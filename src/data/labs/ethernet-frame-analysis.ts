import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ethernet-frame-analysis",
  version: 1,
  title: "Ethernet Frame Analysis",
  tier: "beginner",
  track: "network-fundamentals",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["ethernet", "frames", "layer-2", "wireshark"],
  description:
    "Analyze Ethernet frames for errors, misconfigurations, and anomalies using packet capture data.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Identify Ethernet frame components including source/destination MAC, EtherType, and FCS",
    "Detect frame errors such as runts, giants, and CRC failures",
    "Interpret Wireshark Ethernet frame captures to diagnose Layer 2 issues",
  ],
  sortOrder: 110,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "efa-001",
      title: "High Rate of Runt Frames on Switch Port",
      objective:
        "A switch port is logging a high number of runt frames. Determine the cause based on the evidence.",
      investigationData: [
        {
          id: "src1",
          label: "Switch interface counters",
          content:
            "Switch# show interface GigabitEthernet0/5\n  5 minute input rate 85000000 bits/sec\n  Input errors: 8432\n    Runts: 8430\n    Giants: 0\n    CRC: 2\n    Frame: 0\n  Duplex: Half\n  Speed: 1000Mbps\n  Connected device: IP Phone + PC (daisy-chained)",
          isCritical: true,
        },
        {
          id: "src2",
          label: "Wireshark capture sample",
          content:
            "Frame 1: 64 bytes on wire (normal)\nFrame 2: 38 bytes on wire (RUNT - below 64 byte minimum)\nFrame 3: 64 bytes on wire (normal)\nFrame 4: 42 bytes on wire (RUNT - below 64 byte minimum)\n\nNote: Runt frames appear to correlate with periods of high bidirectional traffic.",
          isCritical: true,
        },
        {
          id: "src3",
          label: "Switch port config",
          content:
            "interface GigabitEthernet0/5\n duplex half\n speed 1000\n switchport mode access\n switchport access vlan 10",
          isCritical: true,
        },
      ],
      actions: [
        { id: "a1", label: "Late collisions from duplex mismatch - change to full duplex", color: "green" },
        { id: "a2", label: "Replace the Ethernet cable - it has physical damage", color: "blue" },
        { id: "a3", label: "The IP phone is corrupting frames - replace it", color: "yellow" },
        { id: "a4", label: "Reduce the port speed to 100Mbps to match the device", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The port is configured for half-duplex at gigabit speed. Half-duplex causes collisions during bidirectional traffic, and late collisions at gigabit speeds truncate frames into runts. Setting full duplex eliminates collisions and the resulting runt frames.",
        },
        {
          id: "r2",
          text: "Cable damage would cause CRC errors, not specifically runts. With only 2 CRC errors versus 8430 runts, cable quality is not the primary issue.",
        },
        {
          id: "r3",
          text: "The runts correlate with high bidirectional traffic, pointing to a collision issue from half-duplex operation rather than a hardware defect in the phone.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Half-duplex at gigabit speed creates collisions that truncate frames into runts. Changing to full duplex resolves the issue. Modern switched networks should always use full duplex.",
        partial:
          "Close. The key evidence is half-duplex configuration combined with high runt count correlated to bidirectional traffic. This is a classic duplex mismatch symptom.",
        wrong:
          "The half-duplex setting is causing collisions that create runt frames. On a gigabit switched port, full duplex should always be used. This eliminates collisions entirely.",
      },
    },
    {
      type: "investigate-decide",
      id: "efa-002",
      title: "Giant Frames Causing Application Errors",
      objective:
        "An application reports data corruption on received messages. Network monitoring shows giant frames on the server's switch port. Investigate the cause.",
      investigationData: [
        {
          id: "src1",
          label: "Switch interface counters",
          content:
            "Switch# show interface GigabitEthernet0/10\n  Giants: 12847\n  MTU: 1500 bytes\n  Input errors: 12847\n\nSwitch# show interface GigabitEthernet0/1 (uplink to core)\n  Giants: 0\n  MTU: 9000 bytes (jumbo frames enabled)",
          isCritical: true,
        },
        {
          id: "src2",
          label: "Server NIC configuration",
          content:
            "$ ip link show eth0\n2: eth0: <BROADCAST,MULTICAST,UP> mtu 9000 qdisc fq state UP\n    link/ether 00:11:22:33:44:55 brd ff:ff:ff:ff:ff:ff\n\nNote: Server NIC has jumbo frames (MTU 9000) enabled.\nThe access switch port has standard MTU (1500).",
          isCritical: true,
        },
        {
          id: "src3",
          label: "Network path",
          content:
            "Server (MTU 9000) -> Access Switch Gi0/10 (MTU 1500) -> Core Switch Gi0/1 (MTU 9000)\n\nThe access switch does not support jumbo frames.",
          isCritical: false,
        },
      ],
      actions: [
        { id: "a1", label: "Reduce server NIC MTU to 1500 to match the access switch", color: "green" },
        { id: "a2", label: "Enable jumbo frames on the access switch", color: "blue" },
        { id: "a3", label: "Replace the access switch with one that supports jumbo frames", color: "yellow" },
        { id: "a4", label: "Enable TCP MSS clamping on the router", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The server sends 9000-byte frames but the access switch only supports 1500-byte MTU. Frames exceeding the switch MTU are counted as giants and dropped. Setting the server to MTU 1500 ensures all frames are within the access switch's capability.",
        },
        {
          id: "r2",
          text: "The access switch does not support jumbo frames, so enabling them is not an option. The immediate fix is to align the server MTU with the lowest MTU in the path.",
        },
        {
          id: "r3",
          text: "While replacing the switch would be a long-term solution, reducing the server MTU is the immediate fix that resolves the data corruption without hardware changes.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The MTU mismatch causes the access switch to drop oversized frames. Reducing the server MTU to 1500 matches the weakest link in the path and eliminates the giant frame errors.",
        partial:
          "Close. The path MTU must be consistent. The server's 9000-byte frames exceed the access switch's 1500-byte limit, causing drops. Align the server MTU to the switch.",
        wrong:
          "The server MTU (9000) exceeds the access switch MTU (1500), causing frames to be classified as giants and dropped. Setting the server to MTU 1500 resolves the mismatch.",
      },
    },
    {
      type: "investigate-decide",
      id: "efa-003",
      title: "Unknown EtherType in Captured Frames",
      objective:
        "Wireshark captures show frames with an unfamiliar EtherType flooding the network. Determine what is happening.",
      investigationData: [
        {
          id: "src1",
          label: "Wireshark capture",
          content:
            "Frame 1: Dst: 01:80:c2:00:00:0e, Src: 00:AA:BB:CC:DD:01\n  EtherType: 0x88CC (LLDP)\n  Link Layer Discovery Protocol\n    Chassis ID: switch-core-01\n    Port ID: GigabitEthernet0/1\n    TTL: 120\n    System Name: switch-core-01\n    System Description: Cisco IOS 15.2",
          isCritical: true,
        },
        {
          id: "src2",
          label: "Frame frequency",
          content:
            "LLDP frames observed: every 30 seconds from each switch\nNumber of switches visible: 15\nTotal LLDP frames per minute: 30\nDestination: 01:80:c2:00:00:0e (LLDP multicast)\n\nNote: A junior admin flagged these as suspicious traffic.",
          isCritical: true,
        },
        {
          id: "src3",
          label: "Network baseline",
          content:
            "LLDP was enabled network-wide last Tuesday during a firmware upgrade.\nNo performance issues reported.\nBandwidth impact: negligible (< 0.001% of link capacity)",
          isCritical: false,
        },
      ],
      actions: [
        { id: "a1", label: "This is normal LLDP discovery traffic - no action needed", color: "green" },
        { id: "a2", label: "Block the unknown EtherType at the firewall", color: "blue" },
        { id: "a3", label: "Investigate potential Layer 2 attack using spoofed frames", color: "yellow" },
        { id: "a4", label: "Disable the ports sending unknown frames", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "EtherType 0x88CC is LLDP (Link Layer Discovery Protocol), a standard IEEE 802.1AB protocol used by switches to advertise their identity and capabilities. It was recently enabled during firmware upgrades and poses no security risk.",
        },
        {
          id: "r2",
          text: "Blocking LLDP would prevent network discovery and management tools from mapping the topology. LLDP multicast frames do not cross router boundaries and have negligible bandwidth impact.",
        },
        {
          id: "r3",
          text: "The consistent source MACs matching known switch ports, the standard LLDP multicast destination, and the recent enabling of LLDP during firmware upgrades all confirm this is legitimate management traffic.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! This is standard LLDP traffic (EtherType 0x88CC) that was enabled during a recent firmware upgrade. It is a normal and useful network management protocol.",
        partial:
          "Close. EtherType 0x88CC is LLDP, a standard discovery protocol. Correlating with the recent firmware upgrade confirms it is expected behavior, not a threat.",
        wrong:
          "These are LLDP frames (EtherType 0x88CC), a standard network discovery protocol. They were enabled during the recent firmware upgrade, have negligible impact, and require no action.",
      },
    },
  ],
  hints: [
    "Runt frames (below 64 bytes) are often caused by collisions from duplex mismatch. Giant frames (above MTU) indicate an MTU mismatch somewhere in the path.",
    "Common EtherTypes: 0x0800 (IPv4), 0x0806 (ARP), 0x86DD (IPv6), 0x8100 (802.1Q VLAN), 0x88CC (LLDP). Unfamiliar EtherTypes are often legitimate protocols.",
    "Always check the interface counters first. The ratio of different error types (runts vs CRC vs giants) tells you what kind of problem you are dealing with.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Ethernet frame analysis is a core Wireshark skill. Network engineers who can quickly read frame-level details can diagnose issues that stumps those who only look at Layer 3 and above.",
  toolRelevance: ["Wireshark", "tcpdump", "show interface", "show mac address-table", "ethtool"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
