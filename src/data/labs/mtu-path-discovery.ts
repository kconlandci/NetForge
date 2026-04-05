import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "mtu-path-discovery",
  version: 1,
  title: "MTU Path Discovery",
  tier: "intermediate",
  track: "network-troubleshooting",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["mtu", "fragmentation", "pmtud", "icmp", "df-bit"],
  description:
    "Diagnose MTU-related issues using ping with the DF bit, traceroute, and interface MTU settings to resolve fragmentation and black hole problems.",
  estimatedMinutes: 13,
  learningObjectives: [
    "Use ping with the Don't Fragment bit to discover path MTU limitations",
    "Identify MTU black holes caused by ICMP filtering",
    "Interpret ICMP 'fragmentation needed' messages to locate MTU mismatches",
    "Determine correct MTU settings across tunnels, VPNs, and WAN links",
  ],
  sortOrder: 608,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "mtu-001",
      title: "VPN Tunnel Causing Silent Packet Drops",
      context:
        "Users connecting over a site-to-site IPsec VPN can browse websites and send emails, but cannot download large files or load certain web pages. Small transfers work fine. You investigate from the VPN headend router:\n\nRouter# ping 10.200.1.50 size 1500 df-bit\nType escape sequence to abort.\nSending 5, 1500-byte ICMP Echos to 10.200.1.50, timeout is 2 seconds:\nPacket sent with the DF bit set\n.....\nSuccess rate is 0 percent (0/5)\n\nRouter# ping 10.200.1.50 size 1400 df-bit\nSending 5, 1400-byte ICMP Echos to 10.200.1.50, timeout is 2 seconds:\nPacket sent with the DF bit set\n!!!!!\nSuccess rate is 100 percent (5/5), round-trip min/avg/max = 22/24/28 ms\n\nRouter# ping 10.200.1.50 size 1450 df-bit\n.....\nSuccess rate is 0 percent (0/5)\n\nRouter# ping 10.200.1.50 size 1420 df-bit\n!!!!!\nSuccess rate is 100 percent (5/5)\n\nRouter# ping 10.200.1.50 size 1430 df-bit\n.....\nSuccess rate is 0 percent (0/5)\n\nRouter# show interfaces Tunnel0\nTunnel0 is up, line protocol is up\n  MTU 1500 bytes (configured), IP MTU 1500\n  Tunnel source 203.0.113.1, destination 198.51.100.1\n  Tunnel protocol/transport IPsec/IP\n  Tunnel TTL 255\n\nRouter# show crypto ipsec sa | include overhead\n  IPsec overhead: 73 bytes (ESP-AES256-SHA256)\n\nNote: IPsec ESP adds 73 bytes of overhead. With a 1500-byte WAN MTU,\nthe maximum payload through the tunnel is 1500 - 73 = 1427 bytes.",
      displayFields: [],
      actions: [
        { id: "a1", label: "Set the tunnel interface MTU to 1427 and enable TCP MSS clamping at 1387", color: "green" },
        { id: "a2", label: "Disable the DF bit on all traffic traversing the VPN", color: "yellow" },
        { id: "a3", label: "Increase the WAN interface MTU to 9000 (jumbo frames)", color: "orange" },
        { id: "a4", label: "Enable GRE fragmentation before encryption", color: "blue" },
      ],
      correctActionId: "a1",
      rationales: [
        { id: "r1", text: "The ping tests confirm the path MTU is between 1420 and 1430 bytes. With 73 bytes of IPsec ESP overhead on a 1500-byte WAN MTU, the effective tunnel payload is 1427 bytes. Setting the tunnel MTU to 1427 ensures the router fragments before encryption when needed. TCP MSS clamping at 1387 (1427 - 40 bytes TCP/IP headers) prevents TCP sessions from sending segments too large for the tunnel, which is why large file downloads and certain web pages fail." },
        { id: "r2", text: "Disabling the DF bit would allow fragmentation but causes reassembly overhead, potential reordering issues, and doubles the packet count for large frames. It also breaks Path MTU Discovery for all traffic. Setting the correct tunnel MTU and clamping TCP MSS is the clean, standards-compliant solution." },
        { id: "r3", text: "Jumbo frames require end-to-end support across every device in the path including the ISP, which is rarely available on WAN links. The correct approach is to work within the 1500-byte WAN MTU by properly accounting for the 73-byte IPsec overhead." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Excellent! You correctly calculated the effective tunnel MTU (1500 - 73 = 1427) confirmed by the ping tests, and applied both fixes: tunnel MTU adjustment and TCP MSS clamping. This ensures both TCP and non-TCP traffic work correctly through the VPN.",
        partial: "You identified an MTU-related issue. The key calculation is 1500 (WAN MTU) minus 73 (IPsec overhead) = 1427 byte effective tunnel MTU. Both tunnel MTU and TCP MSS clamping (1387 = 1427 - 40) are needed for a complete fix.",
        wrong: "The VPN adds 73 bytes of IPsec overhead, leaving only 1427 bytes for payload in a 1500-byte WAN MTU. Set the tunnel MTU to 1427 and clamp TCP MSS to 1387 (1427 minus 40 bytes for TCP/IP headers).",
      },
    },
    {
      type: "action-rationale",
      id: "mtu-002",
      title: "PMTUD Black Hole - ICMP Blocked by Firewall",
      context:
        "An application server at 10.1.1.50 cannot communicate with a cloud API at 203.0.113.100 for transactions larger than about 1400 bytes. Small API calls succeed but bulk data transfers hang indefinitely. You investigate:\n\nServer$ ping -M do -s 1472 203.0.113.100\nPING 203.0.113.100 (203.0.113.100) 1472(1500) bytes of data.\n--- 203.0.113.100 ping statistics ---\n5 packets transmitted, 0 received, 100% packet loss\n\nServer$ ping -M do -s 1372 203.0.113.100\nPING 203.0.113.100 (203.0.113.100) 1372(1400) bytes of data.\n1380 bytes from 203.0.113.100: icmp_seq=1 ttl=52 time=35.2 ms\n--- 5 packets transmitted, 5 received, 0% packet loss\n\nRouter# show access-lists 110\nExtended IP access list 110\n  10 deny icmp any any unreachable log (289412 matches)\n  20 deny icmp any any time-exceeded log (12841 matches)\n  30 permit ip any any (8924102 matches)\n\nRouter# show interfaces GigabitEthernet0/0\n  MTU 1500 bytes\n\nNote: ACL 110 is applied inbound on the WAN interface.\nThe firewall ACL is blocking ALL inbound ICMP unreachable messages,\nincluding Type 3 Code 4 (Fragmentation Needed/DF bit set).\nThis prevents Path MTU Discovery from working.",
      displayFields: [],
      actions: [
        { id: "a1", label: "Modify ACL 110 to permit ICMP Type 3 Code 4 (Fragmentation Needed) messages", color: "green" },
        { id: "a2", label: "Disable the DF bit on the server's network interface", color: "yellow" },
        { id: "a3", label: "Reduce the server's interface MTU to 1400", color: "orange" },
        { id: "a4", label: "Replace the firewall with one that supports stateful ICMP inspection", color: "blue" },
      ],
      correctActionId: "a1",
      rationales: [
        { id: "r1", text: "ACL 110 line 10 blocks all ICMP unreachable messages with 289,412 matches, which includes the critical Type 3 Code 4 'Fragmentation Needed and DF bit set' messages that Path MTU Discovery relies on. By allowing ICMP Type 3 Code 4 specifically, PMTUD can function normally and endpoints will learn the correct path MTU. This is the targeted fix that maintains security while restoring PMTUD." },
        { id: "r2", text: "Reducing the server MTU to 1400 is a workaround, not a fix. It limits all traffic from the server (not just to this destination) and doesn't address the fundamental PMTUD black hole that will affect other connections too. The firewall ACL is the root cause." },
        { id: "r3", text: "Disabling the DF bit globally causes fragmentation on every oversized packet, reducing performance and increasing reassembly load. The correct approach is to fix PMTUD by allowing the specific ICMP messages it needs through the firewall." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Perfect! You identified the PMTUD black hole caused by the overly aggressive ICMP filtering. ACL line 10 blocks all ICMP unreachable messages including the vital Type 3 Code 4 that PMTUD requires. Permitting that specific ICMP type/code restores PMTUD while maintaining security.",
        partial: "You identified the ICMP filtering issue. The critical detail is that ACL 110 blocks Type 3 Code 4 (Fragmentation Needed) messages, creating a PMTUD black hole. Allow this specific ICMP type through the firewall.",
        wrong: "ACL 110 blocks all ICMP unreachable messages, including Type 3 Code 4 (Fragmentation Needed) used by Path MTU Discovery. This creates a PMTUD black hole where large packets are silently dropped. Permit ICMP Type 3 Code 4 in the ACL.",
      },
    },
    {
      type: "action-rationale",
      id: "mtu-003",
      title: "GRE Tunnel MTU Causing Application Failures",
      context:
        "A branch office connected via a GRE tunnel reports that their ERP application fails during large form submissions. Small queries work fine. The network team suspects an MTU issue. You investigate:\n\nRouter-Branch# show interfaces Tunnel1\nTunnel1 is up, line protocol is up\n  Description: GRE to HQ\n  MTU 1500 bytes, BW 1000000 Kbit/sec\n  Tunnel source 10.1.1.1 (GigabitEthernet0/0)\n  Tunnel destination 10.2.1.1\n  Tunnel protocol/transport GRE/IP\n  Tunnel transport MTU 1476 bytes\n\nRouter-Branch# ping 10.200.1.100 source Tunnel1 size 1500 df-bit\n.....\nSuccess rate is 0 percent (0/5)\n\nRouter-Branch# ping 10.200.1.100 source Tunnel1 size 1476 df-bit\n!!!!!\nSuccess rate is 100 percent (5/5), round-trip min/avg/max = 8/10/14 ms\n\nRouter-Branch# show ip interface Tunnel1 | include MTU\n  MTU is 1500 bytes\n  IP MTU is 1500 bytes\n\nRouter-Branch# show running-config interface Tunnel1\ninterface Tunnel1\n description GRE to HQ\n ip address 172.16.0.2 255.255.255.252\n tunnel source GigabitEthernet0/0\n tunnel destination 10.2.1.1\n ! No ip mtu or ip tcp adjust-mss configured\n\nRouter-Branch# show interfaces GigabitEthernet0/0 | include MTU\n  MTU 1500 bytes\n\nNote: GRE adds 24 bytes of overhead (20-byte IP + 4-byte GRE header).\nEffective tunnel payload: 1500 - 24 = 1476 bytes.\nBut the tunnel MTU is still set to 1500, so packets up to 1500\nare accepted into the tunnel and then fragmented or dropped.",
      displayFields: [],
      actions: [
        { id: "a1", label: "Set 'ip mtu 1476' and 'ip tcp adjust-mss 1436' on the Tunnel1 interface", color: "green" },
        { id: "a2", label: "Enable 'tunnel path-mtu-discovery' on the GRE tunnel", color: "blue" },
        { id: "a3", label: "Set the physical interface MTU to 1524 to accommodate GRE overhead", color: "yellow" },
        { id: "a4", label: "Disable GRE and use a direct IPsec tunnel instead", color: "orange" },
      ],
      correctActionId: "a1",
      rationales: [
        { id: "r1", text: "GRE adds 24 bytes of overhead, making the effective tunnel payload 1476 bytes on a 1500-byte physical MTU. Setting 'ip mtu 1476' on the tunnel ensures the router knows the real payload limit and either fragments before encapsulation or sends ICMP Fragmentation Needed back to the source. Adding 'ip tcp adjust-mss 1436' (1476 - 40 for TCP/IP headers) clamps TCP MSS to prevent TCP sessions from exceeding the tunnel's capacity." },
        { id: "r2", text: "While 'tunnel path-mtu-discovery' is helpful, it only discovers the path MTU dynamically and relies on ICMP messages getting through. Explicitly setting the ip mtu and tcp adjust-mss provides a deterministic, reliable solution that works even if ICMP is filtered somewhere in the path." },
        { id: "r3", text: "Increasing the physical interface MTU to 1524 would require the ISP and all intermediate devices to support the larger frame size, which is typically not possible on WAN links. Working within the standard 1500-byte MTU by adjusting the tunnel settings is the correct approach." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Excellent! You correctly identified the GRE overhead (24 bytes) and applied both necessary fixes: ip mtu 1476 to set the proper tunnel payload limit, and ip tcp adjust-mss 1436 to clamp TCP sessions. This two-pronged approach handles both TCP and non-TCP traffic through the tunnel.",
        partial: "You identified the MTU issue. The complete fix requires both 'ip mtu 1476' (1500 - 24 GRE overhead) and 'ip tcp adjust-mss 1436' (1476 - 40 TCP/IP headers) on the tunnel interface to handle all traffic types.",
        wrong: "GRE adds 24 bytes overhead, reducing the effective tunnel payload to 1476 bytes. Configure 'ip mtu 1476' and 'ip tcp adjust-mss 1436' on Tunnel1 to prevent oversized packets from being dropped or silently fragmented.",
      },
    },
  ],
  hints: [
    "Use ping with the DF (Don't Fragment) bit set and vary the packet size to discover the exact path MTU. Binary search between working and failing sizes to find the precise limit.",
    "Common tunnel overheads: GRE adds 24 bytes, IPsec ESP adds 50-73 bytes depending on cipher, GRE+IPsec adds 74-97 bytes. Always subtract the overhead from the physical MTU to get the effective tunnel payload.",
    "TCP MSS clamping (ip tcp adjust-mss) should be set to the tunnel MTU minus 40 bytes (20 IP + 20 TCP headers). This prevents TCP sessions from negotiating segments larger than the tunnel can carry without fragmentation.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "MTU issues are notoriously difficult to diagnose because they only affect large packets, making symptoms intermittent and application-specific. Understanding Path MTU Discovery, tunnel overhead calculations, and TCP MSS clamping is critical for any engineer managing VPN or WAN infrastructure.",
  toolRelevance: ["ping", "traceroute", "show interfaces", "Wireshark", "ip tcp adjust-mss"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
