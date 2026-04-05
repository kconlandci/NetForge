import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "port-security-setup",
  version: 1,
  title: "Configure Switch Port Security Features",

  tier: "beginner",
  track: "routing-switching",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["port-security", "switching", "mac-address", "security"],

  description:
    "Configure port security on switch access ports to limit MAC addresses, set violation actions, and protect against MAC flooding attacks.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Enable port security and set maximum MAC address limits",
    "Configure violation modes: shutdown, restrict, and protect",
    "Implement sticky MAC address learning for persistent security",
  ],
  sortOrder: 205,

  status: "published",
  prerequisites: [],

  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "basic-port-security",
      title: "Enable Port Security on Access Ports",
      description:
        "Fa0/1 connects to a single workstation. Enable port security allowing only 1 MAC address with shutdown violation mode. The port is currently in dynamic desirable mode.",
      targetSystem: "Switch1 (Cisco 2960)",
      items: [
        {
          id: "switchport-mode",
          label: "Fa0/1 Switchport Mode",
          detail: "show run int Fa0/1 — switchport mode dynamic desirable",
          currentState: "dynamic-desirable",
          correctState: "access",
          states: ["dynamic-desirable", "access", "trunk"],
          rationaleId: "r1",
        },
        {
          id: "port-security-enable",
          label: "Port Security Status",
          detail: "show port-security int Fa0/1 — Port Security: Disabled",
          currentState: "disabled",
          correctState: "enabled",
          states: ["disabled", "enabled"],
          rationaleId: "r2",
        },
        {
          id: "max-mac",
          label: "Maximum MAC Addresses",
          detail: "Not configured (default would be 1 when enabled)",
          currentState: "default",
          correctState: "1",
          states: ["default", "1", "2", "5"],
          rationaleId: "r2",
        },
        {
          id: "violation-mode",
          label: "Violation Mode",
          detail: "Not configured (default is shutdown)",
          currentState: "default",
          correctState: "shutdown",
          states: ["default", "shutdown", "restrict", "protect"],
          rationaleId: "r3",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "Port security requires the port to be a static access or trunk port. Dynamic modes do not support port security. Use 'switchport mode access' first.",
        },
        {
          id: "r2",
          text: "Enable with 'switchport port-security'. Maximum of 1 MAC ensures only the authorized workstation can connect. Use 'switchport port-security maximum 1'.",
        },
        {
          id: "r3",
          text: "Shutdown mode (default) err-disables the port on violation, providing the strongest protection. The port stays down until manually re-enabled or auto-recovery is configured.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! Port security is properly configured with access mode, enabled, max 1 MAC, and shutdown violation. The port is now protected.",
        partial:
          "Some settings are correct but port security requires all pieces: access mode, enabled, max MACs, and violation mode.",
        wrong:
          "Port security needs: 1) switchport mode access, 2) switchport port-security, 3) maximum MAC limit, and 4) violation mode.",
      },
    },
    {
      type: "toggle-config",
      id: "sticky-mac-config",
      title: "Configure Sticky MAC Learning",
      description:
        "A conference room has ports Fa0/10-12 where different laptops connect. Configure sticky MAC learning with a maximum of 3 MACs and restrict violation mode to log but not shut down.",
      targetSystem: "Switch1 (Cisco 2960)",
      items: [
        {
          id: "port-mode",
          label: "Fa0/10 Switchport Mode",
          detail: "show run int Fa0/10 — switchport mode access",
          currentState: "access",
          correctState: "access",
          states: ["dynamic-desirable", "access", "trunk"],
          rationaleId: "r1",
        },
        {
          id: "sticky-enable",
          label: "Sticky MAC Learning",
          detail: "show port-security int Fa0/10 — Sticky MAC: Disabled",
          currentState: "disabled",
          correctState: "enabled",
          states: ["disabled", "enabled"],
          rationaleId: "r1",
        },
        {
          id: "max-mac-sticky",
          label: "Maximum MAC Addresses",
          detail: "show port-security int Fa0/10 — Max: 1",
          currentState: "1",
          correctState: "3",
          states: ["1", "2", "3", "5"],
          rationaleId: "r2",
        },
        {
          id: "violation-restrict",
          label: "Violation Mode",
          detail: "show port-security int Fa0/10 — Violation: Shutdown",
          currentState: "shutdown",
          correctState: "restrict",
          states: ["shutdown", "restrict", "protect"],
          rationaleId: "r3",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "Sticky learning ('switchport port-security mac-address sticky') dynamically learns MACs and adds them to the running config, persisting across port bounces.",
        },
        {
          id: "r2",
          text: "Conference room ports need more than 1 MAC since multiple people connect throughout the day. Maximum of 3 allows a reasonable number of devices.",
        },
        {
          id: "r3",
          text: "Restrict mode drops violating traffic and sends SNMP/syslog alerts but keeps the port up. This is better for shared spaces where you want visibility without disruption.",
        },
      ],
      feedback: {
        perfect:
          "Well done! Sticky learning with 3 MACs and restrict mode balances security with usability for a shared conference room.",
        partial:
          "Close, but check the maximum MAC count and violation mode. Conference rooms need flexibility while still maintaining security.",
        wrong:
          "Sticky MAC learning dynamically learns and persists MACs. Combine it with an appropriate max count and restrict mode for shared spaces.",
      },
    },
    {
      type: "toggle-config",
      id: "errdisable-recovery",
      title: "Configure Err-Disable Recovery",
      description:
        "Multiple ports have been err-disabled due to port security violations. Configure automatic err-disable recovery so ports automatically re-enable after 300 seconds.",
      targetSystem: "Switch1 (Cisco 2960)",
      items: [
        {
          id: "errdisable-cause",
          label: "Err-Disable Recovery for Port Security",
          detail: "show errdisable recovery — psecure-violation: Disabled",
          currentState: "disabled",
          correctState: "enabled",
          states: ["disabled", "enabled"],
          rationaleId: "r1",
        },
        {
          id: "recovery-interval",
          label: "Recovery Timer (seconds)",
          detail: "show errdisable recovery — Timer: 300 (default)",
          currentState: "300",
          correctState: "300",
          states: ["30", "120", "300", "600"],
          rationaleId: "r2",
        },
        {
          id: "fa01-status",
          label: "Fa0/1 Port Status",
          detail: "show int status — Fa0/1: err-disabled",
          currentState: "err-disabled",
          correctState: "connected",
          states: ["err-disabled", "connected", "not-connect"],
          rationaleId: "r3",
        },
      ],
      rationales: [
        {
          id: "r1",
          text: "Enable with 'errdisable recovery cause psecure-violation'. This lets the switch automatically try to re-enable ports that were shut down by port security violations.",
        },
        {
          id: "r2",
          text: "The default 300-second (5-minute) interval gives enough time for the violation condition to clear while not leaving ports down excessively long.",
        },
        {
          id: "r3",
          text: "Currently err-disabled ports need 'shutdown' then 'no shutdown' manually. After enabling recovery, the switch will automatically attempt to bring them back up.",
        },
      ],
      feedback: {
        perfect:
          "Port security err-disable recovery is now configured. Ports will automatically attempt to re-enable after 300 seconds, reducing manual intervention.",
        partial:
          "You have the right idea but check the recovery timer. 300 seconds is the standard default that balances availability with security.",
        wrong:
          "Err-disable recovery automatically re-enables ports after a timer expires. Use 'errdisable recovery cause psecure-violation' and set the interval.",
      },
    },
  ],
  hints: [
    "Port security requires 'switchport mode access' or 'switchport mode trunk' before it can be enabled.",
    "Sticky MAC learning dynamically adds learned MACs to the running config. Save the config to make them persistent across reboots.",
    "Err-disable recovery with 'errdisable recovery cause psecure-violation' auto-recovers ports after the configured interval.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "Port security is a fundamental Layer 2 security control. Combined with 802.1X, it forms the first line of defense against unauthorized network access.",
  toolRelevance: [
    "Cisco IOS CLI",
    "SNMP monitoring",
    "Syslog servers",
    "NAC solutions",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
