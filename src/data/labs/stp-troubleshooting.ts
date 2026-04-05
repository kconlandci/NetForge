import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "stp-troubleshooting",
  version: 1,
  title: "Diagnose Spanning Tree Protocol Issues",

  tier: "beginner",
  track: "routing-switching",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["stp", "spanning-tree", "layer-2", "loop-prevention"],

  description:
    "Investigate and resolve Spanning Tree Protocol problems causing network loops, root bridge elections, and blocked port issues.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Read and interpret show spanning-tree output",
    "Identify the root bridge and understand the election process",
    "Diagnose ports stuck in blocking or listening state",
  ],
  sortOrder: 201,

  status: "published",
  prerequisites: [],

  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "wrong-root-bridge",
      title: "Incorrect Root Bridge Election",
      objective:
        "Users on VLAN 10 report slow performance. Investigate why the root bridge is a low-end access switch instead of the distribution switch.",
      investigationData: [
        {
          id: "show-stp",
          label: "show spanning-tree vlan 10 (Switch1 - Access)",
          content:
            "VLAN0010\n  Spanning tree enabled protocol ieee\n  Root ID    Priority    32778\n             Address     aabb.cc00.1000\n             This bridge is the root\n             Hello Time  2 sec  Max Age 20 sec  Forward Delay 15 sec\n\n  Bridge ID  Priority    32778 (priority 32768 sys-id-ext 10)\n             Address     aabb.cc00.1000",
          isCritical: true,
        },
        {
          id: "show-stp-dist",
          label: "show spanning-tree vlan 10 (Switch2 - Distribution)",
          content:
            "VLAN0010\n  Spanning tree enabled protocol ieee\n  Root ID    Priority    32778\n             Address     aabb.cc00.1000\n             Cost        19\n             Port        1 (GigabitEthernet0/1)\n             Hello Time  2 sec  Max Age 20 sec  Forward Delay 15 sec\n\n  Bridge ID  Priority    32778 (priority 32768 sys-id-ext 10)\n             Address     aabb.cc00.2000",
        },
        {
          id: "show-int",
          label: "show interfaces status (Switch2)",
          content:
            "Port      Name    Status       Vlan  Duplex  Speed Type\nGi0/1     UPLINK  connected    trunk full    1000  10/100/1000BaseT\nGi0/2     UPLINK  connected    trunk full    1000  10/100/1000BaseT\nFa0/1     USER1   connected    10    full    100   10/100BaseTX",
        },
      ],
      actions: [
        {
          id: "lower-priority-dist",
          label: "Set Switch2 priority to 4096 for VLAN 10",
          color: "green",
        },
        {
          id: "disable-stp",
          label: "Disable STP on all switches",
          color: "red",
        },
        {
          id: "increase-priority-access",
          label: "Set Switch1 priority to 61440",
          color: "yellow",
        },
        {
          id: "reboot-switch1",
          label: "Reboot Switch1 to reset STP",
          color: "orange",
        },
      ],
      correctActionId: "lower-priority-dist",
      rationales: [
        {
          id: "r1",
          text: "The distribution switch should be root because it has higher bandwidth uplinks and is centrally placed. Lowering its priority ensures it wins the election.",
        },
        {
          id: "r2",
          text: "Disabling STP would create Layer 2 loops, causing broadcast storms and bringing the network down.",
        },
        {
          id: "r3",
          text: "Raising Switch1's priority would make it less likely to be root, but does not guarantee Switch2 wins if other switches have default priority.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Setting the distribution switch to a low priority (e.g., 4096) guarantees it becomes root bridge, optimizing traffic paths.",
        partial:
          "You identified the right area but not the best fix. Always set the desired root bridge to a low priority value explicitly.",
        wrong:
          "Review STP root bridge election. Never disable STP. Instead, control which switch becomes root by lowering its bridge priority.",
      },
    },
    {
      type: "investigate-decide",
      id: "port-stuck-blocking",
      title: "Port Stuck in Blocking State",
      objective:
        "A server connected to Fa0/5 on Switch3 cannot communicate. The port LED is amber. Determine why the port is in STP blocking state.",
      investigationData: [
        {
          id: "show-stp-int",
          label: "show spanning-tree interface Fa0/5",
          content:
            "Vlan             Role Sts   Cost      Prio.Nbr Type\n---------------- ---- --- --------- -------- ----\nVLAN0010         Altn BLK 19        128.5    P2p",
          isCritical: true,
        },
        {
          id: "show-cdp",
          label: "show cdp neighbors Fa0/5",
          content:
            "Device ID    Local Intrfce  Holdtme  Capability  Platform  Port ID\nSwitch4      Fas 0/5        170       S I       WS-C2960  Fas 0/1",
          isCritical: true,
        },
        {
          id: "show-mac",
          label: "show mac address-table interface Fa0/5",
          content: "Mac Address Table\n-------------------------------------------\n(no entries found)",
        },
      ],
      actions: [
        {
          id: "enable-portfast",
          label: "Enable PortFast on Fa0/5",
          color: "red",
        },
        {
          id: "remove-loop",
          label: "Remove the redundant cable creating the loop",
          color: "green",
        },
        {
          id: "set-stp-forward",
          label: "Force the port to forwarding with debug",
          color: "red",
        },
        {
          id: "shut-no-shut",
          label: "Bounce the port with shut/no shut",
          color: "yellow",
        },
      ],
      correctActionId: "remove-loop",
      rationales: [
        {
          id: "r1",
          text: "CDP shows another switch (Switch4) is connected to Fa0/5, not a server. This creates a redundant path that STP correctly blocks. The cable is miswired.",
        },
        {
          id: "r2",
          text: "PortFast should never be enabled on a port connected to another switch. It would bypass STP convergence and could cause a loop.",
        },
        {
          id: "r3",
          text: "Forcing the port to forwarding would create a Layer 2 loop since there is already an active path through this segment.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Exactly right! CDP revealed the port connects to another switch, not a server. The redundant cable should be removed or the server reconnected to the correct port.",
        partial:
          "You're on the right track. Check CDP neighbors before changing STP settings. The issue is a cabling mistake, not an STP misconfiguration.",
        wrong:
          "Never enable PortFast on switch-to-switch links or force ports to forwarding. Use CDP to verify what device is actually connected.",
      },
    },
    {
      type: "investigate-decide",
      id: "stp-topology-change",
      title: "Excessive STP Topology Changes",
      objective:
        "Network monitoring shows thousands of STP topology change notifications per hour on VLAN 20. Determine the source and resolution.",
      investigationData: [
        {
          id: "show-stp-detail",
          label: "show spanning-tree vlan 20 detail",
          content:
            "VLAN0020 is executing the ieee compatible Spanning Tree protocol\n  Number of topology changes 4523\n  Last topology change occurred 00:00:03 ago from FastEthernet0/12\n  Topology change flag set\n  Times:  hold 1, topology change 35, notification 2",
          isCritical: true,
        },
        {
          id: "show-int-fa012",
          label: "show interface Fa0/12",
          content:
            "FastEthernet0/12 is up, line protocol is up (connected)\n  Hardware is Fast Ethernet, address is aabb.cc00.300c\n  Last input 00:00:00, output 00:00:00\n  Input queue: 0/75/0/0 (size/max/drops/flushes)\n  5 minute input rate 12000 bits/sec, 8 packets/sec\n  5 minute output rate 8000 bits/sec, 5 packets/sec\n     82453 input packets, 0 CRC, 0 frame\n     Received 82453 broadcasts (82400 multicasts)",
        },
        {
          id: "show-log",
          label: "show logging | include Fa0/12",
          content:
            "%LINEPROTO-5-UPDOWN: Line protocol on Interface Fa0/12, changed state to down\n%LINEPROTO-5-UPDOWN: Line protocol on Interface Fa0/12, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface Fa0/12, changed state to down\n%LINEPROTO-5-UPDOWN: Line protocol on Interface Fa0/12, changed state to up",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "enable-portfast",
          label: "Enable PortFast on Fa0/12 to suppress TCNs",
          color: "green",
        },
        {
          id: "disable-port",
          label: "Shut down Fa0/12 permanently",
          color: "orange",
        },
        {
          id: "increase-hello",
          label: "Increase STP hello timer to 10 seconds",
          color: "yellow",
        },
        {
          id: "enable-bpdu-guard",
          label: "Enable BPDU Guard globally",
          color: "yellow",
        },
      ],
      correctActionId: "enable-portfast",
      rationales: [
        {
          id: "r1",
          text: "PortFast on access ports prevents STP topology change notifications when the port flaps. The flapping port connects to an end device, so PortFast is safe and stops the TCN flood.",
        },
        {
          id: "r2",
          text: "Shutting down the port would fix the TCN storm but denies service to the connected device. The root cause is the port flapping, which PortFast mitigates for STP.",
        },
        {
          id: "r3",
          text: "Increasing the hello timer would slow down STP convergence for the entire VLAN but would not stop TCNs from the flapping port.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The port connects to an end device and is flapping, generating excessive TCNs. PortFast suppresses TCNs on access ports while still allowing the device to connect.",
        partial:
          "You identified the flapping port but picked a suboptimal fix. PortFast is the standard solution for access ports generating excessive topology changes.",
        wrong:
          "Review how PortFast works. It suppresses TCN generation on access ports. The logs clearly show Fa0/12 is flapping, and the last TCN source confirms it.",
      },
    },
  ],
  hints: [
    "Check 'show spanning-tree' to find the root bridge and port roles. The root bridge has the lowest bridge ID.",
    "Use 'show cdp neighbors' to verify what device is actually connected to a port before changing STP settings.",
    "PortFast is safe on access ports connecting to end devices. Never use it on ports connecting to other switches.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "STP troubleshooting is one of the most common tasks in enterprise LAN environments. Understanding root bridge election and topology changes prevents broadcast storms.",
  toolRelevance: [
    "Cisco IOS CLI",
    "Wireshark (BPDU analysis)",
    "Network monitoring (SNMP traps)",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
