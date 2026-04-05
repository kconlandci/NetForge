import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "static-route-configuration",
  version: 1,
  title: "Set Up Static Routes on a Router",

  tier: "beginner",
  track: "routing-switching",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["static-routing", "ip-routing", "layer-3", "next-hop"],

  description:
    "Configure static routes to enable connectivity between remote subnets, including default routes and floating static routes.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Configure next-hop and exit-interface static routes",
    "Set up a default route for internet-bound traffic",
    "Implement floating static routes for backup paths",
  ],
  sortOrder: 202,

  status: "published",
  prerequisites: [],

  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "basic-static-routes",
      title: "Add Static Routes for Remote Subnets",
      description:
        "Router1 has two directly connected subnets: 10.1.1.0/24 (Gi0/0) and 10.1.2.0/24 (Gi0/1). It needs static routes to reach 10.1.3.0/24 and 10.1.4.0/24 via next-hop 10.1.2.2 on Router2.",
      targetSystem: "Router1 (Cisco ISR 4321)",
      items: [
        {
          id: "route-subnet3",
          label: "Route to 10.1.3.0/24",
          detail: "show ip route — no route to 10.1.3.0/24",
          currentState: "no-route",
          correctState: "via-10.1.2.2",
          states: ["no-route", "via-10.1.2.2", "via-10.1.1.2", "via-gi0/1"],
          rationaleId: "r1",
        },
        {
          id: "route-subnet4",
          label: "Route to 10.1.4.0/24",
          detail: "show ip route — no route to 10.1.4.0/24",
          currentState: "no-route",
          correctState: "via-10.1.2.2",
          states: ["no-route", "via-10.1.2.2", "via-10.1.1.2", "via-gi0/1"],
          rationaleId: "r1",
        },
        {
          id: "ip-routing",
          label: "IP Routing Status",
          detail: "show ip route — routing table has only connected/local routes",
          currentState: "enabled",
          correctState: "enabled",
          states: ["enabled", "disabled"],
          rationaleId: "r2",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "Static routes using next-hop IP (10.1.2.2) are preferred for multi-access networks because the router performs a recursive lookup. Use 'ip route 10.1.3.0 255.255.255.0 10.1.2.2'.",
        },
        {
          id: "r2",
          text: "IP routing must be enabled (it is by default on routers). On Layer 3 switches, you may need 'ip routing' explicitly.",
        },
      ],
      feedback: {
        perfect:
          "All static routes are correctly configured with the proper next-hop address. Both remote subnets are now reachable.",
        partial:
          "Some routes are correct but others are missing or use the wrong next-hop. Verify the topology to determine the correct next-hop IP.",
        wrong:
          "Review static routing syntax: 'ip route <network> <mask> <next-hop>'. The next-hop must be a reachable IP on a directly connected subnet.",
      },
    },
    {
      type: "toggle-config",
      id: "default-route-setup",
      title: "Configure a Default Route",
      description:
        "Router1 needs a default route pointing to the ISP router at 203.0.113.1 via the serial interface. Currently internet-bound traffic is being dropped.",
      targetSystem: "Router1 (Cisco ISR 4321)",
      items: [
        {
          id: "default-route",
          label: "Default Route (0.0.0.0/0)",
          detail: "show ip route — no default route present; Gateway of last resort is not set",
          currentState: "not-configured",
          correctState: "via-203.0.113.1",
          states: ["not-configured", "via-203.0.113.1", "via-10.1.1.1", "via-serial0/0"],
          rationaleId: "r1",
        },
        {
          id: "dns-lookup",
          label: "IP Domain Lookup",
          detail: "show run | include domain — ip domain-lookup is enabled",
          currentState: "enabled",
          correctState: "enabled",
          states: ["enabled", "disabled"],
          rationaleId: "r2",
        },
        {
          id: "icmp-unreachable",
          label: "ICMP Unreachable Messages",
          detail: "show run int Gi0/0 — no ip unreachables is not configured",
          currentState: "enabled",
          correctState: "enabled",
          states: ["enabled", "disabled"],
          rationaleId: "r2",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "The default route 'ip route 0.0.0.0 0.0.0.0 203.0.113.1' catches all traffic that does not match a more specific route, forwarding it to the ISP.",
        },
        {
          id: "r2",
          text: "DNS lookup and ICMP unreachables should remain enabled for proper internet connectivity and error reporting. Disabling them would break name resolution and diagnostics.",
        },
      ],
      feedback: {
        perfect:
          "The default route is properly configured to the ISP. Internet-bound traffic will now be forwarded correctly.",
        partial:
          "Close, but check the next-hop address. The default route must point to the ISP router's IP on the directly connected link.",
        wrong:
          "A default route uses network 0.0.0.0 mask 0.0.0.0 with the ISP next-hop. This acts as the gateway of last resort.",
      },
    },
    {
      type: "toggle-config",
      id: "floating-static-route",
      title: "Implement Floating Static Routes",
      description:
        "The primary path to 192.168.50.0/24 goes through OSPF via Gi0/0 (AD 110). Configure a backup static route via 10.1.5.2 (Serial link) that only activates when OSPF fails.",
      targetSystem: "Router1 (Cisco ISR 4321)",
      items: [
        {
          id: "backup-route",
          label: "Backup Route to 192.168.50.0/24",
          detail: "show ip route — only OSPF route present (O 192.168.50.0/24 via Gi0/0)",
          currentState: "not-configured",
          correctState: "ad-120",
          states: ["not-configured", "ad-1", "ad-110", "ad-120"],
          rationaleId: "r1",
        },
        {
          id: "serial-interface",
          label: "Serial0/0/0 Status",
          detail: "show ip int brief — Serial0/0/0 is up/up with IP 10.1.5.1",
          currentState: "up",
          correctState: "up",
          states: ["up", "down", "admin-down"],
          rationaleId: "r2",
        },
        {
          id: "ip-route-verify",
          label: "Routing Table Verification",
          detail: "show ip route 192.168.50.0 — shows OSPF route, no static backup visible",
          currentState: "ospf-only",
          correctState: "ospf-with-floating-backup",
          states: ["ospf-only", "ospf-with-floating-backup", "static-only"],
          rationaleId: "r1",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "A floating static route has an administrative distance higher than the primary route (OSPF AD=110). Setting AD to 120 means: 'ip route 192.168.50.0 255.255.255.0 10.1.5.2 120'. It only appears in the routing table when the OSPF route disappears.",
        },
        {
          id: "r2",
          text: "The serial interface must be up for the floating static route to be viable. If it goes down, both the OSPF and backup routes would be unavailable.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! The floating static route with AD 120 will remain hidden behind the OSPF route (AD 110) and only activate if OSPF fails.",
        partial:
          "You're close. The AD must be higher than OSPF's 110 but you may have picked the wrong value. AD 120 is a common choice for floating statics behind OSPF.",
        wrong:
          "A floating static route needs an AD higher than the primary routing protocol. Use 'ip route <net> <mask> <next-hop> <AD>' where AD > 110 for OSPF.",
      },
    },
  ],
  hints: [
    "Static route syntax: 'ip route <network> <mask> <next-hop-ip> [administrative-distance]'.",
    "A default route uses 0.0.0.0 0.0.0.0 as the network and mask, matching all destinations not in the routing table.",
    "Floating static routes use a higher administrative distance than the primary protocol so they only activate as backup.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "Static routes are used in small networks and as backup paths in enterprise environments. Understanding administrative distance is essential for route preference.",
  toolRelevance: [
    "Cisco IOS CLI",
    "Packet Tracer",
    "GNS3",
    "EVE-NG",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
