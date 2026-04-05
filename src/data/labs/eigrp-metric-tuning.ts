import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "eigrp-metric-tuning",
  version: 1,
  title: "Adjust EIGRP Metrics for Path Selection",

  tier: "intermediate",
  track: "routing-switching",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["eigrp", "routing-protocol", "metrics", "path-selection"],

  description:
    "Tune EIGRP composite metrics including bandwidth and delay to influence path selection and optimize traffic flow across redundant paths.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Understand EIGRP composite metric calculation using bandwidth and delay",
    "Modify interface bandwidth and delay to influence path selection",
    "Use variance for unequal-cost load balancing in EIGRP",
  ],
  sortOrder: 207,

  status: "published",
  prerequisites: [],

  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "bandwidth-delay-tuning",
      title: "Influence Path Selection with Bandwidth and Delay",
      description:
        "Router1 has two paths to 10.10.10.0/24: via Gi0/0 (1 Gbps fiber to Router2) and via Serial0/0 (T1 to Router3). EIGRP is currently sending traffic over the serial link because the bandwidth command on Gi0/0 is incorrectly set to 1544 Kbps.",
      targetSystem: "Router1 (Cisco ISR 4321)",
      items: [
        {
          id: "gi00-bandwidth",
          label: "Gi0/0 Bandwidth Setting",
          detail: "show int Gi0/0 — BW 1544 Kbit (incorrectly configured)",
          currentState: "1544",
          correctState: "1000000",
          states: ["1544", "10000", "100000", "1000000"],
          rationaleId: "r1",
        },
        {
          id: "gi00-delay",
          label: "Gi0/0 Delay Setting",
          detail: "show int Gi0/0 — DLY 20000 usec (default for serial, wrong for GigE)",
          currentState: "20000",
          correctState: "10",
          states: ["10", "100", "1000", "20000"],
          rationaleId: "r1",
        },
        {
          id: "serial-bandwidth",
          label: "Serial0/0 Bandwidth Setting",
          detail: "show int Serial0/0 — BW 1544 Kbit (correct for T1)",
          currentState: "1544",
          correctState: "1544",
          states: ["1544", "64", "512", "1000000"],
          rationaleId: "r2",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "EIGRP uses the 'bandwidth' and 'delay' values from the interface to calculate its composite metric. Gi0/0 must reflect 1000000 Kbps (1 Gbps) and 10 usec delay for GigE.",
        },
        {
          id: "r2",
          text: "The serial interface bandwidth is correctly set to 1544 Kbps for a T1 line. Do not change it, as it accurately reflects the link speed.",
        },
      ],
      feedback: {
        perfect:
          "Correct! Fixing the bandwidth and delay on Gi0/0 to match its actual 1 Gbps capacity makes EIGRP prefer the faster fiber path.",
        partial:
          "You adjusted some values correctly. Remember that both bandwidth and delay affect the EIGRP metric, and both should reflect the actual link characteristics.",
        wrong:
          "EIGRP metric = f(bandwidth, delay). If the bandwidth command is wrong, EIGRP calculates the wrong metric. Fix bandwidth and delay to match actual link speed.",
      },
    },
    {
      type: "toggle-config",
      id: "unequal-cost-lb",
      title: "Enable Unequal-Cost Load Balancing",
      description:
        "Router1 has two EIGRP paths to 172.16.0.0/16: a primary via Gi0/0 (metric 28160) and a secondary via Gi0/1 (metric 46080, feasible successor). You want to use both links for load balancing. The variance is currently 1.",
      targetSystem: "Router1 (Cisco ISR 4321)",
      items: [
        {
          id: "variance",
          label: "EIGRP Variance Multiplier",
          detail: "show ip protocols — Variance: 1 (equal-cost only)",
          currentState: "1",
          correctState: "2",
          states: ["1", "2", "3", "4"],
          rationaleId: "r1",
        },
        {
          id: "max-paths",
          label: "Maximum Paths",
          detail: "show ip protocols — Maximum path: 4",
          currentState: "4",
          correctState: "4",
          states: ["1", "2", "4", "8"],
          rationaleId: "r2",
        },
        {
          id: "traffic-share",
          label: "Traffic Share Mode",
          detail: "show ip protocols — Traffic share: balanced",
          currentState: "balanced",
          correctState: "balanced",
          states: ["balanced", "min-across-interfaces"],
          rationaleId: "r3",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "Variance 2 means EIGRP will use any feasible successor with a metric up to 2x the best metric. 28160 * 2 = 56320, and 46080 < 56320, so the second path qualifies.",
        },
        {
          id: "r2",
          text: "Maximum paths of 4 allows up to 4 parallel routes. With 2 paths available, the default of 4 is sufficient and does not need changing.",
        },
        {
          id: "r3",
          text: "Balanced traffic share distributes packets proportionally to the metric. The lower-metric path gets more traffic than the higher-metric path.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! Setting variance to 2 enables unequal-cost load balancing across both paths, proportional to their metrics.",
        partial:
          "Close. Variance must be high enough so that the secondary metric falls within the variance multiplier of the best metric.",
        wrong:
          "EIGRP unequal-cost load balancing requires 'variance <n>' where n * best_metric >= feasible_successor_metric. Calculate the needed variance.",
      },
    },
    {
      type: "toggle-config",
      id: "eigrp-k-values",
      title: "Verify K-Value Consistency",
      description:
        "Router1 and Router4 lost their EIGRP adjacency after a configuration change. The log shows 'K-value mismatch'. Router1 uses default K-values (K1=1 K2=0 K3=1 K4=0 K5=0), but Router4 was modified to include K2 (load).",
      targetSystem: "Router4 (Cisco ISR 4321)",
      items: [
        {
          id: "k1-bandwidth",
          label: "K1 (Bandwidth)",
          detail: "show ip protocols — K1=1",
          currentState: "1",
          correctState: "1",
          states: ["0", "1"],
          rationaleId: "r1",
        },
        {
          id: "k2-load",
          label: "K2 (Load)",
          detail: "show ip protocols — K2=1 (non-default)",
          currentState: "1",
          correctState: "0",
          states: ["0", "1"],
          rationaleId: "r1",
        },
        {
          id: "k3-delay",
          label: "K3 (Delay)",
          detail: "show ip protocols — K3=1",
          currentState: "1",
          correctState: "1",
          states: ["0", "1"],
          rationaleId: "r1",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "EIGRP K-values must match on all routers in an autonomous system. The defaults (K1=1, K2=0, K3=1, K4=0, K5=0) use only bandwidth and delay. Router4's K2=1 breaks the adjacency.",
        },
      ],
      feedback: {
        perfect:
          "Correct! Setting K2 back to 0 on Router4 restores matching K-values and allows the EIGRP adjacency to re-form.",
        partial:
          "You identified the K-value issue but check which value is non-default. K2 (load) should be 0 to match the default configuration.",
        wrong:
          "EIGRP K-values must be identical on all neighbors. Compare Router4's K-values to the defaults: K1=1, K2=0, K3=1, K4=0, K5=0.",
      },
    },
  ],
  hints: [
    "EIGRP metric uses bandwidth and delay by default. The 'bandwidth' and 'delay' interface commands directly affect metric calculation.",
    "Variance multiplier enables unequal-cost load balancing. Set it so variance * best_metric >= feasible_successor_metric.",
    "K-values must match between EIGRP neighbors. A mismatch prevents adjacency formation entirely.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "EIGRP metric tuning is essential in enterprise WANs where you need to prefer certain paths. Understanding variance for unequal-cost load balancing is a valuable optimization skill.",
  toolRelevance: [
    "Cisco IOS CLI",
    "GNS3 / EVE-NG",
    "Network monitoring (path utilization)",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
