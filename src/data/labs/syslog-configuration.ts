import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "syslog-configuration",
  version: 1,
  title: "Syslog Collection Strategy",
  tier: "beginner",
  track: "network-services",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["syslog", "logging", "severity-levels", "centralized-logging"],
  description:
    "Design a syslog collection strategy including severity levels, transport protocols, and centralized log management for network devices.",
  estimatedMinutes: 8,
  learningObjectives: [
    "Configure syslog severity levels and facility codes for network devices",
    "Choose appropriate syslog transport protocols for reliability and security",
    "Design a centralized logging architecture for incident response",
  ],
  sortOrder: 504,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "syslog-001",
      title: "Syslog Severity Level Selection",
      context:
        "The SOC team complains that the centralized syslog server is overwhelmed with debug messages from network devices, making it difficult to find critical alerts. The current configuration sends all severity levels:\n\nRouter# show logging\nSyslog logging: enabled\n  Console logging: level debugging, 45231 messages logged\n  Monitor logging: level debugging, 0 messages logged\n  Trap logging: level debugging, 892341 messages logged\n    Logging to 10.0.5.20 (udp port 514)\n\nThe server receives approximately 50,000 messages per hour. The SOC only needs warnings and above for real-time alerting.",
      displayFields: [
        { label: "Current Level", value: "debugging (level 7)", emphasis: "warn" },
        { label: "Messages/Hour", value: "~50,000", emphasis: "critical" },
        { label: "Transport", value: "UDP 514", emphasis: "normal" },
      ],
      actions: [
        { id: "a1", label: "Set trap logging to severity 4 (warnings)", color: "green" },
        { id: "a2", label: "Set trap logging to severity 3 (errors)", color: "blue" },
        { id: "a3", label: "Set trap logging to severity 6 (informational)", color: "yellow" },
        { id: "a4", label: "Disable trap logging entirely to reduce load", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "Severity level 4 (warnings) captures all messages at warning level and above: emergencies (0), alerts (1), critical (2), errors (3), and warnings (4). This matches the SOC requirement for real-time alerting while eliminating notices, informational, and debug messages that create noise.",
        },
        {
          id: "r2",
          text: "Setting to severity 3 (errors) would miss warning-level messages that often indicate developing problems before they become errors. The SOC specifically requested warnings and above.",
        },
        {
          id: "r3",
          text: "Disabling logging entirely would eliminate the SOC's visibility into network events, preventing detection of security incidents and hardware failures.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Severity 4 (warnings) captures warnings, errors, critical, alerts, and emergencies while filtering out the high-volume debug and informational messages overwhelming the server.",
        partial:
          "Close, but remember the syslog severity scale: lower numbers are more severe. The SOC needs warnings (4) and above, which means severities 0 through 4.",
        wrong:
          "The correct level is 4 (warnings). Syslog severity levels are: 0=emergency, 1=alert, 2=critical, 3=error, 4=warning, 5=notice, 6=informational, 7=debug. Setting trap level to 4 captures 0-4.",
      },
    },
    {
      type: "action-rationale",
      id: "syslog-002",
      title: "Syslog Transport Protocol Selection",
      context:
        "During a recent security incident, the investigation team discovered that several critical syslog messages were lost because the network was congested when the incident occurred. The current configuration uses UDP for syslog transport.\n\nThe compliance team requires that all security-relevant logs must be reliably delivered and that log integrity must be verifiable. The syslog server supports both TCP (port 1468) and TLS (port 6514).\n\n$ netstat -an | grep -E '(514|1468|6514)'\nudp  0.0.0.0:514     0.0.0.0:*\ntcp  0.0.0.0:1468    0.0.0.0:*    LISTEN\ntcp  0.0.0.0:6514    0.0.0.0:*    LISTEN",
      displayFields: [
        { label: "Current Transport", value: "UDP 514 (unreliable)", emphasis: "critical" },
        { label: "Compliance Req", value: "Reliable + integrity", emphasis: "warn" },
        { label: "Available", value: "UDP/TCP/TLS", emphasis: "normal" },
      ],
      actions: [
        { id: "a1", label: "Switch to TCP syslog on port 1468", color: "blue" },
        { id: "a2", label: "Switch to TLS syslog on port 6514", color: "green" },
        { id: "a3", label: "Keep UDP and increase buffer sizes", color: "yellow" },
        { id: "a4", label: "Use UDP with application-level acknowledgments", color: "orange" },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "TLS syslog (RFC 5425) on port 6514 provides both reliable delivery through TCP and message integrity verification through TLS encryption and certificate validation. This satisfies both compliance requirements: reliable delivery and verifiable log integrity.",
        },
        {
          id: "r2",
          text: "TCP syslog provides reliable delivery but does not address the integrity requirement. Without TLS, syslog messages could be modified in transit by an attacker without detection.",
        },
        {
          id: "r3",
          text: "Increasing UDP buffer sizes reduces the chance of packet loss but cannot guarantee delivery. UDP is fundamentally unreliable and provides no integrity verification mechanism.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! TLS syslog on port 6514 provides reliable TCP delivery, encryption for confidentiality, and TLS certificate verification for message integrity, meeting all compliance requirements.",
        partial:
          "TCP improves reliability, but the compliance requirement also specifies log integrity verification. Only TLS syslog (port 6514) satisfies both reliable delivery and integrity requirements.",
        wrong:
          "UDP cannot guarantee delivery during network congestion. TLS syslog (port 6514) is the correct choice because it provides TCP reliability, encryption, and integrity verification per the compliance requirements.",
      },
    },
    {
      type: "action-rationale",
      id: "syslog-003",
      title: "Log Source Identification Configuration",
      context:
        "The SIEM team reports that syslog messages from multiple routers are arriving with the wrong source IP because the routers use their outgoing interface IP rather than a consistent loopback address. This makes log correlation difficult.\n\nRouter-A# show logging\nTrap logging: level warnings, 1234 messages logged\n  Logging to 10.0.5.20\n\nRouter-A# show ip interface brief\nInterface        IP-Address   Status  Protocol\nLoopback0        10.255.0.1   up      up\nGig0/0           10.1.1.1     up      up\nGig0/1           10.2.2.1     up      up\n\nMessages sometimes arrive from 10.1.1.1 and sometimes from 10.2.2.1 depending on the routing path to the syslog server.",
      displayFields: [
        { label: "Loopback0", value: "10.255.0.1 (stable)", emphasis: "normal" },
        { label: "Current Source", value: "Varies by egress interface", emphasis: "warn" },
      ],
      actions: [
        { id: "a1", label: "Set logging source-interface Loopback0", color: "green" },
        { id: "a2", label: "Add all interface IPs to the SIEM device list", color: "blue" },
        { id: "a3", label: "Use hostname instead of IP for identification", color: "yellow" },
        { id: "a4", label: "Configure static routes for syslog traffic", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "Setting 'logging source-interface Loopback0' forces all syslog messages to use the Loopback0 IP (10.255.0.1) as the source address regardless of the egress interface. Loopback interfaces are always up and provide a stable, consistent identity for SIEM correlation.",
        },
        {
          id: "r2",
          text: "Adding all interface IPs to the SIEM is a workaround that does not scale and must be updated every time an interface is added or changed. The logging source-interface command is the standard solution.",
        },
        {
          id: "r3",
          text: "Using hostname identification depends on DNS availability and adds latency to log processing. Source interface binding provides immediate, reliable identification without DNS dependency.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! 'logging source-interface Loopback0' ensures all syslog packets use a stable, predictable source IP. This is a best practice for any network device sending logs to a SIEM.",
        partial:
          "The loopback interface provides a stable IP address, but the key is the 'logging source-interface' command that binds syslog messages to that specific interface regardless of routing path.",
        wrong:
          "The 'logging source-interface Loopback0' command is the standard solution. It forces all syslog traffic to use the loopback IP as the source, providing consistent identification for SIEM correlation.",
      },
    },
  ],
  hints: [
    "Syslog severity levels range from 0 (emergency) to 7 (debug). Setting the trap level captures all messages at that level and above (lower numbers).",
    "TLS syslog on port 6514 provides both reliable delivery (TCP) and message integrity (TLS), unlike plain UDP or TCP syslog.",
    "Use 'logging source-interface Loopback0' to ensure syslog messages always originate from a stable, predictable IP address for SIEM correlation.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Centralized logging is a cornerstone of both network operations and security incident response. Professionals who can design robust syslog architectures are invaluable during outages and breach investigations.",
  toolRelevance: [
    "rsyslog",
    "syslog-ng",
    "show logging",
    "logging source-interface",
    "Splunk",
    "ELK Stack",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
