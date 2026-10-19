import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "siem-network-correlation",
  version: 2,
  title: "The AI SOC Summary Is Wrong",
  tier: "advanced",
  track: "network-security",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["siem", "correlation", "log-analysis", "ai-review", "incident-detection", "splunk"],
  description:
    "Your SOC's AI assistant writes the first summary on every incident — and three of this week's are wrong in the direction that matters: an intrusion closed as benign scanning, a C2 beacon waved off, and PHI exfiltration filed as analytics. Work the raw evidence and re-classify each one.",
  estimatedMinutes: 25,
  learningObjectives: [
    "Treat AI-generated incident summaries as unverified claims and check them against the underlying event data",
    "Correlate alerts across multiple data sources to reconstruct attack timelines",
    "Distinguish true positive security incidents from false positive alert noise — in both directions",
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
      id: "ai-soc-lateral-movement",
      title: "Closed as 'Benign Scanning' — Actually Lateral Movement",
      objective:
        "The AI SOC assistant auto-summarized incident INC-4471 and recommended closure as benign internal scanning. Before it closes, review the raw events the summary was generated from and decide the incident's real classification.",
      investigationData: [
        {
          id: "data-ai-summary",
          label: "AI SOC Assistant — Incident Summary (INC-4471)",
          content:
            "Summary: 'Internal host 10.20.7.44 performed port scans against\nmultiple internal servers over 40 minutes. Pattern is consistent\nwith the vulnerability scanner's weekly schedule. No malicious\nindicators identified. Recommend: close as benign scanning.'\n\nConfidence: 89%\n\nAccuracy check (from the asset database, NOT in the summary):\n  10.20.7.44 = WKSTN-DEV-0118, a developer workstation\n  The vulnerability scanner lives at 10.20.3.10, runs Sundays\n  02:00-04:00, and has never scanned from 10.20.7.44.",
          isCritical: true,
        },
        {
          id: "data-network-events",
          label: "Firewall and Authentication Logs (10.20.7.44, 40-minute window)",
          content:
            "Connection pattern from 10.20.7.44 (Tuesday 14:03-14:43):\n  -> 23 internal hosts on TCP/445 (SMB), sequential, ~90s each\n  -> Successful ADMIN$ share access on 9 hosts\n  -> 4 hosts: new service created remotely within 60s of access\n     (Service Control Manager events, service name pattern: single\n     random word, binary in \\\\ADMIN$\\PSEXESVC-style path)\n  -> 2 domain controllers: bulk Kerberos TGS requests (14 service\n     tickets in 3 minutes vs. a baseline of ~2/hour for this user)\n  -> Outbound: one 38 MB transfer to a file-sharing domain at\n     14:41, host's first-ever visit to that domain",
          isCritical: true,
        },
        {
          id: "data-endpoint-events",
          label: "Endpoint Telemetry (WKSTN-DEV-0118)",
          content:
            "EDR timeline (WKSTN-DEV-0118):\n  13:58  powershell.exe spawned from a macro-enabled spreadsheet\n         opened from a personal webmail tab\n  14:01  LSASS memory access by an unsigned process\n         (credential dumping signature, EDR severity: HIGH —\n         this alert was attached to INC-4471 but not mentioned\n         in the AI summary)\n  14:03  First outbound SMB connection to a neighboring host\n  User: developer with legitimate admin rights to 3 of the 23\n  hosts contacted. No change ticket covers the other 20.",
        },
      ],
      actions: [
        {
          id: "act-close-benign",
          label: "Accept the AI summary — close INC-4471 as benign scanning",
          color: "green",
        },
        {
          id: "act-reclassify-lateral",
          label: "Reclassify as active intrusion with lateral movement — isolate 10.20.7.44, preserve evidence, escalate to incident response",
          color: "red",
        },
        {
          id: "act-monitor",
          label: "Keep the incident open and monitor for 24 hours before deciding",
          color: "yellow",
        },
        {
          id: "act-block-outbound",
          label: "Block the file-sharing domain at the proxy and close the incident",
          color: "orange",
        },
      ],
      correctActionId: "act-reclassify-lateral",
      rationales: [
        {
          id: "rat-lateral-confirmed",
          text: "Every element of the summary's benign story fails against the raw data. The source is a workstation, not the scanner (wrong host, wrong day, wrong schedule). The 'scanning' ends in successful ADMIN$ access, remote service creation — the PsExec pattern — LSASS credential dumping, Kerberos ticket harvesting, and a 38 MB outbound transfer. That is a textbook intrusion chain: initial access, credential theft, lateral movement, exfiltration. The AI matched the surface shape (one host, many SMB connections) to the most common benign explanation and stopped looking.",
        },
        {
          id: "rat-not-benign",
          text: "Vulnerability scanners do not dump LSASS, create services on the hosts they scan, or upload 38 MB to file-sharing sites. A summary that calls this benign without mentioning the EDR credential-dumping alert attached to the same incident has not summarized the evidence — it has replaced it.",
        },
        {
          id: "rat-no-delay",
          text: "Monitoring an attacker who already holds credentials and has touched domain controllers trades the containment window for observation the SOC does not need. Nine hosts have remote services installed by the intruder; every hour of delay is more persistence to find later.",
        },
        {
          id: "rat-block-insufficient",
          text: "Blocking one exfiltration domain leaves the compromised workstation, the dumped credentials, and the services planted on nine hosts all in place. The domain is the least important part of this incident.",
        },
      ],
      correctRationaleId: "rat-lateral-confirmed",
      feedback: {
        perfect:
          "Excellent — you did the job the summary was supposed to do. Wrong scanner host, wrong schedule, credential dumping, ADMIN$ access, remote service creation, ticket harvesting, and a 38 MB upload are not scanning; they are an intrusion in progress. The AI summarized the shape of the traffic; you read the events.",
        partial:
          "You knew the closure was wrong, but the response has to match the evidence: this is not a watch-and-wait case. Credential dumping plus lateral movement to 23 hosts plus exfiltration means isolate, preserve, and escalate now.",
        wrong:
          "Accepting the summary would have closed an active intrusion. The assistant's story fails on facts you can check in thirty seconds — the scanner is a different host on a different schedule — and the EDR credential-dumping alert on this very incident never made it into the summary. AI summaries inherit the evidence you give them and the confidence of their training data, not the truth of your network.",
      },
    },
    {
      type: "investigate-decide",
      id: "ai-soc-c2-beacon",
      title: "'Regular Update Check' — Actually a C2 Beacon",
      objective:
        "The AI assistant summarized a medium-severity beaconing alert as a benign application update check and recommended closure. The underlying telemetry is attached to the incident. Verify or refute the summary.",
      investigationData: [
        {
          id: "data-ai-summary-c2",
          label: "AI SOC Assistant — Alert Summary",
          content:
            "Summary: 'Periodic outbound HTTPS from WKSTN-FIN-0223 to a\nCloudflare-fronted domain. Regular-interval connections to a\nCDN are consistent with application update checks. Threat intel\nshows the IP reputation clean and 0/92 VirusTotal detections.\nRecommend: close as false positive.'\n\nConfidence: 86%",
        },
        {
          id: "data-siem-alert",
          label: "SIEM Alert Details",
          content:
            "Alert: Periodic Outbound HTTPS Beacon Detected\nRule: CORR-2841 (Callback interval analysis)\nSeverity: Medium\n\nSource: 10.20.5.118 (WKSTN-FIN-0223)\nDestination: 104.21.73.x (Cloudflare-fronted)\nDomain: updates-cdn.azureservices-health[.]com\nPort: 443 (HTTPS/TLS 1.3)\n\nBeacon Analysis:\n  Interval: 62-68 seconds (mean: 65s, jitter: 4.6%)\n  Duration: Observed for 14 hours (776 sessions)\n  Bytes sent per callback: 247-312 bytes\n  Bytes received per callback: 1,024-8,192 bytes (variable)\n  Certificate: Let's Encrypt, issued 3 days ago",
          isCritical: true,
        },
        {
          id: "data-threat-intel",
          label: "Threat Intelligence Correlation",
          content:
            "Domain: updates-cdn.azureservices-health[.]com\n  - Registered: 4 days ago (NameCheap, privacy protected)\n  - Category: Uncategorized\n  - Three sibling domains registered the same day with the\n    same 'azureservices' naming pattern\n  - Domain name impersonates Microsoft Azure service naming\n\nIP: 104.21.73.x — Cloudflare CDN (14,000+ domains share it);\nreputation 'clean' reflects the CDN, not this domain.",
          isCritical: true,
        },
        {
          id: "data-endpoint-context",
          label: "Endpoint and User Context",
          content:
            "Endpoint: WKSTN-FIN-0223 — Finance, M&A team analyst\nEDR process chain:\n  explorer.exe\n    -> msedge.exe — downloaded Q4-Projections-Final.xlsm\n       from an email link\n    -> EXCEL.EXE (macro execution detected)\n      -> rundll32.exe — originated the HTTPS beaconing,\n         running continuously for 14 hours, 18 MB memory\n\nThe beaconing process is rundll32.exe spawned by a macro.\nIt is not a browser, an updater, or any signed application.",
        },
      ],
      actions: [
        {
          id: "act-confirm-c2",
          label: "Reject the summary — confirm true positive C2 beacon and escalate to IR for containment",
          color: "red",
        },
        {
          id: "act-false-positive",
          label: "Accept the summary — close as a regular application update check",
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
          text: "The summary leaned on the two weakest signals available — clean CDN reputation and zero VirusTotal detections — and ignored the strongest ones. Update checks are not made by rundll32.exe spawned from an email-delivered Excel macro. The domain is four days old, impersonates Azure naming, and has three same-day siblings. The beacon runs at a near-metronomic 65-second interval for 14 hours from a Finance M&A workstation. Correlated, this is a confirmed C2 channel on a high-value target.",
        },
        {
          id: "rat-not-false-positive",
          text: "'Clean threat intel' is what fresh C2 infrastructure looks like before anyone reports it. Reputation scores describe an IP shared by 14,000 domains; they say nothing about this four-day-old domain or the macro-spawned process calling it.",
        },
        {
          id: "rat-no-delay",
          text: "Fourteen hours of beaconing is already fourteen hours too many on a workstation holding M&A data. The evidence needed for classification is complete; more monitoring only extends the attacker's window.",
        },
        {
          id: "rat-block-insufficient",
          text: "Blocking the domain does not remove the implant, its persistence, or anything it has already done. The host needs containment and investigation, not a proxy rule and a closed ticket.",
        },
      ],
      correctRationaleId: "rat-c2-confirmed",
      feedback: {
        perfect:
          "Correct. You weighted the evidence by strength, not by how reassuring it sounded: a macro-spawned rundll32 beaconing to a four-day-old typosquat domain beats a clean CDN reputation score every time. The summary quoted the two signals that required no investigation.",
        partial:
          "You were right to doubt the closure, but the classification is already provable: the process chain alone (email -> macro -> rundll32 -> beacon) settles it. This needs IR containment, not more observation or a domain block.",
        wrong:
          "Application updaters do not hide inside rundll32.exe launched by a spreadsheet macro, and they do not phone home to domains registered four days ago that imitate Azure's naming. The AI's 'clean intel' argument described a shared CDN IP, not this domain. Never let the weakest two signals outvote the strongest three.",
      },
    },
    {
      type: "investigate-decide",
      id: "ai-soc-dns-exfil",
      title: "'Analytics Collection' — Actually PHI Exfiltration over DNS",
      objective:
        "A high-severity DNS alert was summarized by the AI assistant as an analytics service's expected traffic, with a recommendation to close. The decoded evidence is in the incident. Decide what this traffic actually is.",
      investigationData: [
        {
          id: "data-ai-summary-dns",
          label: "AI SOC Assistant — Alert Summary",
          content:
            "Summary: 'Database server prod-db-primary is generating a\nhigh volume of DNS TXT queries to data-analytics-cdn[.]net.\nThe domain name indicates an analytics collection service and\nTXT records are commonly used for service verification.\nRecommend: close as legitimate analytics traffic.'\n\nConfidence: 82%",
        },
        {
          id: "data-dns-alert",
          label: "DNS Analytics Alert",
          content:
            "Alert: Anomalous DNS TXT Query Volume\nRule: DNS-4102 (DNS tunneling heuristic)\nSeverity: High\n\nSource: 10.80.1.10 (prod-db-primary — PostgreSQL patient records DB)\nQuery analysis (last 60 minutes):\n  Total queries: 14,847 (99.2% TXT records)\n  Domain: *.t1.data-analytics-cdn[.]net\n  Subdomain pattern: [Base64 string].t1.data-analytics-cdn[.]net\n  Average subdomain length: 63 characters (the maximum label)\n  Shannon entropy: 5.82 (high — indicates encoded data)\n  Rate: ~247 queries/minute",
          isCritical: true,
        },
        {
          id: "data-decoded-samples",
          label: "Decoded DNS Subdomain Samples",
          content:
            "Base64-decoded subdomain payloads:\n  'health_record_id=1001'\n  'user_ssn=543-21-98...'\n  'dob=1985-03-22, dia...'\n  'gnosis=hypertension, p...'\n\nThe subdomains encode rows from the patients table —\nincluding Social Security numbers, dates of birth, and\nmedical diagnoses (HIPAA PHI).\nEstimated volume: ~694 KB ≈ 2,400 patient records in 60 minutes.",
          isCritical: true,
        },
        {
          id: "data-server-context",
          label: "Server and Network Context",
          content:
            "Server: prod-db-primary — PostgreSQL 15, patient records\nEDR process tree:\n  systemd -> cron -> /tmp/.cache/syshealth (unsigned ELF binary,\n  not from any package) — started 3 minutes after an SSH login\n  from the jump server; it queries the patients table in\n  increments and generates the DNS queries via raw socket.\n\nFirewall: server may only reach DNS (udp/53), NTP, and patch\nrepos. DNS is the one open channel — and the one being used.",
        },
      ],
      actions: [
        {
          id: "act-confirm-exfil",
          label: "Reject the summary — confirm active PHI exfiltration via DNS tunneling and invoke HIPAA breach response",
          color: "red",
        },
        {
          id: "act-legitimate-analytics",
          label: "Accept the summary — close as legitimate analytics data collection",
          color: "green",
        },
        {
          id: "act-block-dns-monitor",
          label: "Block the domain at the resolver and continue monitoring",
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
          text: "The summary classified the traffic from the domain's NAME — 'analytics' — without decoding a single query. Decoded, the subdomains are patient records: SSNs, birth dates, diagnoses, exfiltrated at ~2,400 records per hour by an unsigned binary in /tmp that appeared minutes after a jump-server login. This is confirmed PHI disclosure, which triggers HIPAA breach response and its notification clock, not a ticket closure.",
        },
        {
          id: "rat-not-legitimate",
          text: "No analytics service collects data by Base64-encoding a hospital's patient table into maximum-length DNS labels at 247 queries a minute from a cron-spawned binary in a cache directory. 'TXT records are used for verification' is a true sentence about a different phenomenon by several orders of magnitude.",
        },
        {
          id: "rat-block-insufficient",
          text: "Blocking the domain stops the bleeding; it does not discharge the legal obligation. Roughly 2,400 patients' PHI has already left the network — breach notification duties exist independently of how quickly the channel is closed.",
        },
        {
          id: "rat-isolate-insufficient",
          text: "Isolation without breach declaration repeats the summary's error in slower motion: treating a regulatory event as a purely technical one. Containment and breach response run in parallel; neither substitutes for the other.",
        },
      ],
      correctRationaleId: "rat-exfil-confirmed",
      feedback: {
        perfect:
          "Outstanding. You decoded what the summary only named. A domain called 'analytics' carrying Base64 patient records out of a production database is exfiltration wearing a name tag — and with PHI confirmed gone, breach response is mandatory, not optional.",
        partial:
          "You identified the tunneling, but with decoded PHI (SSNs, diagnoses, ~2,400 records) the incident is a confirmed breach: containment plus formal HIPAA breach response. Blocking and monitoring alone leaves the legal clock unstarted.",
        wrong:
          "The AI classified by vibes: the domain said 'analytics,' so the traffic was analytics. One decode of any subdomain — 'user_ssn=', 'diagnosis=hypertension' — refutes it. Summaries generated from labels and surface patterns will eventually wave through exactly the incident that matters most. Decode the samples. Always.",
      },
    },
  ],
  hints: [
    "Read the AI summary last, not first. Form your classification from the raw evidence, then check whether the summary survives it — summaries anchor judgment even when they're wrong.",
    "When a summary calls something benign, find the specific fact that would make it benign (scanner IP, signed updater process, expected domain age) and verify that fact. Benign stories have checkable premises; so do malicious ones.",
    "DNS tunneling encodes data in subdomain labels: maximum-length (63-character) high-entropy labels queried at high rates are the signature. Always decode sample subdomains — the payload content settles every argument about intent.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "AI SOC assistants are very good at the incidents that don't matter — the repetitive, the benign, the already-understood — and structurally prone to waving through the novel intrusion, because novelty is what 'doesn't match known patterns' means. The analyst's job is shifting from writing summaries to auditing them: the people who thrive in AI-assisted SOCs are the ones who check the summary's premises against the raw events, especially when the summary recommends closing.",
  toolRelevance: [
    "Splunk Enterprise Security",
    "Microsoft Sentinel",
    "CrowdStrike Falcon LogScale",
    "Elastic Security (ELK)",
    "IBM QRadar",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-10-18",
};

export default lab;
