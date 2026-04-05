import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "packet-capture-analysis",
  version: 1,
  title: "Packet Capture Analysis",
  tier: "beginner",
  track: "network-troubleshooting",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["wireshark", "packet-capture", "pcap", "protocol-analysis", "tcp"],
  description:
    "Read Wireshark packet captures to identify common network issues such as retransmissions, DNS failures, and connection resets.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Interpret Wireshark capture output to identify protocol-level issues",
    "Distinguish between TCP retransmissions, RST packets, and normal traffic",
    "Correlate packet capture evidence with user-reported symptoms",
    "Identify DNS resolution failures from captured queries and responses",
  ],
  sortOrder: 602,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "pca-001",
      title: "Web Application Intermittent Timeouts",
      objective:
        "Analyze the packet capture to determine why users experience intermittent timeouts connecting to the internal web portal.",
      investigationData: [
        {
          id: "inv1",
          label: "Wireshark Capture - TCP Stream",
          content:
            "No.  Time      Source        Destination   Protocol  Info\n1    0.000000  10.1.1.50     10.5.5.20     TCP       49152 → 443 [SYN] Seq=0 Win=64240 Len=0 MSS=1460\n2    0.000812  10.5.5.20     10.1.1.50     TCP       443 → 49152 [SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0 MSS=1460\n3    0.001024  10.1.1.50     10.5.5.20     TCP       49152 → 443 [ACK] Seq=1 Ack=1 Win=64240 Len=0\n4    0.001500  10.1.1.50     10.5.5.20     TLSv1.2   Client Hello\n5    3.001520  10.1.1.50     10.5.5.20     TCP       [TCP Retransmission] 49152 → 443 Len=512\n6    9.001540  10.1.1.50     10.5.5.20     TCP       [TCP Retransmission] 49152 → 443 Len=512\n7    21.00156  10.1.1.50     10.5.5.20     TCP       49152 → 443 [RST] Seq=513 Win=0 Len=0",
          isCritical: true,
        },
        {
          id: "inv2",
          label: "Server Firewall Rules",
          content:
            "$ sudo iptables -L INPUT -n --line-numbers\nChain INPUT (policy DROP)\nnum  target   prot opt source       destination\n1    ACCEPT   tcp  --  0.0.0.0/0    0.0.0.0/0    tcp dpt:80\n2    ACCEPT   tcp  --  0.0.0.0/0    0.0.0.0/0    tcp dpt:22\n3    ACCEPT   icmp --  0.0.0.0/0    0.0.0.0/0",
        },
        {
          id: "inv3",
          label: "Network Connectivity Test",
          content:
            "$ ping 10.5.5.20\nReply from 10.5.5.20: bytes=32 time=1ms TTL=64\n\n$ telnet 10.5.5.20 443\nConnecting... Connection timed out.\n\n$ telnet 10.5.5.20 80\nConnecting... Connected.",
        },
      ],
      actions: [
        {
          id: "a1",
          label: "Server application is crashing under load",
          color: "orange",
        },
        {
          id: "a2",
          label: "Firewall is dropping TLS traffic on port 443",
          color: "green",
        },
        {
          id: "a3",
          label: "Client MTU is too large causing fragmentation",
          color: "blue",
        },
        {
          id: "a4",
          label: "DNS is resolving to the wrong IP address",
          color: "yellow",
        },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "The TCP three-way handshake completes (packets 1-3), but the Client Hello (packet 4) is never acknowledged by the server. The retransmissions at 3s and 9s followed by a RST show the server never responds to the TLS data. The firewall rules confirm port 443 is not in the ACCEPT list while port 80 is, explaining why the handshake succeeds (SYN/ACK is processed) but application data is dropped.",
        },
        {
          id: "r2",
          text: "The RST packet at line 7 indicates the server application crashed. When a process dies, the kernel sends RST to all active connections.",
        },
        {
          id: "r3",
          text: "The Client Hello at 512 bytes with MSS 1460 is well within the MTU limit, so fragmentation is not occurring here.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! The capture clearly shows the handshake completing but the Client Hello going unanswered. The iptables rules confirm port 443 is not permitted. Adding an ACCEPT rule for tcp dpt:443 will resolve the issue.",
        partial:
          "You identified part of the problem. Look at the firewall rules closely - port 443 is missing from the ACCEPT list. The handshake completes because SYN packets may pass stateful inspection, but the data is dropped.",
        wrong:
          "The firewall is blocking port 443. The TCP handshake succeeds (packets 1-3) but the Client Hello is never acknowledged, leading to retransmissions and eventual RST. The iptables rules show only ports 80 and 22 are accepted.",
      },
    },
    {
      type: "investigate-decide",
      id: "pca-002",
      title: "Email Client Cannot Connect to Mail Server",
      objective:
        "Investigate the packet capture to determine why the email client fails to connect to the mail server.",
      investigationData: [
        {
          id: "inv1",
          label: "Wireshark Capture - DNS and TCP",
          content:
            "No.  Time      Source        Destination   Protocol  Info\n1    0.000000  10.1.1.50     10.0.0.10     DNS       Standard query A mail.company.com\n2    0.002341  10.0.0.10     10.1.1.50     DNS       Standard query response A mail.company.com A 10.5.5.99\n3    0.003000  10.1.1.50     10.5.5.99     TCP       52100 → 993 [SYN] Seq=0 Win=64240 Len=0\n4    0.003500  10.5.5.99     10.1.1.50     TCP       993 → 52100 [RST, ACK] Seq=0 Ack=1 Win=0 Len=0\n5    0.004000  10.1.1.50     10.5.5.99     TCP       52101 → 993 [SYN] Seq=0 Win=64240 Len=0\n6    0.004500  10.5.5.99     10.1.1.50     TCP       993 → 52101 [RST, ACK] Seq=0 Ack=1 Win=0 Len=0",
          isCritical: true,
        },
        {
          id: "inv2",
          label: "Mail Server Service Status",
          content:
            "admin@mailsrv:~$ systemctl status dovecot\n● dovecot.service - Dovecot IMAP/POP3 email server\n   Loaded: loaded (/lib/systemd/system/dovecot.service; enabled)\n   Active: inactive (dead) since Fri 2026-03-27 02:15:00 UTC\n   Process: 1842 ExecStart=/usr/sbin/dovecot (code=exited, status=0/SUCCESS)\n\nadmin@mailsrv:~$ ss -tlnp | grep 993\n(no output)",
        },
        {
          id: "inv3",
          label: "DNS Record Check",
          content:
            "$ nslookup mail.company.com\nServer:  10.0.0.10\nAddress: 10.0.0.10#53\n\nName:    mail.company.com\nAddress: 10.5.5.99\n\n$ nslookup -type=MX company.com\ncompany.com    MX preference = 10, mail exchanger = mail.company.com",
        },
      ],
      actions: [
        {
          id: "a1",
          label: "DNS is returning an incorrect IP address",
          color: "yellow",
        },
        {
          id: "a2",
          label: "IMAPS service (Dovecot) is stopped on the mail server",
          color: "green",
        },
        {
          id: "a3",
          label: "Network firewall is blocking IMAPS port 993",
          color: "orange",
        },
        {
          id: "a4",
          label: "TLS certificate has expired on the mail server",
          color: "blue",
        },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "The RST/ACK response to the SYN means the server's TCP stack is actively rejecting the connection on port 993, not that a firewall is blocking it. A firewall block would show no response or an ICMP unreachable. The systemctl output confirms Dovecot is 'inactive (dead)' and ss shows nothing listening on port 993. The service needs to be started.",
        },
        {
          id: "r2",
          text: "The DNS resolution is working correctly, returning 10.5.5.99 for mail.company.com with proper MX records. The IP address matches the server that is sending RST packets, confirming DNS is not the issue.",
        },
        {
          id: "r3",
          text: "Since the SYN never completes the handshake, the TLS layer is never reached. A certificate issue would show a completed handshake followed by a TLS alert, not an immediate RST.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Perfect! The RST/ACK to SYN is the server kernel rejecting a connection to a closed port. Dovecot is inactive and nothing listens on 993. Running 'systemctl start dovecot' is the fix.",
        partial:
          "Close. The key distinction is RST/ACK vs timeout: an immediate RST means the server received the SYN but has no service listening. Check the Dovecot service status - it is stopped.",
        wrong:
          "The Dovecot IMAPS service is stopped. The RST/ACK response is the server kernel rejecting connections because nothing is listening on port 993. The systemctl output confirms Dovecot is inactive. DNS and network connectivity are working correctly.",
      },
    },
    {
      type: "investigate-decide",
      id: "pca-003",
      title: "Slow File Downloads from Internal Server",
      objective:
        "Analyze the packet capture to determine why file downloads from the internal file server are extremely slow despite a Gigabit connection.",
      investigationData: [
        {
          id: "inv1",
          label: "Wireshark Capture - TCP Stream Analysis",
          content:
            "No.  Time      Source        Destination   Protocol  Info\n1    0.000000  10.1.1.50     10.5.5.30     TCP       55000 → 445 [SYN] Win=64240 MSS=1460\n2    0.000400  10.5.5.30     10.1.1.50     TCP       445 → 55000 [SYN,ACK] Win=14600 MSS=1460\n3    0.000600  10.1.1.50     10.5.5.30     TCP       [ACK] Win=64240\n...\n120  1.200000  10.5.5.30     10.1.1.50     TCP       445 → 55000 [ACK] Seq=21001 Len=1460 Win=14600\n121  1.200200  10.5.5.30     10.1.1.50     TCP       445 → 55000 [ACK] Seq=22461 Len=1460 Win=14600\n122  1.250000  10.1.1.50     10.5.5.30     TCP       [TCP Window Update] Win=0\n123  1.450000  10.1.1.50     10.5.5.30     TCP       [TCP Window Update] Win=16384\n124  1.450200  10.5.5.30     10.1.1.50     TCP       445 → 55000 Len=1460 Win=14600\n125  1.500000  10.1.1.50     10.5.5.30     TCP       [TCP Window Update] Win=0\n\nWireshark I/O Graph: Average throughput 2.1 Mbps\nTCP Stream Graph: Repeated zero-window events every ~200ms",
          isCritical: true,
        },
        {
          id: "inv2",
          label: "Client System Performance",
          content:
            "C:\\> tasklist /FI \"MEMUSAGE gt 500000\"\nImage Name         PID    Mem Usage\n============       ====   =========\nchrome.exe         3412   2,841,000 K\njava.exe           5100   1,204,000 K\nTeams.exe          6788     892,000 K\n\nC:\\> systeminfo | findstr Memory\nTotal Physical Memory:     8,192 MB\nAvailable Physical Memory:   412 MB",
        },
        {
          id: "inv3",
          label: "Server and Switch Status",
          content:
            "Switch# show interface GigabitEthernet0/5\n  Full-duplex, 1000Mb/s\n  Input errors: 0, CRC: 0, Output errors: 0\n  Input rate: 2.1 Mbps, Output rate: 0.1 Mbps\n\nFile server CPU: 12%, Memory: 45% used, Disk I/O: 5% utilized",
        },
      ],
      actions: [
        {
          id: "a1",
          label: "Network congestion between client and server",
          color: "orange",
        },
        {
          id: "a2",
          label: "File server is overloaded",
          color: "yellow",
        },
        {
          id: "a3",
          label: "Client TCP receive buffer is full due to low memory",
          color: "green",
        },
        {
          id: "a4",
          label: "Switch port is misconfigured at a lower speed",
          color: "blue",
        },
      ],
      correctActionId: "a3",
      rationales: [
        {
          id: "r1",
          text: "The repeated TCP Window=0 updates from the client tell the server to stop sending data because the client's receive buffer is full. With only 412 MB of free RAM out of 8 GB, the client is memory-starved. Chrome, Java, and Teams are consuming most of the memory, leaving insufficient space for TCP receive buffers. The server and network are healthy (low CPU, clean switch counters, Gigabit link).",
        },
        {
          id: "r2",
          text: "The server shows only 12% CPU and 5% disk I/O utilization, so it is not the bottleneck. The switch port is running at 1000 Mbps with zero errors, ruling out network issues. The bottleneck is the client.",
        },
        {
          id: "r3",
          text: "Network congestion would show packet loss, retransmissions, and duplicate ACKs rather than zero-window events. The zero-window pattern specifically indicates the receiver cannot accept more data.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent analysis! TCP zero-window events mean the client is telling the server 'stop sending, I have no buffer space.' The client has only 412 MB free RAM with memory-hungry applications consuming the rest. Closing applications or adding RAM will resolve the throughput issue.",
        partial:
          "You are on the right track. The zero-window events in the capture are the critical clue - they indicate the receiver (client) cannot accept data fast enough. Check the client's available memory.",
        wrong:
          "The client's TCP receive buffer is full. TCP Window=0 updates mean the client is telling the server to pause transmission. With only 412 MB free RAM, the OS cannot allocate sufficient TCP buffer space. The server and network are both healthy.",
      },
    },
  ],
  hints: [
    "Pay attention to who sends what: a RST/ACK from a server in response to SYN means no service is listening. A timeout with no response suggests a firewall.",
    "TCP Window=0 means the receiver is telling the sender to stop. TCP retransmissions mean data is being lost in transit. RST means the connection is being forcibly terminated.",
    "Always check all the investigation data before deciding. The packet capture shows the symptom, but the server status and system performance data reveal the root cause.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Wireshark analysis is one of the most valued skills in network engineering. Being able to read packet captures and pinpoint issues saves hours of guesswork and is a key differentiator in interviews and on the job.",
  toolRelevance: [
    "Wireshark",
    "tcpdump",
    "tshark",
    "ss",
    "netstat",
    "telnet",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
