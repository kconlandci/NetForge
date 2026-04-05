import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "dmz-design-review",
  version: 1,
  title: "Review DMZ Architecture for Security Flaws",
  tier: "intermediate",
  track: "network-security",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["dmz", "architecture", "firewall", "zones", "defense-in-depth", "network-design"],
  description:
    "Investigate DMZ architecture designs by examining firewall rules, network diagrams, and traffic flows to identify security flaws and recommend corrections.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Identify common DMZ architecture flaws such as missing segmentation or overly permissive firewall rules",
    "Evaluate whether DMZ traffic flows follow the principle of least privilege",
    "Recommend corrections to DMZ designs that maintain functionality while improving security",
    "Understand the role of dual-firewall and single-firewall DMZ topologies",
  ],
  sortOrder: 406,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "ddr-001",
      title: "DMZ Web Server Reaching Internal Database Directly",
      objective:
        "Review the firewall rules and network diagram to determine if the DMZ web server's database connectivity is properly secured.",
      investigationData: [
        {
          id: "inv-diagram",
          label: "Network Topology",
          content:
            "Internet -> [Firewall-External] -> DMZ (172.16.1.0/24) -> [Firewall-Internal] -> LAN (10.0.0.0/16)\n\nDMZ Hosts:\n  172.16.1.10 - Web Server (Apache, port 443)\n  172.16.1.11 - Reverse Proxy (nginx, port 443)\n\nLAN Hosts:\n  10.0.1.50 - MySQL Database (port 3306)\n  10.0.1.51 - Application Server (port 8443)\n  10.0.2.0/24 - User workstations",
          isCritical: true,
        },
        {
          id: "inv-fw-rules",
          label: "Internal Firewall Rules",
          content:
            "Firewall-Internal Rule Set (evaluated top-down):\n\nRule 10: ALLOW TCP 172.16.1.10 -> 10.0.1.50:3306  (Web to DB)\nRule 20: ALLOW TCP 172.16.1.10 -> 10.0.1.51:8443  (Web to App)\nRule 30: ALLOW TCP 172.16.1.11 -> 10.0.1.51:8443  (Proxy to App)\nRule 40: ALLOW TCP 10.0.2.0/24 -> 172.16.1.10:443  (Users to Web - WRONG DIRECTION)\nRule 50: DENY   ANY  172.16.1.0/24 -> 10.0.0.0/16   (Default deny DMZ to LAN)\nRule 99: DENY   ANY  ANY -> ANY                      (Implicit deny)",
          isCritical: true,
        },
        {
          id: "inv-traffic",
          label: "Recent Traffic Logs",
          content:
            "$ show firewall session table | include 172.16.1.10\nTCP 172.16.1.10:44521 -> 10.0.1.50:3306  ESTABLISHED  12,847 packets\nTCP 172.16.1.10:44522 -> 10.0.1.50:3306  ESTABLISHED   8,201 packets\nTCP 172.16.1.10:44523 -> 10.0.1.50:3306  ESTABLISHED   3,102 packets\n\nNote: Web server has 3 persistent database connections open directly to MySQL.",
        },
      ],
      actions: [
        { id: "act-remove-direct", label: "Remove Rule 10 and route all DB traffic through the application server", color: "green" },
        { id: "act-keep-design", label: "Keep the current design as the internal firewall already restricts access", color: "yellow" },
        { id: "act-add-ids", label: "Add an IDS between DMZ and LAN to monitor the database connections", color: "orange" },
        { id: "act-vpn", label: "Require the web server to use a VPN tunnel to reach the database", color: "blue" },
      ],
      correctActionId: "act-remove-direct",
      rationales: [
        { id: "rat1", text: "A DMZ host should never have direct access to internal database servers. If the web server in the DMZ is compromised, the attacker gains a direct path to the database. The application server should act as an intermediary, providing an additional layer of defense and input validation." },
        { id: "rat2", text: "The internal firewall restricts access to only port 3306, but this still allows SQL injection or data exfiltration if the web server is compromised. Defense-in-depth requires eliminating direct DMZ-to-database connectivity." },
        { id: "rat3", text: "Adding an IDS provides detection but does not prevent exploitation. The architectural flaw is the direct database access path, which should be eliminated rather than just monitored." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! Direct DMZ-to-database access violates defense-in-depth. Routing traffic through the application server adds a security layer and eliminates direct database exposure to the DMZ.",
        partial: "You recognized there is an issue, but the best fix is to eliminate direct database access from the DMZ entirely by routing through the application server.",
        wrong: "A compromised DMZ web server with direct MySQL access gives an attacker a straight path to your database. This architectural flaw must be corrected by removing Rule 10 and using the application server as an intermediary.",
      },
    },
    {
      type: "investigate-decide",
      id: "ddr-002",
      title: "Single-Firewall DMZ with Flat Internal Network",
      objective:
        "Evaluate a small company's single-firewall DMZ design and determine the most critical security improvement needed.",
      investigationData: [
        {
          id: "inv-topology",
          label: "Current Network Design",
          content:
            "Internet -> [FortiGate 60F] -> Three zones:\n  Zone: WAN     (port1) - Internet uplink\n  Zone: DMZ     (port2) - 192.168.100.0/24\n  Zone: INTERNAL (port3) - 192.168.1.0/24 (FLAT - all hosts)\n\nDMZ Hosts:\n  192.168.100.10 - Public website (HTTPS)\n  192.168.100.11 - Mail relay (SMTP)\n\nInternal Hosts (ALL on same subnet):\n  192.168.1.10 - Domain Controller\n  192.168.1.20 - File Server\n  192.168.1.30 - HR Payroll Application\n  192.168.1.50-100 - User workstations",
          isCritical: true,
        },
        {
          id: "inv-policies",
          label: "Firewall Policies",
          content:
            "FortiGate Policies:\nID  From      To        Source             Dest               Service    Action\n1   WAN       DMZ       all                192.168.100.10     HTTPS      ACCEPT\n2   WAN       DMZ       all                192.168.100.11     SMTP       ACCEPT\n3   DMZ       INTERNAL  192.168.100.11     192.168.1.10       LDAP       ACCEPT\n4   DMZ       INTERNAL  192.168.100.0/24   192.168.1.0/24     ALL        ACCEPT  <<<\n5   INTERNAL  DMZ       192.168.1.0/24     192.168.100.0/24   ALL        ACCEPT\n6   INTERNAL  WAN       192.168.1.0/24     all                ALL        ACCEPT\n7   ANY       ANY       all                all                ALL        DENY",
          isCritical: true,
        },
        {
          id: "inv-context",
          label: "Business Context",
          content:
            "Company: 50 employees, growing 20% year-over-year\nIT Staff: 1 sysadmin (part-time security duties)\nCompliance: SOC 2 Type II audit scheduled in 6 months\nBudget: Limited but management approved security improvements\nRecent incident: Mail relay was compromised via RCE vulnerability last quarter. Attacker had access for 2 hours before detection.",
        },
      ],
      actions: [
        { id: "act-fix-rule4", label: "Replace Policy 4 with specific service rules and segment the internal network", color: "green" },
        { id: "act-add-fw", label: "Add a second firewall to create a dual-firewall DMZ topology", color: "blue" },
        { id: "act-segment-only", label: "Segment the internal network into VLANs but keep firewall policies unchanged", color: "yellow" },
        { id: "act-ids-only", label: "Deploy an IDS on the internal network to detect lateral movement", color: "orange" },
      ],
      correctActionId: "act-fix-rule4",
      rationales: [
        { id: "rat1", text: "Policy 4 allows the entire DMZ subnet unrestricted access to the entire internal network. Combined with the flat internal network, a compromised DMZ host (as happened with the mail relay) can reach every internal resource including the domain controller and payroll system. Replacing this with specific service rules and segmenting the internal network addresses both the overly permissive policy and the flat network architecture." },
        { id: "rat2", text: "A second firewall adds defense-in-depth but does not fix Policy 4, which grants DMZ-to-internal ALL access. The overly permissive rule is the more urgent problem since the existing firewall can enforce proper segmentation." },
        { id: "rat3", text: "Segmenting the internal network alone does not help if Policy 4 still permits the DMZ full access to all internal segments. The firewall policy must be tightened simultaneously." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! Policy 4 is the critical flaw: it grants the DMZ unrestricted access to the entire flat internal network. Combined with segmentation, replacing this with specific rules eliminates the blast radius of a DMZ compromise.",
        partial: "You identified an issue, but the most critical problem is Policy 4 granting DMZ-to-LAN ALL access combined with a flat internal network. Both must be fixed together.",
        wrong: "Policy 4 allows DMZ -> INTERNAL with ALL services. When the mail relay was compromised, the attacker could reach every internal host. This overly permissive rule combined with no internal segmentation is the critical flaw.",
      },
    },
    {
      type: "investigate-decide",
      id: "ddr-003",
      title: "DMZ Management Access Path Review",
      objective:
        "Evaluate how administrators access DMZ servers and determine if the management plane is properly secured.",
      investigationData: [
        {
          id: "inv-access",
          label: "Admin Access Methods",
          content:
            "Current DMZ server management access:\n\n$ show firewall rules | grep -i 'mgmt\\|ssh\\|rdp'\nRule 60: ALLOW TCP 10.0.2.0/24 -> 172.16.1.0/24:22   (Workstations to DMZ SSH)\nRule 61: ALLOW TCP 10.0.2.0/24 -> 172.16.1.0/24:3389  (Workstations to DMZ RDP)\nRule 62: ALLOW TCP 0.0.0.0/0   -> 172.16.1.10:22       (ANY to DMZ Web SSH)\n\nAdmins connect from:\n- Office workstations (10.0.2.0/24) via SSH/RDP directly\n- Remote admins SSH directly from the internet to DMZ web server\n- No jump host or bastion server deployed",
          isCritical: true,
        },
        {
          id: "inv-auth",
          label: "Authentication Configuration",
          content:
            "$ grep -E 'PasswordAuth|PermitRoot|Port' /etc/ssh/sshd_config\nPort 22\nPermitRootLogin yes\nPasswordAuthentication yes\n\n$ last -10 | head -10\nroot  pts/0  45.33.32.156   Mar 28 02:14   still logged in\nroot  pts/1  118.25.6.39    Mar 27 19:22 - 19:45\nroot  pts/0  admin-ws.local Mar 27 14:10 - 17:30\nroot  pts/1  185.220.101.5  Mar 27 08:01 - 08:03\nroot  pts/0  admin-ws.local Mar 26 09:00 - 17:15",
          isCritical: true,
        },
        {
          id: "inv-logs",
          label: "Failed Login Attempts",
          content:
            "$ grep 'Failed password' /var/log/auth.log | wc -l\n14,287 (last 7 days)\n\n$ grep 'Failed password' /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head\n  4201  185.220.101.5\n  3844  45.33.32.156\n  2891  118.25.6.39\n  1522  91.240.118.172\n  1829  Various other IPs\n\nNote: 45.33.32.156 and 185.220.101.5 are listed as Tor exit nodes.",
        },
      ],
      actions: [
        { id: "act-bastion", label: "Deploy a bastion host, disable direct SSH from internet, enforce key-based auth", color: "green" },
        { id: "act-change-port", label: "Change SSH to a non-standard port and add fail2ban", color: "yellow" },
        { id: "act-vpn-only", label: "Require VPN for all management access and remove Rule 62", color: "blue" },
        { id: "act-mfa-only", label: "Add MFA to SSH and keep the current access paths", color: "orange" },
      ],
      correctActionId: "act-bastion",
      rationales: [
        { id: "rat1", text: "Rule 62 exposes SSH to the entire internet with root login and password authentication enabled. The login logs show successful root sessions from Tor exit nodes (45.33.32.156, 185.220.101.5), indicating the server is likely already compromised. A bastion host eliminates direct internet SSH access, centralizes audit logging, and key-based authentication prevents brute-force attacks." },
        { id: "rat2", text: "Changing the SSH port is security through obscurity and does not address the fundamental issue: internet-exposed SSH with password-based root authentication and evidence of unauthorized access from Tor nodes." },
        { id: "rat3", text: "VPN-only access is a valid alternative but a bastion host provides additional benefits: centralized audit logging, session recording, and fine-grained access control per administrator. The bastion approach also addresses the key-based auth and root login issues." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Excellent analysis! You identified the critical exposure: internet-facing SSH with root/password auth and evidence of compromise from Tor exit nodes. A bastion host with key-based auth is the correct architectural solution.",
        partial: "You recognized the management access problem, but the evidence shows active compromise from Tor exit nodes. A bastion host with key-based auth provides the strongest management plane security.",
        wrong: "Rule 62 allows the entire internet to SSH into the DMZ. Root login with password auth is enabled, and the logs show successful root sessions from Tor exit nodes. This server is likely compromised and needs a bastion host architecture immediately.",
      },
    },
  ],
  hints: [
    "Check if DMZ hosts have direct access to internal databases or sensitive servers -- the application tier should mediate these connections.",
    "Look for firewall rules that use ALL services or overly broad source/destination ranges, especially from DMZ to internal zones.",
    "Management access paths to DMZ servers should never be exposed directly to the internet without a bastion host or VPN.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Network architects and security engineers regularly review DMZ designs during audits and penetration tests. Understanding common DMZ flaws like direct database access, overly permissive rules, and exposed management planes is essential for designing resilient perimeter networks.",
  toolRelevance: ["FortiGate", "Palo Alto", "pfSense", "Cisco ASA", "Wireshark"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
