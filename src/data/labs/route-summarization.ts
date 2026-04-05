import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "route-summarization",
  version: 1,
  title: "Address Route Summarization Issues",

  tier: "advanced",
  track: "routing-switching",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["route-summarization", "cidr", "supernetting", "routing-efficiency"],

  description:
    "Triage and remediate route summarization problems including incorrect summary addresses, black-hole routes, and suboptimal summarization boundaries across OSPF and EIGRP.",
  estimatedMinutes: 16,
  learningObjectives: [
    "Calculate correct summary addresses and prefix lengths",
    "Identify black-hole routing caused by overly broad summaries",
    "Remediate summarization configuration errors in OSPF and EIGRP",
  ],
  sortOrder: 217,

  status: "published",
  prerequisites: [],

  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "wrong-summary-address",
      title: "Incorrect OSPF Summary Address",
      description:
        "An ABR is summarizing routes for Area 1 into Area 0, but some subnets in Area 1 are unreachable from Area 0. The summary is too narrow and excludes valid networks.",
      evidence: [
        {
          type: "cli-output",
          content:
            "ABR# show ip route ospf | include IA\nO IA  10.1.0.0/22 [110/20] via 10.0.0.2, 00:15:32, GigabitEthernet0/0",
        },
        {
          type: "cli-output",
          content:
            "ABR# show run | section ospf\nrouter ospf 1\n area 1 range 10.1.0.0 255.255.252.0",
        },
        {
          type: "table",
          content:
            "Area 1 Subnets:\n10.1.0.0/24 - Reachable from Area 0\n10.1.1.0/24 - Reachable from Area 0\n10.1.2.0/24 - Reachable from Area 0\n10.1.3.0/24 - Reachable from Area 0\n10.1.4.0/24 - UNREACHABLE from Area 0\n10.1.5.0/24 - UNREACHABLE from Area 0",
          icon: "alert",
        },
      ],
      classifications: [
        {
          id: "narrow-summary",
          label: "Summary Address Too Narrow",
          description: "The /22 summary covers only 10.1.0.0 to 10.1.3.255, excluding 10.1.4.0/24 and 10.1.5.0/24.",
        },
        {
          id: "area-mismatch",
          label: "Area Configuration Error",
          description: "Subnets 10.1.4.0 and 10.1.5.0 are in the wrong OSPF area.",
        },
        {
          id: "missing-network",
          label: "Missing Network Statements",
          description: "The excluded subnets are not advertised by the OSPF network command.",
        },
      ],
      correctClassificationId: "narrow-summary",
      remediations: [
        {
          id: "widen-summary",
          label: "Change summary to 10.1.0.0/21 (255.255.248.0) to cover 10.1.0.0 through 10.1.7.255",
          description: "Widen the area range to include all six subnets within a /21 summary.",
        },
        {
          id: "add-second-range",
          label: "Add a second area range for 10.1.4.0/23",
          description: "Create an additional summary to cover the excluded subnets.",
        },
        {
          id: "remove-summary",
          label: "Remove summarization and advertise individual routes",
          description: "Eliminate the area range command to send all specific routes into Area 0.",
        },
      ],
      correctRemediationId: "widen-summary",
      rationales: [
        {
          id: "r1",
          text: "The /22 summary covers 10.1.0.0-10.1.3.255 (4 subnets). Changing to /21 covers 10.1.0.0-10.1.7.255 (8 subnets), which includes all 6 existing subnets with room to grow.",
        },
        {
          id: "r2",
          text: "Adding a second range works but creates multiple summary routes. A single /21 is cleaner and provides a contiguous summary block.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The /22 was too narrow. A /21 summary covers all 6 subnets (10.1.0.0 through 10.1.7.255) with a single clean summary route.",
        partial:
          "You identified the narrow summary. While multiple ranges work, a single wider summary is preferred for cleaner routing tables.",
        wrong:
          "Calculate binary boundaries: /22 covers 4 /24s (10.1.0-3.x). To cover 6 subnets (10.1.0-5.x), you need at least /21 which covers 8 /24s.",
      },
    },
    {
      type: "triage-remediate",
      id: "eigrp-blackhole",
      title: "EIGRP Summary Route Black Hole",
      description:
        "After configuring EIGRP auto-summary on an ABR, traffic to 172.16.5.0/24 is being black-holed. The router has subnets 172.16.1.0/24 through 172.16.4.0/24 connected but not 172.16.5.0/24.",
      evidence: [
        {
          type: "cli-output",
          content:
            "Router# show ip route 172.16.5.0\nRouting entry for 172.16.0.0/16\n  Known via \"eigrp 100\", distance 5, metric 28160, type internal\n  Redistributing via eigrp 100\n  Routing Descriptor Blocks:\n  * directly connected, via Null0\n      Route metric is 28160, traffic share count is 1",
          icon: "alert",
        },
        {
          type: "cli-output",
          content:
            "Router# show run | section eigrp\nrouter eigrp 100\n network 172.16.0.0\n auto-summary",
        },
        {
          type: "cli-output",
          content:
            "Router# show ip route eigrp\nD    172.16.0.0/16 is a summary, 00:05:32, Null0\nD    172.16.1.0/24 [90/28160] via Connected, GigabitEthernet0/0\nD    172.16.2.0/24 [90/28160] via Connected, GigabitEthernet0/1\nD    172.16.3.0/24 [90/28160] via Connected, GigabitEthernet0/2\nD    172.16.4.0/24 [90/28160] via Connected, Serial0/0/0",
        },
      ],
      classifications: [
        {
          id: "auto-summary-blackhole",
          label: "Auto-Summary Creating Black Hole via Null0",
          description: "EIGRP auto-summary created a classful 172.16.0.0/16 summary pointing to Null0. Traffic for non-existent subnets within /16 is silently dropped.",
        },
        {
          id: "missing-route",
          label: "Missing Route to 172.16.5.0/24",
          description: "No route exists for 172.16.5.0/24 because it is not connected or learned from a neighbor.",
        },
        {
          id: "null0-route",
          label: "Accidental Null0 Static Route",
          description: "A static route to Null0 was manually configured for traffic engineering.",
        },
      ],
      correctClassificationId: "auto-summary-blackhole",
      remediations: [
        {
          id: "disable-auto-summary",
          label: "Disable auto-summary with 'no auto-summary' under EIGRP",
          description: "Remove the auto-summary command to advertise specific subnets instead of the classful summary.",
        },
        {
          id: "add-ip-route",
          label: "Add a specific static route for 172.16.5.0/24",
          description: "Create a static route to forward 172.16.5.0/24 traffic to the correct next hop.",
        },
        {
          id: "remove-null0",
          label: "Remove the Null0 route manually",
          description: "Delete the summary route pointing to Null0.",
        },
      ],
      correctRemediationId: "disable-auto-summary",
      rationales: [
        {
          id: "r1",
          text: "EIGRP auto-summary creates a classful summary (172.16.0.0/16) pointing to Null0 for loop prevention. This black-holes traffic for any /24 within /16 that is not specifically connected. Disabling auto-summary removes the Null0 route.",
        },
        {
          id: "r2",
          text: "The Null0 route is auto-generated by EIGRP auto-summary and cannot be manually removed. It will reappear after deletion. Disabling auto-summary is the proper fix.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! EIGRP auto-summary creates classful summaries with Null0 routes. Disabling it with 'no auto-summary' removes the black hole and advertises specific subnets.",
        partial:
          "You identified the Null0 issue. The Null0 route is auto-generated by auto-summary and cannot be manually removed. Disable auto-summary instead.",
        wrong:
          "EIGRP auto-summary generates a classful summary route pointing to Null0. Traffic for non-existent subnets within that range is silently dropped (black-holed).",
      },
    },
    {
      type: "triage-remediate",
      id: "summary-boundary-error",
      title: "Summary at Wrong Boundary",
      description:
        "An engineer configured manual summarization in EIGRP to advertise 192.168.16.0/21 but downstream routers report unreachable subnets. The actual subnets are 192.168.16.0/24 through 192.168.20.0/24.",
      evidence: [
        {
          type: "cli-output",
          content:
            "Router# show ip eigrp topology | include Summary\nP 192.168.16.0/21, 1 successors, FD is Infinity\n        via Summary (Infinity/Infinity), Null0",
        },
        {
          type: "table",
          content:
            "Actual Subnets:\n192.168.16.0/24 (connected)\n192.168.17.0/24 (connected)\n192.168.18.0/24 (connected)\n192.168.19.0/24 (connected)\n192.168.20.0/24 (connected) <-- outside /21 range!",
          icon: "alert",
        },
        {
          type: "cli-output",
          content:
            "Router(config-if)# ip summary-address eigrp 100 192.168.16.0 255.255.248.0\n\nNote: /21 covers 192.168.16.0 to 192.168.23.255 (8 subnets)\n192.168.20.0 IS within this range.",
        },
      ],
      classifications: [
        {
          id: "summary-correct-but-not-applied",
          label: "Summary Is Correct But Not Applied to All Interfaces",
          description: "The /21 summary covers all subnets but is not configured on all EIGRP-facing interfaces.",
        },
        {
          id: "wrong-boundary",
          label: "Summary Applied on Wrong Interface",
          description: "The summary is configured on the wrong interface, not the one facing downstream neighbors.",
        },
        {
          id: "fd-infinity",
          label: "Feasible Distance Infinity Due to Missing Component Routes",
          description: "One of the component routes is not in the EIGRP topology, causing the summary to have infinite metric.",
        },
      ],
      correctClassificationId: "fd-infinity",
      remediations: [
        {
          id: "verify-networks",
          label: "Verify all subnets are in the EIGRP topology and add missing network statements",
          description: "Ensure all component subnets are advertised by EIGRP so the summary route has a valid metric.",
        },
        {
          id: "change-summary",
          label: "Change the summary to /20 to be safer",
          description: "Use a broader summary to ensure all subnets are covered.",
        },
        {
          id: "remove-summary",
          label: "Remove manual summarization entirely",
          description: "Stop summarizing and let all individual routes be advertised.",
        },
      ],
      correctRemediationId: "verify-networks",
      rationales: [
        {
          id: "r1",
          text: "The FD is Infinity, meaning not all component routes are present in EIGRP. While the /21 range covers 192.168.16.0-23.255, one or more subnets may not have EIGRP network statements. Verify and add missing network statements.",
        },
        {
          id: "r2",
          text: "Broadening to /20 does not fix the infinite FD issue. The problem is missing component routes in EIGRP, not the summary boundary.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The FD Infinity indicates a missing component route. Verify all subnets are in the EIGRP topology before the summary can be generated with a valid metric.",
        partial:
          "You identified a summarization issue. Focus on the FD Infinity: the summary cannot have a valid metric if component routes are missing from EIGRP.",
        wrong:
          "EIGRP manual summaries show FD Infinity when not all component subnets are in the topology. Check EIGRP network statements for each subnet.",
      },
    },
  ],
  hints: [
    "Route summarization boundaries must be calculated in binary. A /21 covers 8 /24 subnets starting from the boundary address.",
    "EIGRP auto-summary creates classful summaries with Null0 routes. This can black-hole traffic for non-existent subnets within the classful range.",
    "EIGRP manual summary routes show FD Infinity when component routes are missing. Verify all subnets are in the EIGRP topology.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "Route summarization reduces routing table size and improves convergence. Incorrect summaries cause black holes and unreachable networks, making this a high-impact skill.",
  toolRelevance: [
    "Cisco IOS CLI",
    "Subnet calculator",
    "GNS3 / EVE-NG",
    "IP addressing documentation",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
