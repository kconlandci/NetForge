import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "trunk-port-configuration",
  version: 1,
  title: "Configure and Troubleshoot Trunk Links",

  tier: "intermediate",
  track: "routing-switching",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["trunking", "802.1q", "dtp", "native-vlan"],

  description:
    "Configure 802.1Q trunk ports between switches, manage allowed VLANs, set native VLANs, and troubleshoot trunk negotiation failures.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Configure static trunk ports with 802.1Q encapsulation",
    "Manage allowed VLANs on trunk links to limit broadcast domains",
    "Troubleshoot native VLAN mismatches and DTP negotiation issues",
  ],
  sortOrder: 208,

  status: "published",
  prerequisites: [],

  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "static-trunk-setup",
      title: "Configure Static 802.1Q Trunk",
      description:
        "Connect Switch1 (Gi0/1) to Switch2 (Gi0/1) as a static trunk. Currently both sides are in dynamic desirable mode, which is a security risk. Force trunking and disable DTP.",
      targetSystem: "Switch1 (Cisco 3560) — Gi0/1",
      items: [
        {
          id: "trunk-mode",
          label: "Switchport Mode",
          detail: "show int Gi0/1 switchport — Mode: dynamic desirable",
          currentState: "dynamic-desirable",
          correctState: "trunk",
          states: ["dynamic-desirable", "dynamic-auto", "access", "trunk"],
          rationaleId: "r1",
        },
        {
          id: "encapsulation",
          label: "Trunk Encapsulation",
          detail: "show int Gi0/1 switchport — Encap: negotiate",
          currentState: "negotiate",
          correctState: "dot1q",
          states: ["negotiate", "dot1q", "isl"],
          rationaleId: "r2",
        },
        {
          id: "dtp-nonegotiate",
          label: "DTP Negotiation",
          detail: "DTP is sending negotiation frames",
          currentState: "enabled",
          correctState: "disabled",
          states: ["enabled", "disabled"],
          rationaleId: "r3",
        },
        {
          id: "native-vlan",
          label: "Native VLAN",
          detail: "show int trunk — Native VLAN: 1",
          currentState: "1",
          correctState: "999",
          states: ["1", "10", "99", "999"],
          rationaleId: "r4",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "Static trunk ('switchport mode trunk') is more secure than dynamic negotiation. Dynamic modes can be exploited by attackers to force trunk formation.",
        },
        {
          id: "r2",
          text: "802.1Q (dot1q) is the industry standard encapsulation. ISL is Cisco-proprietary and deprecated. Always specify explicitly.",
        },
        {
          id: "r3",
          text: "Disable DTP with 'switchport nonegotiate' after setting static trunk. This prevents attackers from negotiating a trunk on the port.",
        },
        {
          id: "r4",
          text: "Changing the native VLAN from 1 to an unused VLAN (999) mitigates VLAN hopping attacks. Both sides must match.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! The trunk is statically configured with dot1Q, DTP disabled, and native VLAN changed to 999 for security.",
        partial:
          "Some settings are correct. Make sure you set trunk mode, dot1Q encapsulation, disable DTP, and change the native VLAN.",
        wrong:
          "Static trunks need: 'switchport mode trunk', 'switchport trunk encapsulation dot1q', 'switchport nonegotiate', and a non-default native VLAN.",
      },
    },
    {
      type: "toggle-config",
      id: "allowed-vlans",
      title: "Restrict Allowed VLANs on Trunk",
      description:
        "The trunk between Switch1 and Switch2 currently allows all VLANs (1-4094). Only VLANs 10, 20, 30, and 99 should traverse this trunk to reduce unnecessary broadcast traffic.",
      targetSystem: "Switch1 (Cisco 3560) — Gi0/1",
      items: [
        {
          id: "allowed-vlans",
          label: "Allowed VLANs",
          detail: "show int trunk — VLANs allowed: 1-4094",
          currentState: "all",
          correctState: "10,20,30,99",
          states: ["all", "10,20,30,99", "1-100", "10,20,30"],
          rationaleId: "r1",
        },
        {
          id: "pruning",
          label: "VTP Pruning",
          detail: "show vtp status — Pruning: Disabled",
          currentState: "disabled",
          correctState: "disabled",
          states: ["disabled", "enabled"],
          rationaleId: "r2",
        },
        {
          id: "native-match",
          label: "Native VLAN Consistency",
          detail: "Switch1 native: 99, Switch2 native: 99",
          currentState: "matched-99",
          correctState: "matched-99",
          states: ["matched-99", "mismatch-1-99", "matched-1"],
          rationaleId: "r3",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "Use 'switchport trunk allowed vlan 10,20,30,99' to restrict traffic. This reduces broadcast domain size and improves security by blocking unused VLANs.",
        },
        {
          id: "r2",
          text: "VTP pruning dynamically restricts VLANs but is less predictable than manual allowed VLAN lists. With manual trunk pruning, VTP pruning is not needed.",
        },
        {
          id: "r3",
          text: "Native VLANs must match on both sides of a trunk. A mismatch causes STP issues and traffic leakage between VLANs.",
        },
      ],
      feedback: {
        perfect:
          "Well done! Only the required VLANs are allowed on the trunk, reducing broadcast traffic and improving security.",
        partial:
          "Close, but check the allowed VLAN list. Make sure VLAN 99 (native) is included along with VLANs 10, 20, and 30.",
        wrong:
          "Use 'switchport trunk allowed vlan' to explicitly list only the VLANs needed. Allowing all VLANs wastes bandwidth and increases attack surface.",
      },
    },
    {
      type: "toggle-config",
      id: "trunk-negotiation-fix",
      title: "Fix Trunk Negotiation Failure",
      description:
        "Switch1 Gi0/2 is set to 'dynamic auto' and Switch3 Gi0/1 is also 'dynamic auto'. The link is operating in access mode instead of trunk mode. Fix the negotiation.",
      targetSystem: "Switch1 (Cisco 3560) — Gi0/2",
      items: [
        {
          id: "sw1-mode",
          label: "Switch1 Gi0/2 Mode",
          detail: "show int Gi0/2 switchport — Mode: dynamic auto, Operating: access",
          currentState: "dynamic-auto",
          correctState: "trunk",
          states: ["dynamic-auto", "dynamic-desirable", "trunk", "access"],
          rationaleId: "r1",
        },
        {
          id: "sw3-mode",
          label: "Switch3 Gi0/1 Mode",
          detail: "show int Gi0/1 switchport — Mode: dynamic auto, Operating: access",
          currentState: "dynamic-auto",
          correctState: "trunk",
          states: ["dynamic-auto", "dynamic-desirable", "trunk", "access"],
          rationaleId: "r1",
        },
        {
          id: "dtp-setting",
          label: "DTP Status (both switches)",
          detail: "DTP frames being exchanged but no trunk formed",
          currentState: "enabled",
          correctState: "disabled",
          states: ["enabled", "disabled"],
          rationaleId: "r2",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "Two 'dynamic auto' ports will never form a trunk because neither side initiates negotiation. Both should be set to static 'trunk' mode for reliability.",
        },
        {
          id: "r2",
          text: "After setting static trunk mode, disable DTP with 'switchport nonegotiate' for security. DTP is unnecessary when both sides are statically configured.",
        },
      ],
      feedback: {
        perfect:
          "Correct! Two dynamic auto ports cannot negotiate a trunk. Setting both to static trunk mode and disabling DTP is the secure solution.",
        partial:
          "You identified the trunk issue but the best practice is static trunk on both sides. Dynamic modes should be avoided on production links.",
        wrong:
          "DTP auto-auto never forms a trunk. Review the DTP negotiation matrix: trunk+trunk, trunk+auto, trunk+desirable, or desirable+desirable all work.",
      },
    },
  ],
  hints: [
    "DTP mode combinations: auto+auto = access (no trunk), desirable+auto = trunk, trunk+anything = trunk. Static trunk is always safest.",
    "Use 'switchport trunk allowed vlan' to explicitly list VLANs. Add/remove with 'allowed vlan add/remove' to avoid overwriting.",
    "Native VLAN mismatches generate CDP/LLDP warnings and can cause traffic to leak between VLANs. Always verify both sides match.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "Trunk misconfigurations are a leading cause of VLAN connectivity issues. Understanding DTP negotiation and allowed VLAN management is essential for campus LAN operations.",
  toolRelevance: [
    "Cisco IOS CLI",
    "Wireshark (DTP frame analysis)",
    "Network documentation",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
