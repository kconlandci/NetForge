import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "snmp-monitoring-setup",
  version: 1,
  title: "SNMP Monitoring Setup",
  tier: "beginner",
  track: "network-services",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["snmp", "monitoring", "community-strings", "traps", "v3"],
  description:
    "Set up SNMP for network monitoring including community strings, trap destinations, and SNMPv3 security configurations.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Configure SNMPv2c community strings with appropriate access levels",
    "Set up SNMP trap and inform destinations for proactive monitoring",
    "Implement SNMPv3 with authentication and encryption for secure monitoring",
  ],
  sortOrder: 503,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "snmp-001",
      title: "Basic SNMP Community String Hardening",
      description:
        "A security audit found default SNMP community strings on production switches. The monitoring system (10.0.5.10) needs read-only access for polling, but the current configuration uses the default 'public' community with no ACL restrictions.\n\nSwitch# show snmp community\nCommunity name: public\nCommunity access: read-only\nCommunity ACL: none\n\nCommunity name: private\nCommunity access: read-write\nCommunity ACL: none\n\nSwitch# show snmp host\nNo SNMP trap hosts configured",
      targetSystem: "Cisco IOS Switch",
      items: [
        {
          id: "item-1",
          label: "Read-Only Community String",
          detail: "Community string used by the monitoring system",
          currentState: "public (default)",
          correctState: "Custom string with ACL restriction",
          states: [
            "public (default)",
            "Custom string with ACL restriction",
            "public with ACL restriction",
            "Disabled",
          ],
          rationaleId: "rat-1",
        },
        {
          id: "item-2",
          label: "Read-Write Community String",
          detail: "Community string for SNMP write access",
          currentState: "private (default)",
          correctState: "Removed (disabled)",
          states: [
            "private (default)",
            "Removed (disabled)",
            "Custom string no ACL",
            "private with ACL",
          ],
          rationaleId: "rat-2",
        },
        {
          id: "item-3",
          label: "SNMP Trap Destination",
          detail: "Where SNMP traps are sent for event notification",
          currentState: "Not configured",
          correctState: "10.0.5.10 (monitoring server)",
          states: [
            "Not configured",
            "10.0.5.10 (monitoring server)",
            "255.255.255.255 (broadcast)",
            "10.0.5.0 (subnet)",
          ],
          rationaleId: "rat-3",
        },
      ],
      rationales: [
        {
          id: "rat-1",
          text: "Default community strings like 'public' are the first thing attackers try. A custom community string combined with an ACL that only permits the monitoring server's IP (10.0.5.10) provides two layers of access control.",
        },
        {
          id: "rat-2",
          text: "The read-write community string allows remote configuration changes via SNMP SET operations. Unless specifically required for automation, RW access should be disabled entirely to prevent unauthorized modifications.",
        },
        {
          id: "rat-3",
          text: "SNMP traps provide proactive notifications of events like interface status changes, high CPU, or authentication failures. The trap destination should be the monitoring server at 10.0.5.10.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! You hardened SNMP by replacing the default community string, removing dangerous read-write access, and configuring trap delivery to the monitoring server.",
        partial:
          "Some SNMP settings need further hardening. Ensure default communities are replaced, RW access is removed unless required, and traps are configured for the monitoring server.",
        wrong:
          "Default SNMP communities are a critical security risk. Replace 'public' with a custom ACL-restricted string, remove 'private' RW access, and configure traps to 10.0.5.10.",
      },
    },
    {
      type: "toggle-config",
      id: "snmp-002",
      title: "SNMPv3 Migration",
      description:
        "The organization is migrating from SNMPv2c to SNMPv3 for encrypted monitoring. The SNMPv3 user needs authentication (SHA) and encryption (AES-128). The monitoring platform at 10.0.5.10 has been updated to support SNMPv3.\n\nSwitch# show snmp user\nUser name: admin_monitor\nEngine ID: 800000090300AABBCCDDEEFF\nAuth protocol: none\nPriv protocol: none\nGroup name: MONITOR-GROUP\n\nSwitch# show snmp group MONITOR-GROUP\ngroupname: MONITOR-GROUP\nsecurity model: v3\nsecurity level: noAuthNoPriv\nread view: v1default\nwrite view: none",
      targetSystem: "Cisco IOS SNMPv3 Configuration",
      items: [
        {
          id: "item-1",
          label: "Security Level",
          detail: "SNMPv3 authentication and privacy settings",
          currentState: "noAuthNoPriv",
          correctState: "authPriv (auth + encryption)",
          states: [
            "noAuthNoPriv",
            "authNoPriv (auth only)",
            "authPriv (auth + encryption)",
          ],
          rationaleId: "rat-1",
        },
        {
          id: "item-2",
          label: "Authentication Protocol",
          detail: "Hash algorithm for SNMPv3 message authentication",
          currentState: "none",
          correctState: "SHA",
          states: ["none", "MD5", "SHA", "SHA-256"],
          rationaleId: "rat-2",
        },
        {
          id: "item-3",
          label: "Privacy Protocol",
          detail: "Encryption algorithm for SNMPv3 payload",
          currentState: "none",
          correctState: "AES-128",
          states: ["none", "DES", "AES-128", "3DES"],
          rationaleId: "rat-3",
        },
      ],
      rationales: [
        {
          id: "rat-1",
          text: "The authPriv security level provides both authentication (verifying the message sender) and privacy (encrypting the payload). noAuthNoPriv sends SNMP data in cleartext with no identity verification, which is equivalent to SNMPv1 security.",
        },
        {
          id: "rat-2",
          text: "SHA provides stronger authentication than MD5, which has known collision vulnerabilities. SHA ensures message integrity and authenticates the monitoring system, preventing spoofed SNMP operations.",
        },
        {
          id: "rat-3",
          text: "AES-128 encrypts the SNMP payload, preventing eavesdroppers from reading sensitive network information like interface statistics, routing tables, and configuration data. DES is deprecated due to its 56-bit key length.",
        },
      ],
      feedback: {
        perfect:
          "Perfect! You configured SNMPv3 with authPriv using SHA authentication and AES-128 encryption, providing both identity verification and payload confidentiality.",
        partial:
          "The SNMPv3 configuration needs all three components: authPriv security level, SHA authentication, and AES-128 encryption. Partial configurations leave security gaps.",
        wrong:
          "SNMPv3 migration requires upgrading from noAuthNoPriv to authPriv with SHA authentication and AES-128 encryption. The current configuration provides no security benefit over SNMPv2c.",
      },
    },
    {
      type: "toggle-config",
      id: "snmp-003",
      title: "SNMP View and Access Control",
      description:
        "The monitoring team needs to poll interface statistics and CPU utilization but should not have access to the SNMP configuration OID tree or the ability to read community strings. You need to create a restricted SNMP view.\n\nSwitch# show snmp view\nv1default  1.3.6.1  -  included\nv1default  1.3.6.1.6.3.15  -  excluded\nv1default  1.3.6.1.6.3.16  -  excluded\nv1default  1.3.6.1.6.3.18  -  excluded\n\nThe OID tree reference:\n1.3.6.1.2.1.2  = IF-MIB (interfaces)\n1.3.6.1.4.1.9.9.109 = CISCO-PROCESS-MIB (CPU)\n1.3.6.1.6.3 = SNMP configuration MIBs",
      targetSystem: "Cisco IOS SNMP Views",
      items: [
        {
          id: "item-1",
          label: "SNMP View Scope",
          detail: "OID tree included in the monitoring view",
          currentState: "All OIDs (1.3.6.1)",
          correctState: "IF-MIB + CISCO-PROCESS-MIB only",
          states: [
            "All OIDs (1.3.6.1)",
            "IF-MIB + CISCO-PROCESS-MIB only",
            "IF-MIB only",
            "Entire iso tree (1)",
          ],
          rationaleId: "rat-1",
        },
        {
          id: "item-2",
          label: "SNMP Config MIBs Access",
          detail: "Access to SNMP engine configuration OIDs",
          currentState: "Partially excluded",
          correctState: "Fully excluded (1.3.6.1.6.3)",
          states: [
            "Partially excluded",
            "Fully excluded (1.3.6.1.6.3)",
            "Included",
            "Not applicable",
          ],
          rationaleId: "rat-2",
        },
        {
          id: "item-3",
          label: "Write View Assignment",
          detail: "Write access view for the monitoring group",
          currentState: "none",
          correctState: "none",
          states: ["none", "Same as read view", "v1default", "Full access"],
          rationaleId: "rat-3",
        },
      ],
      rationales: [
        {
          id: "rat-1",
          text: "A least-privilege SNMP view should include only the specific OID trees needed: IF-MIB (1.3.6.1.2.1.2) for interface statistics and CISCO-PROCESS-MIB (1.3.6.1.4.1.9.9.109) for CPU data. Including the entire OID tree exposes unnecessary information.",
        },
        {
          id: "rat-2",
          text: "The SNMP configuration MIBs under 1.3.6.1.6.3 contain sensitive data including community strings and user credentials. These must be fully excluded from any monitoring view to prevent credential exposure.",
        },
        {
          id: "rat-3",
          text: "The monitoring group should have no write view assigned (none). Write access would allow the monitoring system to modify device configuration via SNMP SET operations, violating the principle of least privilege.",
        },
      ],
      feedback: {
        perfect:
          "Well done! You restricted the view to only the required MIBs, fully excluded SNMP config OIDs, and maintained no write access. This follows the principle of least privilege.",
        partial:
          "The view needs further restriction. Include only IF-MIB and CISCO-PROCESS-MIB OID trees, exclude all SNMP configuration MIBs, and ensure no write view is assigned.",
        wrong:
          "An overly broad SNMP view exposes sensitive data. Restrict the view to specific OID trees (interfaces and CPU), exclude configuration MIBs entirely, and never grant write access to monitoring tools.",
      },
    },
  ],
  hints: [
    "Default SNMP community strings (public/private) should always be replaced and restricted by ACL in production environments.",
    "SNMPv3 authPriv provides both authentication and encryption. SHA is preferred over MD5, and AES-128 replaces the deprecated DES.",
    "SNMP views should follow least-privilege by including only the specific OID trees needed for monitoring, excluding configuration MIBs.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "SNMP is the foundation of network monitoring in enterprise environments. Understanding SNMPv3 security, MIB structures, and view-based access control is essential for network operations and security compliance.",
  toolRelevance: [
    "snmpwalk",
    "snmpget",
    "show snmp community",
    "show snmp user",
    "show snmp group",
    "Nagios/Zabbix/PRTG",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
