import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ftp-tftp-server-setup",
  version: 1,
  title: "File Transfer Service Troubleshooting",
  tier: "intermediate",
  track: "network-services",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["ftp", "tftp", "sftp", "file-transfer", "firewall"],
  description:
    "Investigate file transfer issues involving FTP, TFTP, and SFTP services including firewall rules, active/passive modes, and protocol selection.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Diagnose FTP active vs passive mode firewall issues",
    "Choose appropriate file transfer protocols based on security requirements",
    "Troubleshoot TFTP failures in network device management scenarios",
  ],
  sortOrder: 507,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "ftp-001",
      title: "FTP Transfers Failing Through Firewall",
      objective:
        "Determine why FTP file transfers fail when clients connect through the corporate firewall, even though the FTP login succeeds.",
      investigationData: [
        {
          id: "source-1",
          label: "FTP Client Session Log",
          content:
            "$ ftp 203.0.113.50\nConnected to 203.0.113.50.\n220 Welcome to FTP Server\nUser: admin\n331 Password required\nPassword: ****\n230 Login successful.\nftp> ls\n200 PORT command successful.\n425 Failed to establish connection.\nftp> get report.pdf\n200 PORT command successful.\n425 Failed to establish connection.",
          isCritical: true,
        },
        {
          id: "source-2",
          label: "Firewall Rule Summary",
          content:
            "Rule 10: ALLOW TCP dst-port 21 (FTP control) - OUTBOUND\nRule 20: ALLOW TCP dst-port 443 (HTTPS) - OUTBOUND\nRule 30: ALLOW TCP dst-port 22 (SSH) - OUTBOUND\nRule 99: DENY ALL INBOUND (stateful inspection enabled)\n\nNo FTP inspection/ALG module enabled.\nNo rules for high-port inbound connections.",
          isCritical: true,
        },
        {
          id: "source-3",
          label: "Network Diagram Notes",
          content:
            "Client (10.1.1.50) -> Firewall (NAT) -> Internet -> FTP Server (203.0.113.50)\nThe client is behind NAT with a private IP address.\nThe firewall performs stateful inspection but has no FTP ALG.",
        },
      ],
      actions: [
        { id: "a1", label: "Switch the FTP client to passive mode (PASV)", color: "green" },
        { id: "a2", label: "Open inbound ports 1024-65535 on the firewall", color: "yellow" },
        { id: "a3", label: "Enable FTP ALG on the firewall for active mode", color: "blue" },
        { id: "a4", label: "Replace FTP with HTTP file downloads", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "In active mode FTP, the server initiates the data connection back to the client on a random high port. The firewall blocks this inbound connection (Rule 99). Passive mode reverses this: the client initiates the data connection to the server, which works with the stateful firewall because it is an outbound connection.",
        },
        {
          id: "r2",
          text: "Opening all high ports inbound would solve the problem but creates a massive security hole. Passive mode is the standard solution for FTP through firewalls without requiring inbound port openings.",
        },
        {
          id: "r3",
          text: "Enabling the FTP ALG would also work for active mode by dynamically inspecting PORT commands and opening temporary firewall pinholes. However, switching to passive mode is simpler and does not require firewall reconfiguration.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Active mode FTP fails through firewalls because the server's inbound data connection is blocked. Passive mode (PASV) makes the client initiate all connections outbound, working with stateful firewalls and NAT.",
        partial:
          "You identified part of the issue. The key is that active mode FTP requires an inbound connection from the server to the client, which the firewall blocks. Passive mode reverses the data connection direction.",
        wrong:
          "The '425 Failed to establish connection' after a successful PORT command indicates the server cannot connect back to the client for data transfer (active mode). Switching to passive (PASV) mode solves this.",
      },
    },
    {
      type: "investigate-decide",
      id: "ftp-002",
      title: "TFTP Firmware Upload Failure",
      objective:
        "Determine why a Cisco switch cannot download its firmware update from the TFTP server during a scheduled maintenance window.",
      investigationData: [
        {
          id: "source-1",
          label: "Switch TFTP Attempt",
          content:
            "Switch# copy tftp://10.0.5.25/c2960-lanbasek9-mz.150-2.SE11.bin flash:\nAccessing tftp://10.0.5.25/c2960-lanbasek9-mz.150-2.SE11.bin...\n%Error opening tftp://10.0.5.25/c2960-lanbasek9-mz.150-2.SE11.bin (Timed out)\n\nSwitch# ping 10.0.5.25\nType escape sequence to abort.\nSending 5, 100-byte ICMP Echos to 10.0.5.25, timeout is 2 seconds:\n!!!!!\nSuccess rate is 100 percent (5/5)",
          isCritical: true,
        },
        {
          id: "source-2",
          label: "TFTP Server Status",
          content:
            "$ systemctl status tftpd-hpa\ntftpd-hpa.service - LSB: HPA's tftp client\n   Active: active (running)\n   CGroup: /system.slice/tftpd-hpa.service\n\n$ ls -la /var/lib/tftpboot/\ntotal 45678\ndrwxr-xr-x 2 root  root     4096 Mar 28 10:00 .\n-rw-r----- 1 root  root  45670912 Mar 28 09:55 c2960-lanbasek9-mz.150-2.SE11.bin\n\n$ ss -ulnp | grep 69\nudp  UNCONN 0  0  0.0.0.0:69  0.0.0.0:*  users:((\"in.tftpd\",pid=1234))",
          isCritical: true,
        },
        {
          id: "source-3",
          label: "Server Firewall Rules",
          content:
            "$ sudo iptables -L -n\nChain INPUT (policy DROP)\ntarget  prot  opt  source    destination\nACCEPT  tcp   --  0.0.0.0/0  0.0.0.0/0  tcp dpt:22\nACCEPT  icmp  --  0.0.0.0/0  0.0.0.0/0\nACCEPT  tcp   --  0.0.0.0/0  0.0.0.0/0  tcp dpt:80",
        },
      ],
      actions: [
        { id: "a1", label: "Fix the file permissions on the firmware file", color: "blue" },
        { id: "a2", label: "Add a UDP port 69 ACCEPT rule to the server firewall", color: "green" },
        { id: "a3", label: "Restart the TFTP service on the server", color: "yellow" },
        { id: "a4", label: "Use SCP instead of TFTP for the firmware transfer", color: "orange" },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "The server's iptables rules only allow TCP ports 22, 80, and ICMP. TFTP uses UDP port 69, which is not in the allow list. With a default DROP policy, UDP 69 packets are silently dropped, causing the switch's TFTP request to time out despite successful pings (ICMP is allowed).",
        },
        {
          id: "r2",
          text: "The file permissions (rw-r-----) could also be an issue since the TFTP daemon typically runs as the 'tftp' user, not root. However, the immediate timeout indicates the connection never reaches the TFTP service, pointing to a firewall block rather than a file access issue.",
        },
        {
          id: "r3",
          text: "Restarting the TFTP service would not help because the service is running and listening on UDP 69. The issue is that the firewall drops incoming UDP packets before they reach the service.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! The iptables rules have a default DROP policy with no UDP 69 rule. TFTP uses UDP, and ping works because ICMP is explicitly allowed. Adding 'iptables -A INPUT -p udp --dport 69 -j ACCEPT' solves it.",
        partial:
          "The timeout indicates a connectivity problem, not a file issue. Check the firewall rules carefully: only TCP 22, TCP 80, and ICMP are allowed. TFTP uses UDP port 69, which is blocked.",
        wrong:
          "The server firewall drops all UDP traffic including TFTP (UDP 69). Ping succeeds because ICMP is explicitly allowed, but TFTP packets are silently dropped by the default DROP policy.",
      },
    },
    {
      type: "investigate-decide",
      id: "ftp-003",
      title: "Secure File Transfer Protocol Selection",
      objective:
        "A compliance audit requires all file transfers between offices to use encryption. Determine the best replacement for the current unencrypted FTP workflow.",
      investigationData: [
        {
          id: "source-1",
          label: "Current FTP Usage Audit",
          content:
            "Daily automated transfers:\n- 50 backup files (avg 500 MB each) between data centers\n- 200 report files (avg 2 MB each) from branches to HQ\n- 10 configuration backups from network devices\n\nAll transfers currently use FTP (plain text, port 21).\nExisting SSH infrastructure is deployed on all servers.\nSSH keys are already distributed for server management.",
          isCritical: true,
        },
        {
          id: "source-2",
          label: "Compliance Requirements",
          content:
            "1. All data in transit must be encrypted\n2. Authentication must use certificates or keys (no plain text passwords)\n3. File integrity must be verifiable\n4. Audit logging of all transfers required\n5. Solution must support automated/scripted transfers",
        },
        {
          id: "source-3",
          label: "Available Options Assessment",
          content:
            "FTPS (FTP over TLS): Requires new certificate infrastructure, complex firewall rules for passive mode + TLS\nSFTP (SSH File Transfer): Uses existing SSH infrastructure, single port (22), key-based auth already deployed\nSCP: Uses SSH but limited to simple file copies, no directory listing or resume\nHTTPS upload: Requires web application development",
        },
      ],
      actions: [
        { id: "a1", label: "Deploy FTPS with TLS certificates", color: "blue" },
        { id: "a2", label: "Migrate to SFTP using existing SSH infrastructure", color: "green" },
        { id: "a3", label: "Use SCP for all file transfers", color: "yellow" },
        { id: "a4", label: "Build a custom HTTPS file transfer application", color: "red" },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "SFTP leverages the existing SSH infrastructure with keys already deployed, meeting encryption, key-based authentication, and integrity requirements immediately. It operates over a single port (22), simplifying firewall rules. SFTP supports automation through command-line tools and scripting libraries.",
        },
        {
          id: "r2",
          text: "FTPS would meet encryption requirements but requires deploying a new certificate infrastructure and managing complex firewall rules for TLS-encrypted passive mode data channels. This adds significant operational overhead compared to using existing SSH.",
        },
        {
          id: "r3",
          text: "SCP provides encryption but lacks features needed for the workflow: no directory listing, no transfer resume for the 500 MB backup files, and limited scripting capabilities compared to SFTP.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! SFTP is the best choice: it uses existing SSH keys for authentication, provides encryption and integrity through SSH, operates on a single port, and supports all required automation features.",
        partial:
          "Consider the existing infrastructure. SFTP leverages the already-deployed SSH keys and infrastructure, requiring minimal changes while meeting all compliance requirements.",
        wrong:
          "SFTP is the optimal choice because SSH infrastructure and keys are already deployed. It provides encryption, key-based auth, integrity, audit logging, and automation support with minimal new infrastructure.",
      },
    },
  ],
  hints: [
    "FTP active mode requires the server to connect back to the client for data transfer. If the client is behind a firewall or NAT, passive mode reverses this flow.",
    "TFTP uses UDP port 69. If ping (ICMP) works but TFTP times out, check whether the firewall allows UDP traffic on that port.",
    "When SSH infrastructure and keys are already deployed, SFTP provides the simplest path to encrypted file transfers with minimal new infrastructure.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Understanding file transfer protocols and their security implications is essential for compliance audits. Many organizations still use unencrypted FTP, and migrating to secure alternatives is a common project for network and security engineers.",
  toolRelevance: [
    "ftp/sftp CLI",
    "Wireshark",
    "iptables",
    "tcpdump",
    "scp",
    "WinSCP",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
