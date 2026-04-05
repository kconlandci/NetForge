import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "tcp-handshake-diagnosis",
  version: 1,
  title: "TCP Handshake Diagnosis",
  tier: "beginner",
  track: "network-fundamentals",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["tcp", "handshake", "syn", "connection", "troubleshooting"],
  description:
    "Diagnose TCP connection establishment failures by analyzing packet captures of the three-way handshake process.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Identify the stages of the TCP three-way handshake (SYN, SYN-ACK, ACK)",
    "Diagnose common TCP connection failures from packet capture evidence",
    "Distinguish between filtered ports, closed ports, and application-level connection issues",
  ],
  sortOrder: 113,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "tch-001",
      title: "Connection Timeout to Remote Server",
      objective:
        "A web application cannot connect to a backend API server. The connection hangs for 30 seconds then times out. Analyze the packet capture.",
      investigationData: [
        {
          id: "src1",
          label: "Wireshark capture from client",
          content:
            "No.  Time     Source        Destination   Protocol  Info\n1    0.000    10.1.1.50     10.2.2.100    TCP       49152 -> 8443 [SYN] Seq=0 Win=64240\n2    1.000    10.1.1.50     10.2.2.100    TCP       49152 -> 8443 [SYN] Seq=0 Win=64240 (retransmission)\n3    3.000    10.1.1.50     10.2.2.100    TCP       49152 -> 8443 [SYN] Seq=0 Win=64240 (retransmission)\n4    7.000    10.1.1.50     10.2.2.100    TCP       49152 -> 8443 [SYN] Seq=0 Win=64240 (retransmission)\n5    15.000   10.1.1.50     10.2.2.100    TCP       49152 -> 8443 [SYN] Seq=0 Win=64240 (retransmission)",
          isCritical: true,
        },
        {
          id: "src2",
          label: "Ping test",
          content:
            "C:\\> ping 10.2.2.100\nReply from 10.2.2.100: bytes=32 time=5ms TTL=62\nReply from 10.2.2.100: bytes=32 time=4ms TTL=62",
          isCritical: false,
        },
        {
          id: "src3",
          label: "Firewall rule check",
          content:
            "Firewall between 10.1.x.x and 10.2.x.x:\nRule 15: ALLOW ICMP ANY -> ANY\nRule 20: ALLOW TCP 10.1.0.0/16 -> 10.2.0.0/16 PORT 443\nRule 99: DENY ALL\n\nNote: The API server recently moved from port 443 to port 8443.",
          isCritical: true,
        },
      ],
      actions: [
        { id: "a1", label: "Firewall is dropping SYN packets to port 8443 - update the rule", color: "green" },
        { id: "a2", label: "The API server is down and not responding", color: "blue" },
        { id: "a3", label: "TCP window size is too small for the connection", color: "yellow" },
        { id: "a4", label: "There is a routing loop between the two subnets", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The capture shows SYN packets sent with exponential backoff retransmissions (1s, 2s, 4s, 8s) but no response at all - not even a RST. The firewall allows port 443 but the server moved to 8443, which is not in any allow rule. The implicit deny drops the SYN silently.",
        },
        {
          id: "r2",
          text: "The server responds to ping (ICMP is allowed), so it is up. The lack of any TCP response (no SYN-ACK or RST) indicates a firewall drop, not a server failure. A down service would send RST.",
        },
        {
          id: "r3",
          text: "A routing loop would cause ping to fail or show high TTL decay. Ping succeeds with consistent TTL=62, confirming the route is clean. The issue is port-level filtering.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Exactly right! The SYN retransmissions with no response are the hallmark of a firewall silently dropping packets. The firewall rule allows port 443 but not the new port 8443.",
        partial:
          "Close. The key evidence is SYN packets with exponential backoff and zero responses. A firewall silently dropping traffic produces this exact pattern. Check the firewall rules for the new port.",
        wrong:
          "The firewall is dropping SYN packets to port 8443. The rule only allows port 443, but the server moved to 8443. SYN retransmissions without any response (no RST, no SYN-ACK) always indicate a firewall drop.",
      },
    },
    {
      type: "investigate-decide",
      id: "tch-002",
      title: "Connection Refused on Application Port",
      objective:
        "Users report that a database application shows 'Connection refused' errors. The database server was recently rebooted for maintenance.",
      investigationData: [
        {
          id: "src1",
          label: "Wireshark capture from client",
          content:
            "No.  Time     Source        Destination   Protocol  Info\n1    0.000    10.1.1.50     10.5.5.20     TCP       55001 -> 5432 [SYN] Seq=0\n2    0.003    10.5.5.20     10.1.1.50     TCP       5432 -> 55001 [RST, ACK] Seq=0 Ack=1",
          isCritical: true,
        },
        {
          id: "src2",
          label: "Server listening ports",
          content:
            "root@db-server:~# ss -tlnp\nState    Recv-Q Send-Q  Local Address:Port  Peer Address:Port  Process\nLISTEN   0      128     127.0.0.1:5432      0.0.0.0:*          users:((\"postgres\",pid=1234,fd=5))\n\nNote: PostgreSQL is listening on 127.0.0.1 (localhost only), not on 0.0.0.0 (all interfaces).",
          isCritical: true,
        },
        {
          id: "src3",
          label: "PostgreSQL configuration",
          content:
            "# postgresql.conf\nlisten_addresses = 'localhost'    # <-- only accepts local connections\n# Should be: listen_addresses = '*' or listen_addresses = '0.0.0.0'\n\nNote: After the reboot, the config file was restored to defaults.",
          isCritical: true,
        },
      ],
      actions: [
        { id: "a1", label: "Change PostgreSQL listen_addresses to accept remote connections and restart", color: "green" },
        { id: "a2", label: "Open port 5432 in the server's firewall", color: "blue" },
        { id: "a3", label: "The client is connecting to the wrong server", color: "yellow" },
        { id: "a4", label: "PostgreSQL service has crashed and needs to be restarted", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "PostgreSQL is listening only on 127.0.0.1 (localhost), so the OS TCP stack sends RST to any remote connection attempt on port 5432. Changing listen_addresses to '0.0.0.0' or '*' and restarting PostgreSQL will accept connections on all interfaces.",
        },
        {
          id: "r2",
          text: "The RST response is immediate (0.003s), confirming the packet reaches the server and the server actively refuses it. A firewall block would produce either a timeout (silent drop) or an ICMP unreachable, not a TCP RST.",
        },
        {
          id: "r3",
          text: "PostgreSQL is running (PID 1234 is active) but only listening on localhost. The reboot restored default config which binds to localhost only. This is not a crash.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The RST response proves the server received the SYN but actively refused it because PostgreSQL is only listening on localhost. Changing listen_addresses and restarting fixes this.",
        partial:
          "Close. The immediate RST means the port is reachable but the application rejects remote connections. Check what address PostgreSQL is binding to.",
        wrong:
          "PostgreSQL is bound to localhost only (127.0.0.1), causing RST for all remote connections. The config was reset during the reboot. Changing listen_addresses to accept remote connections resolves it.",
      },
    },
    {
      type: "investigate-decide",
      id: "tch-003",
      title: "Intermittent Connection Failures Under Load",
      objective:
        "A web server intermittently refuses connections during peak traffic. Some users connect successfully while others get connection timeouts.",
      investigationData: [
        {
          id: "src1",
          label: "Wireshark capture showing mixed results",
          content:
            "Successful connection:\n1  0.000  Client-A -> Server  [SYN] Seq=0\n2  0.002  Server -> Client-A  [SYN,ACK] Seq=0 Ack=1\n3  0.004  Client-A -> Server  [ACK] Seq=1 Ack=1\n\nFailed connection:\n4  0.010  Client-B -> Server  [SYN] Seq=0\n5  1.010  Client-B -> Server  [SYN] Seq=0 (retransmission)\n6  3.010  Client-B -> Server  [SYN] Seq=0 (retransmission)",
          isCritical: true,
        },
        {
          id: "src2",
          label: "Server kernel parameters",
          content:
            "$ sysctl net.ipv4.tcp_max_syn_backlog\nnet.ipv4.tcp_max_syn_backlog = 128\n\n$ ss -s\nTCP:   545 (estab 530, closed 0, orphaned 2, timewait 13)\nSYN backlog: 128/128 (FULL)\n\nNote: The server is a popular web application handling ~500 concurrent connections.",
          isCritical: true,
        },
        {
          id: "src3",
          label: "Server resource usage",
          content:
            "CPU: 45% utilized\nMemory: 60% utilized\nDisk I/O: normal\nNetwork bandwidth: 30% of capacity\n\nThe server has plenty of resources but new connections are being dropped.",
          isCritical: false,
        },
      ],
      actions: [
        { id: "a1", label: "Increase the TCP SYN backlog queue size", color: "green" },
        { id: "a2", label: "Add more RAM to the server", color: "blue" },
        { id: "a3", label: "Upgrade the network link to higher bandwidth", color: "yellow" },
        { id: "a4", label: "Reduce the number of established connections by lowering timeouts", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The SYN backlog is at 128/128 (full). When the backlog is full, the kernel silently drops new SYN packets. Increasing tcp_max_syn_backlog to 1024 or higher allows the server to queue more pending connections during traffic spikes.",
        },
        {
          id: "r2",
          text: "Server resources (CPU 45%, RAM 60%, bandwidth 30%) are not the bottleneck. The limitation is specifically the SYN backlog queue size, which is a kernel tuning parameter independent of hardware resources.",
        },
        {
          id: "r3",
          text: "The successful connections complete normally (SYN, SYN-ACK, ACK in milliseconds), confirming the network path and bandwidth are fine. The issue is the server dropping SYNs when the backlog is full.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The SYN backlog is full at 128, causing the kernel to drop new SYN packets. Increasing the backlog size allows the server to handle more simultaneous connection attempts.",
        partial:
          "Close. The key evidence is the SYN backlog at 128/128 (FULL). The server silently drops new SYNs when the queue is full, causing the intermittent failures.",
        wrong:
          "The TCP SYN backlog queue is full (128/128). When full, the kernel drops new SYN packets, causing connection timeouts for some clients. Increasing the backlog size resolves this.",
      },
    },
  ],
  hints: [
    "SYN with no response (only retransmissions) = firewall dropping traffic. SYN followed by RST = port is reachable but the connection is refused. SYN followed by SYN-ACK = successful handshake start.",
    "TCP retransmissions follow exponential backoff: 1s, 2s, 4s, 8s, 16s. If you see this pattern with no responses, a firewall or routing issue is likely.",
    "A full SYN backlog causes intermittent connection failures where some connections succeed and others silently fail. Check with 'ss -s' or 'netstat -s' for SYN queue overflow counts.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Understanding TCP handshake failures is essential for application support engineers and SREs. These skills reduce escalation time and are tested in both CCNA and cloud networking certifications.",
  toolRelevance: ["Wireshark", "tcpdump", "ss", "netstat", "sysctl"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
