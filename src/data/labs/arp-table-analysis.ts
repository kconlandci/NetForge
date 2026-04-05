import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "arp-table-analysis",
  version: 1,
  title: "ARP Table Analysis",
  tier: "beginner",
  track: "network-fundamentals",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["arp", "mac-address", "layer-2", "troubleshooting"],
  description:
    "Examine ARP tables to identify network issues including duplicate addresses, stale entries, and ARP poisoning indicators.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Read and interpret ARP table entries on hosts and network devices",
    "Identify anomalies in ARP tables that indicate network problems",
    "Distinguish between normal ARP behavior and potential ARP spoofing",
  ],
  sortOrder: 106,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "arp-001",
      title: "Intermittent Connectivity Between Two Hosts",
      objective:
        "Two hosts on the same subnet experience intermittent connectivity to the default gateway. Investigate the ARP tables.",
      investigationData: [
        {
          id: "src1",
          label: "Host-A ARP table",
          content:
            "C:\\> arp -a\nInterface: 10.1.1.50 --- 0xa\n  Internet Address      Physical Address      Type\n  10.1.1.1              aa-bb-cc-dd-ee-01     dynamic\n  10.1.1.51             00-1a-2b-3c-4d-5e     dynamic\n  10.1.1.100            00-50-56-a1-b2-c3     dynamic",
          isCritical: false,
        },
        {
          id: "src2",
          label: "Host-B ARP table",
          content:
            "C:\\> arp -a\nInterface: 10.1.1.51 --- 0xb\n  Internet Address      Physical Address      Type\n  10.1.1.1              00-50-56-a1-b2-c3     dynamic\n  10.1.1.50             00-1a-2b-3c-4d-5e     dynamic\n  10.1.1.100            00-50-56-a1-b2-c3     dynamic",
          isCritical: true,
        },
        {
          id: "src3",
          label: "Router ARP table",
          content:
            "Router# show ip arp\nProtocol  Address    Age(min)  Hardware Addr   Type   Interface\nInternet  10.1.1.1      -     aa-bb-cc-dd-ee-01  ARPA  Gig0/0\nInternet  10.1.1.50     5     00-1a-2b-3c-4d-5e  ARPA  Gig0/0\nInternet  10.1.1.51     3     00-1a-2b-3c-4d-60  ARPA  Gig0/0\nInternet  10.1.1.100    1     00-50-56-a1-b2-c3  ARPA  Gig0/0",
          isCritical: true,
        },
        {
          id: "src4",
          label: "Observation",
          content:
            "Host-A sees the gateway (10.1.1.1) with MAC aa-bb-cc-dd-ee-01 (correct router MAC).\nHost-B sees the gateway (10.1.1.1) with MAC 00-50-56-a1-b2-c3 (this is actually the MAC of host 10.1.1.100).\nHost 10.1.1.100 appears to be sending gratuitous ARP replies claiming to be the gateway.",
          isCritical: true,
        },
      ],
      actions: [
        { id: "a1", label: "ARP spoofing attack from host 10.1.1.100", color: "green" },
        { id: "a2", label: "Normal ARP behavior with a timing issue", color: "blue" },
        { id: "a3", label: "Duplicate IP address on the gateway", color: "yellow" },
        { id: "a4", label: "Switch MAC address table overflow", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "Host 10.1.1.100 (MAC 00-50-56-a1-b2-c3) is sending ARP replies to Host-B claiming to be the gateway (10.1.1.1). Host-B's ARP table shows the gateway with 10.1.1.100's MAC address, which is a classic indicator of ARP spoofing/poisoning.",
        },
        {
          id: "r2",
          text: "The router's own ARP table confirms its correct MAC is aa-bb-cc-dd-ee-01. Host-B incorrectly has a different MAC for the same gateway IP, proving the ARP entry was poisoned by a third party.",
        },
        {
          id: "r3",
          text: "This cannot be a duplicate IP because the router's ARP table shows distinct MACs for all IPs. The anomaly is specifically that Host-B has a wrong MAC for the gateway address.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Host 10.1.1.100 is ARP spoofing the gateway. Its MAC appears in Host-B's ARP table mapped to the gateway IP 10.1.1.1, which should map to aa-bb-cc-dd-ee-01.",
        partial:
          "Close. Compare the gateway MAC in Host-A's table (correct) versus Host-B's table (wrong). The wrong MAC matches host 10.1.1.100, indicating ARP poisoning.",
        wrong:
          "This is ARP spoofing. Host 10.1.1.100 is poisoning Host-B's ARP cache by sending fake ARP replies claiming to be the gateway. The mismatched MAC addresses in the ARP tables prove this.",
      },
    },
    {
      type: "investigate-decide",
      id: "arp-002",
      title: "Host Cannot Communicate Despite Correct IP Config",
      objective:
        "A workstation has a valid IP configuration but cannot reach any other device on the network, including the gateway. Examine the ARP process.",
      investigationData: [
        {
          id: "src1",
          label: "Workstation config",
          content:
            "C:\\> ipconfig\nIPv4 Address. . . . . . . : 10.5.5.25\nSubnet Mask . . . . . . . : 255.255.255.0\nDefault Gateway . . . . . : 10.5.5.1\n\nC:\\> ping 10.5.5.1\nRequest timed out.\nRequest timed out.",
          isCritical: false,
        },
        {
          id: "src2",
          label: "ARP table on workstation",
          content:
            "C:\\> arp -a\nInterface: 10.5.5.25 --- 0xc\n  Internet Address      Physical Address      Type\n  10.5.5.1              ff-ff-ff-ff-ff-ff     dynamic\n  10.5.5.255            ff-ff-ff-ff-ff-ff     static",
          isCritical: true,
        },
        {
          id: "src3",
          label: "Switch port status",
          content:
            "Switch# show interface Gi1/0/22\nGigabitEthernet1/0/22 is up, line protocol is up\n  VLAN: 50\n  Port Mode: Access\n\nSwitch# show mac address-table interface Gi1/0/22\nMac Address Table\n-------------------------------------------\nVlan    Mac Address       Type      Ports\n50      00aa.bbcc.dd22    DYNAMIC   Gi1/0/22",
          isCritical: true,
        },
        {
          id: "src4",
          label: "Switch VLAN info",
          content:
            "Switch# show vlan brief\nVLAN  Name         Status    Ports\n10    Servers      active    Gi1/0/1-5\n20    Users        active    Gi1/0/6-21\n50    Quarantine   active    Gi1/0/22\n\nNote: VLAN 50 is a quarantine VLAN with no gateway interface configured.",
          isCritical: true,
        },
      ],
      actions: [
        { id: "a1", label: "Move the switch port from VLAN 50 (Quarantine) to the correct user VLAN", color: "green" },
        { id: "a2", label: "Clear the ARP cache on the workstation", color: "blue" },
        { id: "a3", label: "Replace the network cable", color: "yellow" },
        { id: "a4", label: "Reconfigure the workstation's IP address", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The workstation is on VLAN 50 (Quarantine) which has no router interface. ARP requests for the gateway get no response because 10.5.5.1 does not exist on VLAN 50. The gateway MAC resolves to ff-ff-ff-ff-ff-ff (broadcast) because no unicast reply was received.",
        },
        {
          id: "r2",
          text: "The ARP entry showing ff-ff-ff-ff-ff-ff for the gateway means ARP resolution failed completely. This is not a cache corruption issue - there is genuinely no device at 10.5.5.1 on VLAN 50.",
        },
        {
          id: "r3",
          text: "The link is up and the switch sees the workstation's MAC. The physical layer is fine. The problem is Layer 2 VLAN isolation preventing ARP from reaching the gateway.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Exactly right! The workstation is isolated on the Quarantine VLAN with no gateway. Moving it to the correct VLAN will allow ARP to resolve the gateway and restore connectivity.",
        partial:
          "You're on the right track. The gateway ARP entry of ff-ff-ff-ff-ff-ff is the key clue - it means no device responded to the ARP request, because the gateway doesn't exist on VLAN 50.",
        wrong:
          "The workstation is on VLAN 50 (Quarantine) which has no Layer 3 gateway interface. ARP cannot resolve because there is no gateway at 10.5.5.1 on that VLAN. Moving to the correct VLAN fixes this.",
      },
    },
    {
      type: "investigate-decide",
      id: "arp-003",
      title: "Duplicate IP Address Causing Packet Loss",
      objective:
        "A critical server experiences 50% packet loss. Network monitoring shows the server's IP responds from two different MAC addresses. Investigate.",
      investigationData: [
        {
          id: "src1",
          label: "Ping results to server",
          content:
            "C:\\> ping 10.10.10.100 -n 10\nReply from 10.10.10.100: bytes=32 time=1ms TTL=128\nRequest timed out.\nReply from 10.10.10.100: bytes=32 time=1ms TTL=128\nRequest timed out.\nReply from 10.10.10.100: bytes=32 time=2ms TTL=64\nRequest timed out.\n\nPackets: Sent = 10, Received = 5, Lost = 5 (50% loss)",
          isCritical: false,
        },
        {
          id: "src2",
          label: "Switch MAC address table",
          content:
            "Switch# show mac address-table address *\nVlan    Mac Address       Type      Ports\n10      00-11-22-33-44-55 DYNAMIC   Gi1/0/5    (Server port)\n10      00-AA-BB-CC-DD-EE DYNAMIC   Gi1/0/18   (Unknown device)\n\nBoth MACs have been seen sending frames with source IP 10.10.10.100",
          isCritical: true,
        },
        {
          id: "src3",
          label: "ARP monitoring",
          content:
            "Captured ARP traffic for 10.10.10.100:\n09:15:01 ARP Reply: 10.10.10.100 is-at 00-11-22-33-44-55 (Server)\n09:15:03 ARP Reply: 10.10.10.100 is-at 00-AA-BB-CC-DD-EE (Unknown)\n09:15:05 ARP Reply: 10.10.10.100 is-at 00-11-22-33-44-55 (Server)\n09:15:07 ARP Reply: 10.10.10.100 is-at 00-AA-BB-CC-DD-EE (Unknown)",
          isCritical: true,
        },
      ],
      actions: [
        { id: "a1", label: "Identify and disconnect the device on Gi1/0/18 to resolve the duplicate IP", color: "green" },
        { id: "a2", label: "Restart the server to refresh its ARP announcements", color: "blue" },
        { id: "a3", label: "Clear the MAC address table on the switch", color: "yellow" },
        { id: "a4", label: "Enable spanning tree on the VLAN", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "Two devices are competing for IP 10.10.10.100 with different MACs. The alternating ARP replies cause clients to flip-flop between the real server (Gi1/0/5) and the duplicate (Gi1/0/18), creating the 50% loss pattern. Disconnecting the duplicate restores consistent connectivity.",
        },
        {
          id: "r2",
          text: "The alternating TTL values (128 and 64) in the ping confirm two different operating systems are responding. TTL 128 is typically Windows (the server) and TTL 64 is typically Linux (the conflicting device).",
        },
        {
          id: "r3",
          text: "Clearing the MAC table would only temporarily help. Both devices would re-populate their MAC entries and the conflict would resume within seconds.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! A duplicate IP address causes two devices to compete for the same address, with ARP replies alternating and splitting traffic. Disconnecting the unauthorized device on Gi1/0/18 resolves the conflict.",
        partial:
          "Close. The 50% loss pattern and alternating MACs are the signature of a duplicate IP. Identify which device is unauthorized and disconnect it.",
        wrong:
          "This is an IP address conflict. Two devices claim 10.10.10.100 with different MACs, causing ARP table flapping and 50% packet loss. The unauthorized device on Gi1/0/18 must be disconnected.",
      },
    },
  ],
  hints: [
    "ARP maps IP addresses to MAC addresses. If the same IP shows different MACs at different times, suspect either ARP spoofing or a duplicate IP address.",
    "An ARP entry of ff-ff-ff-ff-ff-ff (broadcast) for a unicast address means the ARP resolution failed - no device responded to the ARP request.",
    "Check VLAN assignments when ARP fails. A device can have perfect Layer 1 connectivity but fail ARP if it is on the wrong VLAN with no gateway.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "ARP analysis is a fundamental skill for security analysts and network engineers. ARP spoofing detection is a key component of network security monitoring in enterprise environments.",
  toolRelevance: ["arp -a", "show ip arp", "Wireshark", "arpwatch", "show mac address-table"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
