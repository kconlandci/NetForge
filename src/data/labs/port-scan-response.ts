import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "port-scan-response",
  version: 1,
  title: "Respond to Detected Port Scans",
  tier: "intermediate",
  track: "network-security",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["port-scan", "nmap", "ids", "firewall", "incident-response", "reconnaissance"],
  description:
    "Analyze detected port scan patterns from IDS alerts and firewall logs, classify the threat severity, and implement appropriate countermeasures to protect network assets.",
  estimatedMinutes: 14,
  learningObjectives: [
    "Identify different port scan techniques (SYN, FIN, XMAS, UDP) from network logs",
    "Classify the severity of port scan activity based on scan patterns and source reputation",
    "Select the appropriate countermeasure based on the scan type and organizational risk tolerance",
    "Distinguish between legitimate vulnerability assessments and malicious reconnaissance",
  ],
  sortOrder: 405,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "psr-001",
      title: "SYN Scan Targeting Critical Subnet",
      description:
        "Your IDS triggered multiple alerts for a SYN scan originating from an external IP address targeting your server subnet. The scan has been running for 12 minutes and has probed over 200 ports on 15 hosts.",
      evidence: [
        {
          type: "log",
          content:
            "Snort Alert Log:\n[**] [1:1000001:1] SCAN SYN FIN [**]\n03/28-09:14:22.431 198.51.100.77:43281 -> 10.10.50.0/24\nPriority: 2\n\n$ sudo tcpdump -nn host 198.51.100.77 | head -10\n09:14:22.431 IP 198.51.100.77.43281 > 10.10.50.10.22: Flags [S], seq 0, win 1024\n09:14:22.432 IP 198.51.100.77.43282 > 10.10.50.10.80: Flags [S], seq 0, win 1024\n09:14:22.433 IP 198.51.100.77.43283 > 10.10.50.10.443: Flags [S], seq 0, win 1024\n09:14:22.434 IP 198.51.100.77.43284 > 10.10.50.10.3306: Flags [S], seq 0, win 1024\n09:14:22.501 IP 198.51.100.77.43285 > 10.10.50.11.22: Flags [S], seq 0, win 1024\n09:14:22.502 IP 198.51.100.77.43286 > 10.10.50.11.80: Flags [S], seq 0, win 1024\n09:14:22.503 IP 198.51.100.77.43287 > 10.10.50.11.445: Flags [S], seq 0, win 1024\n09:14:22.600 IP 198.51.100.77.43288 > 10.10.50.12.22: Flags [S], seq 0, win 1024\n09:14:22.601 IP 198.51.100.77.43289 > 10.10.50.12.1433: Flags [S], seq 0, win 1024\n09:14:22.602 IP 198.51.100.77.43290 > 10.10.50.12.3389: Flags [S], seq 0, win 1024",
        },
        {
          type: "log",
          content:
            "Threat Intelligence:\n198.51.100.77 - Listed on 3 blocklists (AbuseIPDB confidence: 92%)\nASN: AS-BULLETPROOF-HOSTING\nCountry: Unknown (VPN/Proxy detected)\nLast reported: 2026-03-26 for port scanning activity\n\nTarget subnet 10.10.50.0/24: Production database and application servers\nNo scheduled vulnerability scans authorized for today.",
        },
      ],
      classifications: [
        { id: "c1", label: "Critical - Active Reconnaissance by Known Threat Actor", description: "A known malicious IP is performing systematic reconnaissance against production infrastructure" },
        { id: "c2", label: "Medium - Routine Internet Background Noise", description: "Opportunistic scanning common on the internet, no specific targeting" },
        { id: "c3", label: "Low - Authorized Vulnerability Scan", description: "A scheduled or authorized penetration test or vulnerability assessment" },
        { id: "c4", label: "High - Possible Worm Propagation", description: "Automated malware spreading by scanning for vulnerable services" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Block source IP at the perimeter firewall and enable rate-limiting for SYN packets", description: "Add an explicit deny rule for 198.51.100.77 and configure SYN flood protection on the firewall" },
        { id: "rem2", label: "Ignore the scan since the firewall will block unauthorized access", description: "Rely on existing firewall rules to prevent access to closed ports" },
        { id: "rem3", label: "Shut down all services on the target subnet", description: "Take servers offline to prevent any exploitation" },
        { id: "rem4", label: "Send an abuse complaint to the source ISP", description: "Report the scanning activity and wait for the ISP to take action" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "The source IP is on multiple blocklists with 92% abuse confidence, hosted on bulletproof infrastructure, and is systematically scanning production database and application servers. Immediate blocking plus SYN rate-limiting prevents follow-up exploitation attempts." },
        { id: "rat2", text: "Ignoring the scan is dangerous because the attacker is actively mapping open ports on production servers. Even with a firewall, any misconfigured rules or newly opened ports could be exploited." },
        { id: "rat3", text: "Shutting down all services is excessive and causes a self-inflicted denial of service. The appropriate response is to block the attacker, not disrupt your own operations." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Excellent! You correctly identified a targeted reconnaissance operation from a known malicious source and chose to block the IP while adding SYN rate-limiting to protect against follow-up attacks.",
        partial: "You identified the threat correctly but the remediation needs to be more decisive. Blocking the source IP and enabling rate-limiting addresses both this scan and potential follow-up activity.",
        wrong: "This is active reconnaissance from a known malicious IP (92% abuse confidence, bulletproof hosting) targeting production servers. It requires immediate blocking at the firewall perimeter, not passive monitoring.",
      },
    },
    {
      type: "triage-remediate",
      id: "psr-002",
      title: "Stealthy FIN Scan Detected After Hours",
      description:
        "Network monitoring detected unusual FIN packets arriving at a slow rate targeting your DMZ servers during off-hours. The scan has been trickling in over 4 hours with approximately one probe every 30 seconds.",
      evidence: [
        {
          type: "log",
          content:
            "Suricata Alert:\n[1:2001228:6] ET SCAN Potential FIN Scan\n03/27 23:14:05 - 03/28 03:22:18 (4+ hours)\nSource: 203.0.113.200:varied -> DMZ 172.16.1.0/28\n\n$ tshark -r capture.pcap -Y 'tcp.flags.fin==1 && tcp.flags.ack==0' | tail -8\n23:14:05 203.0.113.200 -> 172.16.1.2   TCP  60  41022 > 21   [FIN]\n23:14:34 203.0.113.200 -> 172.16.1.2   TCP  60  41023 > 25   [FIN]\n23:15:06 203.0.113.200 -> 172.16.1.2   TCP  60  41024 > 53   [FIN]\n23:15:38 203.0.113.200 -> 172.16.1.3   TCP  60  41025 > 80   [FIN]\n23:16:09 203.0.113.200 -> 172.16.1.3   TCP  60  41026 > 443  [FIN]\n23:16:40 203.0.113.200 -> 172.16.1.3   TCP  60  41027 > 8080 [FIN]\n23:17:12 203.0.113.200 -> 172.16.1.4   TCP  60  41028 > 22   [FIN]\n23:17:43 203.0.113.200 -> 172.16.1.4   TCP  60  41029 > 3306 [FIN]",
        },
        {
          type: "log",
          content:
            "Scan characteristics:\n- FIN-only packets (no SYN, no ACK) = stealth technique to evade stateful firewalls\n- ~30 second interval between probes = slow scan to avoid rate-based detection\n- Targeting well-known service ports: 21, 22, 25, 53, 80, 443, 3306, 8080\n- Off-hours timing (23:00 - 03:00) suggests deliberate evasion\n\nThreat Intel:\n203.0.113.200 - No prior reports, clean reputation\nGeoIP: Eastern Europe\nReverse DNS: none",
        },
      ],
      classifications: [
        { id: "c1", label: "High - Deliberate Stealth Reconnaissance", description: "An attacker is using evasion techniques to map DMZ services while avoiding detection" },
        { id: "c2", label: "Low - Malformed Packet Noise", description: "Random malformed packets from a misconfigured system" },
        { id: "c3", label: "Medium - Automated Scanner", description: "An automated tool performing broad internet scanning" },
        { id: "c4", label: "Critical - Active Exploitation Attempt", description: "An attacker actively exploiting vulnerabilities on DMZ servers" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Block the source IP, verify firewall drops FIN-only packets, and review DMZ host logs", description: "Block the scanner, ensure the stateful firewall drops unsolicited FIN packets, and check if any probes received responses" },
        { id: "rem2", label: "Wait and continue monitoring for escalation", description: "The scan is slow and may stop on its own; continue observing" },
        { id: "rem3", label: "Reconfigure DMZ hosts to not respond to FIN scans", description: "Modify TCP stack behavior on each server to drop FIN-only packets" },
        { id: "rem4", label: "Enable tarpit on the firewall to slow down the attacker", description: "Use TCP tarpit to waste the attacker's time and resources" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "FIN-only packets are a classic stealth scan technique (nmap -sF) designed to bypass stateless firewalls. The slow timing and off-hours execution indicate a deliberate, targeted operation. Blocking the IP, validating that the stateful firewall drops these packets, and checking for successful responses ensures comprehensive defense." },
        { id: "rat2", text: "Waiting and monitoring allows the attacker to complete reconnaissance. Even if the scan is slow, each successful probe reveals information about open ports that could be used in a follow-up attack." },
        { id: "rat3", text: "A TCP tarpit wastes attacker resources but does not prevent them from gathering information about open ports. The priority is to stop information leakage, not to slow the attacker." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Spot on! FIN scans are a deliberate evasion technique. Blocking the source, validating firewall behavior against stealth scans, and checking for information leakage is the correct multi-layered response.",
        partial: "You recognized the stealth nature of the scan but the remediation should be more comprehensive. Block the IP and also verify the firewall properly handles FIN-only packets to prevent information disclosure.",
        wrong: "FIN-only packets with no SYN/ACK, sent at 30-second intervals during off-hours, are a deliberate stealth reconnaissance technique. This requires immediate blocking and firewall hardening, not passive monitoring.",
      },
    },
    {
      type: "triage-remediate",
      id: "psr-003",
      title: "Internal Host Performing Network Sweep",
      description:
        "Your SIEM correlated alerts showing an internal workstation performing rapid ICMP and TCP SYN sweeps across multiple internal subnets during business hours.",
      evidence: [
        {
          type: "log",
          content:
            "SIEM Correlation Alert: Internal Network Sweep Detected\nSource: 10.1.5.22 (WORKSTATION-MKT-07, Marketing department)\nUser: jsmith\n\n$ show ip arp | include 10.1.5.22\n10.1.5.22  0050.56a1.2b3c  VLAN 105  GigabitEthernet0/7\n\nFirewall internal log (last 5 minutes):\n09:32:01 ICMP 10.1.5.22 -> 10.1.1.1    Echo Request\n09:32:01 ICMP 10.1.5.22 -> 10.1.1.2    Echo Request\n09:32:01 ICMP 10.1.5.22 -> 10.1.1.3    Echo Request\n...(450 ICMP echo requests to 10.1.1.0/24 in 3 seconds)\n09:32:05 TCP  10.1.5.22:55001 -> 10.1.2.10:445  [SYN]\n09:32:05 TCP  10.1.5.22:55002 -> 10.1.2.11:445  [SYN]\n09:32:05 TCP  10.1.5.22:55003 -> 10.1.2.12:445  [SYN]\n09:32:06 TCP  10.1.5.22:55004 -> 10.1.3.5:3389   [SYN]\n09:32:06 TCP  10.1.5.22:55005 -> 10.1.3.6:3389   [SYN]",
        },
        {
          type: "log",
          content:
            "Host details:\n- WORKSTATION-MKT-07: Windows 11, marketing department\n- User jsmith: Marketing coordinator, no IT admin privileges\n- No authorized scanning tools installed per software inventory\n- EDR alert: nmap.exe detected running as user jsmith\n- Last login: 09:28 today (4 minutes before scanning began)\n\nSubnets targeted:\n- 10.1.1.0/24 - Server VLAN (ICMP sweep)\n- 10.1.2.0/24 - File server VLAN (SMB port 445)\n- 10.1.3.0/24 - Management VLAN (RDP port 3389)",
        },
      ],
      classifications: [
        { id: "c1", label: "Critical - Compromised Host / Insider Threat", description: "An internal workstation with no authorization is performing network reconnaissance, indicating compromise or malicious insider activity" },
        { id: "c2", label: "Medium - Shadow IT Tool Usage", description: "A user installed an unauthorized tool for troubleshooting purposes" },
        { id: "c3", label: "Low - DHCP or ARP Storm", description: "A misconfigured network service causing broadcast-like behavior" },
        { id: "c4", label: "High - Worm Propagation", description: "Automated malware scanning the internal network for propagation targets" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Isolate the workstation at the switch port and initiate incident response", description: "Disable the switch port or move it to an isolated VLAN, preserve forensic evidence, and investigate the user account" },
        { id: "rem2", label: "Uninstall nmap from the workstation remotely", description: "Use remote management to remove the scanning tool" },
        { id: "rem3", label: "Block ICMP and SYN traffic from the marketing VLAN", description: "Add ACLs to prevent the marketing subnet from scanning other VLANs" },
        { id: "rem4", label: "Send an email to jsmith's manager about the policy violation", description: "Report the unauthorized tool usage through HR channels" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "A marketing user running nmap to sweep server, file server, and management VLANs (specifically targeting SMB and RDP) is a strong indicator of either a compromised account or insider threat. Immediate network isolation preserves evidence and stops potential lateral movement before the attacker can exploit discovered services." },
        { id: "rat2", text: "Simply uninstalling nmap does not address the root cause. If the host is compromised, the attacker has other tools available. If it is an insider threat, the user can reinstall the tool." },
        { id: "rat3", text: "Blocking ICMP/SYN from the entire marketing VLAN is too broad and disrupts legitimate business traffic. The issue is this specific host, not the entire subnet." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Excellent response! A non-IT user running nmap against server, file share, and management VLANs is a critical indicator of compromise or insider threat. Immediate isolation and incident response is the correct action.",
        partial: "You identified the severity but the remediation should prioritize isolating the host. Removing the tool or adding broad ACLs does not address the underlying compromise or insider threat.",
        wrong: "A marketing coordinator running nmap scans against server and management VLANs is not routine. This indicates a compromised host or insider threat requiring immediate isolation and investigation.",
      },
    },
  ],
  hints: [
    "Check the source IP reputation and scan timing to assess whether the scan is opportunistic or targeted.",
    "FIN-only packets without a preceding SYN are never part of legitimate TCP communication and indicate stealth scanning.",
    "Internal hosts performing network sweeps, especially targeting sensitive VLANs with specific service ports, should be treated as compromised until proven otherwise.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "SOC analysts classify and respond to port scan alerts daily. Knowing how to differentiate targeted reconnaissance from internet noise and choosing proportional countermeasures is a foundational skill for any network security role.",
  toolRelevance: ["Snort", "Suricata", "tcpdump", "Wireshark", "nmap"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
