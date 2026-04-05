import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "inter-vlan-routing",
  version: 1,
  title: "Choose the Right Inter-VLAN Routing Approach",

  tier: "beginner",
  track: "routing-switching",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["inter-vlan", "router-on-a-stick", "layer-3-switch", "subinterfaces"],

  description:
    "Evaluate different inter-VLAN routing methods and select the best approach for each network scenario based on traffic volume and hardware.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Compare router-on-a-stick, Layer 3 switch, and legacy multi-interface approaches",
    "Identify when each inter-VLAN routing method is appropriate",
    "Configure subinterfaces with 802.1Q encapsulation",
  ],
  sortOrder: 204,

  status: "published",
  prerequisites: [],

  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "small-office-intervlan",
      title: "Small Office with Limited Budget",
      context:
        "A small office has 25 users across 3 VLANs (Sales, Admin, Guest). They have a single Cisco 2911 router and a Cisco 2960 Layer 2 switch. Inter-VLAN traffic is light (mostly print jobs and file sharing). Budget does not allow purchasing a Layer 3 switch.",
      displayFields: [
        { label: "Users", value: "25" },
        { label: "VLANs", value: "3 (Sales, Admin, Guest)" },
        { label: "Router", value: "Cisco 2911 (1x Gi0/0 available)" },
        { label: "Switch", value: "Cisco 2960 (Layer 2 only)" },
        { label: "Traffic Pattern", value: "Light inter-VLAN traffic" },
      ],
      actions: [
        {
          id: "router-on-stick",
          label: "Router-on-a-Stick with subinterfaces",
          color: "green",
        },
        {
          id: "layer3-switch",
          label: "Replace switch with a Layer 3 switch",
          color: "yellow",
        },
        {
          id: "separate-interfaces",
          label: "Use separate physical router interfaces per VLAN",
          color: "orange",
        },
        {
          id: "no-routing",
          label: "Keep VLANs isolated with no inter-VLAN routing",
          color: "red",
        },
      ],
      correctActionId: "router-on-stick",
      rationales: [
        {
          id: "r1",
          text: "Router-on-a-stick uses a single trunk link with subinterfaces, each handling one VLAN. With light traffic and budget constraints, this is the most cost-effective solution.",
        },
        {
          id: "r2",
          text: "A Layer 3 switch would work but exceeds the budget. It would be overkill for 25 users with light inter-VLAN traffic.",
        },
        {
          id: "r3",
          text: "Separate physical interfaces waste router ports and switch ports. With only one Gi0/0 available, this is not even possible.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Router-on-a-stick is ideal for small offices with light traffic. Create subinterfaces Gi0/0.10, Gi0/0.20, Gi0/0.30 with 802.1Q encapsulation.",
        partial:
          "Your choice could work but is not optimal for the constraints. Consider budget, available hardware, and traffic volume.",
        wrong:
          "Review inter-VLAN routing methods. With one router, one L2 switch, and a tight budget, router-on-a-stick is the standard approach.",
      },
    },
    {
      type: "action-rationale",
      id: "campus-network-intervlan",
      title: "Campus Network with Heavy Traffic",
      context:
        "A campus network supports 500 users across 8 VLANs. Inter-VLAN traffic is heavy with multiple servers in a dedicated server VLAN. The current router-on-a-stick design is causing a bottleneck on the trunk link. You have budget approval for new hardware.",
      displayFields: [
        { label: "Users", value: "500" },
        { label: "VLANs", value: "8" },
        { label: "Bottleneck", value: "Router trunk link saturated at 85%" },
        { label: "Budget", value: "Approved for hardware upgrade" },
        { label: "Current Design", value: "Router-on-a-stick (1 Gbps trunk)" },
      ],
      actions: [
        {
          id: "add-trunk",
          label: "Add a second trunk link to the router",
          color: "yellow",
        },
        {
          id: "layer3-switch",
          label: "Deploy a Layer 3 switch for inter-VLAN routing",
          color: "green",
        },
        {
          id: "keep-roas",
          label: "Keep router-on-a-stick but upgrade to 10 Gbps",
          color: "orange",
        },
        {
          id: "separate-routers",
          label: "Add more routers, one per VLAN pair",
          color: "red",
        },
      ],
      correctActionId: "layer3-switch",
      rationales: [
        {
          id: "r1",
          text: "A Layer 3 switch performs inter-VLAN routing in hardware (ASIC) at wire speed. With 500 users and heavy traffic, this eliminates the trunk bottleneck entirely.",
        },
        {
          id: "r2",
          text: "Adding a second trunk does not double throughput unless EtherChannel is configured, and the router CPU still processes all inter-VLAN packets in software.",
        },
        {
          id: "r3",
          text: "Upgrading to 10 Gbps helps bandwidth but the router still routes in software. A Layer 3 switch uses hardware-based routing which is fundamentally faster.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Exactly right! A Layer 3 switch routes between VLANs using hardware ASICs at wire speed, eliminating the trunk bottleneck for 500+ users.",
        partial:
          "Your choice improves things but does not solve the fundamental problem. Router-on-a-stick processes packets in software, which is always slower than L3 switch hardware routing.",
        wrong:
          "For large campus networks with heavy inter-VLAN traffic, Layer 3 switches are the standard solution. They route in hardware at line rate.",
      },
    },
    {
      type: "action-rationale",
      id: "subinterface-config",
      title: "Troubleshoot Router-on-a-Stick Connectivity",
      context:
        "A router-on-a-stick configuration was set up but VLAN 20 users cannot reach VLAN 10. The trunk is up. You examine the router subinterface configuration:\n\ninterface Gi0/0.10\n encapsulation dot1Q 10\n ip address 10.1.10.1 255.255.255.0\n\ninterface Gi0/0.20\n encapsulation dot1Q 10\n ip address 10.1.20.1 255.255.255.0",
      displayFields: [
        { label: "VLAN 10 Subnet", value: "10.1.10.0/24" },
        { label: "VLAN 20 Subnet", value: "10.1.20.0/24" },
        { label: "Trunk Status", value: "Up, allowing VLANs 10 and 20" },
        { label: "Problem", value: "Gi0/0.20 has dot1Q 10 instead of dot1Q 20", emphasis: "critical" },
      ],
      actions: [
        {
          id: "fix-encap",
          label: "Change Gi0/0.20 encapsulation to dot1Q 20",
          color: "green",
        },
        {
          id: "fix-ip",
          label: "Change Gi0/0.20 IP to a different subnet",
          color: "yellow",
        },
        {
          id: "add-vlan-switch",
          label: "Create VLAN 20 on the switch",
          color: "orange",
        },
        {
          id: "replace-cable",
          label: "Replace the trunk cable",
          color: "red",
        },
      ],
      correctActionId: "fix-encap",
      rationales: [
        {
          id: "r1",
          text: "Both subinterfaces are tagged with VLAN 10 (dot1Q 10). Gi0/0.20 must use 'encapsulation dot1Q 20' to match VLAN 20 traffic. This is why VLAN 20 traffic never reaches the router.",
        },
        {
          id: "r2",
          text: "The IP addresses are on different subnets (10.1.10.0 and 10.1.20.0), so the IP config is fine. The problem is the VLAN tag on the subinterface.",
        },
        {
          id: "r3",
          text: "The trunk is already up and allowing both VLANs. The cable and switch are not the issue. The router subinterface has the wrong VLAN tag.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The encapsulation dot1Q tag on Gi0/0.20 is set to VLAN 10 instead of VLAN 20. Fixing this allows the subinterface to process VLAN 20 tagged frames.",
        partial:
          "You are close. Look carefully at the 'encapsulation dot1Q' line on each subinterface and compare it to the VLAN it should serve.",
        wrong:
          "Each subinterface's dot1Q tag must match the VLAN it serves. Gi0/0.10 should have dot1Q 10, and Gi0/0.20 should have dot1Q 20.",
      },
    },
  ],
  hints: [
    "Router-on-a-stick uses subinterfaces with 802.1Q encapsulation. Each subinterface's VLAN tag must match the VLAN it routes for.",
    "Layer 3 switches perform inter-VLAN routing in hardware at wire speed, making them ideal for high-traffic environments.",
    "When troubleshooting, check that each subinterface's 'encapsulation dot1Q <vlan-id>' matches the intended VLAN.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "Choosing the right inter-VLAN routing method depends on scale, budget, and performance needs. This decision impacts network architecture for years.",
  toolRelevance: [
    "Cisco IOS CLI",
    "Packet Tracer",
    "Network design documentation",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
