import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "nac-policy-decisions",
  version: 1,
  title: "Set Network Access Control Policies",
  tier: "beginner",
  track: "network-security",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["nac", "802.1x", "posture", "compliance", "access-control"],
  description:
    "Design network access control policies that determine device admission decisions based on user identity, device posture, and compliance status using 802.1X and NAC frameworks.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Design NAC policies that combine user identity and device posture for admission decisions",
    "Select appropriate access levels (full, limited, quarantine, deny) based on device compliance",
    "Apply the principle of least privilege to network access control decisions",
  ],
  sortOrder: 403,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "nac-byod-policy",
      title: "BYOD Device Access Decision",
      context:
        "An employee connects a personal laptop (BYOD) to the corporate network. The device passes 802.1X authentication with valid credentials but fails the posture check: antivirus is outdated and the OS has 3 critical patches missing.",
      displayFields: [
        { label: "User", value: "jsmith (Engineering, valid AD credentials)" },
        { label: "Device", value: "Personal MacBook Pro (not domain-joined)" },
        { label: "Authentication", value: "802.1X PASSED (EAP-PEAP)" },
        { label: "Posture", value: "FAILED (AV outdated, 3 critical patches missing)", emphasis: "warn" },
      ],
      logEntry:
        "Cisco ISE Posture Assessment:\n  Antivirus: Outdated (last updated 45 days ago)\n  OS Patches: 3 critical updates missing\n  Firewall: Enabled\n  Disk Encryption: Not detected\n  Domain Join: No (personal device)\n\nPolicy options:\n  Full Access: Corporate VLAN (unrestricted)\n  Limited Access: Internet-only VLAN\n  Quarantine: Remediation VLAN (update portal)\n  Deny: Block network access entirely",
      actions: [
        { id: "act-quarantine", label: "Place on quarantine VLAN with access to remediation portal for patching" },
        { id: "act-full", label: "Grant full corporate network access (user authenticated successfully)" },
        { id: "act-deny", label: "Deny all network access until device is manually remediated" },
        { id: "act-internet", label: "Grant internet-only access on a limited VLAN" },
      ],
      correctActionId: "act-quarantine",
      rationales: [
        {
          id: "rat-quarantine",
          text: "Quarantine provides access to the remediation portal where the employee can update antivirus and install patches. Once compliant, the device is automatically reassessed and upgraded to the appropriate access level.",
        },
        {
          id: "rat-full-risky",
          text: "Full access for a non-compliant device with outdated AV and missing patches exposes the corporate network to malware and known vulnerabilities.",
        },
        {
          id: "rat-deny-harsh",
          text: "Denying access entirely blocks the employee from self-remediating. Quarantine allows self-service patching without IT intervention.",
        },
      ],
      correctRationaleId: "rat-quarantine",
      feedback: {
        perfect:
          "Correct! Quarantine allows self-service remediation via the portal. The device updates, gets reassessed, and is granted appropriate access automatically.",
        partial:
          "Right to restrict access, but quarantine with remediation access is preferred over complete denial -- it enables self-service compliance.",
        wrong:
          "A device with failed posture should never get full access. Quarantine with a remediation portal allows the user to fix compliance issues and regain access.",
      },
    },
    {
      type: "action-rationale",
      id: "nac-unknown-device",
      title: "Unknown Device on Network",
      context:
        "A device connects to a switch port in a conference room. It does not respond to 802.1X authentication requests (no supplicant) and MAC authentication bypass (MAB) finds it is not in the approved device list.",
      displayFields: [
        { label: "Device MAC", value: "aa:bb:cc:dd:ee:ff" },
        { label: "802.1X", value: "TIMEOUT (no supplicant response)" },
        { label: "MAB Lookup", value: "NOT FOUND in approved MAC database" },
        { label: "Switch Port", value: "Gi1/0/15 (Conference Room B)" },
      ],
      logEntry:
        "ISE Authentication Flow:\n  1. 802.1X: EAP-Request/Identity sent 3x, no response (timeout)\n  2. MAB: MAC aa:bb:cc:dd:ee:ff looked up - NOT FOUND\n  3. Guest VLAN fallback: Available (VLAN 50)\n  4. Auth-fail VLAN: Available (VLAN 999, restricted)\n\nDevice could be: guest laptop, printer, IP phone, or rogue device",
      actions: [
        { id: "act-guest-vlan", label: "Assign to guest VLAN with captive portal for visitor self-registration" },
        { id: "act-full-access", label: "Allow full network access since it is in a conference room" },
        { id: "act-block", label: "Block the port entirely -- no access for unknown devices" },
        { id: "act-auth-fail", label: "Assign to auth-fail VLAN with no network access and alert IT" },
      ],
      correctActionId: "act-guest-vlan",
      rationales: [
        {
          id: "rat-guest",
          text: "Conference room ports commonly serve visitor devices. Assigning to the guest VLAN with a captive portal allows legitimate guests to self-register while keeping them isolated from corporate resources.",
        },
        {
          id: "rat-block-harsh",
          text: "Blocking the port entirely prevents legitimate guest use of conference room network drops. The guest VLAN provides controlled access without corporate exposure.",
        },
        {
          id: "rat-full-risky",
          text: "Full access for an unknown, unauthenticated device is a critical security risk regardless of physical location.",
        },
      ],
      correctRationaleId: "rat-guest",
      feedback: {
        perfect:
          "Correct! Guest VLAN with captive portal is the standard fallback for unknown devices in shared spaces. It provides network access while maintaining corporate isolation.",
        partial:
          "Good security instinct, but conference rooms need to support visitors. Guest VLAN with captive portal balances access and security.",
        wrong:
          "Unknown devices should not get full access, but blocking them in conference rooms frustrates visitors. Guest VLAN with captive portal is the standard NAC fallback.",
      },
    },
    {
      type: "action-rationale",
      id: "nac-compromised-device",
      title: "Compromised Device Detection",
      context:
        "A fully authenticated corporate laptop is flagged by the endpoint detection system (EDR) as running a known malware process. The NAC system receives this alert and must take action.",
      displayFields: [
        { label: "User", value: "admin@corp.local (IT Administrator)" },
        { label: "Device", value: "Corporate Dell Latitude (domain-joined, compliant)" },
        { label: "802.1X Status", value: "Authenticated (full access)" },
        { label: "EDR Alert", value: "MALWARE DETECTED: Cobalt Strike beacon process", emphasis: "critical" },
      ],
      logEntry:
        "EDR -> ISE pxGrid Alert:\n  Threat: Cobalt Strike beacon (command-and-control implant)\n  Severity: CRITICAL\n  Process: svchost_update.exe (masquerading as system process)\n  Network activity: Beaconing to 185.100.87.42:443 every 60s\n  User: admin@corp.local (Domain Admin privileges!)\n\nThis is an active compromise with C2 communication.\nThe account has Domain Admin rights -- highest risk.",
      actions: [
        { id: "act-isolate", label: "Immediately isolate: move to quarantine VLAN and trigger CoA to reauthenticate" },
        { id: "act-monitor", label: "Monitor the traffic but maintain access for investigation" },
        { id: "act-notify", label: "Send an email to the user asking them to run a scan" },
        { id: "act-block-c2", label: "Block the C2 IP address at the firewall only" },
      ],
      correctActionId: "act-isolate",
      rationales: [
        {
          id: "rat-isolate",
          text: "A Cobalt Strike beacon on a Domain Admin workstation is a critical incident requiring immediate isolation. CoA (Change of Authorization) moves the device to quarantine, cutting C2 communication and preventing lateral movement.",
        },
        {
          id: "rat-monitor-risky",
          text: "Maintaining access for a compromised Domain Admin device allows the attacker to move laterally, escalate privileges, and exfiltrate data. Isolation must be immediate.",
        },
        {
          id: "rat-block-c2-insufficient",
          text: "Blocking one C2 IP is insufficient. Cobalt Strike supports multiple C2 channels and the attacker can pivot to alternate servers. Network isolation is the only reliable containment.",
        },
      ],
      correctRationaleId: "rat-isolate",
      feedback: {
        perfect:
          "Correct! Cobalt Strike on a Domain Admin device is a critical incident. Immediate network isolation via CoA prevents lateral movement and cuts C2 communication.",
        partial:
          "Right to act immediately, but full network isolation (not just C2 blocking) is required. The attacker may have multiple communication channels.",
        wrong:
          "An active C2 implant on a Domain Admin workstation is the highest-severity incident. Immediate quarantine via CoA is the only acceptable response -- delays allow lateral movement.",
      },
    },
  ],
  hints: [
    "NAC quarantine VLANs allow self-service remediation. Devices update their posture and are automatically reassessed without IT intervention.",
    "Conference room ports should fall back to a guest VLAN with captive portal for unknown devices, not block access entirely.",
    "When EDR detects active malware on an authenticated device, NAC should immediately isolate via Change of Authorization (CoA) to quarantine the threat.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "NAC policy design combines networking and security knowledge. Cisco ISE and Aruba ClearPass administrators are in high demand as zero-trust architectures require granular access control.",
  toolRelevance: [
    "Cisco ISE / Aruba ClearPass",
    "Microsoft NPS (RADIUS)",
    "pxGrid / STIX/TAXII (threat sharing)",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
