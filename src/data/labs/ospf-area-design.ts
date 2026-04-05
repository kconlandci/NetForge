import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ospf-area-design",
  version: 1,
  title: "Design Multi-Area OSPF Topology",

  tier: "advanced",
  track: "routing-switching",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["ospf", "multi-area", "abr", "stub-area", "nssa"],

  description:
    "Design a multi-area OSPF topology including stub areas, NSSAs, and virtual links to optimize LSA flooding, reduce SPF calculations, and scale the routing domain.",
  estimatedMinutes: 18,
  learningObjectives: [
    "Design OSPF area boundaries to control LSA flooding",
    "Choose between stub, totally stubby, and NSSA area types",
    "Implement virtual links to extend Area 0 connectivity",
  ],
  sortOrder: 214,

  status: "published",
  prerequisites: [],

  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "stub-area-selection",
      title: "Choose the Right OSPF Area Type",
      context:
        "Area 5 has 20 routers and connects to Area 0 through a single ABR. The LSDB in Area 5 contains 3,000 Type-5 external LSAs from route redistribution in other areas. Area 5 routers have limited memory and high CPU during SPF runs. Area 5 does not originate any external routes itself.",
      displayFields: [
        { label: "Area", value: "Area 5 (20 routers)" },
        { label: "ABR Connection", value: "Single ABR to Area 0" },
        { label: "External LSAs", value: "3,000 Type-5 LSAs", emphasis: "critical" },
        { label: "External Routes from Area 5", value: "None" },
        { label: "Router Resources", value: "Limited memory/CPU", emphasis: "warn" },
      ],
      actions: [
        {
          id: "totally-stubby",
          label: "Configure Area 5 as totally stubby",
          color: "green",
        },
        {
          id: "stub",
          label: "Configure Area 5 as a standard stub area",
          color: "yellow",
        },
        {
          id: "nssa",
          label: "Configure Area 5 as NSSA",
          color: "orange",
        },
        {
          id: "normal",
          label: "Keep Area 5 as a normal area and add memory",
          color: "red",
        },
      ],
      correctActionId: "totally-stubby",
      rationales: [
        {
          id: "r1",
          text: "Totally stubby blocks Type-3 summary and Type-5 external LSAs, replacing them with a single default route. This maximally reduces the LSDB size and SPF load on resource-constrained routers.",
        },
        {
          id: "r2",
          text: "A standard stub blocks Type-5 externals but still allows Type-3 summaries. This reduces LSAs but not as aggressively as totally stubby.",
        },
        {
          id: "r3",
          text: "NSSA is for areas that need to originate external routes (Type-7 LSAs). Area 5 has no external routes, so NSSA provides no benefit over stub/totally stubby.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! Totally stubby is the most aggressive LSDB reduction. With no external routes from Area 5, it only needs a default route from the ABR.",
        partial:
          "Your choice reduces LSAs but not maximally. Consider whether Area 5 needs summary routes or can rely on a default route.",
        wrong:
          "Area types control which LSAs are allowed. Totally stubby blocks the most LSAs (Type-3 and Type-5), leaving only a default route.",
      },
    },
    {
      type: "action-rationale",
      id: "virtual-link-design",
      title: "Fix Discontiguous Area 0",
      context:
        "After a network merger, Area 0 is split into two segments. Area 2 sits between them, preventing OSPF from working properly. Routers in the disconnected Area 0 segment cannot receive full routing updates.",
      displayFields: [
        { label: "Area 0 Segment A", value: "10 routers (ABR1 borders Area 2)" },
        { label: "Area 2", value: "5 routers (transit area)" },
        { label: "Area 0 Segment B", value: "8 routers (ABR2 borders Area 2)" },
        { label: "Problem", value: "Discontiguous backbone", emphasis: "critical" },
      ],
      actions: [
        {
          id: "virtual-link",
          label: "Create a virtual link between ABR1 and ABR2 through Area 2",
          color: "green",
        },
        {
          id: "gre-tunnel",
          label: "Build a GRE tunnel between ABR1 and ABR2 in Area 0",
          color: "yellow",
        },
        {
          id: "merge-areas",
          label: "Merge Area 2 into Area 0",
          color: "orange",
        },
        {
          id: "redistribute",
          label: "Redistribute between the two Area 0 segments",
          color: "red",
        },
      ],
      correctActionId: "virtual-link",
      rationales: [
        {
          id: "r1",
          text: "A virtual link extends Area 0 through a transit area (Area 2), reconnecting the backbone. This is the standard OSPF solution for discontiguous Area 0.",
        },
        {
          id: "r2",
          text: "A GRE tunnel works but adds complexity and overhead. Virtual links are native OSPF and require no additional interface configuration.",
        },
        {
          id: "r3",
          text: "Merging Area 2 into Area 0 creates one large area, defeating the purpose of multi-area OSPF and increasing SPF load on all routers.",
        },
        {
          id: "r4",
          text: "Redistribution between OSPF instances creates external routes and loses intra-area route information. This is not a proper solution for backbone continuity.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! A virtual link through Area 2 reconnects the backbone. Configure 'area 2 virtual-link <router-id>' on both ABR1 and ABR2.",
        partial:
          "Your approach restores connectivity but is not the cleanest solution. Virtual links are the native OSPF mechanism for this exact problem.",
        wrong:
          "OSPF requires a contiguous Area 0. Virtual links extend the backbone through a transit area. They are configured on the ABRs at each end.",
      },
    },
    {
      type: "action-rationale",
      id: "nssa-external",
      title: "Allow External Routes in a Stub-like Area",
      context:
        "Area 10 was configured as a stub area to reduce LSAs. Now a new ASBR in Area 10 needs to redistribute connected routes from a partner network. Stub areas block external routes (Type-5 LSAs), so the redistribution is being rejected.",
      displayFields: [
        { label: "Area 10", value: "Currently stub area" },
        { label: "New ASBR", value: "Needs to redistribute partner routes" },
        { label: "Requirement", value: "Block external LSAs from other areas, allow local external origination" },
        { label: "Error", value: "OSPF: Cannot redistribute into stub area", emphasis: "critical" },
      ],
      actions: [
        {
          id: "convert-nssa",
          label: "Convert Area 10 from stub to NSSA",
          color: "green",
        },
        {
          id: "remove-stub",
          label: "Remove the stub configuration entirely",
          color: "orange",
        },
        {
          id: "redistribute-other-area",
          label: "Move the ASBR to Area 0 and redistribute there",
          color: "yellow",
        },
        {
          id: "static-routes",
          label: "Use static routes instead of redistribution",
          color: "red",
        },
      ],
      correctActionId: "convert-nssa",
      rationales: [
        {
          id: "r1",
          text: "NSSA (Not-So-Stubby Area) allows local external route origination as Type-7 LSAs while still blocking Type-5 externals from other areas. The ABR converts Type-7 to Type-5 for the rest of the OSPF domain.",
        },
        {
          id: "r2",
          text: "Removing stub allows all external LSAs into Area 10, defeating the original purpose of reducing the LSDB size.",
        },
        {
          id: "r3",
          text: "Moving the ASBR to Area 0 changes the physical or logical topology and may not be feasible. NSSA was designed exactly for this scenario.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! NSSA is specifically designed for stub-like areas that need to originate external routes. Type-7 LSAs are used locally and converted to Type-5 at the ABR.",
        partial:
          "Your approach works but loses the stub benefits. NSSA provides the best of both worlds: stub-like filtering with local external route support.",
        wrong:
          "NSSA allows redistribution within a stub-like area using Type-7 LSAs. It blocks Type-5 from outside while permitting local Type-7 origination.",
      },
    },
  ],
  hints: [
    "Stub areas block Type-5 external LSAs. Totally stubby also blocks Type-3 summary LSAs, leaving only a default route.",
    "NSSA allows external route origination within a stub-like area using Type-7 LSAs. The ABR converts Type-7 to Type-5.",
    "Virtual links extend Area 0 through a transit area. They are configured on both ABRs with 'area <transit-area> virtual-link <remote-router-id>'.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "Multi-area OSPF design is fundamental to scaling enterprise and service provider networks. Understanding area types and their LSA behavior is essential for CCNP and above.",
  toolRelevance: [
    "Cisco IOS CLI",
    "GNS3 / EVE-NG",
    "OSPF design documentation",
    "Network topology tools",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
