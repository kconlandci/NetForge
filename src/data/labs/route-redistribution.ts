import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "route-redistribution",
  version: 1,
  title: "Decide on Route Redistribution Strategy",

  tier: "intermediate",
  track: "routing-switching",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["redistribution", "ospf", "eigrp", "route-filtering"],

  description:
    "Evaluate route redistribution strategies between different routing protocols, understanding seed metrics, route maps, and potential routing loops.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Understand when route redistribution is necessary between protocols",
    "Configure seed metrics for redistributed routes",
    "Prevent routing loops using route maps and distribute lists",
  ],
  sortOrder: 209,

  status: "published",
  prerequisites: [],

  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "eigrp-to-ospf",
      title: "Redistribute EIGRP into OSPF",
      context:
        "Your company acquired a smaller firm. The main network runs OSPF Area 0, and the acquired network runs EIGRP AS 100. A border router connects both. You need OSPF routers to learn about EIGRP networks. The EIGRP side has 50 routes.",
      displayFields: [
        { label: "Main Network", value: "OSPF Area 0 (200 routes)" },
        { label: "Acquired Network", value: "EIGRP AS 100 (50 routes)" },
        { label: "Border Router", value: "Runs both OSPF and EIGRP" },
        { label: "Goal", value: "OSPF learns EIGRP routes" },
      ],
      actions: [
        {
          id: "redist-with-metric-routemap",
          label: "Redistribute EIGRP into OSPF with metric and route-map filter",
          color: "green",
        },
        {
          id: "redist-no-filter",
          label: "Redistribute EIGRP into OSPF with no filtering",
          color: "yellow",
        },
        {
          id: "static-routes",
          label: "Add static routes on every OSPF router for EIGRP networks",
          color: "red",
        },
        {
          id: "replace-eigrp",
          label: "Replace EIGRP with OSPF on the acquired network",
          color: "orange",
        },
      ],
      correctActionId: "redist-with-metric-routemap",
      rationales: [
        {
          id: "r1",
          text: "Redistributing with a route-map ensures only intended routes are shared, and setting a proper metric type (E1 or E2) controls how OSPF calculates cost. This is the safest approach.",
        },
        {
          id: "r2",
          text: "Redistributing without filtering could inject unwanted routes (default routes, loopbacks) into OSPF and create suboptimal routing or loops.",
        },
        {
          id: "r3",
          text: "Static routes on every router do not scale with 50+ networks and create a management nightmare when subnets change.",
        },
        {
          id: "r4",
          text: "Replacing EIGRP is a major migration that disrupts the acquired network. Redistribution is the standard approach for multi-protocol environments.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Redistribute with a route-map to filter routes and set appropriate OSPF metrics. This is the standard for merging two protocol domains.",
        partial:
          "Your approach would work but lacks safeguards. Always use route-maps or distribute-lists when redistributing to prevent route leaking.",
        wrong:
          "Route redistribution with filtering is the standard solution for connecting different routing protocol domains. Static routes do not scale.",
      },
    },
    {
      type: "action-rationale",
      id: "prevent-routing-loop",
      title: "Prevent Redistribution Routing Loops",
      context:
        "You have two border routers (R1 and R2) both redistributing between OSPF and EIGRP. After enabling mutual redistribution, you notice a routing loop: EIGRP routes go into OSPF on R1, then back into EIGRP on R2, creating suboptimal paths and high CPU.",
      displayFields: [
        { label: "R1", value: "OSPF <-> EIGRP redistribution" },
        { label: "R2", value: "OSPF <-> EIGRP redistribution" },
        { label: "Symptom", value: "Routing loops and suboptimal paths", emphasis: "critical" },
        { label: "CPU", value: "High on both border routers", emphasis: "warn" },
      ],
      actions: [
        {
          id: "tag-filter",
          label: "Use route tags to prevent re-redistribution of routes",
          color: "green",
        },
        {
          id: "remove-r2-redist",
          label: "Remove redistribution from R2 entirely",
          color: "yellow",
        },
        {
          id: "increase-ad",
          label: "Increase the administrative distance of redistributed routes",
          color: "orange",
        },
        {
          id: "add-more-routers",
          label: "Add a third border router to break the loop",
          color: "red",
        },
      ],
      correctActionId: "tag-filter",
      rationales: [
        {
          id: "r1",
          text: "Route tags mark redistributed routes at the point of injection. A route-map on each border router denies routes with the tag, preventing re-redistribution back into the original protocol.",
        },
        {
          id: "r2",
          text: "Removing R2 redistribution eliminates redundancy. Both border routers should redistribute for failover, but with proper loop prevention.",
        },
        {
          id: "r3",
          text: "Increasing AD helps with route preference but does not prevent the loop. Routes can still be redistributed back and forth.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! Route tagging is the industry-standard technique for preventing redistribution loops with multiple border routers.",
        partial:
          "Your approach reduces the problem but sacrifices redundancy or does not fully prevent loops. Route tags are the cleanest solution.",
        wrong:
          "With dual redistribution points, use route tags. Tag routes when redistributing and deny tagged routes on the opposite redistribution to prevent loops.",
      },
    },
    {
      type: "action-rationale",
      id: "seed-metric-issue",
      title: "Fix Missing Seed Metric",
      context:
        "You redistributed OSPF routes into EIGRP but none of the OSPF routes appear in the EIGRP topology table. The redistribution command is: 'redistribute ospf 1'. No metric was specified.\n\nRouter# show ip eigrp topology\n... (no external routes shown)",
      displayFields: [
        { label: "Command", value: "redistribute ospf 1 (no metric)" },
        { label: "EIGRP Topology", value: "No external routes", emphasis: "critical" },
        { label: "OSPF Routes", value: "15 routes in OSPF database" },
      ],
      actions: [
        {
          id: "add-seed-metric",
          label: "Add seed metric: redistribute ospf 1 metric 10000 100 255 1 1500",
          color: "green",
        },
        {
          id: "default-metric",
          label: "Set 'default-metric 10000 100 255 1 1500' under EIGRP",
          color: "green",
        },
        {
          id: "clear-eigrp",
          label: "Clear the EIGRP topology table",
          color: "red",
        },
        {
          id: "use-connected",
          label: "Redistribute connected subnets instead",
          color: "orange",
        },
      ],
      correctActionId: "add-seed-metric",
      rationales: [
        {
          id: "r1",
          text: "EIGRP requires a seed metric for redistributed routes. Without it, routes get an infinite metric and are not installed. Specify bandwidth, delay, reliability, load, and MTU.",
        },
        {
          id: "r2",
          text: "The 'default-metric' command also works as a global fallback. However, specifying the metric directly on the redistribute command gives more granular control.",
        },
        {
          id: "r3",
          text: "Clearing the topology table would not help because the routes were never accepted due to the missing metric. The configuration must be fixed.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! EIGRP needs explicit seed metrics for redistributed routes. The five values (bandwidth, delay, reliability, load, MTU) must be specified.",
        partial:
          "Your approach could work. Both 'metric' on the redistribute command and 'default-metric' provide the seed metric. Either is acceptable.",
        wrong:
          "EIGRP assigns infinite metric to redistributed routes if no seed metric is provided. Use 'metric <bw> <delay> <reliability> <load> <mtu>' on the redistribute command.",
      },
    },
  ],
  hints: [
    "Route redistribution requires understanding seed metrics. EIGRP needs explicit metrics; OSPF uses a default metric of 20 for external routes.",
    "Route tags mark redistributed routes to prevent re-redistribution loops when multiple border routers exist.",
    "Always use route-maps or distribute-lists with redistribution to control exactly which routes are shared between protocols.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "Route redistribution is common in mergers, acquisitions, and multi-vendor environments. Getting it wrong causes routing loops and outages; getting it right is a high-value skill.",
  toolRelevance: [
    "Cisco IOS CLI",
    "GNS3 / EVE-NG",
    "Route analysis tools",
    "Network design documentation",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
