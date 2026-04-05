import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "zero-trust-network-design",
  version: 1,
  title: "Design Zero Trust Network Architecture",
  tier: "advanced",
  track: "network-security",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["zero-trust", "microsegmentation", "identity", "continuous-verification", "sdp", "ztna"],
  description:
    "Design zero-trust network architecture decisions involving microsegmentation policies, identity-based access controls, and continuous verification mechanisms for enterprise environments.",
  estimatedMinutes: 25,
  learningObjectives: [
    "Evaluate network access decisions based on zero-trust principles of least privilege and continuous verification",
    "Design microsegmentation policies that enforce identity-based rather than network-based access controls",
    "Select appropriate zero-trust architecture components for given threat models and compliance requirements",
    "Analyze session trust signals to determine when to step up authentication or revoke access",
  ],
  sortOrder: 412,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "lateral-movement-prevention",
      title: "Microsegmentation Policy for Database Access",
      objective:
        "A developer workstation has been compromised via a phishing attack. The attacker has obtained the developer's credentials and is attempting to pivot from the development VLAN to production database servers. Review the current access telemetry and decide on the appropriate zero-trust enforcement action.",
      investigationData: [
        {
          id: "data-session-log",
          label: "Session Telemetry",
          content:
            "Policy Engine Session Log:\n  User: jchen@corp.example.com (Developer)\n  Device: WKSTN-DEV-0447\n  Source: 10.50.12.47 (Dev VLAN)\n  Auth Method: SSO (Okta) - Authenticated 6h ago\n  MFA: Last verified 6h ago at initial login\n  Device Posture: EDR agent reporting - LAST CHECK 45min ago\n  Trust Score: 62/100 (was 85 at login)\n\nAccess Attempt Log (last 15 minutes):\n  09:14:22 - SSH to 10.80.1.10 (prod-db-primary) - PENDING POLICY\n  09:14:18 - SSH to 10.80.1.11 (prod-db-replica) - PENDING POLICY\n  09:13:55 - RDP to 10.80.2.5 (prod-app-server-01) - PENDING POLICY\n  09:12:01 - DNS query: prod-db-primary.internal.example.com\n  09:11:44 - DNS query: prod-db-replica.internal.example.com\n  09:10:22 - Port scan detected: 10.80.1.0/24 (47 ports in 90 seconds)",
          isCritical: true,
        },
        {
          id: "data-normal-baseline",
          label: "User Baseline Behavior",
          content:
            "Normal Access Pattern for jchen@corp.example.com:\n  Typical hosts: git.example.com, jira.example.com, dev-db-01.example.com\n  Typical protocols: HTTPS (443), SSH (22) to dev servers only\n  Typical hours: 08:00-18:00 PST\n  Has NEVER accessed production database servers\n  Has NEVER accessed 10.80.0.0/16 subnet\n  Role: Junior Developer - no production access in RBAC policy\n  Last security training: 2026-01-15 (passed)\n\nDev team access policy:\n  - Dev VLAN -> Dev DB servers: ALLOW (SSH, port 3306)\n  - Dev VLAN -> Production: DENY (all protocols)\n  - Exception: Senior DevOps with approval ticket -> Production (SSH only, 2h window)",
        },
        {
          id: "data-edr-alert",
          label: "EDR Agent Alert",
          content:
            "CrowdStrike Falcon Alert - WKSTN-DEV-0447:\n  Severity: HIGH\n  Detection: Suspicious Process Chain\n  Details:\n    outlook.exe -> cmd.exe -> powershell.exe (encoded command)\n    PowerShell executing encoded Base64 payload\n    Cobalt Strike beacon indicators detected\n    C2 callback to 185.220.101.x (known threat infrastructure)\n    Credential dumping tool (Mimikatz) artifacts in memory\n  Timestamp: 09:08:44 UTC\n  Status: Isolated by EDR at 09:09:01 UTC (partial - network still active)",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "act-block-isolate",
          label: "Immediately revoke all sessions, quarantine device, and force re-authentication from a clean device",
          color: "red",
        },
        {
          id: "act-step-up-mfa",
          label: "Require step-up MFA before allowing the production access requests",
          color: "yellow",
        },
        {
          id: "act-allow-monitor",
          label: "Allow access with enhanced monitoring since the user is authenticated",
          color: "green",
        },
        {
          id: "act-block-prod-only",
          label: "Block production access but allow continued development environment access",
          color: "orange",
        },
      ],
      correctActionId: "act-block-isolate",
      rationales: [
        {
          id: "rat-full-revoke",
          text: "The EDR alert confirms active compromise: Cobalt Strike beacon, C2 callbacks, and Mimikatz credential dumping. Combined with anomalous behavior (port scanning production, accessing servers never accessed before), this is an active breach. Zero-trust mandates immediate session revocation and device quarantine. Step-up MFA is useless because the attacker has likely harvested credentials and session tokens.",
        },
        {
          id: "rat-mfa-insufficient",
          text: "Step-up MFA would be appropriate for low-confidence anomalies, but with confirmed malware (Cobalt Strike + Mimikatz), the attacker can intercept or relay MFA tokens. The device itself is compromised, so any authentication from it cannot be trusted.",
        },
        {
          id: "rat-monitor-wrong",
          text: "Allowing access with monitoring violates zero-trust fundamentals. With an active C2 beacon and credential dumping, monitoring provides evidence but does not prevent data exfiltration. The attacker could access and exfiltrate database contents within seconds.",
        },
        {
          id: "rat-partial-block-wrong",
          text: "Blocking only production access while allowing development access still lets the attacker pivot through development infrastructure, harvest more credentials, and potentially find alternative paths to production through CI/CD pipelines or shared service accounts.",
        },
      ],
      correctRationaleId: "rat-full-revoke",
      feedback: {
        perfect:
          "Correct. Active EDR indicators (Cobalt Strike, Mimikatz, C2 callbacks) combined with anomalous production access attempts demand immediate full session revocation and device quarantine. This is textbook zero-trust incident response.",
        partial:
          "You took defensive action, but with confirmed malware and active C2, partial measures are insufficient. The device is fully compromised - any authentication from it cannot be trusted, and the attacker has likely already dumped credentials.",
        wrong:
          "The EDR telemetry shows confirmed compromise: Cobalt Strike beacon, Mimikatz credential dumping, and active C2 callbacks. Combined with unprecedented production access attempts and port scanning, this requires immediate and complete session revocation.",
      },
    },
    {
      type: "investigate-decide",
      id: "sdp-architecture-selection",
      title: "Zero Trust Remote Access Architecture",
      objective:
        "The CISO has mandated replacing the legacy VPN with a zero-trust network access (ZTNA) solution. Three vendor architectures have been shortlisted. Review the requirements and telemetry from the VPN pilot to select the most appropriate architecture.",
      investigationData: [
        {
          id: "data-requirements",
          label: "Architecture Requirements",
          content:
            "Enterprise Requirements:\n  - 12,000 remote users across 30 countries\n  - 340 internal applications (mix of web, SSH, RDP, thick-client)\n  - Compliance: SOC 2 Type II, HIPAA (healthcare division), PCI DSS (payment apps)\n  - 15% of apps are legacy thick-client (non-HTTP) that cannot use reverse proxy\n  - Must support BYOD with device posture checks\n  - Current VPN pain points:\n    * Full tunnel exposes entire network to any authenticated user\n    * Split tunnel leaks DNS and causes compliance findings\n    * VPN concentrator is a single chokepoint (1.2 Gbps peak)\n    * No per-application access controls\n    * Average connection setup: 8-12 seconds\n  - Budget: $480K annual for 12,000 users",
        },
        {
          id: "data-option-a",
          label: "Option A: SDP with Client Agent",
          content:
            "Vendor A - Software Defined Perimeter (Agent-Based):\n  Architecture: Client agent -> SDP Controller -> SDP Gateway -> App\n  Model: Single-packet authorization (SPA), per-app micro-tunnels\n  Features:\n    - Device posture assessment via agent\n    - Per-application encrypted tunnels (not full network access)\n    - Supports ALL protocols (TCP/UDP, thick-client apps)\n    - Continuous trust evaluation every 60 seconds\n    - SPA makes infrastructure invisible to port scans\n    - Client agent required on all devices\n  Performance: 2ms overhead, direct-path routing\n  BYOD: Requires agent installation (MDM enrollment for BYOD)\n  Thick-client support: Full (tunnel-level isolation)\n  Pricing: $38/user/year = $456K annual\n  Compliance: SOC 2, HIPAA, PCI DSS certified",
          isCritical: true,
        },
        {
          id: "data-option-b",
          label: "Option B: Reverse Proxy ZTNA",
          content:
            "Vendor B - Cloud-Based Reverse Proxy ZTNA:\n  Architecture: Browser -> Identity Provider -> Cloud Edge -> App Connector\n  Model: Application-layer proxy, clientless for web apps\n  Features:\n    - No agent required for web/SSH/RDP applications\n    - Identity-aware proxy with per-request policy evaluation\n    - Built-in DLP and CASB integration\n    - Browser isolation for high-risk access\n    - Limited thick-client support (requires companion agent)\n  Performance: 15-40ms overhead (cloud routing through nearest PoP)\n  BYOD: Fully clientless for 85% of apps (web-based)\n  Thick-client support: Partial (agent needed, limited protocol support)\n  Pricing: $42/user/year = $504K annual\n  Compliance: SOC 2, HIPAA certified (PCI DSS in progress)",
        },
        {
          id: "data-option-c",
          label: "Option C: VPN Replacement with NAC",
          content:
            "Vendor C - Next-Gen VPN with Network Access Control:\n  Architecture: VPN Client -> Cloud VPN Gateway -> NAC Policy -> Network Segments\n  Model: Segmented VPN with post-auth network ACLs\n  Features:\n    - Familiar VPN client experience\n    - Network-level segmentation (VLAN/ACL per user role)\n    - Post-authentication posture assessment\n    - Supports all protocols natively\n    - Network-based segmentation (not application-level)\n  Performance: 5ms overhead, hub-and-spoke routing\n  BYOD: Standard VPN client installation\n  Thick-client support: Full (network-level access)\n  Pricing: $25/user/year = $300K annual\n  Compliance: SOC 2, HIPAA, PCI DSS certified",
        },
      ],
      actions: [
        {
          id: "act-sdp-agent",
          label: "Select Option A: SDP with Client Agent for per-app micro-tunnels and full protocol support",
          color: "green",
        },
        {
          id: "act-reverse-proxy",
          label: "Select Option B: Reverse Proxy ZTNA for clientless access and built-in DLP",
          color: "blue",
        },
        {
          id: "act-vpn-nac",
          label: "Select Option C: Next-Gen VPN with NAC for cost savings and familiarity",
          color: "yellow",
        },
        {
          id: "act-hybrid-ab",
          label: "Hybrid: Option B for web apps + Option A agent for thick-client apps",
          color: "orange",
        },
      ],
      correctActionId: "act-sdp-agent",
      rationales: [
        {
          id: "rat-sdp-best-fit",
          text: "Option A satisfies all requirements: per-application access (not network-level), full protocol support for the 15% thick-client apps, continuous trust evaluation, BYOD posture via agent, and is within budget at $456K. SPA makes infrastructure invisible, addressing the current VPN exposure. The agent requirement is acceptable since BYOD already requires MDM enrollment for compliance.",
        },
        {
          id: "rat-proxy-gaps",
          text: "Option B's partial thick-client support is a dealbreaker for 15% of applications. It also exceeds budget at $504K and lacks PCI DSS certification, which is required for the payment applications division. The added latency (15-40ms) could impact real-time thick-client applications.",
        },
        {
          id: "rat-vpn-not-zt",
          text: "Option C is a segmented VPN, not true zero-trust. It provides network-level access (VLANs/ACLs) rather than application-level access, which was the primary pain point of the current VPN. It violates the zero-trust principle of per-application micro-perimeters.",
        },
        {
          id: "rat-hybrid-complex",
          text: "A hybrid A+B approach adds operational complexity, two vendor relationships, inconsistent user experience, and combined cost would exceed budget. Option A alone covers both web and thick-client applications.",
        },
      ],
      correctRationaleId: "rat-sdp-best-fit",
      feedback: {
        perfect:
          "Correct. Option A's SDP architecture provides true per-application zero-trust access, supports all protocol types including the critical 15% thick-client apps, stays within budget, and meets all three compliance frameworks.",
        partial:
          "Your choice addresses some requirements but has gaps. Consider all constraints: 15% thick-client apps, three compliance frameworks (SOC2 + HIPAA + PCI DSS), budget of $480K, and the need for per-application (not network-level) access control.",
        wrong:
          "Review the requirements carefully: per-application access control, full protocol support for thick-client apps, all three compliance certifications, and $480K budget. The correct architecture must satisfy every requirement without compromise.",
      },
    },
    {
      type: "investigate-decide",
      id: "continuous-verification-response",
      title: "Continuous Verification Trust Score Response",
      objective:
        "The zero-trust policy engine has flagged a session with degraded trust signals during an active database administration session. Review the trust telemetry and decide the appropriate continuous verification response.",
      investigationData: [
        {
          id: "data-trust-signals",
          label: "Real-Time Trust Signals",
          content:
            "Policy Engine - Continuous Trust Assessment:\n  Session ID: SES-2026032814221\n  User: mwilliams@corp.example.com (Senior DBA)\n  Application: prod-db-admin (PostgreSQL pgAdmin)\n  Session Duration: 47 minutes\n  Authentication: SSO + Hardware FIDO2 key (47min ago)\n\nTrust Score Timeline:\n  14:22 - Score: 92 (Session start, all signals green)\n  14:35 - Score: 88 (Minor: new IP geolocation - office WiFi roam)\n  14:51 - Score: 71 (Device posture: OS patch 14 days overdue)\n  15:02 - Score: 58 (Network: connected to guest WiFi SSID)\n  15:06 - Score: 52 (Behavior: bulk SELECT queries on PII table)\n  15:09 - Score: 48 (Current - below step-up threshold of 50)\n\nPolicy Thresholds:\n  90-100: Full access, standard monitoring\n  70-89:  Full access, enhanced logging\n  50-69:  Step-up authentication required within 5 minutes\n  30-49:  Immediate step-up, reduce to read-only\n  0-29:   Immediate session termination",
          isCritical: true,
        },
        {
          id: "data-context",
          label: "Session Context",
          content:
            "Scheduled Change Window:\n  Change ticket: CHG-44891\n  Approved by: Director of Engineering\n  Window: 14:00-16:00 UTC (current time: 15:09)\n  Task: Quarterly PII audit - requires SELECT on users.pii_data table\n  Expected queries: Bulk SELECT on PII tables for compliance audit\n\nUser History:\n  - Senior DBA for 6 years, no security incidents\n  - Performs quarterly PII audits routinely\n  - Approved for production database access\n  - Last PII audit: 2025-12-28 (same query pattern)\n\nDevice Context:\n  - Corporate laptop (domain-joined)\n  - OS patches: 14 days overdue (IT pushed delay due to compatibility testing)\n  - EDR: Active, no alerts\n  - Connected to 'Guest-WiFi' SSID (unencrypted corporate guest network)",
        },
        {
          id: "data-network-detail",
          label: "Network Analysis",
          content:
            "Network Security Analysis:\n  Current SSID: Guest-WiFi\n    - Open network (no WPA2/3)\n    - No 802.1X authentication\n    - Shared with visitors\n    - Not segmented from internet\n    - Man-in-the-middle risk: HIGH\n\n  Previous SSID: Corp-Secure (WPA3-Enterprise, 802.1X)\n    - Switched at 15:01 UTC (roamed to conference room)\n\n  Database Connection:\n    - PostgreSQL SSL/TLS: Enabled (TLS 1.3)\n    - Client certificate auth: Active\n    - Connection encrypted end-to-end regardless of WiFi security\n\n  DLP Assessment:\n    - PII table contains: SSN, DOB, medical records\n    - Bulk export: 12,400 rows queried in last 8 minutes\n    - Data classification: HIPAA PHI, PCI cardholder data",
        },
      ],
      actions: [
        {
          id: "act-stepup-readonly",
          label: "Enforce step-up MFA and reduce to read-only access per the 30-49 threshold policy",
          color: "yellow",
        },
        {
          id: "act-terminate-session",
          label: "Immediately terminate the session due to guest WiFi and bulk PII access",
          color: "red",
        },
        {
          id: "act-allow-change-window",
          label: "Override the trust score because the activity matches an approved change ticket",
          color: "green",
        },
        {
          id: "act-force-network-switch",
          label: "Require the user to reconnect to Corp-Secure WiFi before continuing",
          color: "blue",
        },
      ],
      correctActionId: "act-stepup-readonly",
      rationales: [
        {
          id: "rat-policy-enforcement",
          text: "The trust score is 48, placing it in the 30-49 band which requires immediate step-up authentication and read-only access reduction. The policy engine must enforce thresholds consistently regardless of change tickets. The DBA can re-authenticate with their FIDO2 key, which will raise the trust score. Read-only access still allows the SELECT-based audit to continue. The approved change window provides context but does not override zero-trust policy.",
        },
        {
          id: "rat-termination-disproportionate",
          text: "Session termination (0-29 band) is disproportionate. The trust degradation is gradual and explainable: WiFi roaming and an overdue patch. There are no EDR alerts or indicators of compromise. The database connection itself is encrypted via TLS 1.3 with client certificates, mitigating the guest WiFi risk.",
        },
        {
          id: "rat-override-dangerous",
          text: "Overriding trust scores based on change tickets undermines zero-trust principles. Change tickets provide context for investigation but should never bypass continuous verification. If exceptions are allowed, attackers who compromise change management systems gain unrestricted access.",
        },
        {
          id: "rat-network-switch-partial",
          text: "Forcing a network switch to Corp-Secure would address one signal but not the full trust degradation. The overdue OS patch still contributes to the lowered score. The correct action addresses all signals through the established policy threshold response.",
        },
      ],
      correctRationaleId: "rat-policy-enforcement",
      feedback: {
        perfect:
          "Correct. Zero-trust policy thresholds must be enforced consistently. At score 48 (30-49 band), step-up MFA and read-only reduction is the correct response. The DBA can re-authenticate and continue the approved audit with read-only access, which is sufficient for SELECT queries.",
        partial:
          "You took a reasonable security action, but zero-trust requires consistent policy enforcement based on trust scores. The 30-49 band has a defined response that should be followed regardless of contextual factors like change tickets.",
        wrong:
          "The trust score of 48 falls in the 30-49 policy band, which mandates step-up authentication and read-only access reduction. Zero-trust principles require consistent threshold enforcement. Change tickets provide audit context but do not override continuous verification policies.",
      },
    },
  ],
  hints: [
    "In zero-trust architecture, the trust score and policy thresholds must be enforced consistently. Contextual information like change tickets informs investigation but never overrides automated policy enforcement.",
    "When evaluating ZTNA architectures, verify that the solution provides per-application access control (not network-level) and supports all required protocols, especially for legacy thick-client applications.",
    "Active indicators of compromise (C2 beacons, credential dumping tools) demand immediate full session revocation. Step-up MFA is useless when the endpoint itself is compromised because the attacker controls the authentication channel.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Zero-trust architecture is the dominant security framework driving enterprise network redesigns. Architects who can translate NIST SP 800-207 principles into practical microsegmentation policies and continuous verification workflows command premium salaries in security engineering and consulting roles.",
  toolRelevance: [
    "Zscaler Private Access",
    "Palo Alto Prisma Access",
    "Cloudflare Access",
    "Okta Identity Engine",
    "CrowdStrike Falcon Zero Trust",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
