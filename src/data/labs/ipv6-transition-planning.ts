import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ipv6-transition-planning",
  version: 1,
  title: "IPv6 Transition Planning",
  tier: "beginner",
  track: "network-fundamentals",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["ipv6", "transition", "dual-stack", "tunneling"],
  description:
    "Decide on appropriate IPv6 transition strategies based on network requirements and infrastructure constraints.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Compare dual-stack, tunneling, and translation IPv6 transition methods",
    "Evaluate infrastructure readiness for different transition strategies",
    "Select the most appropriate transition mechanism for given scenarios",
  ],
  sortOrder: 108,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "ipv6-001",
      title: "Enterprise Network With Full Infrastructure Control",
      context:
        "Your organization controls all network equipment (routers, switches, firewalls) and endpoints. Budget is available for a phased migration. Current state:\n\n- 500 routers and switches (all support IPv6)\n- 10,000 endpoints (Windows 10/11, macOS, Linux)\n- Internal applications have been tested with IPv6\n- ISP provides both IPv4 and IPv6 connectivity\n- Security team requires full visibility into all traffic\n\nManagement wants the most sustainable long-term approach.",
      displayFields: [],
      actions: [
        { id: "a1", label: "Dual-Stack deployment across all infrastructure", color: "green" },
        { id: "a2", label: "6to4 automatic tunneling", color: "blue" },
        { id: "a3", label: "NAT64/DNS64 translation", color: "yellow" },
        { id: "a4", label: "ISATAP tunneling for internal networks", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "Dual-stack is the gold standard transition method when you have full infrastructure control and equipment support. Running both IPv4 and IPv6 natively allows gradual migration while maintaining backward compatibility and full security visibility.",
        },
        {
          id: "r2",
          text: "6to4 tunneling encapsulates IPv6 within IPv4, which reduces security visibility and introduces MTU issues. With native IPv6 ISP support available, tunneling is unnecessary overhead.",
        },
        {
          id: "r3",
          text: "NAT64 is useful when connecting IPv6-only clients to IPv4-only servers, but adds translation complexity. Since all infrastructure supports IPv6, dual-stack avoids the need for translation entirely.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Dual-stack is the recommended approach when infrastructure fully supports IPv6. It provides the cleanest migration path with no tunneling overhead or translation complexity.",
        partial:
          "Close. When you control all equipment and have IPv6-capable ISP connectivity, dual-stack is preferred over tunneling or translation because it avoids encapsulation overhead and security blind spots.",
        wrong:
          "Dual-stack is the best choice here. All infrastructure supports IPv6, the ISP provides native IPv6, and applications are tested. Tunneling and translation add unnecessary complexity when native support exists.",
      },
    },
    {
      type: "action-rationale",
      id: "ipv6-002",
      title: "Branch Office With IPv4-Only ISP Connection",
      context:
        "A remote branch office needs to reach IPv6 services at headquarters, but its ISP only provides IPv4 connectivity:\n\n- Branch router supports IPv6 and IPv4\n- ISP has no IPv6 rollout planned for this region\n- HQ has dual-stack connectivity\n- Branch needs to access IPv6-only internal applications at HQ\n- VPN tunnel already exists between branch and HQ\n- 50 users at the branch office",
      displayFields: [],
      actions: [
        { id: "a1", label: "Wait for ISP to deploy IPv6", color: "green" },
        { id: "a2", label: "Configure IPv6-in-IPv4 tunnel over the existing VPN", color: "blue" },
        { id: "a3", label: "Deploy a second ISP link with IPv6 support", color: "yellow" },
        { id: "a4", label: "Convert HQ applications back to IPv4", color: "red" },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "An IPv6-in-IPv4 tunnel over the existing VPN provides immediate IPv6 connectivity without waiting for the ISP or adding infrastructure. The branch router already supports both protocols, and the VPN provides the secure IPv4 transport path to HQ.",
        },
        {
          id: "r2",
          text: "Waiting for the ISP provides no timeline guarantee and leaves the branch unable to access IPv6-only applications. The business need is immediate.",
        },
        {
          id: "r3",
          text: "A second ISP link is expensive and unnecessary. The existing VPN can carry tunneled IPv6 traffic at minimal cost and configuration effort.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Right! Tunneling IPv6 over the existing IPv4 VPN is the practical and cost-effective solution. It leverages existing infrastructure while providing immediate IPv6 access to HQ resources.",
        partial:
          "You're close. The key constraint is an IPv4-only ISP with no timeline for IPv6. Tunneling over the existing VPN is the most practical solution using current infrastructure.",
        wrong:
          "IPv6-in-IPv4 tunneling over the existing VPN is the answer. It provides immediate connectivity, uses existing infrastructure, and doesn't require ISP changes or expensive new links.",
      },
    },
    {
      type: "action-rationale",
      id: "ipv6-003",
      title: "Cloud-First Organization Moving to IPv6-Only",
      context:
        "A startup is deploying a new cloud infrastructure and wants to minimize operational complexity:\n\n- All new services will be IPv6-only in the cloud\n- Some legacy SaaS vendors only support IPv4\n- Mobile workforce uses modern devices (all IPv6-capable)\n- No legacy on-premises infrastructure to maintain\n- Cloud provider supports NAT64 gateway service\n- Goal: reduce dual-stack management overhead",
      displayFields: [],
      actions: [
        { id: "a1", label: "Full dual-stack for all cloud services", color: "green" },
        { id: "a2", label: "IPv6-only with NAT64 for IPv4 legacy access", color: "blue" },
        { id: "a3", label: "Stay IPv4-only until all vendors support IPv6", color: "yellow" },
        { id: "a4", label: "Deploy manual 6to4 tunnels to each SaaS vendor", color: "red" },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "IPv6-only with NAT64 translation for legacy IPv4 access aligns with the startup's goal of minimal complexity. NAT64 (managed by the cloud provider) handles the few legacy SaaS connections while the primary infrastructure runs cleanly on IPv6 only.",
        },
        {
          id: "r2",
          text: "Full dual-stack contradicts the goal of reducing management overhead. Running two protocol stacks doubles the configuration, monitoring, and troubleshooting surface area.",
        },
        {
          id: "r3",
          text: "Waiting for all vendors to support IPv6 could take years and delays the benefits of simplified IPv6-only infrastructure. NAT64 bridges the gap in the interim.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! IPv6-only with NAT64 for legacy access gives the startup clean infrastructure while maintaining compatibility. The cloud provider's managed NAT64 service keeps operational overhead low.",
        partial:
          "Close. Consider the startup's explicit goal of minimal complexity. IPv6-only with NAT64 for legacy access provides the simplest operational model.",
        wrong:
          "IPv6-only with NAT64 is the best fit. It achieves the operational simplicity goal while using the cloud provider's NAT64 service to reach the few remaining IPv4-only vendors.",
      },
    },
  ],
  hints: [
    "Dual-stack is ideal when you control infrastructure and have native IPv6 support. It provides the cleanest coexistence but requires managing two protocol stacks.",
    "Tunneling (6to4, GRE, ISATAP) is appropriate when you need IPv6 connectivity across IPv4-only infrastructure. The trade-off is encapsulation overhead and reduced visibility.",
    "NAT64/DNS64 is best for IPv6-only networks that need to reach IPv4-only services. It minimizes dual-stack complexity at the cost of translation overhead.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "IPv6 deployment is accelerating as IPv4 exhaustion bites. Engineers who understand transition strategies are increasingly valuable, especially in cloud and service provider environments.",
  toolRelevance: ["show ipv6 route", "ping6", "ip -6 addr", "traceroute6", "dig AAAA"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
