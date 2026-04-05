import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "vlan-configuration",
  version: 1,
  title: "Configure VLANs on a Managed Switch",

  tier: "beginner",
  track: "routing-switching",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["vlan", "switching", "layer-2", "segmentation"],

  description:
    "Learn to create, assign, and verify VLANs on a Cisco managed switch to segment traffic for different departments.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Create VLANs using the vlan database or global config mode",
    "Assign switch ports to the correct VLAN",
    "Verify VLAN configuration with show commands",
  ],
  sortOrder: 200,

  status: "published",
  prerequisites: [],

  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "vlan-create-assign",
      title: "Create and Assign Department VLANs",
      description:
        "A new office floor has three departments: Sales (VLAN 10), Engineering (VLAN 20), and HR (VLAN 30). Ports Fa0/1-8 should be on VLAN 10, Fa0/9-16 on VLAN 20, and Fa0/17-24 on VLAN 30. Currently all ports are on VLAN 1.",
      targetSystem: "Switch1 (Cisco 2960)",
      items: [
        {
          id: "vlan10-create",
          label: "VLAN 10 (Sales)",
          detail: "show vlan brief shows no VLAN 10 entry",
          currentState: "not-created",
          correctState: "created",
          states: ["not-created", "created"],
          rationaleId: "r1",
        },
        {
          id: "vlan20-create",
          label: "VLAN 20 (Engineering)",
          detail: "show vlan brief shows no VLAN 20 entry",
          currentState: "not-created",
          correctState: "created",
          states: ["not-created", "created"],
          rationaleId: "r1",
        },
        {
          id: "vlan30-create",
          label: "VLAN 30 (HR)",
          detail: "show vlan brief shows no VLAN 30 entry",
          currentState: "not-created",
          correctState: "created",
          states: ["not-created", "created"],
          rationaleId: "r1",
        },
        {
          id: "fa01-access-mode",
          label: "Fa0/1 Switchport Mode",
          detail: "show run int Fa0/1 — currently switchport mode dynamic desirable",
          currentState: "dynamic-desirable",
          correctState: "access",
          states: ["dynamic-desirable", "access", "trunk"],
          rationaleId: "r2",
        },
        {
          id: "fa01-vlan-assign",
          label: "Fa0/1 VLAN Assignment",
          detail: "switchport access vlan — currently VLAN 1",
          currentState: "vlan-1",
          correctState: "vlan-10",
          states: ["vlan-1", "vlan-10", "vlan-20", "vlan-30"],
          rationaleId: "r2",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "VLANs must be created in the VLAN database before ports can be assigned to them. Use 'vlan <id>' in global config and 'name <label>' to create each VLAN.",
        },
        {
          id: "r2",
          text: "Ports must be set to 'switchport mode access' and then assigned with 'switchport access vlan <id>'. Dynamic desirable could accidentally negotiate a trunk.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! All VLANs are created and ports are correctly assigned in access mode. Traffic is properly segmented.",
        partial:
          "Some items are correct but you missed a VLAN creation or port assignment. Remember to create VLANs before assigning ports.",
        wrong:
          "Review VLAN fundamentals. VLANs must first be created, then ports set to access mode, and finally assigned to the VLAN.",
      },
    },
    {
      type: "toggle-config",
      id: "vlan-naming-verify",
      title: "Fix VLAN Names and Verify Configuration",
      description:
        "VLANs 10, 20, and 30 exist but have default names (VLAN0010, etc.). Name them properly and ensure the native VLAN on the trunk port is set to VLAN 99 for security.",
      targetSystem: "Switch1 (Cisco 2960)",
      items: [
        {
          id: "vlan10-name",
          label: "VLAN 10 Name",
          detail: "show vlan brief — Name: VLAN0010",
          currentState: "VLAN0010",
          correctState: "Sales",
          states: ["VLAN0010", "Sales", "Engineering", "HR"],
          rationaleId: "r1",
        },
        {
          id: "vlan20-name",
          label: "VLAN 20 Name",
          detail: "show vlan brief — Name: VLAN0020",
          currentState: "VLAN0020",
          correctState: "Engineering",
          states: ["VLAN0020", "Sales", "Engineering", "HR"],
          rationaleId: "r1",
        },
        {
          id: "vlan30-name",
          label: "VLAN 30 Name",
          detail: "show vlan brief — Name: VLAN0030",
          currentState: "VLAN0030",
          correctState: "HR",
          states: ["VLAN0030", "Sales", "Engineering", "HR"],
          rationaleId: "r1",
        },
        {
          id: "native-vlan",
          label: "Trunk Native VLAN on Gi0/1",
          detail: "show int trunk — native vlan is 1",
          currentState: "vlan-1",
          correctState: "vlan-99",
          states: ["vlan-1", "vlan-10", "vlan-99"],
          rationaleId: "r2",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "Descriptive VLAN names make network documentation easier and help during troubleshooting. Use 'name <description>' under the vlan config.",
        },
        {
          id: "r2",
          text: "Changing the native VLAN from the default (VLAN 1) to an unused VLAN like 99 mitigates VLAN hopping attacks where an attacker double-tags frames with VLAN 1.",
        },
      ],
      feedback: {
        perfect:
          "Great work! VLANs are properly named and the native VLAN has been changed to 99 for security hardening.",
        partial:
          "You got some items right. Make sure each VLAN has a descriptive name matching its department and the native VLAN is not VLAN 1.",
        wrong:
          "Review best practices for VLAN naming and native VLAN security. Names should match departments and native VLAN should be unused for security.",
      },
    },
    {
      type: "toggle-config",
      id: "vlan-voice-data",
      title: "Configure Voice and Data VLANs",
      description:
        "IP phones are connected to ports Fa0/1-4 with PCs daisy-chained behind them. Configure each port for data VLAN 10 and voice VLAN 50. Ensure the ports are access ports.",
      targetSystem: "Switch2 (Cisco 3560)",
      items: [
        {
          id: "port-mode",
          label: "Fa0/1 Switchport Mode",
          detail: "show run int Fa0/1 — no switchport mode configured",
          currentState: "default",
          correctState: "access",
          states: ["default", "access", "trunk"],
          rationaleId: "r1",
        },
        {
          id: "data-vlan",
          label: "Fa0/1 Data VLAN",
          detail: "switchport access vlan — not set",
          currentState: "vlan-1",
          correctState: "vlan-10",
          states: ["vlan-1", "vlan-10", "vlan-50"],
          rationaleId: "r1",
        },
        {
          id: "voice-vlan",
          label: "Fa0/1 Voice VLAN",
          detail: "switchport voice vlan — not configured",
          currentState: "none",
          correctState: "vlan-50",
          states: ["none", "vlan-10", "vlan-50"],
          rationaleId: "r2",
        },
        {
          id: "qos-trust",
          label: "QoS Trust on Fa0/1",
          detail: "mls qos trust — not configured",
          currentState: "untrusted",
          correctState: "trust-cos",
          states: ["untrusted", "trust-cos", "trust-dscp"],
          rationaleId: "r3",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "The data VLAN carries PC traffic and is set with 'switchport access vlan 10'. The port must be in access mode for the voice VLAN command to work correctly.",
        },
        {
          id: "r2",
          text: "The voice VLAN uses 'switchport voice vlan 50' which creates a mini-trunk (802.1Q tagged) specifically for the phone while keeping data untagged on VLAN 10.",
        },
        {
          id: "r3",
          text: "QoS trust CoS allows the switch to honor the Class of Service markings from the IP phone, ensuring voice packets get priority treatment.",
        },
      ],
      feedback: {
        perfect:
          "Perfect! Ports are configured with separate data and voice VLANs and QoS trust is enabled for proper voice prioritization.",
        partial:
          "Close, but check that both data and voice VLANs are assigned and QoS trust is enabled. All three are needed for VoIP.",
        wrong:
          "Review voice VLAN configuration. You need access mode, a data VLAN, a voice VLAN, and QoS trust CoS for IP phone deployments.",
      },
    },
  ],
  hints: [
    "VLANs must be created before ports can be assigned to them. Check 'show vlan brief' first.",
    "Access ports carry a single data VLAN. Use 'switchport mode access' before assigning a VLAN.",
    "Voice VLANs require 'switchport voice vlan <id>' and work alongside the data VLAN on the same port.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "VLAN configuration is a daily task for network engineers. Properly segmenting traffic reduces broadcast domains and improves security posture.",
  toolRelevance: [
    "Cisco IOS CLI",
    "Packet Tracer",
    "GNS3",
    "Network documentation tools",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
