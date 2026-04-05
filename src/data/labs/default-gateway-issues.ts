import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "default-gateway-issues",
  version: 1,
  title: "Resolve Default Gateway Problems",

  tier: "beginner",
  track: "routing-switching",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["default-gateway", "layer-3", "connectivity", "troubleshooting"],

  description:
    "Diagnose and fix default gateway configuration issues preventing hosts from reaching remote networks and the internet.",
  estimatedMinutes: 8,
  learningObjectives: [
    "Verify default gateway configuration on hosts and network devices",
    "Identify subnet mismatch and gateway reachability issues",
    "Understand the role of the default gateway in IP communication",
  ],
  sortOrder: 206,

  status: "published",
  prerequisites: [],

  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "wrong-gateway-ip",
      title: "Host Cannot Reach the Internet",
      context:
        "A user on VLAN 10 (subnet 192.168.10.0/24) cannot browse the internet. Their PC has IP 192.168.10.50, mask 255.255.255.0, and gateway 192.168.20.1. The router's VLAN 10 SVI is 192.168.10.1. Pinging 192.168.10.1 from the PC fails.",
      displayFields: [
        { label: "PC IP", value: "192.168.10.50/24" },
        { label: "PC Gateway", value: "192.168.20.1", emphasis: "critical" },
        { label: "Router SVI (VLAN 10)", value: "192.168.10.1" },
        { label: "Ping to Gateway", value: "Request timed out", emphasis: "warn" },
      ],
      actions: [
        {
          id: "fix-gateway",
          label: "Change PC gateway to 192.168.10.1",
          color: "green",
        },
        {
          id: "change-router-ip",
          label: "Change router SVI to 192.168.20.1",
          color: "red",
        },
        {
          id: "add-route",
          label: "Add a static route on the router for the PC",
          color: "yellow",
        },
        {
          id: "check-cable",
          label: "Replace the network cable",
          color: "orange",
        },
      ],
      correctActionId: "fix-gateway",
      rationales: [
        {
          id: "r1",
          text: "The PC's gateway (192.168.20.1) is not on its own subnet (192.168.10.0/24). The gateway must be on the same subnet as the host. Changing it to 192.168.10.1 fixes the issue.",
        },
        {
          id: "r2",
          text: "Changing the router SVI would break connectivity for all other hosts on VLAN 10. The PC's configuration is wrong, not the router's.",
        },
        {
          id: "r3",
          text: "A static route would not help because the PC cannot even reach its gateway. The problem is Layer 3 configuration on the host, not a routing issue.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The default gateway must be on the same subnet as the host. 192.168.20.1 is on a different subnet, so ARP for the gateway fails.",
        partial:
          "You're on the right track but consider which device needs the change. The PC's gateway must match the router's SVI on the same VLAN.",
        wrong:
          "The default gateway must be an IP address on the host's local subnet. Check the PC's gateway against the router's VLAN 10 SVI.",
      },
    },
    {
      type: "action-rationale",
      id: "gateway-interface-down",
      title: "Gateway Interface is Down",
      context:
        "All users on VLAN 30 lost internet access simultaneously. PCs can ping each other within VLAN 30 but cannot reach the gateway. The router shows the VLAN 30 SVI as administratively down.\n\nRouter# show ip interface brief\nVlan30    192.168.30.1    YES manual administratively down down",
      displayFields: [
        { label: "VLAN 30 SVI", value: "192.168.30.1" },
        { label: "SVI Status", value: "administratively down", emphasis: "critical" },
        { label: "Intra-VLAN Ping", value: "Success" },
        { label: "Gateway Ping", value: "Failed" },
      ],
      actions: [
        {
          id: "no-shut-svi",
          label: "Issue 'no shutdown' on the VLAN 30 SVI",
          color: "green",
        },
        {
          id: "recreate-svi",
          label: "Delete and recreate the VLAN 30 SVI",
          color: "orange",
        },
        {
          id: "reboot-router",
          label: "Reboot the router",
          color: "red",
        },
        {
          id: "change-gateway",
          label: "Change all PCs to use a different gateway",
          color: "red",
        },
      ],
      correctActionId: "no-shut-svi",
      rationales: [
        {
          id: "r1",
          text: "The SVI is administratively down, meaning someone issued 'shutdown' on the interface. Simply entering 'no shutdown' under interface Vlan30 will bring it back up.",
        },
        {
          id: "r2",
          text: "Deleting and recreating the SVI would work but is excessive. The configuration is correct; it just needs to be re-enabled.",
        },
        {
          id: "r3",
          text: "Rebooting the router causes a network-wide outage and is unnecessary. The SVI can be re-enabled without a reboot.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Right! The SVI is just administratively shut down. A simple 'no shutdown' restores the gateway for all VLAN 30 users.",
        partial:
          "Your approach would eventually work but is not the simplest fix. Check the interface status; 'administratively down' means shutdown was issued.",
        wrong:
          "When 'show ip interface brief' shows 'administratively down', the fix is 'no shutdown' on that interface. No reboot or reconfiguration needed.",
      },
    },
    {
      type: "action-rationale",
      id: "dhcp-wrong-gateway",
      title: "DHCP Assigning Wrong Default Gateway",
      context:
        "New PCs on VLAN 40 receive IP addresses via DHCP but cannot reach other VLANs. Investigation shows DHCP assigns gateway 192.168.40.254, but the actual router SVI is 192.168.40.1. The DHCP server is centralized.\n\nRouter# show ip dhcp pool VLAN40\n  Network: 192.168.40.0/24\n  Default Router: 192.168.40.254\n  DNS Server: 8.8.8.8\n  Lease: 8 hours",
      displayFields: [
        { label: "DHCP Pool Gateway", value: "192.168.40.254", emphasis: "critical" },
        { label: "Actual Router SVI", value: "192.168.40.1" },
        { label: "PC IP (DHCP)", value: "192.168.40.100/24" },
        { label: "Symptom", value: "Cannot reach other VLANs" },
      ],
      actions: [
        {
          id: "fix-dhcp-gateway",
          label: "Change DHCP pool default-router to 192.168.40.1",
          color: "green",
        },
        {
          id: "add-secondary-ip",
          label: "Add 192.168.40.254 as secondary IP on the SVI",
          color: "yellow",
        },
        {
          id: "static-ip-all",
          label: "Assign static IPs with correct gateway to all PCs",
          color: "red",
        },
        {
          id: "change-svi",
          label: "Change router SVI to 192.168.40.254",
          color: "orange",
        },
      ],
      correctActionId: "fix-dhcp-gateway",
      rationales: [
        {
          id: "r1",
          text: "The DHCP pool has the wrong default-router value. Fix it with 'default-router 192.168.40.1' under the DHCP pool. Existing clients will update at next lease renewal.",
        },
        {
          id: "r2",
          text: "Adding a secondary IP works as a workaround but introduces an unnecessary configuration. The DHCP pool is the root cause and should be corrected.",
        },
        {
          id: "r3",
          text: "Static IPs for all PCs defeats the purpose of DHCP and creates a management burden. Fix the DHCP pool instead.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The DHCP pool is handing out the wrong gateway. Change 'default-router' to 192.168.40.1 and clients will pick it up at lease renewal.",
        partial:
          "Your fix would restore connectivity but does not address the root cause. The DHCP pool has an incorrect default-router value.",
        wrong:
          "Check the DHCP pool configuration. The default-router must match the actual router SVI that serves as the gateway for that VLAN.",
      },
    },
  ],
  hints: [
    "The default gateway must be an IP address on the host's local subnet. If it is on a different subnet, ARP resolution will fail.",
    "Check 'show ip interface brief' to verify that the gateway interface (SVI or physical) is in an up/up state.",
    "If DHCP is in use, verify the 'default-router' option in the DHCP pool matches the actual router interface IP.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "Default gateway issues are among the most common help desk calls. Being able to quickly identify gateway misconfigurations saves hours of troubleshooting.",
  toolRelevance: [
    "Cisco IOS CLI",
    "ipconfig / ifconfig",
    "Ping and traceroute",
    "DHCP server management",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
