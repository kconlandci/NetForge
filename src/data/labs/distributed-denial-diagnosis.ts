import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "distributed-denial-diagnosis",
  version: 1,
  title: "Identify & Respond to DDoS Attack Patterns",

  tier: "advanced",
  track: "network-troubleshooting",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: [
    "ddos",
    "security",
    "traffic-analysis",
    "netflow",
    "mitigation",
    "incident-response",
  ],

  description:
    "Identify and respond to DDoS attack patterns by analyzing network traffic captures, NetFlow data, and firewall logs to determine attack vectors and appropriate mitigations.",
  estimatedMinutes: 30,
  learningObjectives: [
    "Classify DDoS attack types from traffic patterns and protocol analysis",
    "Distinguish volumetric, protocol, and application-layer attacks using flow data",
    "Select appropriate mitigation strategies based on attack vector identification",
    "Interpret NetFlow and firewall logs to quantify attack magnitude and source distribution",
  ],
  sortOrder: 613,

  status: "published",
  prerequisites: [],

  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "syn-flood-detection",
      title: "Web Servers Unresponsive Despite Low CPU and Available Bandwidth",
      objective:
        "The company's public web servers became unresponsive at 14:30. Server CPU is at 15% and WAN bandwidth utilization is only 40%, yet new connections are timing out. Investigate the traffic patterns to identify the attack type and determine the correct response.",
      investigationData: [
        {
          id: "netflow-summary",
          label: "NetFlow top talkers report (14:30 - 14:45)",
          content:
            "Top Source IPs by Flow Count:\nSrc IP          Flows     Bytes       Pkts      Proto  Dst Port\n203.0.113.41    284,312   17,058,720  284,312   TCP    443\n198.51.100.89   271,840   16,310,400  271,840   TCP    443\n192.0.2.155     268,103   16,086,180  268,103   TCP    443\n203.0.113.200   254,891   15,293,460  254,891   TCP    443\n... (2,847 unique source IPs, all sending 1-packet TCP flows)\n\nTotal inbound flows: 8,472,103\nAverage bytes per flow: 60 (single SYN packet)\nAverage packets per flow: 1.0",
          isCritical: true,
        },
        {
          id: "firewall-conntrack",
          label: "show connection-state table summary on edge-fw1",
          content:
            "Connection State Table Summary:\n  Total entries:     2,097,152 / 2,097,152 (FULL)\n  TCP ESTABLISHED:   12,483\n  TCP SYN_SENT:      1,847,291\n  TCP SYN_RCVD:      237,378\n  UDP:               0\n  ICMP:              0\n\n** WARNING: Connection table is FULL **\n** New connections being DROPPED due to table exhaustion **",
          isCritical: true,
        },
        {
          id: "server-tcp-stats",
          label: "netstat -s on web-srv01 (TCP statistics)",
          content:
            "Tcp:\n    12483 connections established\n    2084669 SYNs received (last 15 min)\n    12483 SYN-ACKs sent and ACKed (completed handshakes)\n    2072186 SYN-ACKs sent with no ACK response (half-open)\n    0 connection resets received\n    Listen queue overflows: 847291\n    SYN backlog: 65536/65536 (FULL)\n\nNote: 99.4% of inbound SYNs never complete the handshake.",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "enable-syn-cookies",
          label: "Enable SYN cookies on servers and configure firewall SYN proxy",
          color: "green",
        },
        {
          id: "block-source-ips",
          label: "Block all 2,847 source IPs in the firewall ACL",
          color: "orange",
        },
        {
          id: "increase-bandwidth",
          label: "Contact ISP to increase WAN bandwidth capacity",
          color: "red",
        },
        {
          id: "enable-rate-limiting",
          label: "Apply per-source-IP rate limiting on the edge router",
          color: "yellow",
        },
      ],
      correctActionId: "enable-syn-cookies",
      rationales: [
        {
          id: "r1",
          text: "This is a SYN flood attack: 8.4M single-packet TCP flows with 99.4% never completing the handshake. The firewall connection table and server SYN backlog are exhausted. SYN cookies eliminate the need to store state for half-open connections, and a firewall SYN proxy validates the handshake before passing to the server.",
        },
        {
          id: "r2",
          text: "Blocking 2,847 source IPs is ineffective against a distributed attack. The attacker can easily rotate source IPs (often spoofed), and maintaining an ever-growing blocklist is not sustainable.",
        },
        {
          id: "r3",
          text: "Bandwidth is only 40% utilized — this is not a volumetric attack. The bottleneck is the connection state table and SYN backlog, not link capacity. More bandwidth would not help.",
        },
        {
          id: "r4",
          text: "Per-source rate limiting helps but is less effective when source IPs are spoofed or rapidly rotated. SYN cookies directly address the state exhaustion problem without needing to identify individual attackers.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! This is a classic SYN flood attack exhausting the firewall connection table and server SYN backlog. SYN cookies and SYN proxy are the correct mitigations because they eliminate stateful tracking of half-open connections.",
        partial:
          "Your approach would help reduce the impact, but the core problem is state exhaustion from millions of half-open TCP connections. SYN cookies address this directly without requiring per-source identification.",
        wrong:
          "The evidence shows a SYN flood: millions of single-SYN flows that never complete the handshake. The firewall connection table is full at 2M entries. SYN cookies and SYN proxy prevent state exhaustion from half-open connections.",
      },
    },
    {
      type: "investigate-decide",
      id: "dns-amplification-attack",
      title: "Inbound Bandwidth Saturated by Unsolicited DNS Responses",
      objective:
        "The NOC reports that the 10 Gbps WAN link is saturated at 9.7 Gbps inbound. Internal users cannot access the internet. The traffic analysis shows massive inbound UDP traffic from port 53. Investigate and determine the attack type and appropriate response.",
      investigationData: [
        {
          id: "interface-stats",
          label: "show interfaces GigabitEthernet0/0 on edge-rtr1 (WAN uplink)",
          content:
            "GigabitEthernet0/0 is up, line protocol is up\n  5 minute input rate 9,712,483,000 bits/sec (97.1% utilization)\n  5 minute output rate 148,200,000 bits/sec (1.5% utilization)\n     Input: 8,742,109 packets/sec\n     Output: 182,400 packets/sec\n\nNote: Extreme input/output asymmetry — 97% inbound vs 1.5% outbound.",
          isCritical: true,
        },
        {
          id: "netflow-proto",
          label: "NetFlow protocol breakdown (inbound traffic, last 15 min)",
          content:
            "Protocol  Src Port  Dst Port  Flows      Bytes          Pct\nUDP       53        *         4,128,401  84,231,482,880  96.2%\nTCP       *         443       12,483     2,847,321,600   3.2%\nTCP       *         80        2,341      487,200,000     0.5%\nOther     *         *         891        82,944,000      0.1%\n\nTop DNS response sizes:\n  Average response size: 3,847 bytes\n  Max response size: 4,096 bytes (ANY queries for isc.org)\n\nDst IP analysis: ALL DNS responses target 10.1.1.0/24 (our public range)\nNote: We do NOT run any public DNS servers on 10.1.1.0/24.",
          isCritical: true,
        },
        {
          id: "upstream-sample",
          label: "Packet capture sample (5 representative packets)",
          content:
            "No. Time       Src IP          Src Port  Dst IP       Dst Port  Proto  Len   Info\n1   14:30:01   8.8.8.8         53        10.1.1.10    34521     UDP    3912  DNS ANY isc.org Response\n2   14:30:01   1.1.1.1         53        10.1.1.10    41832     UDP    3847  DNS ANY isc.org Response\n3   14:30:01   9.9.9.9         53        10.1.1.10    29104     UDP    4011  DNS ANY isc.org Response\n4   14:30:01   208.67.222.222  53        10.1.1.10    38742     UDP    3792  DNS ANY isc.org Response\n5   14:30:01   208.67.220.220  53        10.1.1.10    50123     UDP    3955  DNS ANY isc.org Response\n\nNote: Responses from LEGITIMATE public DNS resolvers. Our source IP\nwas spoofed in the original queries sent to these resolvers.",
        },
      ],
      actions: [
        {
          id: "contact-isp-blackhole",
          label: "Contact ISP to apply upstream blackhole routing for the targeted prefix and engage DDoS scrubbing",
          color: "green",
        },
        {
          id: "block-dns-inbound",
          label: "Block all inbound UDP port 53 traffic on the edge firewall",
          color: "yellow",
        },
        {
          id: "block-resolver-ips",
          label: "Block 8.8.8.8, 1.1.1.1, 9.9.9.9 and other resolver IPs",
          color: "red",
        },
        {
          id: "increase-wan-capacity",
          label: "Upgrade WAN link to 40 Gbps to absorb the attack traffic",
          color: "red",
        },
      ],
      correctActionId: "contact-isp-blackhole",
      rationales: [
        {
          id: "r1",
          text: "This is a DNS amplification/reflection attack. The attacker spoofed our IPs to send small DNS queries (ANY record for isc.org) to open resolvers, which responded with large (~4KB) replies to our network. At 9.7 Gbps inbound, local filtering cannot help because the link is already saturated. Upstream ISP blackhole routing or DDoS scrubbing is required to drop traffic before it reaches our link.",
        },
        {
          id: "r2",
          text: "Blocking inbound UDP 53 on our firewall would not help because the 10G link is already 97% saturated. The packets still traverse the WAN link and consume all available bandwidth before reaching our firewall.",
        },
        {
          id: "r3",
          text: "Blocking legitimate DNS resolvers like 8.8.8.8 and 1.1.1.1 is misguided — they are victims too (being used as reflectors). The source IPs in the DNS queries were spoofed, and blocking resolvers would also break our own DNS resolution.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! This is a DNS amplification attack saturating the WAN link at 9.7 Gbps. Since the link is already full, local filtering is useless. The mitigation must happen upstream via ISP blackhole routing or a DDoS scrubbing service.",
        partial:
          "You identified the right direction, but the critical insight is that at 97% link utilization, no local device can mitigate this. The filtering must happen upstream at the ISP level before the traffic reaches your WAN link.",
        wrong:
          "The WAN link is 97% saturated with DNS responses from legitimate resolvers. Our source IPs were spoofed. No local filtering can help because the traffic fills the link before reaching our equipment. ISP-level mitigation is required.",
      },
    },
    {
      type: "investigate-decide",
      id: "slowloris-application-layer",
      title: "Web Server Connection Pool Exhausted by Slow HTTP Clients",
      objective:
        "The web application team reports that the load balancer shows all backend connection pools at 100% capacity, yet traffic volume is unusually low. Response times have degraded from 200ms to 45+ seconds. Investigate the connection patterns to identify the attack and select the correct mitigation.",
      investigationData: [
        {
          id: "lb-connection-pool",
          label: "show server pool status on load-balancer (F5 BIG-IP)",
          content:
            "ltm pool web-pool {\n  members {\n    web-srv01:443 {\n      state: available\n      current-connections: 8192 / 8192 (FULL)\n      bytes-in: 12,483,200 (unusually low for 8192 connections)\n    }\n    web-srv02:443 {\n      state: available\n      current-connections: 8192 / 8192 (FULL)\n      bytes-in: 11,872,100 (unusually low for 8192 connections)\n    }\n  }\n  total-connections: 16384 / 16384 (ALL POOLS FULL)\n}",
          isCritical: true,
        },
        {
          id: "connection-analysis",
          label: "HTTP connection analysis from load balancer access log",
          content:
            "Connection Duration Analysis (last 15 min):\n  Connections lasting > 5 minutes:    14,847 (90.6%)\n  Connections lasting 1-5 minutes:    1,102  (6.7%)\n  Connections lasting < 1 minute:     435    (2.7%)\n\nHTTP Header Analysis (sample of long-duration connections):\n  Connections with incomplete HTTP headers: 14,847\n  Average header send rate: 1 byte every 10 seconds\n  Sample: \"GET / HTTP/1.1\\r\\nHost: www.example.com\\r\\nX-a: \" (header never completed)\n\nSource IP Analysis:\n  Unique source IPs: 312\n  Average connections per source IP: 47.6\n  Top source: 203.0.113.50 with 284 concurrent connections",
          isCritical: true,
        },
        {
          id: "bandwidth-stats",
          label: "Interface bandwidth on WAN link during attack",
          content:
            "WAN Interface Statistics:\n  Inbound:  48 Mbps  (0.48% of 10G capacity)\n  Outbound: 12 Mbps  (0.12% of 10G capacity)\n\nNote: Bandwidth utilization is extremely low despite all connection\npools being exhausted. This rules out a volumetric attack.",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "configure-http-timeouts",
          label: "Set aggressive HTTP header completion timeouts and minimum data rate thresholds on the load balancer",
          color: "green",
        },
        {
          id: "increase-pool-size",
          label: "Increase backend connection pool limits from 8192 to 32768",
          color: "orange",
        },
        {
          id: "block-312-ips",
          label: "Block all 312 attacking source IPs in the edge firewall",
          color: "yellow",
        },
        {
          id: "enable-rate-limiting",
          label: "Enable per-IP connection rate limiting to 10 connections/second",
          color: "yellow",
        },
      ],
      correctActionId: "configure-http-timeouts",
      rationales: [
        {
          id: "r1",
          text: "This is a Slowloris attack: 14,847 connections are sending HTTP headers at 1 byte per 10 seconds, never completing the request. The connection pools are exhausted not by volume but by holding connections open indefinitely. Configuring strict header completion timeouts (e.g., 10 seconds) and minimum data rate enforcement will terminate these slow connections and free the pools.",
        },
        {
          id: "r2",
          text: "Increasing pool size delays the exhaustion but does not stop it. The attacker simply opens more slow connections. The attack uses minimal bandwidth, so the attacker can easily scale up to match any pool size increase.",
        },
        {
          id: "r3",
          text: "Blocking 312 source IPs is a temporary fix. The attacker can rotate IPs easily. Per-IP connection rate limiting helps but does not address connections already holding pools open. Header timeouts directly evict the malicious connections.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! This is a Slowloris application-layer attack that holds connections open by sending partial HTTP headers extremely slowly. Strict header completion timeouts and minimum data rate enforcement on the load balancer directly counter this technique.",
        partial:
          "Your approach would reduce the attack's effectiveness, but the root mitigation is enforcing HTTP header completion timeouts. Connections sending 1 byte every 10 seconds should be terminated after a strict deadline.",
        wrong:
          "The evidence shows 90.6% of connections have been open for over 5 minutes with incomplete HTTP headers, each sending data at 1 byte per 10 seconds. This is a Slowloris attack. The fix is HTTP header completion timeouts on the load balancer.",
      },
    },
  ],
  hints: [
    "Check the ratio of completed vs half-open TCP handshakes. If SYN packets vastly outnumber completed connections, you are likely seeing a SYN flood attack.",
    "When inbound bandwidth is saturated by UDP responses from legitimate servers, the attacker has spoofed your IP in requests to reflectors. Local filtering cannot help — you need upstream mitigation.",
    "Application-layer DDoS attacks use very little bandwidth but exhaust server resources like connection pools. Look for unusually long-lived connections with minimal data transfer.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "DDoS attacks are among the most impactful threats to network availability. Security and network engineers who can rapidly classify attack vectors and select the correct mitigation strategy are critical during incidents where every minute of downtime costs the business significant revenue.",
  toolRelevance: [
    "NetFlow / sFlow collectors (ntopng, Kentik)",
    "Wireshark / tcpdump",
    "F5 BIG-IP / NGINX",
    "ISP DDoS scrubbing services (Cloudflare, Akamai)",
    "Firewall CLI (Palo Alto, Fortinet)",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
