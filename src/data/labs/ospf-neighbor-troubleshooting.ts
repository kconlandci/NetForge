import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ospf-neighbor-troubleshooting",
  version: 1,
  title: "Debug OSPF Adjacency Failures",

  tier: "beginner",
  track: "routing-switching",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["ospf", "routing-protocol", "adjacency", "troubleshooting"],

  description:
    "Investigate why OSPF neighbors fail to form adjacencies by examining hello timers, area mismatches, authentication, and network types.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Identify OSPF adjacency requirements and common failure causes",
    "Interpret show ip ospf neighbor and show ip ospf interface output",
    "Resolve hello/dead timer, area, and authentication mismatches",
  ],
  sortOrder: 203,

  status: "published",
  prerequisites: [],

  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "hello-timer-mismatch",
      title: "OSPF Neighbors Stuck in INIT",
      objective:
        "Router1 and Router2 are directly connected on 10.0.12.0/30 but OSPF adjacency is stuck in INIT state. Find and fix the root cause.",
      investigationData: [
        {
          id: "show-ospf-neighbor",
          label: "show ip ospf neighbor (Router1)",
          content:
            "Neighbor ID     Pri   State       Dead Time   Address         Interface\n2.2.2.2           1   INIT/DROTHER  00:00:35  10.0.12.2       GigabitEthernet0/0",
          isCritical: true,
        },
        {
          id: "show-ospf-int-r1",
          label: "show ip ospf interface Gi0/0 (Router1)",
          content:
            "GigabitEthernet0/0 is up, line protocol is up\n  Internet Address 10.0.12.1/30, Area 0\n  Process ID 1, Router ID 1.1.1.1, Network Type BROADCAST, Cost: 1\n  Transmit Delay is 1 sec, State DR, Priority 1\n  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5",
          isCritical: true,
        },
        {
          id: "show-ospf-int-r2",
          label: "show ip ospf interface Gi0/0 (Router2)",
          content:
            "GigabitEthernet0/0 is up, line protocol is up\n  Internet Address 10.0.12.2/30, Area 0\n  Process ID 1, Router ID 2.2.2.2, Network Type BROADCAST, Cost: 1\n  Transmit Delay is 1 sec, State BDR, Priority 1\n  Timer intervals configured, Hello 15, Dead 60, Wait 60, Retransmit 5",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "fix-timers",
          label: "Set Router2 hello to 10 and dead to 40",
          color: "green",
        },
        {
          id: "change-network-type",
          label: "Change both to point-to-point network type",
          color: "yellow",
        },
        {
          id: "clear-ospf",
          label: "Clear OSPF process on both routers",
          color: "orange",
        },
        {
          id: "change-area",
          label: "Move Router2 interface to Area 1",
          color: "red",
        },
      ],
      correctActionId: "fix-timers",
      rationales: [
        {
          id: "r1",
          text: "OSPF requires matching hello and dead timers on both ends. Router1 uses 10/40 while Router2 uses 15/60. Fixing Router2's timers to 10/40 will allow adjacency to form.",
        },
        {
          id: "r2",
          text: "Changing network type to point-to-point would change the default timers but is not necessary on Ethernet. The real issue is the explicit timer mismatch.",
        },
        {
          id: "r3",
          text: "Clearing the OSPF process would restart adjacency attempts but would not fix the underlying timer mismatch, so it would fail again.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Hello/Dead timer mismatch is a classic OSPF adjacency failure. Both sides must agree on 10/40 or whatever values you choose.",
        partial:
          "You identified a valid concern but missed the timer mismatch. Compare the hello and dead timer values on both interfaces.",
        wrong:
          "OSPF adjacency requires matching hello timers, dead timers, area ID, authentication, and network type. Check each one systematically.",
      },
    },
    {
      type: "investigate-decide",
      id: "area-mismatch",
      title: "OSPF Area ID Mismatch",
      objective:
        "Two routers on the same subnet cannot form an OSPF adjacency. No neighbor entry appears at all. Investigate the configuration.",
      investigationData: [
        {
          id: "show-ospf-r1",
          label: "show ip ospf interface Gi0/1 (Router1)",
          content:
            "GigabitEthernet0/1 is up, line protocol is up\n  Internet Address 172.16.0.1/30, Area 0\n  Process ID 1, Router ID 1.1.1.1, Network Type BROADCAST, Cost: 1\n  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5\n  No neighbor on this interface",
          isCritical: true,
        },
        {
          id: "show-ospf-r3",
          label: "show ip ospf interface Gi0/0 (Router3)",
          content:
            "GigabitEthernet0/0 is up, line protocol is up\n  Internet Address 172.16.0.2/30, Area 1\n  Process ID 1, Router ID 3.3.3.3, Network Type BROADCAST, Cost: 1\n  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5\n  No neighbor on this interface",
          isCritical: true,
        },
        {
          id: "show-run-ospf-r3",
          label: "show run | section ospf (Router3)",
          content:
            "router ospf 1\n router-id 3.3.3.3\n network 172.16.0.0 0.0.0.3 area 1\n network 192.168.3.0 0.0.0.255 area 1",
        },
      ],
      actions: [
        {
          id: "fix-area-r3",
          label: "Change Router3 Gi0/0 to Area 0",
          color: "green",
        },
        {
          id: "fix-area-r1",
          label: "Change Router1 Gi0/1 to Area 1",
          color: "yellow",
        },
        {
          id: "add-virtual-link",
          label: "Create a virtual link between Area 0 and Area 1",
          color: "yellow",
        },
        {
          id: "restart-ospf",
          label: "Restart OSPF on both routers",
          color: "red",
        },
      ],
      correctActionId: "fix-area-r3",
      rationales: [
        {
          id: "r1",
          text: "Both interfaces on the shared subnet must be in the same OSPF area. Since this link connects to Area 0 (the backbone), Router3 should use 'network 172.16.0.0 0.0.0.3 area 0' to match Router1.",
        },
        {
          id: "r2",
          text: "Changing Router1 to Area 1 would disconnect it from the backbone, which could break connectivity to other areas. The backbone link should remain in Area 0.",
        },
        {
          id: "r3",
          text: "A virtual link is used when an area cannot physically connect to Area 0, not to fix a simple area mismatch on a direct connection.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Right! The area ID must match on both sides of a link. Since this connects to the backbone, Router3's interface should be in Area 0.",
        partial:
          "You see the area mismatch but chose a suboptimal fix. The backbone-facing interface should be in Area 0 to maintain proper OSPF hierarchy.",
        wrong:
          "OSPF neighbors must be in the same area on a shared subnet. Compare the area assignments in both 'show ip ospf interface' outputs.",
      },
    },
    {
      type: "investigate-decide",
      id: "auth-failure",
      title: "OSPF Authentication Failure",
      objective:
        "Router1 and Router4 show OSPF neighbor in EXSTART/EXCHANGE state and then drop. Investigate the authentication configuration.",
      investigationData: [
        {
          id: "show-log-r1",
          label: "show logging | include OSPF (Router1)",
          content:
            "%OSPF-4-NOVALIDKEY: No valid authentication send key is available on interface GigabitEthernet0/2\n%OSPF-5-ADJCHG: Process 1, Nbr 4.4.4.4 on GigabitEthernet0/2 from EXSTART to DOWN, Neighbor Down: Dead timer expired",
          isCritical: true,
        },
        {
          id: "show-run-r1-int",
          label: "show run interface Gi0/2 (Router1)",
          content:
            "interface GigabitEthernet0/2\n ip address 10.0.14.1 255.255.255.252\n ip ospf authentication message-digest\n ip ospf message-digest-key 1 md5 SecretPass123\n ip ospf cost 10",
        },
        {
          id: "show-run-r4-int",
          label: "show run interface Gi0/0 (Router4)",
          content:
            "interface GigabitEthernet0/0\n ip address 10.0.14.2 255.255.255.252\n ip ospf authentication message-digest\n ip ospf message-digest-key 2 md5 SecretPass123\n ip ospf cost 10",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "fix-key-id",
          label: "Change Router4 key ID from 2 to 1",
          color: "green",
        },
        {
          id: "remove-auth",
          label: "Remove authentication from both routers",
          color: "red",
        },
        {
          id: "change-to-plaintext",
          label: "Switch both to plaintext authentication",
          color: "red",
        },
        {
          id: "change-password",
          label: "Change the MD5 password on both sides",
          color: "yellow",
        },
      ],
      correctActionId: "fix-key-id",
      rationales: [
        {
          id: "r1",
          text: "The MD5 key ID must match on both sides (Router1 uses key 1, Router4 uses key 2). The password is the same, but OSPF requires both the key ID and password to match.",
        },
        {
          id: "r2",
          text: "Removing authentication would fix the adjacency but eliminates security. MD5 authentication protects against rogue OSPF routers injecting false routes.",
        },
        {
          id: "r3",
          text: "Plaintext authentication is less secure than MD5. The issue is the key ID mismatch, not the authentication type.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Exactly! The key ID must match on both sides. Router1 uses key 1 and Router4 uses key 2, even though the password is identical. Fix the key ID to resolve the adjacency.",
        partial:
          "You see the authentication problem but your fix removes security or misidentifies the cause. The key ID (not just the password) must match.",
        wrong:
          "Compare the 'ip ospf message-digest-key' lines. OSPF MD5 auth requires matching key ID AND password. Never remove authentication to fix mismatches.",
      },
    },
  ],
  hints: [
    "OSPF adjacency requires matching hello/dead timers, area ID, authentication type/key, network type, and subnet mask.",
    "The 'show ip ospf interface' command reveals timers, area, network type, and authentication settings on each interface.",
    "Check 'show logging' for OSPF error messages that pinpoint the exact reason adjacencies fail.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "OSPF is the most widely deployed interior gateway protocol in enterprise networks. Quickly diagnosing adjacency failures is a critical skill for network operations.",
  toolRelevance: [
    "Cisco IOS CLI",
    "Wireshark (OSPF hello analysis)",
    "GNS3 / EVE-NG",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
