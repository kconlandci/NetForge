import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "network-topology-selection",
  version: 1,
  title: "Network Topology Selection",
  tier: "beginner",
  track: "network-fundamentals",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["topology", "network-design", "star", "mesh", "ring"],
  description:
    "Choose appropriate network topologies for different environments based on reliability, cost, and scalability requirements.",
  estimatedMinutes: 8,
  learningObjectives: [
    "Compare star, mesh, ring, and bus topology characteristics",
    "Match topology types to business and technical requirements",
    "Evaluate trade-offs between redundancy, cost, and complexity",
  ],
  sortOrder: 109,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "nts-001",
      title: "Hospital Critical Care Network Design",
      context:
        "A hospital is designing the network for its critical care unit where equipment failure could endanger patients:\n\n- 4 network nodes (monitoring stations, infusion pumps, nurses station, server)\n- Zero tolerance for single point of failure\n- Budget is not a constraint for life-safety systems\n- Each node must maintain connectivity even if any single link or node fails\n- Network must be self-healing within milliseconds\n- Regulatory compliance requires maximum uptime",
      displayFields: [],
      actions: [
        { id: "a1", label: "Star topology with a central switch", color: "green" },
        { id: "a2", label: "Full mesh topology", color: "blue" },
        { id: "a3", label: "Ring topology with redundancy", color: "yellow" },
        { id: "a4", label: "Bus topology for simplicity", color: "red" },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "Full mesh provides a direct link between every node, ensuring no single point of failure. With 4 nodes requiring 6 links, cost is manageable. Any link or node failure still leaves alternate paths for all remaining nodes, meeting the zero-tolerance requirement.",
        },
        {
          id: "r2",
          text: "Star topology creates a single point of failure at the central switch. Even with redundant switches, the approach has more failure modes than full mesh for a small number of critical nodes.",
        },
        {
          id: "r3",
          text: "Ring topology, even with dual-ring redundancy, has slower failover than full mesh and becomes more complex as nodes are added. For 4 nodes, full mesh is more straightforward.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Full mesh eliminates all single points of failure. With only 4 nodes (6 links), the cost is justified for life-safety systems where every millisecond of connectivity matters.",
        partial:
          "Close. For life-safety with only 4 nodes, full mesh is optimal. It provides maximum redundancy with manageable complexity at this scale.",
        wrong:
          "Full mesh is the right choice for critical care. It provides the highest redundancy with no single point of failure. With only 4 nodes, the link count (6) is easily manageable.",
      },
    },
    {
      type: "action-rationale",
      id: "nts-002",
      title: "Small Business Office Network",
      context:
        "A small business with 30 employees needs a cost-effective network:\n\n- 30 workstations and 5 printers\n- Single floor office space\n- Limited IT budget\n- IT support is outsourced (simple management preferred)\n- Standard business applications (email, web, file sharing)\n- Some growth expected (up to 50 devices in 2 years)\n- No high-availability requirements beyond basic connectivity",
      displayFields: [],
      actions: [
        { id: "a1", label: "Star topology with a managed switch", color: "green" },
        { id: "a2", label: "Full mesh topology", color: "blue" },
        { id: "a3", label: "Bus topology using coaxial cable", color: "yellow" },
        { id: "a4", label: "Hybrid ring-star topology", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "Star topology with a managed switch is the standard for small offices. It provides easy device addition/removal, simple troubleshooting (each device has its own link to the switch), and scales easily to 50 devices. The cost is minimal compared to mesh or hybrid designs.",
        },
        {
          id: "r2",
          text: "Full mesh for 35 devices would require 595 links - completely impractical and unnecessary for a small office with standard availability needs.",
        },
        {
          id: "r3",
          text: "Bus topology using coaxial cable is outdated technology with poor fault isolation - a single cable break affects all devices. Modern networks use star topology with structured cabling.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Right! Star topology is the industry standard for small offices. It balances cost, manageability, and scalability perfectly for this use case.",
        partial:
          "Almost. For a small office with budget constraints and basic requirements, star topology is the practical choice. It is simple to manage and scales easily.",
        wrong:
          "Star topology is the answer. It is cost-effective, easy to manage for outsourced IT, scales to 50 devices with just a switch upgrade, and provides good fault isolation per port.",
      },
    },
    {
      type: "action-rationale",
      id: "nts-003",
      title: "Multi-Site WAN Backbone Design",
      context:
        "A company with 6 regional offices needs a WAN backbone:\n\n- Each office generates significant inter-site traffic\n- WAN links are expensive (leased lines at $2,000/month each)\n- Full mesh would require 15 links ($30,000/month)\n- Budget allows maximum $12,000/month for WAN\n- Three offices are designated as hub sites\n- Three offices are spoke sites with lower traffic\n- 99.9% uptime required for hub-to-hub communication",
      displayFields: [],
      actions: [
        { id: "a1", label: "Full mesh connecting all 6 offices", color: "green" },
        { id: "a2", label: "Partial mesh with full mesh between hubs, spokes connect to nearest hub", color: "blue" },
        { id: "a3", label: "Star topology with one central hub", color: "yellow" },
        { id: "a4", label: "Ring topology connecting all offices", color: "red" },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "Partial mesh provides full redundancy between the 3 hub sites (3 links) while connecting each spoke to its nearest hub (3 links), totaling 6 links at $12,000/month. This meets both the budget and the hub-to-hub uptime requirement.",
        },
        {
          id: "r2",
          text: "Full mesh at 15 links exceeds the budget by $18,000/month. The spoke offices don't generate enough traffic to justify direct connections to every other office.",
        },
        {
          id: "r3",
          text: "A single hub star topology creates a single point of failure that violates the 99.9% uptime requirement for hub-to-hub communication. If the central hub fails, all inter-site traffic stops.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! Partial mesh optimizes the budget by applying full redundancy only where it is needed (hub-to-hub) while using simple hub-spoke for lower-traffic sites.",
        partial:
          "You're close. The key is matching redundancy to requirements: full mesh between hubs (for uptime SLA) and spoke connections for lower-priority sites (for budget).",
        wrong:
          "Partial mesh is the optimal design. Hub-to-hub full mesh (3 links) meets the uptime requirement, and spoke-to-hub connections (3 links) serve lower-traffic offices, staying within the $12,000 budget.",
      },
    },
  ],
  hints: [
    "Full mesh links = n(n-1)/2 where n is the number of nodes. For 4 nodes that is 6 links, but for 30 nodes it would be 435 links.",
    "Star topology is the most common for LAN environments. It provides good fault isolation and easy scalability at low cost.",
    "Partial mesh is the practical middle ground for WANs - apply full redundancy where it matters most and use simpler connectivity elsewhere.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Network topology decisions directly impact cost and reliability. Understanding topology trade-offs is essential for network architects and is heavily tested in CCNA and CCNP design exams.",
  toolRelevance: ["Visio", "draw.io", "show cdp neighbors", "show lldp neighbors", "traceroute"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
