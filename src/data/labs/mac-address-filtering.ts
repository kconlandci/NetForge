import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "mac-address-filtering",
  version: 1,
  title: "MAC Address Filtering",
  tier: "beginner",
  track: "network-fundamentals",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["mac-address", "port-security", "switch", "layer-2-security"],
  description:
    "Configure MAC address filters on a switch to control which devices can access the network through specific ports.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Configure port security with specific MAC address allowlists",
    "Set appropriate violation actions for unauthorized MAC addresses",
    "Troubleshoot port security lockouts and sticky MAC issues",
  ],
  sortOrder: 111,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "maf-001",
      title: "Secure Access for Server Room Ports",
      description:
        "The server room switch has 4 ports that should only allow specific servers to connect. Configure port security settings to enforce this policy. Currently the ports have no security configured.",
      targetSystem: "Server Room Switch (SW-SRV-01)",
      items: [
        {
          id: "item1",
          label: "Port Security State",
          detail: "Port security must be enabled to enforce MAC filtering",
          currentState: "disabled",
          correctState: "enabled",
          states: ["disabled", "enabled"],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "Maximum MAC Addresses per Port",
          detail: "Each server port should only accept one device",
          currentState: "unlimited",
          correctState: "1",
          states: ["unlimited", "1", "3", "10"],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "Violation Action",
          detail: "What happens when an unauthorized device connects",
          currentState: "protect",
          correctState: "shutdown",
          states: ["protect", "restrict", "shutdown"],
          rationaleId: "rat3",
        },
        {
          id: "item4",
          label: "MAC Learning Mode",
          detail: "How the switch learns allowed MAC addresses",
          currentState: "dynamic",
          correctState: "sticky",
          states: ["dynamic", "sticky", "static-only"],
          rationaleId: "rat4",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "Port security must be explicitly enabled. Without it, any device can connect to any port regardless of other settings.",
        },
        {
          id: "rat2",
          text: "Each server port should accept exactly 1 MAC address. Setting the maximum to 1 ensures only the designated server can use that port.",
        },
        {
          id: "rat3",
          text: "Shutdown mode disables the port entirely when a violation occurs, providing the strongest protection for server room ports. It requires manual re-enablement, ensuring administrators are aware of unauthorized access attempts.",
        },
        {
          id: "rat4",
          text: "Sticky learning automatically captures the first MAC address and saves it to the running configuration. This simplifies deployment - plug in the server, and its MAC is automatically secured.",
        },
      ],
      feedback: {
        perfect:
          "Port security is properly configured. The server ports will lock to their connected servers and shutdown if an unauthorized device attempts to connect.",
        partial:
          "Some settings need adjustment. For server room security, you need port security enabled, max MAC of 1, shutdown violation action, and sticky learning.",
        wrong:
          "The server room ports are not properly secured. Enable port security, limit to 1 MAC per port, set shutdown as the violation action, and use sticky MAC learning.",
      },
    },
    {
      type: "toggle-config",
      id: "maf-002",
      title: "Conference Room Port Security",
      description:
        "Conference room ports need to allow visitors to connect but limit the number of devices and log violations without disrupting access. The current config is too restrictive, causing ports to shut down when visitors plug in.",
      targetSystem: "Conference Room Switch (SW-CONF-01)",
      items: [
        {
          id: "item1",
          label: "Maximum MAC Addresses per Port",
          detail: "Conference rooms may have up to 3 devices (laptop, phone, presentation device)",
          currentState: "1",
          correctState: "3",
          states: ["1", "3", "5", "unlimited"],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "Violation Action",
          detail: "Conference rooms should log violations but not disrupt connectivity",
          currentState: "shutdown",
          correctState: "restrict",
          states: ["protect", "restrict", "shutdown"],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "Aging Time",
          detail: "MAC addresses should age out since different visitors use the room daily",
          currentState: "0 (never age)",
          correctState: "60 minutes",
          states: ["0 (never age)", "15 minutes", "60 minutes", "480 minutes"],
          rationaleId: "rat3",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "Conference rooms need to support multiple devices per port: a laptop, phone, and presentation device. Limiting to 1 causes shutdowns when a second device connects.",
        },
        {
          id: "rat2",
          text: "Restrict mode drops traffic from unauthorized MACs and generates a log entry, but keeps the port operational. This provides visibility without disrupting conference room use. Protect mode drops silently without logging.",
        },
        {
          id: "rat3",
          text: "An aging time of 60 minutes allows MAC entries to expire between meetings, freeing slots for the next visitor's devices without manual intervention.",
        },
      ],
      feedback: {
        perfect:
          "The conference room ports now support up to 3 devices, log violations without shutting down, and automatically clear MAC entries between meetings.",
        partial:
          "Some settings improved but the balance between security and usability needs fine-tuning. Conference rooms need more MAC slots and less aggressive violation actions.",
        wrong:
          "The current config is too restrictive for conference rooms. Increase the MAC limit to 3, use restrict (not shutdown) for violations, and set a reasonable aging time.",
      },
    },
    {
      type: "toggle-config",
      id: "maf-003",
      title: "Recovering From Port Security Violation",
      description:
        "Several switch ports are in err-disabled state after port security violations. An unauthorized hub was connected to a server port, triggering the security policy. Fix the configuration to recover and prevent recurrence.",
      targetSystem: "Access Switch (SW-ACC-03)",
      items: [
        {
          id: "item1",
          label: "Port Gi0/5 State (err-disabled)",
          detail: "This port was disabled by a security violation. It needs to be re-enabled after removing the hub.",
          currentState: "err-disabled",
          correctState: "no shutdown",
          states: ["err-disabled", "no shutdown", "shutdown"],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "Errdisable Recovery for Port Security",
          detail: "Configure automatic recovery from port security violations",
          currentState: "disabled",
          correctState: "enabled (300 seconds)",
          states: ["disabled", "enabled (30 seconds)", "enabled (300 seconds)", "enabled (3600 seconds)"],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "Port Gi0/5 Secure MAC Entry",
          detail: "The hub's MAC address was learned. Clear it so the correct server can reconnect.",
          currentState: "AA:BB:CC:DD:EE:FF (hub MAC)",
          correctState: "cleared (allow re-learning)",
          states: ["AA:BB:CC:DD:EE:FF (hub MAC)", "cleared (allow re-learning)", "manually set server MAC"],
          rationaleId: "rat3",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "After removing the unauthorized hub, the port must be manually re-enabled. An err-disabled port does not recover automatically unless errdisable recovery is configured.",
        },
        {
          id: "rat2",
          text: "Errdisable recovery at 300 seconds (5 minutes) automatically re-enables ports after a violation. This reduces manual intervention while giving enough time for the unauthorized device to be physically removed.",
        },
        {
          id: "rat3",
          text: "The hub's MAC address was learned as the sticky/secure MAC. It must be cleared so the legitimate server's MAC can be learned when the port comes back up.",
        },
      ],
      feedback: {
        perfect:
          "The port is recovered, the stale MAC is cleared, and auto-recovery is configured. The server can now reconnect and the port will self-heal from future violations.",
        partial:
          "Some recovery steps are correct but all three are needed: re-enable the port, configure errdisable recovery, and clear the learned hub MAC address.",
        wrong:
          "Recovery requires three steps: bring the port out of err-disabled, configure automatic recovery, and clear the unauthorized MAC so the legitimate device can reconnect.",
      },
    },
  ],
  hints: [
    "Port security violation actions: protect (drop silently), restrict (drop and log), shutdown (disable port). Choose based on the environment's security vs availability needs.",
    "Sticky MAC learning auto-saves learned MACs to the config. Use it for permanent devices like servers. Use aging for transient environments like conference rooms.",
    "Err-disabled ports require two steps: clear the cause of the violation, then re-enable the port. Configuring errdisable recovery automates the second step.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Port security is a fundamental Layer 2 security control tested in CCNA Security and evaluated in every enterprise network audit. Understanding its modes prevents both security gaps and unnecessary outages.",
  toolRelevance: [
    "show port-security",
    "show port-security interface",
    "switchport port-security",
    "show errdisable recovery",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
