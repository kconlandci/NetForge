import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "port-identification-triage",
  version: 1,
  title: "Port Identification Triage",
  tier: "beginner",
  track: "network-fundamentals",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["ports", "tcp", "udp", "security", "triage"],
  description:
    "Classify and respond to unknown port activity detected on your network by identifying services and assessing risk.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Identify common well-known ports and their associated services",
    "Classify unexpected port activity by severity level",
    "Determine appropriate remediation for unauthorized services",
  ],
  sortOrder: 107,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "pit-001",
      title: "Unexpected Listening Port on Web Server",
      description:
        "A security scan reveals an unexpected open port on a production web server that should only run HTTPS (443).",
      evidence: [
        {
          type: "log",
          content:
            "$ netstat -tlnp | grep LISTEN\ntcp  0  0  0.0.0.0:443    0.0.0.0:*  LISTEN  1234/nginx\ntcp  0  0  0.0.0.0:3389   0.0.0.0:*  LISTEN  5678/xrdp\ntcp  0  0  0.0.0.0:22     0.0.0.0:*  LISTEN  910/sshd",
        },
        {
          type: "log",
          content:
            "Firewall audit log:\nPort 443/tcp - ALLOWED (policy: web-server)\nPort 3389/tcp - NO RULE (default: allow)\nPort 22/tcp - ALLOWED (policy: management)\n\nServer role: Production web server\nRDP policy: Disabled on all Linux production servers",
        },
      ],
      classifications: [
        { id: "c1", label: "Critical - Unauthorized Remote Access", description: "An unauthorized remote desktop service is running on a production server, providing potential unauthorized access" },
        { id: "c2", label: "Medium - Misconfigured Service", description: "A legitimate service is running on a non-standard port" },
        { id: "c3", label: "Low - Informational", description: "A standard monitoring agent is operating normally" },
        { id: "c4", label: "False Positive", description: "The scan incorrectly identified the port as open" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Stop the xrdp service and block port 3389 in the firewall", description: "Immediately disable the unauthorized remote desktop service and add a firewall deny rule" },
        { id: "rem2", label: "Change the RDP port to a non-standard number", description: "Move the service to an obscure port to avoid detection" },
        { id: "rem3", label: "Monitor the port for 30 days before taking action", description: "Observe traffic patterns to determine if the service is in use" },
        { id: "rem4", label: "Restart the server to clear the process", description: "Reboot to stop any unauthorized processes" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "RDP (port 3389) on a Linux production web server violates the security policy prohibiting RDP on production servers. This represents an unauthorized remote access vector that must be immediately disabled." },
        { id: "rat2", text: "Changing the port does not address the policy violation. The service should not be running at all on this server, regardless of what port it uses." },
        { id: "rat3", text: "Waiting 30 days to monitor an unauthorized remote access service on a production server introduces unacceptable risk. The remediation must be immediate." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Excellent triage! RDP on a Linux production web server is a critical policy violation. Stopping the service and blocking the port is the correct immediate response.",
        partial: "You identified part of the issue. Port 3389 (RDP) running on a production web server that should only serve HTTPS is a critical security concern requiring immediate action.",
        wrong: "This is a critical finding. Port 3389 (RDP/xrdp) is running on a production web server in violation of policy. The service must be stopped and the port blocked immediately.",
      },
    },
    {
      type: "triage-remediate",
      id: "pit-002",
      title: "High-Port Activity From Internal Workstation",
      description:
        "Network monitoring detected unusual outbound connections from a user workstation to external hosts on high ports.",
      evidence: [
        {
          type: "log",
          content:
            "Firewall log - Source: 10.1.1.50 (Marketing-WS-03)\n10:01:15 TCP 10.1.1.50:49152 -> 203.0.113.50:4444 ESTABLISHED\n10:01:16 TCP 10.1.1.50:49153 -> 203.0.113.50:4444 ESTABLISHED\n10:01:18 TCP 10.1.1.50:49154 -> 198.51.100.25:8080 SYN_SENT\n10:01:20 TCP 10.1.1.50:49155 -> 203.0.113.50:4444 ESTABLISHED",
        },
        {
          type: "log",
          content:
            "Threat intelligence lookup:\n203.0.113.50 - Known C2 (Command and Control) server\nPort 4444 - Common Metasploit/Meterpreter default port\n198.51.100.25 - No threat data available\n\nUser activity: User reports they received and opened an email attachment 30 minutes ago",
        },
      ],
      classifications: [
        { id: "c1", label: "Critical - Active Malware C2 Communication", description: "The workstation is communicating with a known command-and-control server" },
        { id: "c2", label: "Medium - Suspicious but unconfirmed", description: "Unusual traffic that needs further investigation" },
        { id: "c3", label: "Low - Legitimate application traffic", description: "Normal business application using high ports" },
        { id: "c4", label: "High - Policy violation", description: "User accessing unauthorized external services" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Isolate the workstation from the network and begin incident response", description: "Immediately quarantine the host to stop C2 communication and preserve evidence for forensic analysis" },
        { id: "rem2", label: "Block the external IP in the firewall", description: "Add a firewall rule to deny traffic to 203.0.113.50" },
        { id: "rem3", label: "Run an antivirus scan on the workstation", description: "Perform a full system scan to detect and remove malware" },
        { id: "rem4", label: "Contact the user and ask them to close the application", description: "Have the user terminate the suspicious process" },
      ],
      correctRemediationId: "rem1",

      rationales: [
        { id: "rat1", text: "Multiple established connections to a known C2 server on port 4444 (Meterpreter default) after a user opened an email attachment is a textbook malware compromise. Network isolation stops data exfiltration and lateral movement while preserving forensic evidence." },
        { id: "rat2", text: "Only blocking the IP is insufficient - the malware may have additional C2 servers configured. Full isolation prevents all outbound communication and lateral movement." },
        { id: "rat3", text: "Asking the user to close the application risks alerting the attacker and may trigger destructive actions from the malware. The workstation should be isolated at the network level." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Perfect triage! Active C2 communication requires immediate network isolation. You correctly identified the threat indicators and chose containment as the priority action.",
        partial: "You recognized the severity but the remediation should prioritize isolation. Blocking one IP or running AV is insufficient when active C2 communication is occurring.",
        wrong: "This is an active malware compromise. Port 4444 connections to a known C2 server, combined with the user opening a suspicious attachment, require immediate network isolation and incident response.",
      },
    },
    {
      type: "triage-remediate",
      id: "pit-003",
      title: "Database Port Exposed to the Internet",
      description:
        "A quarterly vulnerability assessment reveals that an internal database server's port is accessible from the Internet.",
      evidence: [
        {
          type: "log",
          content:
            "External vulnerability scan results:\nHost: 203.0.113.100 (company public IP)\nOpen port: 3306/tcp (MySQL)\nService: MySQL 8.0.32\nBanner: 5.7.42-0ubuntu0.18.04.1\n\nNAT translation table:\n203.0.113.100:3306 -> 10.10.10.50:3306 (db-prod-01)",
        },
        {
          type: "log",
          content:
            "MySQL access log (last 24 hours):\nFailed login attempts from external IPs: 12,847\nTop sources: 45.33.32.0/24 (scanner), 185.220.101.0/24 (Tor exit)\n\nFirewall rule audit:\nRule 47: ALLOW TCP ANY -> 203.0.113.100:3306\nNote: Rule added 2025-12-01 by 'admin' with comment 'temp access for migration'",
        },
      ],
      classifications: [
        { id: "c1", label: "Critical - Production Database Exposed to Internet", description: "A production database is directly accessible from the Internet with active brute-force attempts" },
        { id: "c2", label: "High - Temporary rule left in place", description: "A firewall rule that was meant to be temporary has not been removed" },
        { id: "c3", label: "Medium - Standard port scan activity", description: "Normal background scanning that all Internet-facing services experience" },
        { id: "c4", label: "Low - Database is password protected", description: "The database requires authentication so the exposure is minimal" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Remove firewall rule 47 and audit for unauthorized database access", description: "Immediately close the NAT rule exposing MySQL and review access logs for any successful unauthorized logins" },
        { id: "rem2", label: "Change the MySQL port to a non-standard number", description: "Move MySQL to a different port to avoid automated scanning" },
        { id: "rem3", label: "Add IP-based access restrictions to the existing rule", description: "Limit the firewall rule to known partner IP addresses" },
        { id: "rem4", label: "Enable MySQL SSL and stronger passwords", description: "Harden the MySQL configuration to resist brute-force attacks" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "A production database exposed to the Internet with nearly 13,000 brute-force attempts in 24 hours is a critical risk. The temporary firewall rule from the migration was never removed. Deleting the rule immediately closes the exposure, and log auditing determines if any breach occurred." },
        { id: "rat2", text: "Changing ports is security through obscurity and does not address the fundamental problem of a database being Internet-accessible. Scanners will find any port." },
        { id: "rat3", text: "The migration is complete, so no external access is needed. The rule should be fully removed, not restricted. Any legitimate remote access should use a VPN." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Excellent response! Removing the forgotten temporary rule and auditing for compromise is the correct approach. Production databases should never be Internet-accessible.",
        partial: "You identified the severity correctly but the remediation should fully remove the rule, not modify it. The migration is complete and no Internet access to the database is needed.",
        wrong: "A production MySQL server exposed to the Internet with thousands of brute-force attempts is critical. The temporary firewall rule must be removed immediately and logs audited for any successful unauthorized access.",
      },
    },
  ],
  hints: [
    "Well-known ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3306 (MySQL), 3389 (RDP), 4444 (common Metasploit). Knowing default ports helps classify unexpected activity.",
    "When triaging port activity, consider the server's role. RDP on a web server or MySQL on the Internet are red flags regardless of whether the services are 'working correctly.'",
    "Active connections to known C2 servers require immediate isolation, not just monitoring. The speed of response directly impacts the scope of a breach.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Port identification and triage is a daily task for SOC analysts and penetration testers. The ability to quickly classify port activity by risk level is a critical skill tested in Security+ and CySA+ certifications.",
  toolRelevance: ["netstat", "nmap", "ss", "Wireshark", "firewall-cmd"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
