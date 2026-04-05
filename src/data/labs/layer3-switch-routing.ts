import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "layer3-switch-routing",
  version: 1,
  title: "Classify L3 Switch Routing Problems",

  tier: "advanced",
  track: "routing-switching",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["layer-3-switch", "svi", "routed-port", "ip-routing", "triage"],

  description:
    "Classify and remediate Layer 3 switch routing problems including SVI failures, missing ip routing, routed port issues, and CEF inconsistencies.",
  estimatedMinutes: 16,
  learningObjectives: [
    "Diagnose SVI state issues and their relationship to physical ports",
    "Identify missing 'ip routing' enablement on Layer 3 switches",
    "Troubleshoot routed port vs SVI configuration conflicts",
  ],
  sortOrder: 216,

  status: "published",
  prerequisites: [],

  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "ip-routing-disabled",
      title: "Inter-VLAN Routing Not Working on L3 Switch",
      description:
        "A Cisco 3850 has SVIs configured for VLANs 10, 20, and 30 with correct IP addresses. Hosts can ping their gateway but cannot reach other VLANs. The switch has no routing protocol configured.",
      evidence: [
        {
          type: "cli-output",
          content:
            "Switch# show ip route\nDefault gateway is not set\n\nHost               Gateway           Last Use    Total Uses  Interface\nICMP redirect cache is empty",
        },
        {
          type: "cli-output",
          content:
            "Switch# show ip interface brief\nVlan10    10.1.10.1   YES manual up    up\nVlan20    10.1.20.1   YES manual up    up\nVlan30    10.1.30.1   YES manual up    up",
        },
        {
          type: "cli-output",
          content:
            "Switch# show run | include ip routing\n(no output)",
        },
      ],
      classifications: [
        {
          id: "ip-routing-missing",
          label: "IP Routing Not Enabled",
          description: "The 'ip routing' command has not been issued, so the switch operates as a Layer 2 device for inter-VLAN traffic.",
        },
        {
          id: "svi-down",
          label: "SVI Interface Down",
          description: "One or more SVIs are in a down state, preventing routing.",
        },
        {
          id: "no-default-route",
          label: "Missing Default Route",
          description: "No default route configured for internet-bound traffic.",
        },
      ],
      correctClassificationId: "ip-routing-missing",
      remediations: [
        {
          id: "enable-ip-routing",
          label: "Enable ip routing in global configuration",
          description: "Enter 'ip routing' in global config mode to enable Layer 3 forwarding between SVIs.",
        },
        {
          id: "add-ospf",
          label: "Configure OSPF to populate the routing table",
          description: "Add OSPF configuration to learn routes dynamically.",
        },
        {
          id: "add-static-routes",
          label: "Add static routes between VLANs",
          description: "Manually configure static routes for each VLAN subnet.",
        },
      ],
      correctRemediationId: "enable-ip-routing",
      rationales: [
        {
          id: "r1",
          text: "The 'show ip route' output shows only a host table (no routing table), confirming 'ip routing' is disabled. Without it, the switch cannot forward packets between SVIs even though they are up/up.",
        },
        {
          id: "r2",
          text: "OSPF or static routes would be needed after enabling ip routing, but the primary issue is that ip routing itself is not enabled. Connected routes will appear automatically once enabled.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The missing 'ip routing' command is the root cause. Once enabled, connected routes for all SVIs will appear and inter-VLAN routing will work.",
        partial:
          "You identified a routing issue but the fundamental problem is that the switch is not routing at all. Check if 'ip routing' is enabled first.",
        wrong:
          "Layer 3 switches require 'ip routing' to be explicitly enabled. Without it, the switch only operates at Layer 2 even with SVIs configured.",
      },
    },
    {
      type: "triage-remediate",
      id: "svi-down-no-ports",
      title: "SVI in Down/Down State",
      description:
        "VLAN 40 SVI is showing line protocol down. Hosts cannot reach their gateway at 10.1.40.1. Other VLANs are working fine.",
      evidence: [
        {
          type: "cli-output",
          content:
            "Switch# show ip int brief | include Vlan40\nVlan40    10.1.40.1   YES manual down  down",
        },
        {
          type: "cli-output",
          content:
            "Switch# show vlan brief | include 40\n40   VLAN40                           active",
        },
        {
          type: "cli-output",
          content:
            "Switch# show vlan id 40\nVLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------\n40   VLAN40                           active\n\n(no ports listed)",
          icon: "alert",
        },
      ],
      classifications: [
        {
          id: "no-active-ports",
          label: "No Active Ports in VLAN 40",
          description: "The SVI is down because no physical ports are assigned to VLAN 40 in an up/up state.",
        },
        {
          id: "svi-shutdown",
          label: "SVI Administratively Shut Down",
          description: "The VLAN 40 SVI has been manually shut down.",
        },
        {
          id: "vlan-deleted",
          label: "VLAN 40 Deleted from Database",
          description: "VLAN 40 does not exist in the VLAN database.",
        },
      ],
      correctClassificationId: "no-active-ports",
      remediations: [
        {
          id: "assign-ports",
          label: "Assign at least one active port to VLAN 40",
          description: "Configure a switch port as 'switchport access vlan 40' or ensure a trunk port allows VLAN 40.",
        },
        {
          id: "no-shutdown-svi",
          label: "Issue 'no shutdown' on the VLAN 40 SVI",
          description: "Re-enable the SVI interface.",
        },
        {
          id: "recreate-vlan",
          label: "Delete and recreate VLAN 40",
          description: "Remove and re-add VLAN 40 to the database.",
        },
      ],
      correctRemediationId: "assign-ports",
      rationales: [
        {
          id: "r1",
          text: "The VLAN is active in the database but 'show vlan id 40' shows no ports assigned. An SVI goes to line protocol down when no ports in that VLAN are in an up/up state.",
        },
        {
          id: "r2",
          text: "If the SVI were administratively shut down, the status would show 'administratively down' not just 'down down'. The issue is no active ports in the VLAN.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! An SVI requires at least one active port in its VLAN to come up. Assign ports to VLAN 40 or verify trunk links allow VLAN 40.",
        partial:
          "You identified an SVI issue but the root cause is the absence of active ports in the VLAN. The SVI cannot come up without them.",
        wrong:
          "An SVI's line protocol status depends on having at least one port in the VLAN in an up/up state. Check 'show vlan id <id>' for port membership.",
      },
    },
    {
      type: "triage-remediate",
      id: "routed-port-conflict",
      title: "Routed Port Not Forwarding Traffic",
      description:
        "A Layer 3 switch port Gi0/1 was configured as a routed port (no switchport) to connect to a router. The interface is up/up with a correct IP but traffic is not being forwarded.",
      evidence: [
        {
          type: "cli-output",
          content:
            "Switch# show ip interface Gi0/1\nGigabitEthernet0/1 is up, line protocol is up\n  Internet address is 10.0.99.1/30\n  Broadcast address is 255.255.255.255\n  IP CEF switching is disabled\n  ICMP redirects are always sent\n  IP unicast RPF check is disabled",
        },
        {
          type: "cli-output",
          content:
            "Switch# show ip cef\n% CEF not running",
          icon: "alert",
        },
        {
          type: "cli-output",
          content:
            "Switch# show run | include ip routing\nip routing\nSwitch# show run | include ip cef\nno ip cef",
        },
      ],
      classifications: [
        {
          id: "cef-disabled",
          label: "CEF (Cisco Express Forwarding) Disabled",
          description: "IP CEF is disabled, preventing hardware-accelerated forwarding on the Layer 3 switch.",
        },
        {
          id: "no-switchport-missing",
          label: "Missing 'no switchport' Command",
          description: "The port is still in switchport mode and not operating as a routed port.",
        },
        {
          id: "ip-routing-off",
          label: "IP Routing Disabled",
          description: "The ip routing command is missing from global config.",
        },
      ],
      correctClassificationId: "cef-disabled",
      remediations: [
        {
          id: "enable-cef",
          label: "Enable CEF with 'ip cef' in global configuration",
          description: "Re-enable Cisco Express Forwarding to restore hardware-based routing on the switch.",
        },
        {
          id: "add-no-switchport",
          label: "Re-apply 'no switchport' on Gi0/1",
          description: "Ensure the interface is properly configured as a routed port.",
        },
        {
          id: "reboot-switch",
          label: "Reboot the switch to restore default CEF state",
          description: "Restart the switch hoping CEF re-initializes.",
        },
      ],
      correctRemediationId: "enable-cef",
      rationales: [
        {
          id: "r1",
          text: "The show output confirms 'IP CEF switching is disabled' and 'no ip cef' in the running config. Layer 3 switches require CEF for hardware-based forwarding. Without it, routing may fail or fall back to slow process switching.",
        },
        {
          id: "r2",
          text: "The interface already shows as a routed port (has an IP address, is up/up). 'ip routing' is also enabled. The missing piece is CEF, which is required for L3 switch forwarding.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! CEF is required for Layer 3 switch hardware forwarding. 'no ip cef' was configured (perhaps accidentally), disabling forwarding. Re-enable with 'ip cef'.",
        partial:
          "You identified a forwarding issue. The key evidence is 'CEF not running'. Layer 3 switches depend on CEF for routing in hardware.",
        wrong:
          "Layer 3 switches use CEF for hardware-based forwarding. When disabled, the switch cannot route traffic efficiently. Check 'show ip cef' and 'show run | include cef'.",
      },
    },
  ],
  hints: [
    "Layer 3 switches require 'ip routing' enabled in global config. Without it, SVIs cannot route between VLANs.",
    "An SVI goes to down/down when no active ports are assigned to its VLAN. Check 'show vlan id <n>' for port membership.",
    "CEF (Cisco Express Forwarding) is required for hardware-based routing on L3 switches. Verify with 'show ip cef'.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "Layer 3 switches are the backbone of modern campus networks. Understanding the interplay between SVIs, routed ports, ip routing, and CEF is essential for enterprise deployments.",
  toolRelevance: [
    "Cisco IOS CLI",
    "Network TAP / SPAN analysis",
    "CEF troubleshooting tools",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
