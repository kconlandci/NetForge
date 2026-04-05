import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "nat-configuration-review",
  version: 1,
  title: "NAT Configuration Review",
  tier: "intermediate",
  track: "network-fundamentals",
  difficulty: "moderate",
  accessLevel: "premium",
  tags: ["nat", "pat", "static-nat", "firewall", "addressing"],
  description:
    "Review and fix Network Address Translation configurations including static NAT, dynamic NAT, and PAT overload issues.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Distinguish between static NAT, dynamic NAT, and PAT (overload)",
    "Identify common NAT misconfiguration patterns",
    "Verify NAT translations using show commands and debug output",
  ],
  sortOrder: 114,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "nat-001",
      title: "Static NAT for Web Server Not Working",
      description:
        "A web server at 192.168.1.100 should be accessible from the Internet via the public IP 203.0.113.10. External users cannot reach the server. Review the NAT configuration on the edge router.",
      targetSystem: "Edge Router (R-EDGE)",
      items: [
        {
          id: "item1",
          label: "NAT Inside Interface",
          detail: "Interface facing the internal network (Gig0/0 - 192.168.1.1)",
          currentState: "ip nat outside",
          correctState: "ip nat inside",
          states: ["ip nat inside", "ip nat outside", "no nat"],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "NAT Outside Interface",
          detail: "Interface facing the Internet (Gig0/1 - 203.0.113.1)",
          currentState: "ip nat inside",
          correctState: "ip nat outside",
          states: ["ip nat inside", "ip nat outside", "no nat"],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "Static NAT Rule",
          detail: "Maps internal server to public IP",
          currentState: "ip nat inside source static 192.168.1.100 203.0.113.10",
          correctState: "ip nat inside source static 192.168.1.100 203.0.113.10",
          states: [
            "ip nat inside source static 192.168.1.100 203.0.113.10",
            "ip nat outside source static 203.0.113.10 192.168.1.100",
            "ip nat inside source static 192.168.1.1 203.0.113.10",
          ],
          rationaleId: "rat3",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "The internal interface (Gig0/0) was incorrectly marked as 'ip nat outside'. It must be 'ip nat inside' because it connects to the private network where the server resides.",
        },
        {
          id: "rat2",
          text: "The Internet-facing interface (Gig0/1) was marked as 'ip nat inside' when it should be 'ip nat outside'. The inside/outside designations were swapped.",
        },
        {
          id: "rat3",
          text: "The static NAT rule itself is correct. It maps the internal server IP (192.168.1.100) to the public IP (203.0.113.10). The problem was the reversed interface designations.",
        },
      ],
      feedback: {
        perfect:
          "The NAT interfaces are now correctly designated. Internal traffic from 192.168.1.100 will be translated to 203.0.113.10, making the web server accessible from the Internet.",
        partial:
          "Some settings are fixed but the inside/outside interface designations must both be correct for NAT to function. Verify each interface's role in the network.",
        wrong:
          "The inside and outside interface designations are reversed. The interface facing private addresses must be 'ip nat inside' and the interface facing the Internet must be 'ip nat outside'.",
      },
    },
    {
      type: "toggle-config",
      id: "nat-002",
      title: "PAT Overload Exhaustion",
      description:
        "500 internal users share a single public IP via PAT (overload). Users report intermittent Internet connectivity failures during peak hours. The NAT translation table is hitting its limit.",
      targetSystem: "Internet Gateway Router",
      items: [
        {
          id: "item1",
          label: "NAT Pool Size",
          detail: "Current pool has only 1 public IP address. PAT port exhaustion occurs at ~65,000 concurrent sessions.",
          currentState: "1 address (203.0.113.10)",
          correctState: "4 addresses (203.0.113.10-13)",
          states: [
            "1 address (203.0.113.10)",
            "4 addresses (203.0.113.10-13)",
            "16 addresses (203.0.113.10-25)",
            "254 addresses (203.0.113.1-254)",
          ],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "NAT Translation Timeout (TCP)",
          detail: "How long idle TCP translations are kept in the table",
          currentState: "86400 seconds (24 hours)",
          correctState: "3600 seconds (1 hour)",
          states: ["86400 seconds (24 hours)", "3600 seconds (1 hour)", "300 seconds (5 minutes)", "60 seconds (1 minute)"],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "NAT Translation Timeout (UDP)",
          detail: "How long idle UDP translations are kept",
          currentState: "300 seconds (5 minutes)",
          correctState: "300 seconds (5 minutes)",
          states: ["86400 seconds (24 hours)", "3600 seconds (1 hour)", "300 seconds (5 minutes)", "60 seconds (1 minute)"],
          rationaleId: "rat3",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "With 500 users, a single PAT address can exhaust its ~65,000 available port translations. Adding 4 addresses provides ~260,000 concurrent translations, giving adequate headroom for peak usage.",
        },
        {
          id: "rat2",
          text: "A 24-hour TCP timeout holds stale translations for idle connections far too long, wasting NAT table entries. Reducing to 1 hour frees entries from abandoned sessions while keeping active connections alive.",
        },
        {
          id: "rat3",
          text: "The UDP timeout of 300 seconds (5 minutes) is appropriate. UDP sessions are typically short-lived (DNS queries, streaming packets), so 5 minutes is sufficient to cover normal UDP flows.",
        },
      ],
      feedback: {
        perfect:
          "The NAT pool is expanded and timeouts are optimized. With 4 public IPs and shorter TCP timeouts, the PAT exhaustion issue is resolved with room for growth.",
        partial:
          "Some improvements help, but both the pool size and TCP timeout need adjustment. Expanding the pool provides more translations, and shorter timeouts free stale entries faster.",
        wrong:
          "PAT exhaustion requires both more public IPs and shorter idle timeouts. One IP with 24-hour TCP timeouts cannot support 500 users at peak. Expand the pool and reduce timeouts.",
      },
    },
    {
      type: "toggle-config",
      id: "nat-003",
      title: "Hairpin NAT for Internal Access to Public Server",
      description:
        "Internal users cannot access the company web server using its public DNS name (www.company.com -> 203.0.113.10). They must use the private IP (192.168.1.100) instead. Configure NAT hairpin (NAT reflection) to fix this.",
      targetSystem: "Edge Router NAT Hairpin Config",
      items: [
        {
          id: "item1",
          label: "DNS Resolution Method",
          detail: "How internal users should reach the server by public hostname",
          currentState: "Split-horizon DNS (internal zone returns private IP)",
          correctState: "Split-horizon DNS (internal zone returns private IP)",
          states: [
            "Split-horizon DNS (internal zone returns private IP)",
            "NAT hairpin (loopback translation)",
            "Host file entries on all workstations",
          ],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "Internal DNS Zone Record",
          detail: "DNS record for www.company.com in the internal DNS server",
          currentState: "www.company.com -> 203.0.113.10 (public IP)",
          correctState: "www.company.com -> 192.168.1.100 (private IP)",
          states: [
            "www.company.com -> 203.0.113.10 (public IP)",
            "www.company.com -> 192.168.1.100 (private IP)",
            "No record (use external DNS)",
          ],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "Router NAT Hairpin Rule",
          detail: "Whether to add a NAT hairpin/loopback rule on the router",
          currentState: "no hairpin rule configured",
          correctState: "no hairpin rule configured",
          states: [
            "no hairpin rule configured",
            "ip nat inside source static 203.0.113.10 192.168.1.100",
            "ip nat hairpin enable",
          ],
          rationaleId: "rat3",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "Split-horizon DNS is the cleanest solution. Internal DNS returns the private IP directly, so traffic stays internal without requiring NAT hairpin. This avoids unnecessary routing through the edge router.",
        },
        {
          id: "rat2",
          text: "The internal DNS zone must return the private IP (192.168.1.100) for www.company.com. Currently it returns the public IP (203.0.113.10), causing internal clients to route to the edge router.",
        },
        {
          id: "rat3",
          text: "No hairpin rule is needed when using split-horizon DNS. Internal clients resolve directly to the private IP and connect without touching the edge router's NAT.",
        },
      ],
      feedback: {
        perfect:
          "Split-horizon DNS with the correct internal record eliminates the hairpin problem entirely. Internal users resolve directly to the private IP without needing NAT loopback.",
        partial:
          "The approach is partially correct. Split-horizon DNS requires the internal zone to return the private IP so clients connect directly to the server without NAT.",
        wrong:
          "The simplest fix is split-horizon DNS: update the internal DNS record to return 192.168.1.100 instead of the public IP. This avoids NAT hairpin complexity entirely.",
      },
    },
  ],
  hints: [
    "NAT requires correctly designating inside (private) and outside (public) interfaces. If these are swapped, no translations will occur.",
    "PAT (overload) shares one public IP among many hosts using port numbers. Each public IP supports ~65,000 concurrent translations before exhaustion.",
    "Split-horizon DNS (also called split-brain DNS) provides different answers for internal vs external queries, avoiding NAT hairpin issues.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "NAT troubleshooting is a critical skill for network engineers working with Internet-facing infrastructure. Understanding PAT exhaustion and hairpin NAT are common scenarios in enterprise and service provider networks.",
  toolRelevance: [
    "show ip nat translations",
    "show ip nat statistics",
    "debug ip nat",
    "clear ip nat translation *",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
