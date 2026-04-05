import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "duplex-mismatch-detection",
  version: 1,
  title: "Duplex Mismatch Detection",
  tier: "intermediate",
  track: "network-troubleshooting",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["duplex", "speed", "mismatch", "ethernet", "auto-negotiation"],
  description:
    "Detect and resolve duplex and speed mismatches between network devices using interface statistics and negotiation analysis.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Identify the symptoms of a duplex mismatch from interface error counters",
    "Distinguish between full-duplex and half-duplex error patterns",
    "Determine the correct remediation for speed and duplex autonegotiation failures",
    "Understand how forced settings on one side affect autonegotiation on the other",
  ],
  sortOrder: 607,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "dmd-001",
      title: "Classic Duplex Mismatch - One Side Forced, One Side Auto",
      description:
        "A server connected to Switch port Gi0/1 experiences poor throughput (only 10-20 Mbps on a Gigabit link) and intermittent connectivity. The server team says they hard-coded the NIC to 1000/Full. Investigate the switch port.",
      evidence: [
        {
          type: "log",
          content:
            "Switch# show interfaces GigabitEthernet0/1\nGigabitEthernet0/1 is up, line protocol is up\n  Hardware is Gigabit Ethernet, address is aa11.bb22.cc01\n  Description: Server-DB01\n  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec\n  Full-duplex, 1000Mb/s, link type is auto\n  Auto-negotiation status: incomplete\n  Input flow-control is off, output flow-control is off\n  5 minute input rate 8,200,000 bits/sec, 1,100 packets/sec\n  5 minute output rate 12,400,000 bits/sec, 1,500 packets/sec\n     412,891 input packets, 298,104,720 bytes\n     0 runts, 0 giants, 0 throttles\n     48,291 input errors, 0 CRC, 48,112 frame, 0 overrun\n     0 output errors, 124,881 late collisions, 0 deferred\n     0 lost carrier, 0 no carrier",
        },
        {
          type: "log",
          content:
            "Switch# show interfaces GigabitEthernet0/1 status\nPort    Name       Status  Vlan  Duplex  Speed  Type\nGi0/1   Server-DB  connected 10  a-full  a-1000 10/100/1000BaseTX\n\nSwitch# show interfaces GigabitEthernet0/1 capabilities\n  Duplex: full, half, auto\n  Speed: 10, 100, 1000, auto\n  Auto-negotiation: Yes (configured: auto)\n\nServer NIC configuration (from server team):\n  Speed: 1000 Mbps (forced)\n  Duplex: Full (forced)\n  Auto-negotiation: Disabled",
        },
      ],
      classifications: [
        { id: "c1", label: "Autonegotiation Conflict Due to Forced Server NIC", description: "The server NIC has autonegotiation disabled with forced 1000/Full settings, but the switch port is set to auto. When one side forces and the other auto-negotiates, the auto side may not correctly detect the partner's capabilities, leading to protocol-level issues and late collisions." },
        { id: "c2", label: "Faulty Cable Causing Signal Degradation", description: "A bad cable is causing the interface errors and poor throughput" },
        { id: "c3", label: "Switch Port Hardware Failure", description: "The switch port ASIC is malfunctioning" },
        { id: "c4", label: "VLAN Misconfiguration Limiting Throughput", description: "The VLAN assignment is causing the performance issue" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Set both sides to autonegotiation enabled", description: "Configure both the server NIC and switch port to autonegotiate. This is the IEEE 802.3 recommended approach and ensures both sides agree on speed and duplex." },
        { id: "rem2", label: "Force the switch port to match the server: 1000/Full", description: "Hard-code the switch port to 1000Mbps Full-duplex to match the forced server settings" },
        { id: "rem3", label: "Replace the Ethernet cable", description: "Install a new Cat6 cable between server and switch" },
        { id: "rem4", label: "Move the server to a different switch port", description: "Reconnect the server to an alternate port to rule out hardware issues" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "r1", text: "The IEEE 802.3 standard recommends autonegotiation on both sides. When the server forces 1000/Full and disables autoneg, the switch auto-negotiates but receives no negotiation parameters from the partner. Although it detects 1000Mbps speed via link pulse, the protocol-level handshake is incomplete (shown by 'Auto-negotiation status: incomplete'), causing 48,112 frame errors and 124,881 late collisions." },
        { id: "r2", text: "While forcing both sides to 1000/Full would also work as a short-term fix, autonegotiation is the recommended standard because it also handles flow control and other link parameters. Mismatched forced settings are a common source of recurring issues during hardware replacements." },
        { id: "r3", text: "The error pattern (frame errors on input, late collisions on output) is the classic signature of a duplex negotiation problem, not a cable or hardware fault. CRC errors are zero, which rules out physical layer cable issues." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Excellent! You identified the autonegotiation conflict and recommended the IEEE standard approach. The 'incomplete' auto-negotiation status combined with frame errors and late collisions is the classic signature. Enabling autoneg on both sides is the proper long-term fix.",
        partial: "You identified the duplex-related issue. The root cause is the server forcing 1000/Full while the switch auto-negotiates. The best practice is to enable autonegotiation on both sides per IEEE 802.3.",
        wrong: "The server has autoneg disabled with forced 1000/Full, causing the switch's auto-negotiation to be 'incomplete'. This produces frame errors and late collisions. Enable autonegotiation on both sides for proper link negotiation.",
      },
    },
    {
      type: "triage-remediate",
      id: "dmd-002",
      title: "Speed Mismatch - 100Mbps vs 1000Mbps",
      description:
        "A newly installed IP camera is connected to a PoE switch port but is only achieving 12 Mbps throughput for its 4K video stream, causing severe video artifacts. The camera is rated for 25 Mbps streaming.",
      evidence: [
        {
          type: "log",
          content:
            "Switch# show interfaces FastEthernet0/12\nFastEthernet0/12 is up, line protocol is up\n  Hardware is Fast Ethernet, address is bb22.cc33.dd12\n  Description: IP-Camera-Lobby\n  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec\n  Full-duplex, 100Mb/s, 100BaseTX/FX\n  5 minute input rate 12,100,000 bits/sec, 1,800 packets/sec\n  5 minute output rate 240,000 bits/sec, 45 packets/sec\n  0 input errors, 0 CRC, 0 frame\n  0 output errors, 0 collisions\n  Utilization: Input 12.1%\n\nSwitch# show power inline FastEthernet0/12\nInterface  Admin  Oper    Power(Watts)  Device     Class\nFa0/12     auto   on      15.4          IEEE PD    3",
        },
        {
          type: "log",
          content:
            "Switch# show interfaces FastEthernet0/12 status\nPort    Name          Status  Vlan  Duplex  Speed  Type\nFa0/12  IP-Cam-Lobby  connected 20  a-full  a-100  10/100BaseTX\n\nCamera Specifications:\n  Network: 10/100/1000 Base-T Ethernet\n  Required bandwidth: 25 Mbps (4K stream)\n  PoE: 802.3af (Class 3, 15.4W)\n\nNote: The switch port is a FastEthernet port (maximum 100Mbps).\nThe camera negotiated 100Mbps Full-duplex successfully.\nHowever, at 100Mbps the link can carry the 25Mbps stream.\n\nFurther investigation:\nSwitch# show processes cpu\nCPU utilization for five seconds: 2%/0%\n\nCamera management page shows:\n  Stream 1 (4K): 25 Mbps target, actual 12 Mbps (bandwidth constrained)\n  Stream 2 (720p): Disabled\n  Multicast: Enabled, Group 239.1.1.12\n  IGMP snooping on VLAN 20: Not configured on switch",
        },
      ],
      classifications: [
        { id: "c1", label: "IGMP Snooping Not Enabled - Multicast Flooding", description: "The camera uses multicast streaming but IGMP snooping is not configured on VLAN 20. Without IGMP snooping, multicast traffic floods to all ports in the VLAN, consuming bandwidth across the entire VLAN and causing the switch to rate-limit the camera's multicast traffic to prevent broadcast storms." },
        { id: "c2", label: "Speed Mismatch - Camera Needs Gigabit", description: "The FastEthernet port cannot support the camera's bandwidth requirements" },
        { id: "c3", label: "PoE Budget Insufficient", description: "The camera is not receiving enough power to operate at full capacity" },
        { id: "c4", label: "Duplex Mismatch Causing Collisions", description: "A duplex mismatch is reducing effective throughput" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Enable IGMP snooping on VLAN 20 and configure the switch as IGMP querier", description: "Configure IGMP snooping on the camera VLAN so multicast traffic is only forwarded to ports with active IGMP subscribers, preventing flooding and the associated rate-limiting." },
        { id: "rem2", label: "Move the camera to a Gigabit switch port", description: "Connect the camera to a GigabitEthernet port to increase available bandwidth" },
        { id: "rem3", label: "Increase PoE power allocation to the camera", description: "Allocate more watts to the camera port" },
        { id: "rem4", label: "Disable multicast and switch to unicast streaming", description: "Reconfigure the camera to use unicast instead of multicast" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "r1", text: "The 100Mbps link has plenty of capacity for a 25Mbps stream, and the link negotiated correctly at Full-duplex with zero errors. The real issue is the missing IGMP snooping configuration. Without it, multicast traffic floods to all VLAN 20 ports, and the switch's storm control or internal rate-limiting is throttling the camera's multicast output to 12Mbps to protect the VLAN." },
        { id: "r2", text: "The PoE is delivering the full 15.4W Class 3 power the camera requires, and the duplex negotiation is clean (a-full with zero collisions). The speed is 100Mbps which is sufficient for 25Mbps. IGMP snooping is the missing configuration." },
        { id: "r3", text: "Enabling IGMP snooping and configuring an IGMP querier will ensure multicast traffic is only sent to ports with active subscribers. This eliminates the flooding condition that triggers rate-limiting and allows the camera to stream at its full 25Mbps." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Great diagnosis! The 100Mbps link has ample capacity for 25Mbps, and the negotiation is clean. The missing IGMP snooping is causing multicast flooding across VLAN 20, triggering rate-limiting that caps the camera at 12Mbps. Enabling IGMP snooping is the correct fix.",
        partial: "You identified a configuration issue. The key detail is that IGMP snooping is not configured on VLAN 20, causing multicast flooding. The 100Mbps link speed is not the bottleneck - the multicast flooding and resulting rate-limiting is.",
        wrong: "The link negotiated correctly at 100Mbps Full-duplex with zero errors. The bottleneck is missing IGMP snooping on VLAN 20, causing multicast flooding and rate-limiting the camera to 12Mbps. Enable IGMP snooping and configure an IGMP querier.",
      },
    },
    {
      type: "triage-remediate",
      id: "dmd-003",
      title: "Half-Duplex Fallback After Cable Replacement",
      description:
        "After a cable replacement during weekend maintenance, a workstation connected to Gi0/5 experiences extremely slow file transfers (2-3 Mbps) and frequent disconnections. Before the maintenance, the connection was stable at full Gigabit speed.",
      evidence: [
        {
          type: "log",
          content:
            "Switch# show interfaces GigabitEthernet0/5\nGigabitEthernet0/5 is up, line protocol is up\n  Hardware is Gigabit Ethernet, address is cc33.dd44.ee05\n  Description: Workstation-Finance-042\n  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec\n  Half-duplex, 100Mb/s, media type is 10/100/1000BaseTX\n  Auto-negotiation is turned on\n  Input flow-control is off, output flow-control is off\n  5 minute input rate 2,400,000 bits/sec, 420 packets/sec\n  5 minute output rate 2,800,000 bits/sec, 490 packets/sec\n     124,510 input packets, 89,647,200 bytes\n     0 runts, 0 giants, 0 throttles\n     1,284 input errors, 841 CRC, 443 frame, 0 overrun\n     2,102 output errors, 0 late collisions, 12,847 collisions\n     489 deferred, 1,204 single collision, 11,643 multiple collisions",
        },
        {
          type: "log",
          content:
            "Switch# show interfaces GigabitEthernet0/5 status\nPort    Name          Status  Vlan  Duplex  Speed   Type\nGi0/5   Fin-042       connected 30  a-half  a-100   10/100/1000BaseTX\n\nSwitch# show cable-diagnostics tdr GigabitEthernet0/5\nInterface  Speed  Local  Pair  Length   Status\nGi0/5      100M   Auto   1-2   45m      Normal\n                          3-6   45m      Normal\n                          4-5   45m      Open\n                          7-8   45m      Open\n\nNote: Gigabit Ethernet requires all 4 pairs (8 wires).\n100Mbps Ethernet only requires pairs 1-2 and 3-6.\nPairs 4-5 and 7-8 show 'Open' - these wires are\nnot connected (likely a wiring fault in the new cable).",

        },
      ],
      classifications: [
        { id: "c1", label: "Faulty Cable - Only 2 of 4 Pairs Connected", description: "The replacement cable only has 2 working pairs (1-2 and 3-6). Gigabit Ethernet requires all 4 pairs, so the link fell back to 100Mbps. With only 2 pairs at 100Mbps, autoneg defaulted to half-duplex, causing collisions that further reduce effective throughput." },
        { id: "c2", label: "Switch Port Configuration Changed During Maintenance", description: "Someone changed the port settings during the maintenance window" },
        { id: "c3", label: "Workstation NIC Driver Issue", description: "The NIC driver needs updating after the maintenance reboot" },
        { id: "c4", label: "Autonegotiation Bug on the Switch", description: "The switch has a firmware bug affecting speed negotiation" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Replace the cable with a properly terminated Cat5e or Cat6 cable with all 4 pairs connected", description: "The new cable has a wiring fault with pairs 4-5 and 7-8 open. Replace it with a properly terminated and tested cable to restore Gigabit connectivity on all 4 pairs." },
        { id: "rem2", label: "Force the switch port to 1000/Full", description: "Hard-code the port to Gigabit Full-duplex to override the autoneg result" },
        { id: "rem3", label: "Update the workstation NIC firmware", description: "Install the latest NIC driver and firmware update" },
        { id: "rem4", label: "Restart the switch port with shutdown/no shutdown", description: "Bounce the port to force renegotiation" },
      ],
      correctRemediationId: "rem1",

      rationales: [
        { id: "r1", text: "The TDR cable diagnostic clearly shows pairs 4-5 and 7-8 are 'Open' (disconnected). Gigabit Ethernet requires all 4 pairs for 1000BASE-T signaling. With only 2 pairs working, autoneg correctly fell back to 100Mbps (which needs only 2 pairs) and half-duplex. The half-duplex operation at 100Mbps causes collisions (12,847 total), dramatically reducing throughput. Replacing the cable restores all 4 pairs and Gigabit operation." },
        { id: "r2", text: "Forcing 1000/Full would not work - the link would fail entirely because Gigabit requires all 4 pairs and only 2 are connected. Bouncing the port would just re-negotiate to the same 100/half result. The physical cable must be fixed." },
        { id: "r3", text: "The CRC errors (841) confirm physical layer signal issues from the faulty cable. The collision counters are consistent with half-duplex operation. Both symptoms resolve once a properly wired cable provides all 4 pairs for Gigabit negotiation." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Perfect diagnosis! The TDR test reveals the root cause: pairs 4-5 and 7-8 are open in the new cable, forcing a fallback to 100Mbps half-duplex. The collisions from half-duplex further reduce throughput to 2-3 Mbps. A properly terminated cable with all 4 pairs will restore Gigabit full-duplex.",
        partial: "You identified a cable or physical layer issue. The TDR diagnostic is the key evidence: only 2 of 4 pairs are working, forcing 100Mbps half-duplex instead of Gigabit full-duplex. Replace the cable.",
        wrong: "The TDR test shows pairs 4-5 and 7-8 are 'Open' in the replacement cable. Gigabit needs all 4 pairs, so the link fell back to 100Mbps half-duplex. The half-duplex collisions reduce throughput to 2-3 Mbps. Replace the cable with a properly terminated one.",
      },
    },
  ],
  hints: [
    "Late collisions on a full-duplex link indicate a duplex mismatch. In proper full-duplex operation, collisions should never occur because transmit and receive use separate wire pairs.",
    "When a link negotiates to a lower speed than expected, check TDR cable diagnostics. Gigabit Ethernet requires all 4 wire pairs, and a fault on any pair forces a fallback to 100Mbps or 10Mbps.",
    "The IEEE 802.3 standard recommends autonegotiation on both ends. When one side forces speed/duplex and the other auto-negotiates, the auto side may default to half-duplex, causing severe performance degradation.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Duplex mismatches are among the most common yet misdiagnosed network issues. They cause subtle performance problems that are often blamed on applications or servers. Understanding autonegotiation behavior and reading interface error counters is a fundamental skill tested on the CCNA and used daily by network support engineers.",
  toolRelevance: ["show interfaces", "show interfaces status", "cable-diagnostics tdr", "show power inline"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
