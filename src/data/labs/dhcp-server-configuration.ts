import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "dhcp-server-configuration",
  version: 1,
  title: "DHCP Server Configuration",
  tier: "beginner",
  track: "network-services",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["dhcp", "ip-addressing", "server-configuration", "scopes"],
  description:
    "Configure DHCP server scopes, options, and exclusions to provide automatic IP addressing to network clients.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Configure DHCP scopes with correct address ranges",
    "Set appropriate DHCP options including gateway and DNS",
    "Implement address exclusions and reservations",
  ],
  sortOrder: 500,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "dhcp-001",
      title: "Branch Office DHCP Scope Setup",
      description:
        "A new branch office needs DHCP configured on a Cisco router. The LAN subnet is 192.168.10.0/24. The first 20 addresses are reserved for infrastructure. The gateway is 192.168.10.1, DNS servers are 8.8.8.8 and 8.8.4.4, and the lease time should be 8 hours for the employee VLAN.\n\nRouter# show running-config | section dhcp\nip dhcp excluded-address 192.168.10.1 192.168.10.10\nip dhcp pool BRANCH-LAN\n network 192.168.10.0 255.255.255.0\n default-router 192.168.10.1\n dns-server 8.8.8.8\n lease 1",
      targetSystem: "Cisco IOS DHCP Server",
      items: [
        {
          id: "item-1",
          label: "Exclusion Range",
          detail: "ip dhcp excluded-address range for infrastructure devices",
          currentState: "192.168.10.1 - 192.168.10.10",
          correctState: "192.168.10.1 - 192.168.10.20",
          states: [
            "192.168.10.1 - 192.168.10.10",
            "192.168.10.1 - 192.168.10.20",
            "192.168.10.1 - 192.168.10.5",
            "192.168.10.1 - 192.168.10.50",
          ],
          rationaleId: "rat-1",
        },
        {
          id: "item-2",
          label: "DNS Server Configuration",
          detail: "dns-server option for client name resolution",
          currentState: "8.8.8.8 only",
          correctState: "8.8.8.8 and 8.8.4.4",
          states: [
            "8.8.8.8 only",
            "8.8.8.8 and 8.8.4.4",
            "192.168.10.1 only",
            "No DNS configured",
          ],
          rationaleId: "rat-2",
        },
        {
          id: "item-3",
          label: "Lease Duration",
          detail: "DHCP lease time for employee workstations",
          currentState: "1 day",
          correctState: "8 hours",
          states: ["1 day", "8 hours", "30 minutes", "infinite"],
          rationaleId: "rat-3",
        },
      ],
      rationales: [
        {
          id: "rat-1",
          text: "The requirement states that the first 20 addresses are reserved for infrastructure. The exclusion must cover 192.168.10.1 through 192.168.10.20 to prevent the DHCP pool from assigning these addresses to clients.",
        },
        {
          id: "rat-2",
          text: "Two DNS servers should be configured for redundancy. If the primary DNS server fails, clients will fall back to the secondary server, maintaining name resolution availability.",
        },
        {
          id: "rat-3",
          text: "An 8-hour lease is appropriate for an employee VLAN where workstations are used during business hours. This ensures addresses are reclaimed promptly when devices disconnect, preventing pool exhaustion.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! You correctly configured the exclusion range for all 20 infrastructure addresses, both DNS servers for redundancy, and the 8-hour lease for the employee VLAN.",
        partial:
          "Some settings need adjustment. Review the exclusion range to ensure all 20 infrastructure addresses are protected, verify both DNS servers are listed, and check the lease duration matches the 8-hour requirement.",
        wrong:
          "The DHCP scope has significant misconfigurations. The exclusion range must cover .1 through .20, both DNS servers (8.8.8.8 and 8.8.4.4) must be included, and the lease should be 8 hours for employee workstations.",
      },
    },
    {
      type: "toggle-config",
      id: "dhcp-002",
      title: "DHCP Relay Agent Configuration",
      description:
        "The sales VLAN (VLAN 20, subnet 172.16.20.0/24) on a remote floor cannot obtain DHCP addresses. The DHCP server is on the server VLAN at 10.0.1.50. The router subinterface for VLAN 20 is configured but clients receive 169.254.x.x APIPA addresses.\n\nRouter# show running-config interface GigabitEthernet0/0.20\ninterface GigabitEthernet0/0.20\n encapsulation dot1Q 20\n ip address 172.16.20.1 255.255.255.0\n no shutdown",
      targetSystem: "Cisco IOS Router Subinterface",
      items: [
        {
          id: "item-1",
          label: "DHCP Relay (ip helper-address)",
          detail: "Forward DHCP broadcasts to the central DHCP server",
          currentState: "Not configured",
          correctState: "ip helper-address 10.0.1.50",
          states: [
            "Not configured",
            "ip helper-address 10.0.1.50",
            "ip helper-address 172.16.20.1",
            "ip helper-address 255.255.255.255",
          ],
          rationaleId: "rat-1",
        },
        {
          id: "item-2",
          label: "VLAN 20 Interface State",
          detail: "Administrative state of the subinterface",
          currentState: "no shutdown",
          correctState: "no shutdown",
          states: ["shutdown", "no shutdown"],
          rationaleId: "rat-2",
        },
        {
          id: "item-3",
          label: "Encapsulation",
          detail: "802.1Q VLAN tagging on the subinterface",
          currentState: "dot1Q 20",
          correctState: "dot1Q 20",
          states: ["dot1Q 20", "dot1Q 1", "isl 20", "Not configured"],
          rationaleId: "rat-3",
        },
      ],
      rationales: [
        {
          id: "rat-1",
          text: "DHCP clients send broadcast DISCOVER packets that do not cross router boundaries. The ip helper-address command converts these broadcasts to unicast packets directed at the DHCP server (10.0.1.50), enabling cross-subnet DHCP.",
        },
        {
          id: "rat-2",
          text: "The subinterface must be in the no shutdown state to pass traffic. This is already correct and should not be changed.",
        },
        {
          id: "rat-3",
          text: "The 802.1Q encapsulation with VLAN 20 tagging is correctly configured to match the switch VLAN assignment. This enables the router to process tagged frames from VLAN 20.",
        },
      ],
      feedback: {
        perfect:
          "Perfect! Adding ip helper-address 10.0.1.50 is the key fix. DHCP broadcasts from VLAN 20 clients will now be relayed as unicast to the central DHCP server.",
        partial:
          "Close - the critical missing piece is the ip helper-address pointing to the DHCP server at 10.0.1.50. Without it, DHCP DISCOVER broadcasts stay within the local subnet.",
        wrong:
          "The main issue is the missing ip helper-address 10.0.1.50 on the VLAN 20 subinterface. This relay agent configuration forwards DHCP requests across subnet boundaries to the centralized server.",
      },
    },
    {
      type: "toggle-config",
      id: "dhcp-003",
      title: "DHCP Pool Security Hardening",
      description:
        "The IT security team has flagged the guest wireless DHCP pool for hardening. The current pool gives guests access to internal DNS and has no safeguards against rogue DHCP servers. You need to configure the guest pool (192.168.99.0/24) with public DNS only, enable DHCP snooping on the switch, and limit the lease to 2 hours.\n\nSwitch# show ip dhcp snooping\nDHCP snooping is disabled\nDHCP snooping VLAN: none\n\nRouter# show run | section dhcp\nip dhcp pool GUEST-WIFI\n network 192.168.99.0 255.255.255.0\n default-router 192.168.99.1\n dns-server 10.0.1.10\n lease 7",
      targetSystem: "Cisco IOS Switch and Router",
      items: [
        {
          id: "item-1",
          label: "Guest DNS Server",
          detail: "DNS server provided to guest wireless clients",
          currentState: "10.0.1.10 (internal)",
          correctState: "1.1.1.1 (public Cloudflare)",
          states: [
            "10.0.1.10 (internal)",
            "1.1.1.1 (public Cloudflare)",
            "No DNS configured",
            "192.168.99.1 (gateway)",
          ],
          rationaleId: "rat-1",
        },
        {
          id: "item-2",
          label: "DHCP Snooping",
          detail: "DHCP snooping feature on the access switch",
          currentState: "Disabled",
          correctState: "Enabled on guest VLAN",
          states: [
            "Disabled",
            "Enabled on guest VLAN",
            "Enabled globally only",
            "Enabled on all VLANs",
          ],
          rationaleId: "rat-2",
        },
        {
          id: "item-3",
          label: "Guest Lease Duration",
          detail: "DHCP lease time for guest wireless clients",
          currentState: "7 days",
          correctState: "2 hours",
          states: ["7 days", "2 hours", "24 hours", "30 minutes"],
          rationaleId: "rat-3",
        },
      ],
      rationales: [
        {
          id: "rat-1",
          text: "Guest clients should never use internal DNS servers. Internal DNS can leak information about internal hostnames and services. Public DNS (such as 1.1.1.1) provides name resolution without exposing internal infrastructure.",
        },
        {
          id: "rat-2",
          text: "DHCP snooping on the guest VLAN prevents rogue DHCP servers from handing out malicious configurations. It builds a binding table that validates DHCP traffic and drops unauthorized DHCP server responses.",
        },
        {
          id: "rat-3",
          text: "A 2-hour lease for guest WiFi ensures IP addresses are recycled quickly as visitors come and go. A 7-day lease would exhaust the pool in a busy location and allow stale entries to persist.",
        },
      ],
      feedback: {
        perfect:
          "Well done! You hardened the guest DHCP by switching to public DNS, enabling DHCP snooping on the guest VLAN, and shortening the lease to 2 hours for rapid address recycling.",
        partial:
          "You improved some settings, but review all three areas: DNS should be public (not internal), DHCP snooping should protect the guest VLAN, and the lease should be 2 hours.",
        wrong:
          "The guest pool needs all three changes: public DNS to prevent internal exposure, DHCP snooping to block rogue servers, and a 2-hour lease for the transient guest population.",
      },
    },
  ],
  hints: [
    "DHCP exclusions must cover all statically assigned infrastructure addresses to prevent IP conflicts.",
    "When DHCP clients are on a different subnet than the server, a relay agent (ip helper-address) is required to forward broadcast DISCOVER packets.",
    "Guest network DHCP should use public DNS, short leases, and snooping to prevent both information leakage and rogue server attacks.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "DHCP misconfigurations cause more helpdesk tickets than almost any other service. Mastering scope design, relay agents, and security features like snooping is essential for any network operations role.",
  toolRelevance: [
    "Cisco IOS DHCP commands",
    "ip helper-address",
    "DHCP snooping",
    "ipconfig /release /renew",
    "show ip dhcp binding",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
