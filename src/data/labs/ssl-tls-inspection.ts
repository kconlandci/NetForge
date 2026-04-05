import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ssl-tls-inspection",
  version: 1,
  title: "SSL/TLS Inspection Decisions on Firewalls",
  tier: "intermediate",
  track: "network-security",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["ssl", "tls", "inspection", "firewall", "decryption", "proxy", "certificate"],
  description:
    "Decide when and how to implement SSL/TLS inspection on next-gen firewalls, balancing security visibility with privacy requirements and certificate trust issues.",
  estimatedMinutes: 13,
  learningObjectives: [
    "Determine which traffic categories should and should not be subject to TLS inspection",
    "Understand the certificate trust chain implications of TLS interception",
    "Identify privacy and compliance constraints that restrict TLS decryption",
    "Configure appropriate bypass rules for sensitive traffic categories",
  ],
  sortOrder: 407,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "sti-001",
      title: "Enabling TLS Inspection for Outbound Web Traffic",
      context:
        "Your organization is deploying a Palo Alto PA-850 with SSL Forward Proxy to inspect outbound HTTPS traffic. The security team wants to decrypt all traffic for threat inspection, but HR and Legal have raised concerns. You must decide the inspection policy for the initial deployment.",
      displayFields: [
        { label: "Firewall", value: "Palo Alto PA-850 with SSL Forward Proxy" },
        { label: "Users", value: "500 employees across corporate LAN" },
        { label: "Concerns", value: "HR: employee banking/health sites; Legal: attorney-client privilege" },
        { label: "Compliance", value: "HIPAA applies to HR department traffic" },
      ],
      logEntry:
        "Current SSL Decryption Policy Options:\n\nOption A: Decrypt ALL outbound HTTPS traffic\n  - Maximum visibility for threat detection\n  - Violates HIPAA for health-related sites\n  - May violate attorney-client privilege protections\n  - Employee backlash risk\n\nOption B: Decrypt all except financial, healthcare, and legal categories\n  - URL category-based bypass for sensitive categories\n  - ~80% traffic visibility retained\n  - Compliant with HIPAA and privilege requirements\n  - Uses PA built-in URL categories for bypass\n\nOption C: Only decrypt traffic to uncategorized/risky URL categories\n  - Minimal decryption scope\n  - ~30% traffic visibility\n  - Low compliance risk\n  - May miss threats in legitimate-looking HTTPS traffic\n\nOption D: Do not enable TLS inspection\n  - Zero encrypted traffic visibility\n  - No compliance concerns\n  - Cannot detect threats in HTTPS traffic (85% of web traffic)",
      actions: [
        { id: "act-all", label: "Decrypt all outbound HTTPS with no exceptions" },
        { id: "act-category-bypass", label: "Decrypt all except financial, healthcare, and legal URL categories" },
        { id: "act-risky-only", label: "Only decrypt uncategorized and high-risk URL categories" },
        { id: "act-none", label: "Do not enable TLS inspection at this time" },
      ],
      correctActionId: "act-category-bypass",
      rationales: [
        { id: "rat1", text: "Decrypting all traffic except financial, healthcare, and legal categories provides ~80% visibility while respecting HIPAA requirements and attorney-client privilege. Palo Alto's URL category-based decryption bypass makes this straightforward to implement." },
        { id: "rat2", text: "Decrypting all traffic without exceptions violates HIPAA by intercepting health-related communications and may expose the organization to legal liability for breaking attorney-client privilege." },
        { id: "rat3", text: "Inspecting only risky categories misses the majority of web traffic where threats can hide inside seemingly legitimate HTTPS connections to well-known domains." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! Category-based bypass provides strong security visibility while respecting HIPAA and legal privilege requirements. This is the industry best practice for initial TLS inspection deployment.",
        partial: "You are on the right track, but the policy must balance threat visibility with compliance. Excluding financial, healthcare, and legal categories addresses HIPAA and privilege concerns while maintaining ~80% visibility.",
        wrong: "TLS inspection is critical for threat detection (85% of web traffic is encrypted), but it must comply with HIPAA and respect attorney-client privilege. Category-based bypass is the balanced approach.",
      },
    },
    {
      type: "action-rationale",
      id: "sti-002",
      title: "Certificate Pinning Failures After TLS Inspection",
      context:
        "After enabling SSL Forward Proxy, several applications are failing with certificate errors. The help desk reports that mobile banking apps, Microsoft Teams, and a custom ERP client are all rejecting the firewall's re-signed certificates due to certificate pinning.",
      displayFields: [
        { label: "Affected Apps", value: "Banking apps, Microsoft Teams, ERP client (CertPinned)" },
        { label: "Error", value: "SSL_PINNED_KEY_NOT_IN_CERT_CHAIN / NET::ERR_CERT_AUTHORITY_INVALID" },
        { label: "Tickets", value: "47 help desk tickets in 2 hours" },
        { label: "Impact", value: "Teams meetings failing, ERP orders cannot be placed" },
      ],
      logEntry:
        "Palo Alto Decryption Log:\n03/28 10:15:22 DECRYPTION session_id=44210 src=10.1.5.22 dst=teams.microsoft.com:443\n  Result: FAIL - Client rejected re-signed certificate\n  Reason: Certificate pinning detected\n\n03/28 10:15:25 DECRYPTION session_id=44215 src=10.1.5.30 dst=erp.company-vendor.com:443\n  Result: FAIL - Mutual TLS (mTLS) handshake broken\n  Reason: Client certificate not forwarded through proxy\n\n03/28 10:16:01 DECRYPTION session_id=44220 src=10.1.5.45 dst=mobile-banking.example.com:443\n  Result: FAIL - App refused connection\n  Reason: HPKP / certificate pinning enforcement\n\nOptions:\n  A. Disable TLS inspection entirely to fix all applications\n  B. Add SSL decryption bypass rules for pinned applications by destination\n  C. Push the firewall CA certificate to all client devices and apps\n  D. Replace certificate-pinning apps with web-based alternatives",
      actions: [
        { id: "act-disable", label: "Disable TLS inspection to restore all application connectivity" },
        { id: "act-bypass", label: "Create decryption bypass rules for certificate-pinned applications" },
        { id: "act-push-ca", label: "Push the firewall CA to all devices and override pinning" },
        { id: "act-replace", label: "Replace pinned applications with web-based alternatives" },
      ],
      correctActionId: "act-bypass",
      rationales: [
        { id: "rat1", text: "Certificate-pinned applications are designed to reject any certificate not matching their embedded pins. The firewall CA cannot override application-level pinning. Creating bypass rules for these specific destinations (Teams, ERP, banking) restores functionality while maintaining TLS inspection on all other traffic." },
        { id: "rat2", text: "Disabling TLS inspection entirely loses all encrypted traffic visibility to fix a problem that only affects a handful of applications. Targeted bypass rules are far more proportional." },
        { id: "rat3", text: "Pushing the firewall CA to devices only fixes browser-based certificate trust, not application-level certificate pinning. Mobile banking apps and Teams have hard-coded pins that cannot be overridden by adding a CA certificate." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! Certificate pinning cannot be overridden by CA deployment. Targeted bypass rules for pinned applications maintain inspection on the majority of traffic while restoring application connectivity.",
        partial: "You recognized the need to fix the application failures, but the most targeted solution is bypass rules for the specific pinned applications, not disabling inspection entirely.",
        wrong: "Certificate pinning is an application-level security control that rejects re-signed certificates. The correct approach is to bypass decryption for pinned applications, not disable inspection globally or attempt to override the pins.",
      },
    },
    {
      type: "action-rationale",
      id: "sti-003",
      title: "Inbound TLS Inspection for Public-Facing Servers",
      context:
        "The security team wants to inspect inbound HTTPS traffic to the company's public web servers for SQL injection, XSS, and malware uploads. The web servers currently terminate TLS with Let's Encrypt certificates. You must decide how to implement inbound inspection.",
      displayFields: [
        { label: "Web Servers", value: "3 Apache servers behind load balancer in DMZ" },
        { label: "Current TLS", value: "Let's Encrypt certificates, TLS 1.2/1.3" },
        { label: "Firewall", value: "Palo Alto PA-3260 with SSL Inbound Inspection license" },
        { label: "Goal", value: "Inspect HTTPS payload for SQLi, XSS, malware uploads" },
      ],
      logEntry:
        "Inbound SSL Inspection Architecture Options:\n\nOption A: SSL Inbound Inspection (import server cert+key to firewall)\n  - Firewall decrypts using the server's private key\n  - Full payload inspection for threats\n  - Firewall re-encrypts and forwards to web server\n  - Requires importing server private key to firewall\n  - Works with TLS 1.2 RSA key exchange\n  - DOES NOT work with TLS 1.3 or ECDHE (PFS)\n\nOption B: Firewall terminates TLS, inspects, re-encrypts to backend\n  - Firewall acts as reverse proxy / SSL offload\n  - Move certificates to the firewall\n  - Backend servers receive re-encrypted or plain HTTP\n  - Full inspection capability regardless of TLS version\n\nOption C: Deploy a WAF in front of the web servers instead\n  - Purpose-built for web application attacks\n  - WAF terminates TLS and inspects HTTP\n  - Forwards clean traffic to backend servers\n  - More granular SQLi/XSS detection rules than NGFW\n\nOption D: Use web server module (mod_security) for inspection\n  - No network-level changes required\n  - Inspection happens after TLS termination on the server\n  - Limited centralized visibility",
      actions: [
        { id: "act-inbound-ssl", label: "Import server certificates to the firewall for SSL Inbound Inspection" },
        { id: "act-fw-proxy", label: "Configure the firewall as a reverse proxy terminating TLS" },
        { id: "act-waf", label: "Deploy a dedicated WAF to inspect inbound HTTPS traffic" },
        { id: "act-modsec", label: "Install mod_security on each web server for local inspection" },
      ],
      correctActionId: "act-waf",
      rationales: [
        { id: "rat1", text: "A dedicated WAF is purpose-built for detecting web application attacks (SQLi, XSS, file upload abuse) with far more granular detection rules than an NGFW's SSL Inbound Inspection. It handles TLS 1.3/PFS natively, provides virtual patching, and does not require sharing private keys with the firewall." },
        { id: "rat2", text: "SSL Inbound Inspection by importing server keys does not work with TLS 1.3 or ECDHE key exchange (Perfect Forward Secrecy), which modern servers should be using. This approach is increasingly deprecated." },
        { id: "rat3", text: "Using the firewall as a reverse proxy is functional but an NGFW's web attack detection is less sophisticated than a dedicated WAF. For the specific goal of SQLi/XSS/malware detection on public-facing servers, a WAF is the right tool." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Excellent! A dedicated WAF is the right tool for inspecting inbound web application traffic. It provides superior SQLi/XSS detection, handles TLS 1.3 natively, and does not require exposing server private keys to the firewall.",
        partial: "Your approach would provide some inspection, but a WAF is purpose-built for web application attack detection with more granular rules than an NGFW and better TLS 1.3 compatibility.",
        wrong: "For inbound HTTPS inspection targeting web application attacks, a dedicated WAF provides the most effective detection. SSL Inbound Inspection has TLS 1.3 limitations, and mod_security lacks centralized management.",
      },
    },
  ],
  hints: [
    "When deploying TLS inspection, always identify traffic categories that must be excluded for legal, compliance, or privacy reasons before enabling decryption.",
    "Certificate pinning is an application-level control that cannot be overridden by deploying a CA certificate. These applications require decryption bypass rules.",
    "For inspecting inbound HTTPS to web servers, consider whether a purpose-built WAF would provide better detection than generic NGFW SSL inspection.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "SSL/TLS inspection is a frequent topic in security architecture interviews and on the job. Understanding the trade-offs between visibility, compliance, and certificate trust issues is critical for firewall engineers and security architects deploying NGFWs.",
  toolRelevance: ["Palo Alto NGFW", "Fortinet FortiGate", "Zscaler", "F5 BIG-IP", "Squid Proxy"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
