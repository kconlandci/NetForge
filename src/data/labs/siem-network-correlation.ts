import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "siem-network-correlation",
  version: 1,
  title: "Correlate SIEM Alerts with Network Logs",
  tier: "advanced",
  track: "network-security",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["siem", "correlation", "log-analysis", "incident-detection", "splunk", "network-forensics"],
  description:
    "Correlate SIEM alerts with network flow data, firewall logs, and endpoint telemetry to identify true security incidents and determine the scope and severity of detected threats.",
  estimatedMinutes: 25,
  learningObjectives: [
    "Correlate alerts across multiple data sources to reconstruct attack timelines",
    "Distinguish true positive security incidents from false positive alert noise",
    "Identify indicators of compromise by cross-referencing SIEM detections with network metadata",
    "Determine incident scope and severity by analyzing lateral movement patterns in correlated logs",
  ],
  sortOrder: 414,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "c2-beacon-detection",
      title: "Suspected C2 Beacon Activity",
      objective:
        "The SIEM has generated a medium-severity alert for periodic outbound HTTPS connections from an internal host. The alert was triggered by a correlation rule detecting regular-interval callbacks. Investigate the alert data and determine whether this is a true C2 beacon or a benign application.",
      investigationData: [
        {
          id: "data-siem-alert",
          label: "SIEM Alert Details",
          content:
            "Alert: Periodic Outbound HTTPS Beacon Detected\nRule: CORR-2841 (Callback interval analysis)\nSeverity: Medium\nTimestamp: 2026-03-28 10:14:00 UTC\n\nSource: 10.20.5.118 (WKSTN-FIN-0223)\nDestination: 104.21.73.x (Cloudflare-fronted domain)\nDomain: updates-cdn.azureservices-health[.]com\nPort: 443 (HTTPS/TLS 1.3)\n\nBeacon Analysis:\n  Interval: 62-68 seconds (mean: 65s, jitter: 4.6%)\n  Duration: Observed for 14 hours\n  Bytes sent per callback: 247-312 bytes\n  Bytes received per callback: 1,024-8,192 bytes (variable)\n  Total sessions in 14h: 776\n  First seen: 2026-03-27 20:22:14 UTC\n  Certificate: Let's Encrypt, issued 2026-03-25\n  SNI: updates-cdn.azureservices-health[.]com",
          isCritical: true,
        },
        {
          id: "data-threat-intel",
          label: "Threat Intelligence Correlation",
          content:
            "Threat Intel Lookup Results:\n\n  Domain: updates-cdn.azureservices-health[.]com\n    - Registered: 2026-03-24 (4 days ago)\n    - Registrar: NameCheap\n    - WHOIS: Privacy protected\n    - VirusTotal: 0/92 detections (clean)\n    - Category: Uncategorized\n    - Similar domains registered same day:\n      * updates-cdn.azureservices-monitor[.]com\n      * updates-cdn.azureservices-check[.]com\n      * updates-cdn.azureservices-status[.]com\n    - All resolve to Cloudflare IPs\n\n  IP: 104.21.73.x\n    - Cloudflare CDN IP (shared hosting)\n    - 14,000+ domains on same IP\n    - Reputation: Clean (Cloudflare infrastructure)\n\n  Certificate Analysis:\n    - Let's Encrypt DV cert (automated issuance)\n    - Issued 3 days ago\n    - Domain impersonates Microsoft Azure naming convention",
          isCritical: true,
        },
        {
          id: "data-endpoint-context",
          label: "Endpoint and User Context",
          content:
            "Endpoint: WKSTN-FIN-0223\n  User: rthompson@corp.example.com (Financial Analyst)\n  Department: Finance - M&A Team\n  OS: Windows 11 Enterprise\n  EDR: CrowdStrike Falcon - No detections\n  Last login: 2026-03-27 19:45 UTC (remote VPN)\n\nProcess Analysis (from EDR telemetry):\n  Parent: explorer.exe\n    -> msedge.exe (PID 7841)\n      -> Downloaded: Q4-Projections-Final.xlsm (from email link)\n    -> EXCEL.EXE (PID 8102, started 20:18 UTC)\n      -> Macro execution detected\n      -> rundll32.exe (PID 8340, started 20:22 UTC)\n        -> Outbound HTTPS to updates-cdn.azureservices-health[.]com\n        -> Running for 14 hours continuously\n        -> Memory: 18MB (abnormally low for legitimate service)\n\nRecent Email (Exchange Online):\n  From: michael.chen@partner-capital[.]com\n  Subject: \"Updated Q4 M&A Projections - CONFIDENTIAL\"\n  Attachment: Q4-Projections-Final.xlsm (macro-enabled)\n  Received: 2026-03-27 19:52 UTC",
        },
      ],
      actions: [
        {
          id: "act-confirm-c2",
          label: "Confirm as true positive C2 beacon - escalate to IR team for containment",
          color: "red",
        },
        {
          id: "act-false-positive",
          label: "Close as false positive - regular application update check",
          color: "green",
        },
        {
          id: "act-monitor-longer",
          label: "Continue monitoring for 24 more hours to gather additional evidence",
          color: "yellow",
        },
        {
          id: "act-block-domain",
          label: "Block the domain at the proxy and close the alert",
          color: "orange",
        },
      ],
      correctActionId: "act-confirm-c2",
      rationales: [
        {
          id: "rat-c2-confirmed",
          text: "Multiple correlated indicators confirm this is a C2 beacon: (1) Domain registered 4 days ago impersonating Azure naming, (2) triggered by a macro-enabled Excel file from an external email, (3) rundll32.exe spawned by Excel making periodic outbound calls with low jitter, (4) 14 hours of continuous beaconing at ~65s intervals, (5) the M&A team member on the Finance team makes this a high-value target for espionage. Each indicator alone could be benign; correlated together they form a clear attack chain.",
        },
        {
          id: "rat-not-false-positive",
          text: "Despite zero VirusTotal detections and clean Cloudflare IP reputation, the process chain (email -> Excel macro -> rundll32.exe -> HTTPS beacon) is a textbook initial access pattern. Clean threat intel scores are common with fresh C2 infrastructure specifically designed to evade reputation-based detection.",
        },
        {
          id: "rat-no-delay",
          text: "Waiting 24 more hours while an active C2 channel operates on a Finance M&A workstation risks data exfiltration of highly sensitive acquisition data. The evidence is already sufficient to classify this as a true positive requiring immediate containment.",
        },
        {
          id: "rat-block-insufficient",
          text: "Blocking the domain alone does not contain the compromise. The attacker has had 14 hours of access, may have deployed persistence mechanisms, harvested credentials, or established alternate C2 channels. Full incident response containment is required.",
        },
      ],
      correctRationaleId: "rat-c2-confirmed",
      feedback: {
        perfect:
          "Excellent correlation. You connected the newly-registered typosquat domain, the email-delivered macro payload, the suspicious process chain, and the beacon timing pattern to confirm an active C2 channel on a high-value Finance M&A workstation.",
        partial:
          "You identified suspicious elements but the full picture requires correlating ALL data sources: the email delivery, macro execution, process chain, domain age, naming convention impersonation, and beacon timing. Together they are conclusive.",
        wrong:
          "Correlate the evidence: a 4-day-old domain impersonating Azure, spawned via rundll32.exe from an Excel macro received by email, beaconing every 65 seconds for 14 hours from a Finance M&A workstation. This is a confirmed C2 beacon requiring immediate IR escalation.",
      },
    },
    {
      type: "investigate-decide",
      id: "data-exfiltration-detection",
      title: "Anomalous DNS Query Volume from Server",
      objective:
        "A SIEM correlation rule has triggered on anomalous DNS query patterns from a production database server. The server is generating thousands of TXT record queries to an unusual domain. Investigate whether this is DNS tunneling for data exfiltration or a legitimate service.",
      investigationData: [
        {
          id: "data-dns-alert",
          label: "DNS Analytics Alert",
          content:
            "Alert: Anomalous DNS TXT Query Volume\nRule: DNS-4102 (DNS tunneling heuristic)\nSeverity: High\nTimestamp: 2026-03-28 14:31:00 UTC\n\nSource: 10.80.1.10 (prod-db-primary)\nDNS Server: 10.10.1.53 (corp-dns-01)\n\nQuery Analysis (last 60 minutes):\n  Total queries: 14,847\n  Query type: 99.2% TXT records\n  Domain: *.t1.data-analytics-cdn[.]net\n  Subdomain pattern: [Base64-encoded string].t1.data-analytics-cdn[.]net\n  Average subdomain length: 63 characters (maximum label length)\n  Query rate: ~247 queries/minute\n  Shannon entropy of subdomains: 5.82 (high - indicates encoded data)\n\nSample queries:\n  aGVhbHRoX3JlY29yZF9pZD0xMDAx.t1.data-analytics-cdn[.]net TXT\n  MDIsdXNlcl9zc249NTQzLTIxLTk4.t1.data-analytics-cdn[.]net TXT\n  NzYsZG9iPTE5ODUtMDMtMjIsZGlh.t1.data-analytics-cdn[.]net TXT\n  Z25vc2lzPWh5cGVydGVuc2lvbixw.t1.data-analytics-cdn[.]net TXT",
          isCritical: true,
        },
        {
          id: "data-decoded-samples",
          label: "Decoded DNS Subdomain Samples",
          content:
            "Base64 Decoded Subdomain Samples:\n\n  aGVhbHRoX3JlY29yZF9pZD0xMDAx =\n    health_record_id=1001\n\n  MDIsdXNlcl9zc249NTQzLTIxLTk4 =\n    02,user_ssn=543-21-98\n\n  NzYsZG9iPTE5ODUtMDMtMjIsZGlh =\n    76,dob=1985-03-22,dia\n\n  Z25vc2lzPWh5cGVydGVuc2lvbixw =\n    gnosis=hypertension,p\n\n  ** DECODED DATA CONTAINS PHI: SSN, DOB, MEDICAL DIAGNOSES **\n  ** This is patient health record data from the database **\n\nEstimated data exfiltrated:\n  14,847 queries x ~48 bytes payload/query = ~694 KB\n  Estimated records: ~2,400 patient records\n  Data classification: HIPAA PHI (Protected Health Information)",
          isCritical: true,
        },
        {
          id: "data-server-context",
          label: "Server and Network Context",
          content:
            "Server: prod-db-primary (10.80.1.10)\n  Role: PostgreSQL 15 - Primary patient records database\n  OS: Ubuntu 22.04 LTS\n  Last patch: 2026-03-15\n  EDR: SentinelOne - Active\n\nSentinelOne Process Tree:\n  systemd -> postgresql (PID 1842, normal)\n  systemd -> cron -> /tmp/.cache/syshealth (PID 29104)\n    -> Started: 2026-03-28 13:28:44 UTC\n    -> Binary: ELF 64-bit, not in package manager\n    -> Connecting to localhost:5432 (PostgreSQL)\n    -> Executing: SELECT * FROM patients WHERE id > 0 LIMIT 100 OFFSET [incrementing]\n    -> Generating DNS queries via raw socket\n\nFirewall Logs (prod-db-primary):\n  Outbound rules: DENY ALL except DNS (udp/53), NTP (udp/123), HTTPS to patch repos\n  No direct internet access - all traffic through internal DNS resolver\n  No anomalous firewall denies (attacker using allowed DNS channel)\n\nRecent Access:\n  SSH login: devops-svc@10.50.3.22 at 2026-03-28 13:25:11 UTC\n  Source 10.50.3.22: Jump server (compromised? - under investigation)",
        },
      ],
      actions: [
        {
          id: "act-confirm-exfil",
          label: "Confirm active data exfiltration via DNS tunneling - invoke HIPAA breach response",
          color: "red",
        },
        {
          id: "act-legitimate-analytics",
          label: "Close as legitimate analytics data collection service",
          color: "green",
        },
        {
          id: "act-block-dns-monitor",
          label: "Block the domain at the DNS resolver and continue monitoring",
          color: "yellow",
        },
        {
          id: "act-network-isolate-only",
          label: "Network-isolate the server and investigate without declaring a breach",
          color: "orange",
        },
      ],
      correctActionId: "act-confirm-exfil",
      rationales: [
        {
          id: "rat-exfil-confirmed",
          text: "The evidence is conclusive: (1) Base64-encoded DNS subdomains decode to patient health records containing SSN, DOB, and medical diagnoses, (2) an unauthorized binary in /tmp/.cache/ is querying the database and generating raw DNS queries, (3) ~2,400 patient records have already been exfiltrated via DNS tunneling, (4) the data is HIPAA PHI. This requires immediate breach response including HIPAA notification procedures, not just technical containment.",
        },
        {
          id: "rat-not-legitimate",
          text: "No legitimate analytics service operates by Base64-encoding database contents into DNS subdomain labels. The binary is unsigned, not from the package manager, and located in /tmp/.cache/ - a classic malware staging directory. The process was started 3 minutes after an SSH login from a potentially compromised jump server.",
        },
        {
          id: "rat-block-insufficient",
          text: "Blocking the DNS domain stops ongoing exfiltration but does not constitute a HIPAA breach response. With 2,400 patient records already exfiltrated containing PHI, the organization has a legal obligation to invoke breach notification procedures within 60 days per HIPAA.",
        },
        {
          id: "rat-isolate-insufficient",
          text: "Isolating without declaring a breach ignores the regulatory requirement. HIPAA mandates that unauthorized disclosure of PHI must be reported. The decoded data proves PHI was transmitted to an external domain. Technical containment is necessary but the breach has already occurred.",
        },
      ],
      correctRationaleId: "rat-exfil-confirmed",
      feedback: {
        perfect:
          "Outstanding analysis. You correlated the DNS analytics alert with the decoded payload content, identified the unauthorized process, confirmed PHI exfiltration, and correctly recognized this requires HIPAA breach response procedures, not just technical remediation.",
        partial:
          "You identified the DNS tunneling correctly, but with confirmed PHI exfiltration (SSN, DOB, medical diagnoses for 2,400 patients), this requires formal HIPAA breach response notification, not just blocking and monitoring.",
        wrong:
          "Decode the Base64 subdomains: they contain patient SSNs, dates of birth, and medical diagnoses. An unauthorized binary in /tmp is querying the database and exfiltrating records via DNS tunneling. This is confirmed PHI breach requiring HIPAA notification.",
      },
    },
    {
      type: "investigate-decide",
      id: "insider-threat-correlation",
      title: "After-Hours VPN Access with Bulk File Downloads",
      objective:
        "Multiple SIEM rules have triggered simultaneously: after-hours VPN login, bulk file download from a SharePoint document library, and a DLP alert for sensitive file transfers. The alerts all involve the same user account. Investigate whether this is authorized activity or an insider threat/compromised account.",
      investigationData: [
        {
          id: "data-siem-alerts",
          label: "Correlated SIEM Alerts",
          content:
            "Alert Cluster (3 correlated alerts within 20-minute window):\n\n1. VPN-2201: After-Hours VPN Login\n   Time: 2026-03-28 02:14:33 UTC (Saturday, 10:14 PM local)\n   User: akovacs@corp.example.com\n   Source IP: 185.156.73.x (Hungary, Budapest)\n   VPN Gateway: vpn-east.corp.example.com\n   Auth: SSO + Push MFA (approved via Duo Mobile)\n\n2. SHARE-3301: Bulk File Download\n   Time: 2026-03-28 02:18:44 - 02:31:12 UTC\n   User: akovacs@corp.example.com\n   Source: SharePoint - \"Project Titan\" document library\n   Files: 347 files downloaded (892 MB total)\n   File types: .docx (142), .xlsx (89), .pdf (71), .pptx (45)\n   Download method: OneDrive sync client bulk download\n\n3. DLP-4401: Sensitive Data Transfer\n   Time: 2026-03-28 02:33:18 UTC\n   User: akovacs@corp.example.com\n   Action: Files moved to personal OneDrive\n   Classification labels detected: \"Confidential\", \"Internal Only\"\n   Policy: Block and alert (BLOCKED - transfer prevented)",
          isCritical: true,
        },
        {
          id: "data-user-context",
          label: "User Profile and HR Context",
          content:
            "User: Andras Kovacs (akovacs@corp.example.com)\n  Title: Senior Product Manager\n  Department: Product - Strategic Initiatives\n  Location: Budapest, Hungary (remote employee)\n  Hire date: 2019-06-15\n  Performance: Exceeds expectations (last 3 reviews)\n  Access level: \"Project Titan\" document library (authorized member)\n\nHR Context (CONFIDENTIAL - from HR systems):\n  Status: Active employee\n  Notice period: None filed\n  Recent events:\n    - 2026-03-15: Passed over for VP promotion (internal announcement)\n    - 2026-03-20: Scheduled 1:1 with skip-level manager (cancelled by employee)\n    - 2026-03-26: Updated LinkedIn profile (added \"Open to Work\" badge)\n    - 2026-03-27: Glassdoor review posted from company IP range\n\nNormal Access Pattern:\n  Typical hours: 09:00-19:00 CET (weekdays)\n  Weekend VPN logins in last 90 days: 2 (both during product launches)\n  Typical file access: 10-20 files/day from Project Titan\n  Has NEVER bulk-downloaded from SharePoint before\n  Personal OneDrive transfer: Never attempted before",
        },
        {
          id: "data-network-forensics",
          label: "Network and Authentication Forensics",
          content:
            "VPN Session Analysis:\n  Source IP: 185.156.73.x\n    - ISP: Magyar Telekom (Hungarian residential ISP)\n    - Geolocation: Budapest, Hungary\n    - Consistent with user's home location\n    - No VPN/proxy/Tor indicators on source IP\n\nAuthentication Timeline:\n  02:14:22 - SSO login to Okta (password correct on first attempt)\n  02:14:28 - Duo MFA push sent to registered device (iPhone 15)\n  02:14:33 - Duo MFA approved (5-second response time - normal)\n  02:14:35 - VPN tunnel established\n  02:15:01 - SharePoint Online authenticated via SSO token\n  02:18:44 - OneDrive sync client initiated bulk download\n  02:31:12 - Download complete (347 files, 892 MB)\n  02:33:18 - Attempted transfer to personal OneDrive (BLOCKED by DLP)\n  02:34:01 - Attempted USB copy (BLOCKED by endpoint DLP)\n  02:35:22 - Attempted email to personal Gmail (BLOCKED by email DLP)\n  02:36:44 - VPN disconnected\n\nPost-Block Behavior:\n  3 rapid attempts to exfiltrate data using different channels\n  All blocked by DLP policies\n  User disconnected 1.5 minutes after final block",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "act-insider-threat",
          label: "Classify as insider threat - escalate to Security and HR for coordinated response",
          color: "red",
        },
        {
          id: "act-compromised-account",
          label: "Classify as compromised account - reset credentials and investigate",
          color: "orange",
        },
        {
          id: "act-authorized-work",
          label: "Close as authorized after-hours work by a legitimate user",
          color: "green",
        },
        {
          id: "act-request-justification",
          label: "Contact user for business justification before classifying",
          color: "blue",
        },
      ],
      correctActionId: "act-insider-threat",
      rationales: [
        {
          id: "rat-insider-confirmed",
          text: "The correlated evidence points to deliberate insider data theft: (1) After being passed over for promotion, the user updated LinkedIn to \"Open to Work\", (2) unprecedented Saturday night bulk download of 347 confidential files, (3) immediate attempt to transfer to personal OneDrive, (4) after DLP blocked the transfer, rapidly tried USB copy and then personal email - three different exfiltration methods in 3 minutes, (5) disconnected immediately after all channels were blocked. The authentication is legitimate (correct password, approved MFA from registered device, home IP) - this is the actual user, not a compromised account.",
        },
        {
          id: "rat-not-compromised",
          text: "The authentication chain confirms this is the legitimate user: correct password on first attempt, MFA approved in 5 seconds from a registered iPhone, source IP matches the user's home ISP in Budapest. Account compromise would typically show password spraying attempts, MFA bombing, or unusual device/location. This is authorized-user unauthorized-activity.",
        },
        {
          id: "rat-not-authorized",
          text: "While the user has legitimate access to Project Titan files, the behavioral pattern is far outside normal: first-ever bulk download, first-ever weekend late-night access, immediate attempts to move data to personal storage using three different methods. The HR context (passed over for promotion, Open to Work status) provides motive.",
        },
        {
          id: "rat-no-contact",
          text: "Contacting the user would alert them and give them time to find alternative exfiltration methods not covered by DLP (e.g., photographing screens, using a personal device to access SharePoint). Insider threat investigations require coordination between Security and HR before any user contact.",
        },
      ],
      correctRationaleId: "rat-insider-confirmed",
      feedback: {
        perfect:
          "Excellent correlation across security, HR, and behavioral data. You correctly identified the insider threat indicators: motive (passed over for promotion), unprecedented behavior (bulk weekend download), intent (three rapid exfiltration attempts via different channels), and confirmed legitimate authentication ruling out account compromise.",
        partial:
          "You recognized the suspicious activity but the classification matters. The legitimate authentication chain (correct password, fast MFA approval, home IP) rules out account compromise. The three rapid exfiltration attempts after DLP blocks demonstrate clear intent, making this an insider threat requiring HR coordination.",
        wrong:
          "Correlate all data sources: HR events show motive (denied promotion, job searching), the authentication is legitimate (not compromised), behavior is unprecedented (first-ever bulk download at 10 PM Saturday), and the user tried three different exfiltration methods in 3 minutes after being blocked. This is a textbook insider threat case.",
      },
    },
  ],
  hints: [
    "When investigating potential C2 beacons, correlate the process chain (how the beaconing process was started), domain age and registration patterns, and beacon timing regularity. Fresh domains impersonating legitimate services spawned via document macros are strong C2 indicators.",
    "DNS tunneling encodes data in subdomain labels. High entropy subdomains at maximum label length (63 characters) with Base64 patterns queried at high rates are classic DNS exfiltration signatures. Always decode sample subdomains to verify content.",
    "Insider threat classification requires correlating technical indicators (unusual access patterns, exfiltration attempts) with HR context (job dissatisfaction, upcoming departure). Legitimate authentication rules out account compromise and confirms the user is acting deliberately.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "SIEM analysts who can correlate alerts across network, endpoint, identity, and HR data sources are the backbone of modern Security Operations Centers. The ability to quickly determine whether a SIEM alert represents a true incident and assess its scope separates L1 alert fatigue from L3 incident investigation expertise.",
  toolRelevance: [
    "Splunk Enterprise Security",
    "Microsoft Sentinel",
    "CrowdStrike Falcon LogScale",
    "Elastic Security (ELK)",
    "IBM QRadar",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
