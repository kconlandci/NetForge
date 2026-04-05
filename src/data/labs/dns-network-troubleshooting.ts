import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "dns-network-troubleshooting",
  version: 1,
  title: "DNS Network Troubleshooting",
  tier: "intermediate",
  track: "network-troubleshooting",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["dns", "udp", "firewall", "routing", "name-resolution"],
  description:
    "Troubleshoot DNS failures from a network perspective, diagnosing connectivity, firewall, and routing issues that prevent DNS resolution.",
  estimatedMinutes: 13,
  learningObjectives: [
    "Identify network-layer causes of DNS resolution failures",
    "Distinguish between DNS server issues and network transport problems",
    "Analyze firewall rules and ACLs that block DNS traffic",
    "Trace DNS packet flow through the network to locate failure points",
  ],
  sortOrder: 609,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "dnt-001",
      title: "DNS Queries Failing After Firewall Rule Change",
      description:
        "After a firewall policy update last night, all internal hosts lost the ability to resolve external DNS names. Internal DNS resolution between domain-joined machines still works. The DNS servers are at 10.1.1.53 and 10.1.1.54, and they forward external queries to 8.8.8.8 and 8.8.4.4.",
      evidence: [
        {
          type: "log",
          content:
            "Workstation$ nslookup www.example.com 10.1.1.53\nServer:  dns01.corp.local\nAddress: 10.1.1.53\n\n*** dns01.corp.local can't find www.example.com: Server failed\n\nWorkstation$ nslookup server01.corp.local 10.1.1.53\nServer:  dns01.corp.local\nAddress: 10.1.1.53\n\nName:    server01.corp.local\nAddress: 10.1.1.100\n(Internal resolution works fine)",
        },
        {
          type: "log",
          content:
            "DNS-Server$ dig @8.8.8.8 www.example.com\n; <<>> DiG 9.16.1 <<>> @8.8.8.8 www.example.com\n;; connection timed out; no servers could be reached\n\nDNS-Server$ ping 8.8.8.8\nPING 8.8.8.8: 64 data bytes\n64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=12.4 ms\n--- 5 packets transmitted, 5 received, 0% packet loss\n\nFirewall# show access-list WAN-OUTBOUND\n  10 permit tcp 10.1.0.0/16 any eq 443\n  20 permit tcp 10.1.0.0/16 any eq 80\n  30 permit icmp 10.1.0.0/16 any\n  40 deny ip any any log (matches: 89,241)\n\nFirewall# show log | include deny\n  Mar 28 02:15:33 FW deny UDP 10.1.1.53:1025 -> 8.8.8.8:53 by WAN-OUTBOUND\n  Mar 28 02:15:33 FW deny UDP 10.1.1.54:1041 -> 8.8.4.4:53 by WAN-OUTBOUND\n  Mar 28 02:15:34 FW deny TCP 10.1.1.53:1026 -> 8.8.8.8:53 by WAN-OUTBOUND\n  (pattern repeats thousands of times)",
        },
      ],
      classifications: [
        { id: "c1", label: "Firewall ACL Missing DNS Port 53 Permit Rule", description: "The updated WAN-OUTBOUND ACL only permits TCP 443, TCP 80, and ICMP. There is no rule permitting UDP or TCP port 53 outbound, so all DNS forwarder queries to external resolvers are being denied by the implicit deny at line 40." },
        { id: "c2", label: "External DNS Servers 8.8.8.8 and 8.8.4.4 Are Down", description: "Google's public DNS servers are experiencing an outage" },
        { id: "c3", label: "DNS Server Software Crashed After the Update", description: "The DNS service on the internal servers stopped running" },
        { id: "c4", label: "Routing Table Changed Preventing DNS Traffic From Reaching the Internet", description: "A routing change is sending DNS traffic to a black hole" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Add permit rules for UDP and TCP port 53 from DNS servers to any destination in the WAN-OUTBOUND ACL", description: "Insert rules before the deny: permit udp host 10.1.1.53 any eq 53, permit udp host 10.1.1.54 any eq 53, and matching TCP rules for DNS over TCP." },
        { id: "rem2", label: "Change the DNS forwarders to use an internal recursive resolver", description: "Point the DNS servers to an internal resolver instead of external ones" },
        { id: "rem3", label: "Disable the firewall until the ACL is fixed", description: "Remove the WAN-OUTBOUND ACL temporarily to restore DNS" },
        { id: "rem4", label: "Configure DNS-over-HTTPS on the DNS servers to bypass port 53 filtering", description: "Use DoH on port 443 which is already permitted" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "r1", text: "The firewall logs explicitly show UDP and TCP port 53 traffic from both DNS servers (10.1.1.53 and 10.1.1.54) being denied by the WAN-OUTBOUND ACL. The ACL only permits TCP 443, TCP 80, and ICMP - there is no rule for DNS traffic. Adding specific permit rules for the DNS servers on port 53 (both UDP and TCP) restores external resolution while maintaining the security policy." },
        { id: "r2", text: "Ping to 8.8.8.8 succeeds because ICMP is permitted at line 30 of the ACL. This proves routing and basic connectivity are fine - only DNS port 53 traffic is blocked. Internal DNS works because it does not traverse the firewall." },
        { id: "r3", text: "Disabling the firewall would restore DNS but exposes the network to all traffic. The targeted fix is adding DNS permit rules only for the DNS server source IPs, maintaining the principle of least privilege." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Excellent! You correctly identified the missing DNS permit rules in the firewall ACL. The logs clearly show port 53 traffic being denied, and ping works because ICMP has its own permit rule. Adding specific UDP/TCP 53 permits for the DNS servers is the correct, targeted fix.",
        partial: "You identified a firewall issue. The firewall logs show DNS traffic (port 53) being denied by the WAN-OUTBOUND ACL, which only permits TCP 443, TCP 80, and ICMP. Add UDP and TCP port 53 permits for the DNS servers.",
        wrong: "The firewall ACL updated last night is missing permit rules for DNS port 53. The logs show thousands of denied UDP/TCP port 53 packets from the DNS servers. Add specific permit rules for the DNS servers to reach external resolvers on port 53.",
      },
    },
    {
      type: "triage-remediate",
      id: "dnt-002",
      title: "DNS Resolution Slow From One Subnet Only",
      description:
        "Users on the 10.1.50.0/24 subnet (VLAN 50, Accounting department) report that DNS resolution takes 10-15 seconds before succeeding. All other subnets resolve DNS instantly. The DHCP server assigns 10.1.1.53 as the primary DNS and 10.1.1.54 as secondary.",
      evidence: [
        {
          type: "log",
          content:
            "Accounting-PC$ nslookup www.example.com\nDNS request timed out.\n    timeout was 5 seconds.\nServer:  UnKnown\nAddress: 10.1.1.53\n\nDNS request timed out.\n    timeout was 5 seconds.\nServer:  UnKnown\nAddress: 10.1.1.53\n\nNon-authoritative answer:\nName:    www.example.com\nAddress: 93.184.216.34\n(Resolution succeeds after ~10 second delay - 2 timeouts then success)\n\nAccounting-PC$ nslookup www.example.com 10.1.1.54\nServer:  dns02.corp.local\nAddress: 10.1.1.54\n\nNon-authoritative answer:\nName:    www.example.com\nAddress: 93.184.216.34\n(Instant response when using secondary DNS directly)",
        },
        {
          type: "log",
          content:
            "Core-Switch# show ip route 10.1.1.53\nRouting entry for 10.1.1.0/24\n  Known via \"connected\", distance 0, metric 0\n  Directly connected, Vlan10\n\nCore-Switch# show ip access-lists VLAN50-OUT\nExtended IP access list VLAN50-OUT (applied outbound on VLAN 50 SVI)\n  10 permit tcp 10.1.50.0 0.0.0.255 10.1.1.0 0.0.0.255 eq 53\n  20 permit udp 10.1.50.0 0.0.0.255 10.1.1.0 0.0.0.255 eq 53\n  30 permit tcp 10.1.50.0 0.0.0.255 any eq 443\n  40 permit tcp 10.1.50.0 0.0.0.255 any eq 80\n  50 deny ip any any log\n\nCore-Switch# show ip access-lists VLAN50-IN\nExtended IP access list VLAN50-IN (applied inbound on VLAN 50 SVI)\n  10 permit tcp 10.1.1.0 0.0.0.255 10.1.50.0 0.0.0.255 established\n  20 deny ip any any log (matches: 412,881)\n\nCore-Switch# show log | include VLAN50-IN.*deny\n  Mar 28 09:01:12 deny UDP 10.1.1.53:53 -> 10.1.50.15:51234 by VLAN50-IN\n  Mar 28 09:01:12 deny UDP 10.1.1.53:53 -> 10.1.50.22:49812 by VLAN50-IN\n  Mar 28 09:01:14 deny UDP 10.1.1.54:53 -> 10.1.50.15:51234 by VLAN50-IN",
        },
      ],
      classifications: [
        { id: "c1", label: "Inbound ACL Blocking UDP DNS Responses to VLAN 50", description: "The VLAN50-IN ACL permits TCP established connections (line 10) but has no rule for UDP return traffic. DNS primarily uses UDP, so the DNS server's UDP responses are being blocked by the deny rule at line 20. After two UDP timeouts, the client falls back to TCP (which works due to the 'established' keyword), explaining the 10-second delay." },
        { id: "c2", label: "Primary DNS Server 10.1.1.53 Is Overloaded", description: "The primary DNS server is too busy to respond to VLAN 50 queries" },
        { id: "c3", label: "VLAN 50 Has a Spanning Tree Issue Causing Packet Loss", description: "STP is blocking traffic intermittently on VLAN 50" },
        { id: "c4", label: "DHCP Is Assigning the Wrong Primary DNS Server", description: "VLAN 50 clients are getting a bad DNS server address" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Add a permit rule for UDP return traffic from DNS servers to VLAN 50 in the VLAN50-IN ACL", description: "Insert 'permit udp 10.1.1.0 0.0.0.255 eq 53 10.1.50.0 0.0.0.255' before the deny rule in VLAN50-IN to allow UDP DNS responses back to the Accounting subnet." },
        { id: "rem2", label: "Change DHCP to assign 10.1.1.54 as the primary DNS for VLAN 50", description: "Switch primary and secondary DNS servers for the Accounting scope" },
        { id: "rem3", label: "Enable DNS over TCP only for VLAN 50 clients", description: "Force all DNS queries to use TCP instead of UDP" },
        { id: "rem4", label: "Remove the VLAN50-IN ACL entirely", description: "Delete the inbound ACL to stop blocking traffic" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "r1", text: "The VLAN50-IN ACL only permits TCP established (stateful return traffic) but has no rule for UDP responses. Since DNS uses UDP by default, the server's UDP replies are denied at line 20 (412,881 matches). After two 5-second UDP timeouts, the client retries with TCP, which succeeds via the 'established' rule. Adding a UDP permit for DNS responses fixes the root cause." },
        { id: "r2", text: "The secondary DNS (10.1.1.54) responds instantly when queried directly because that test bypasses the normal client retry logic. The nslookup direct query also uses UDP, but the response still gets blocked - the instant success is actually via TCP fallback in that specific tool's behavior. The core issue is the missing UDP return rule." },
        { id: "r3", text: "Removing the ACL entirely would fix DNS but eliminates the security policy for the Accounting VLAN. The targeted fix is adding only the specific UDP DNS return rule needed, maintaining the security posture." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Excellent diagnosis! You identified that the VLAN50-IN ACL permits TCP established but blocks UDP responses. DNS uses UDP first, times out twice (10 seconds), then falls back to TCP which works. Adding the UDP DNS return rule is the precise fix.",
        partial: "You identified an ACL issue. The key detail is that VLAN50-IN lacks a UDP return rule for DNS. The 'established' keyword only works for TCP, so UDP DNS responses are denied. Add a UDP permit for DNS server responses.",
        wrong: "The VLAN50-IN ACL blocks UDP DNS responses (port 53) because it only has a TCP 'established' permit rule. Clients timeout on UDP (2x 5 seconds = 10 seconds) then succeed via TCP fallback. Add a UDP permit rule for DNS return traffic.",
      },
    },
    {
      type: "triage-remediate",
      id: "dnt-003",
      title: "DNS Fails After VLAN Migration",
      description:
        "After migrating the DNS servers from VLAN 10 (10.1.1.0/24) to VLAN 100 (10.1.100.0/24) with new IP addresses 10.1.100.53 and 10.1.100.54, approximately 40% of hosts cannot resolve DNS. The other 60% work fine. DHCP was updated with the new DNS addresses.",
      evidence: [
        {
          type: "log",
          content:
            "Working-Host$ ipconfig /all\n  DNS Servers: 10.1.100.53, 10.1.100.54\n  DHCP Enabled: Yes\n  Lease Obtained: March 28, 2026 08:15:00\n\nWorking-Host$ nslookup www.example.com\nServer:  dns01.corp.local\nAddress: 10.1.100.53\nName:    www.example.com\nAddress: 93.184.216.34\n\nFailing-Host$ ipconfig /all\n  DNS Servers: 10.1.1.53, 10.1.1.54\n  DHCP Enabled: Yes\n  Lease Obtained: March 27, 2026 14:30:00\n\nFailing-Host$ nslookup www.example.com\nDNS request timed out.\n*** Can't find server name for address 10.1.1.53: Timed out\n*** Default servers are not available",
        },
        {
          type: "log",
          content:
            "DHCP-Server# show dhcp lease statistics\n  Total active leases: 1,247\n  Leases issued after DNS update (08:00 today): 748 (60%)\n  Leases issued before DNS update: 499 (40%)\n  Default lease time: 24 hours\n  Lease renewal interval: 12 hours\n\nNetwork diagram note:\n  Old DNS: 10.1.1.53 / 10.1.1.54 (VLAN 10) - Servers POWERED OFF\n  New DNS: 10.1.100.53 / 10.1.100.54 (VLAN 100) - Active\n  DHCP updated at 08:00 with new DNS addresses\n  No static DNS entries configured on clients\n\nRouter# ping 10.1.1.53\n  Request timed out. (Old servers are off)\nRouter# ping 10.1.100.53\n  Reply from 10.1.100.53: bytes=32 time=1ms TTL=64",
        },
      ],
      classifications: [
        { id: "c1", label: "Stale DHCP Leases With Old DNS Server Addresses", description: "40% of hosts obtained their DHCP lease before the DNS address change at 08:00 and still have the old DNS servers (10.1.1.53/54) which are now powered off. These hosts will not receive the updated DNS addresses until their lease renews. The 60% that renewed after 08:00 have the new addresses and work correctly." },
        { id: "c2", label: "VLAN 100 Routing Not Configured Properly", description: "The new VLAN 100 is not reachable from all subnets" },
        { id: "c3", label: "New DNS Servers Not Configured Correctly", description: "The migrated DNS servers have configuration errors" },
        { id: "c4", label: "DNS Zone Transfer Failed During Migration", description: "The DNS zone data was not properly migrated to the new servers" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Force a DHCP lease renewal on all clients to push the new DNS server addresses", description: "Use 'ipconfig /renew' on affected Windows hosts or push a network-wide DHCP lease renewal via management tools to update all clients to the new DNS server addresses immediately instead of waiting for natural lease expiry." },
        { id: "rem2", label: "Temporarily power on the old DNS servers at the old IPs", description: "Bring the old servers back online to serve the clients that still reference them" },
        { id: "rem3", label: "Reduce the DHCP lease time to 1 hour", description: "Shorten the lease time so clients renew faster going forward" },
        { id: "rem4", label: "Add a static route for the old DNS IPs pointing to the new servers", description: "Route traffic destined for 10.1.1.53 to 10.1.100.53" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "r1", text: "The 40/60 split perfectly correlates with DHCP lease timing: 60% of hosts renewed after the DNS change at 08:00 and work fine. 40% still hold leases from before the change with the old DNS addresses (10.1.1.53/54) pointing to powered-off servers. Forcing a DHCP renewal on all clients immediately pushes the updated DNS configuration to every host." },
        { id: "r2", text: "The new DNS servers at 10.1.100.53/54 are reachable and functional (60% of hosts are working). The problem is not with the servers or routing but with stale client configurations. A DHCP renewal is the cleanest and fastest remediation." },
        { id: "r3", text: "Powering on the old servers would work as a temporary bandage, but the goal is to complete the migration. Reducing lease time going forward is good practice for future changes but does not fix the current 40% of affected hosts. A forced renewal resolves the issue immediately." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Perfect! The 40/60 split mapped directly to DHCP lease timing. Hosts that renewed after 08:00 got the new DNS IPs and work fine. The remaining 40% still point to the decommissioned servers. Forcing a DHCP renewal pushes the new configuration immediately.",
        partial: "You identified a DHCP-related issue. The 40% of failing hosts still have old DNS server addresses from pre-migration DHCP leases. Force a DHCP renewal to push the new DNS addresses to all clients.",
        wrong: "40% of hosts still have stale DHCP leases pointing to the old DNS servers (10.1.1.53/54) which are powered off. Force a DHCP lease renewal on all clients to distribute the new DNS server addresses (10.1.100.53/54).",
      },
    },
  ],
  hints: [
    "When DNS fails, first verify whether the issue is network connectivity to the DNS server or a DNS service problem. Can you ping the DNS server? Can you reach port 53 via TCP? Firewall logs often reveal blocked DNS traffic.",
    "DNS uses UDP port 53 for most queries and TCP port 53 for zone transfers and large responses. Firewalls and ACLs must permit both protocols on port 53 for full DNS functionality. The 'established' keyword only applies to TCP.",
    "After any DHCP scope change, remember that clients keep their current settings until their lease renews. A 24-hour lease means up to 24 hours before all clients receive the update. Force renewals for immediate effect.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "DNS issues account for a large percentage of helpdesk escalations to network teams. Understanding how DNS traffic flows through the network - including firewall rules, ACLs, and DHCP-assigned configurations - lets you quickly resolve problems that other teams misdiagnose as server or application failures.",
  toolRelevance: ["nslookup", "dig", "Wireshark", "show access-lists", "ipconfig", "show dhcp"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
