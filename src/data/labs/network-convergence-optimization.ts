import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "network-convergence-optimization",
  version: 1,
  title: "Optimize Network Convergence Times",

  tier: "advanced",
  track: "routing-switching",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["convergence", "ospf-tuning", "bfd", "fast-reroute", "optimization"],

  description:
    "Triage and remediate slow network convergence caused by suboptimal timer configurations, missing BFD, and inefficient SPF scheduling across OSPF and EIGRP networks.",
  estimatedMinutes: 18,
  learningObjectives: [
    "Identify factors affecting routing protocol convergence time",
    "Configure BFD for sub-second failure detection",
    "Tune OSPF SPF timers and hello/dead intervals for faster convergence",
  ],
  sortOrder: 219,

  status: "published",
  prerequisites: [],

  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "slow-ospf-convergence",
      title: "OSPF Failover Taking 40+ Seconds",
      description:
        "When a WAN link fails, OSPF takes over 40 seconds to converge to the backup path. Business applications time out during this period. The network uses default OSPF timers.",
      evidence: [
        {
          type: "cli-output",
          content:
            "Router# show ip ospf interface Serial0/0/0\nSerial0/0/0 is up, line protocol is up\n  Internet Address 10.0.1.1/30, Area 0\n  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5\n  Neighbor Count is 1, Adjacent neighbor count is 1",
        },
        {
          type: "cli-output",
          content:
            "Router# show ip ospf | include SPF\n SPF schedule delay 5 secs, Hold time between two SPFs 10 secs\n Minimum LSA interval 5 secs. Minimum LSA arrival 1 secs",
        },
        {
          type: "log-entry",
          content:
            "Mar 28 10:15:00: %OSPF-5-ADJCHG: Nbr 2.2.2.2 on Serial0/0/0 from FULL to DOWN, Neighbor Down: Dead timer expired\nMar 28 10:15:05: SPF algorithm scheduled, delay 5 seconds\nMar 28 10:15:10: SPF calculation complete\nMar 28 10:15:11: Routes installed in RIB",
          icon: "alert",
        },
      ],
      classifications: [
        {
          id: "slow-timers",
          label: "Default OSPF Timers Too Slow",
          description: "Default hello (10s) and dead (40s) timers combined with default SPF scheduling cause 40+ second convergence.",
        },
        {
          id: "no-backup-path",
          label: "No Alternate Path Available",
          description: "There is no backup path, so convergence depends entirely on re-routing through another area.",
        },
        {
          id: "spf-only",
          label: "SPF Calculation Taking Too Long",
          description: "The SPF algorithm itself is slow due to a large LSDB.",
        },
      ],
      correctClassificationId: "slow-timers",
      remediations: [
        {
          id: "tune-timers-add-bfd",
          label: "Reduce OSPF hello/dead timers and enable BFD for sub-second detection",
          description: "Set hello to 1s, dead to 3s or 4s, tune SPF throttle timers, and deploy BFD for millisecond failure detection.",
        },
        {
          id: "tune-spf-only",
          label: "Only tune SPF throttle timers",
          description: "Adjust SPF initial delay, hold, and max-wait without changing hello/dead timers.",
        },
        {
          id: "add-static-backup",
          label: "Add a floating static route as backup",
          description: "Configure a static route with higher AD as a quick failover mechanism.",
        },
      ],
      correctRemediationId: "tune-timers-add-bfd",
      rationales: [
        {
          id: "r1",
          text: "The 40-second dead timer is the biggest delay. Reducing hello/dead timers (1/3 or 1/4) and adding BFD (50ms detection) dramatically reduces failure detection. Tuning SPF throttle (e.g., 50/200/5000 ms) reduces computation delay.",
        },
        {
          id: "r2",
          text: "Tuning SPF alone saves seconds but the 40-second dead timer dominates convergence time. Both detection and computation must be optimized together.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The combination of reduced hello/dead timers, BFD, and SPF throttle tuning brings convergence from 40+ seconds to sub-second.",
        partial:
          "You addressed part of the problem. Both failure detection (hello/dead/BFD) and SPF computation timing need optimization for truly fast convergence.",
        wrong:
          "OSPF convergence = detection time + SPF computation + RIB update. Default timers contribute 40s of detection alone. BFD and timer tuning are essential.",
      },
    },
    {
      type: "triage-remediate",
      id: "eigrp-stuck-in-active",
      title: "EIGRP Routes Stuck in Active (SIA)",
      description:
        "After a link failure, several EIGRP routes go into Stuck-in-Active (SIA) state, causing route loss for 3+ minutes. The network has slow WAN links and large EIGRP domains.",
      evidence: [
        {
          type: "cli-output",
          content:
            "Router# show ip eigrp topology active\nEIGRP-IPv4 Topology Table for AS(100)\n\nCodes: P - Passive, A - Active, U - Update, Q - Query, R - Reply\n\nA 10.100.0.0/16, 1 successors, FD is Infinity\n    1 replies, active 00:03:15, query-origin: Local Origin\n    via 10.0.1.2, Serial0/0/0, Q\n\nA 10.200.0.0/16, 0 successors, FD is Infinity\n    2 replies, active 00:03:15, query-origin: Local Origin\n    via 10.0.1.2, Serial0/0/0, Q\n    via 10.0.2.2, Serial0/0/1, Q",
          icon: "alert",
        },
        {
          type: "log-entry",
          content:
            "%DUAL-3-SIA: Route 10.100.0.0/16 stuck-in-active state in IP-EIGRP(0) 100. Cleaning up\n%DUAL-5-NBRCHANGE: EIGRP-IPv4 100: Neighbor 10.0.1.2 (Serial0/0/0) is down: stuck in active",
        },
        {
          type: "cli-output",
          content:
            "Router# show ip eigrp topology summary\nEIGRP-IPv4 Topology Table for AS(100)\n  Head serial 0, next serial 0\n  412 routes, 180 pending queries\n  SIA-Timers: Active Time Limit: 180 sec",
        },
      ],
      classifications: [
        {
          id: "query-scope-too-wide",
          label: "EIGRP Query Scope Too Wide",
          description: "Queries propagate across the entire EIGRP domain over slow WAN links, exceeding the SIA timer before replies return.",
        },
        {
          id: "interface-failure",
          label: "Recurring Interface Failures",
          description: "The serial interfaces are flapping, causing constant topology changes.",
        },
        {
          id: "cpu-overload",
          label: "Router CPU Overloaded",
          description: "The router cannot process EIGRP queries fast enough due to CPU constraints.",
        },
      ],
      correctClassificationId: "query-scope-too-wide",
      remediations: [
        {
          id: "stub-and-summarize",
          label: "Deploy EIGRP stub routers and route summarization to limit query scope",
          description: "Configure spoke routers as EIGRP stubs and apply summary routes at distribution points to prevent queries from propagating network-wide.",
        },
        {
          id: "increase-sia-timer",
          label: "Increase the SIA timer to 600 seconds",
          description: "Give more time for replies to return from distant neighbors.",
        },
        {
          id: "replace-wan-links",
          label: "Upgrade all WAN links to higher bandwidth",
          description: "Faster links would reduce query/reply propagation time.",
        },
      ],
      correctRemediationId: "stub-and-summarize",
      rationales: [
        {
          id: "r1",
          text: "EIGRP queries propagate to every router in the topology until they hit a query boundary (stub, summary, or topology edge). Stub routers and summarization create boundaries that limit query propagation.",
        },
        {
          id: "r2",
          text: "Increasing the SIA timer just delays the inevitable neighbor teardown. The real fix is limiting how far queries travel. With 412 routes and 180 pending queries, the domain is too flat.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! EIGRP SIA is caused by unbounded query propagation. Stub routers and summarization create query boundaries that prevent queries from traversing the entire domain.",
        partial:
          "You identified the SIA problem. The solution must limit query scope, not just increase timers. Stub routers and summarization are the standard fixes.",
        wrong:
          "EIGRP Stuck-in-Active occurs when queries propagate too far and replies do not return in time. Limit query scope with stub routers and route summarization.",
      },
    },
    {
      type: "triage-remediate",
      id: "bfd-not-detecting",
      title: "BFD Not Detecting Link Failure",
      description:
        "BFD was configured between two routers to provide sub-second failure detection, but when a link degraded (high packet loss, not a full failure), BFD did not trigger a failover and OSPF continued using the degraded path.",
      evidence: [
        {
          type: "cli-output",
          content:
            "Router# show bfd neighbors detail\nNeighAddr    LD/RD    RH/RS    State   Int\n10.0.1.2     1/2      Up       Up      Gi0/0\n\nRegistered protocols: OSPF\nSession state is UP\nLocal Diag: 0, Demand mode: 0\nMinTxInt: 300000, MinRxInt: 300000, Multiplier: 3",
          icon: "alert",
        },
        {
          type: "cli-output",
          content:
            "Router# show interface Gi0/0\nGigabitEthernet0/0 is up, line protocol is up\n  5 minute input rate 450000000 bits/sec, 38000 packets/sec\n  Input errors: 0, CRC: 0, frame: 0\n  Output errors: 0\n  Input queue: 75/75/352/0 (size/max/drops/flushes)\n  5 min packet loss rate: 12%",
        },
        {
          type: "log-entry",
          content:
            "No BFD state change events in log.\nOSPF neighbor remains in FULL state on Gi0/0.\nApplication traffic experiencing 12% packet loss and high latency.",
        },
      ],
      classifications: [
        {
          id: "bfd-timers-too-slow",
          label: "BFD Timers Too Lenient for Degraded Link Detection",
          description: "BFD intervals of 300ms with multiplier 3 require 3 consecutive missed packets (900ms) to declare failure. With 12% packet loss, most BFD packets still arrive.",
        },
        {
          id: "bfd-not-registered",
          label: "BFD Not Registered with OSPF",
          description: "BFD is running but OSPF is not using it for failure detection.",
        },
        {
          id: "link-still-up",
          label: "Link Is Still Up",
          description: "BFD only detects complete failures, not quality degradation.",
        },
      ],
      correctClassificationId: "bfd-timers-too-slow",
      remediations: [
        {
          id: "aggressive-bfd-plus-ip-sla",
          label: "Tighten BFD timers and add IP SLA tracking for quality-based failover",
          description: "Reduce BFD intervals to 50ms x3 for faster hard-failure detection, and add IP SLA probes with OSPF object tracking to detect quality degradation (loss, latency, jitter).",
        },
        {
          id: "only-tighten-bfd",
          label: "Reduce BFD timers to 50ms with multiplier 3",
          description: "Aggressive BFD timers of 50ms x3 = 150ms failure detection.",
        },
        {
          id: "dampening",
          label: "Enable interface dampening to suppress the flapping link",
          description: "Dampen the interface to prevent oscillation.",
        },
      ],
      correctRemediationId: "aggressive-bfd-plus-ip-sla",
      rationales: [
        {
          id: "r1",
          text: "BFD detects link failure (complete loss), not quality degradation. With 12% loss, most BFD packets arrive and the session stays up. IP SLA with object tracking can measure loss/latency/jitter and trigger a routing change based on quality thresholds.",
        },
        {
          id: "r2",
          text: "Tightening BFD alone helps with hard failures but does not address quality degradation. At 12% loss with 50ms intervals, BFD would still rarely miss 3 consecutive packets.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! BFD detects link failures, not quality degradation. IP SLA with tracking provides quality-based failover by measuring loss, latency, and jitter thresholds.",
        partial:
          "You addressed BFD but missed the quality degradation aspect. BFD alone cannot detect 12% packet loss. IP SLA tracking is needed for quality-based decisions.",
        wrong:
          "BFD operates at the link layer and detects complete failures. For quality degradation (loss, latency, jitter), use IP SLA probes with OSPF/EIGRP object tracking.",
      },
    },
  ],
  hints: [
    "OSPF convergence time = failure detection (hello/dead or BFD) + SPF computation + RIB/FIB update. Optimize all three stages.",
    "EIGRP Stuck-in-Active is caused by queries propagating too far. Stub routers and summarization create query boundaries.",
    "BFD detects link failure but not quality degradation. For quality-based failover, combine BFD with IP SLA and object tracking.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "Network convergence optimization directly impacts application availability. Understanding BFD, timer tuning, and query scoping separates senior engineers from juniors.",
  toolRelevance: [
    "Cisco IOS / IOS-XE CLI",
    "IP SLA and Object Tracking",
    "BFD configuration",
    "Network monitoring (convergence measurement)",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
