import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ddos-mitigation-response",
  version: 1,
  title: "Respond to Active DDoS Attacks",
  tier: "advanced",
  track: "network-security",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["ddos", "mitigation", "volumetric", "application-layer", "scrubbing", "rate-limiting"],
  description:
    "Identify DDoS attack vectors from live traffic analysis and implement appropriate mitigation strategies including scrubbing, rate limiting, and application-layer defenses.",
  estimatedMinutes: 25,
  learningObjectives: [
    "Classify DDoS attacks by vector: volumetric, protocol, and application-layer",
    "Select appropriate mitigation strategies based on attack type and available infrastructure",
    "Interpret NetFlow, packet captures, and server metrics to identify the primary attack vector",
    "Prioritize mitigation actions during an active incident to minimize service disruption",
  ],
  sortOrder: 413,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "udp-amplification",
      title: "DNS Amplification Volumetric Attack",
      description:
        "The NOC has declared a P1 incident. The primary web application at app.example.com is unreachable. Upstream bandwidth monitoring shows inbound traffic has spiked from the normal 2 Gbps baseline to 48 Gbps. You are the on-call security engineer responsible for mitigation.",
      evidence: [
        {
          type: "log",
          content:
            "# NetFlow Top Talkers (last 5 minutes)\n$ nfdump -r /var/netflow/current -s srcip/bytes -n 20\nDate first seen     Duration Proto  Src IP Addr      Dst IP Addr       Bytes\n2026-03-28 09:14:01  300.0   UDP    198.51.100.53    203.0.113.10      4.2G\n2026-03-28 09:14:01  300.0   UDP    192.0.2.53       203.0.113.10      3.8G\n2026-03-28 09:14:01  300.0   UDP    198.51.100.153   203.0.113.10      3.1G\n2026-03-28 09:14:01  300.0   UDP    203.0.113.53     203.0.113.10      2.9G\n... (847 additional source IPs, all port 53 -> random high ports)\nSummary: 48.2 Gbps inbound, 97.3% UDP, 94.1% source port 53",
          icon: "terminal",
        },
        {
          type: "log",
          content:
            "# Packet capture sample (tcpdump)\n$ tcpdump -i eth0 -c 5 udp port 53 -nn\n09:15:01.234 IP 198.51.100.53.53 > 203.0.113.10.41923: 47281 24/0/1 ANY? example.com (4073)\n09:15:01.234 IP 192.0.2.53.53 > 203.0.113.10.33871: 51902 24/0/1 ANY? example.com (4073)\n09:15:01.235 IP 198.51.100.153.53 > 203.0.113.10.29445: 62104 24/0/1 ANY? example.com (4073)\n09:15:01.235 IP 203.0.113.53.53 > 203.0.113.10.51002: 38291 24/0/1 ANY? example.com (4073)\n09:15:01.236 IP 198.51.100.53.53 > 203.0.113.10.44210: 47281 24/0/1 ANY? example.com (4073)\n\n# Response sizes: ~4KB each (amplification factor ~50x)\n# All responses are for ANY query on example.com",
          icon: "terminal",
        },
        {
          type: "log",
          content:
            "# Infrastructure Status\nUpstream link: 10 Gbps (SATURATED at 48 Gbps - provider absorbing overflow)\nFirewall CPU: 98% (struggling to process volume)\nWeb server: Unreachable (upstream saturation)\n\n# ISP Contact Info\nUpstream ISP: AS64500 - NOC available 24/7\nDDoS scrubbing service: Contracted but not activated\nBGP community for blackhole: 64500:666\nClean pipe capacity: 100 Gbps via scrubbing center",
          icon: "settings",
        },
      ],
      classifications: [
        {
          id: "class-dns-amp",
          label: "DNS Amplification Volumetric Attack",
          description:
            "Spoofed DNS ANY queries generating ~4KB amplified responses from open resolvers. The 48 Gbps volume exceeds local link capacity, requiring upstream mitigation.",
        },
        {
          id: "class-dns-flood",
          label: "Direct DNS Query Flood",
          description:
            "Direct flood of DNS queries from botnets targeting the victim's DNS infrastructure.",
        },
        {
          id: "class-syn-flood",
          label: "TCP SYN Flood Attack",
          description:
            "High-volume SYN flood exhausting server connection table and firewall state tables.",
        },
        {
          id: "class-app-layer",
          label: "Application-Layer HTTP Flood",
          description:
            "Sophisticated HTTP request flood targeting the web application directly.",
        },
      ],
      correctClassificationId: "class-dns-amp",
      remediations: [
        {
          id: "rem-activate-scrubbing",
          label: "Activate Upstream DDoS Scrubbing Service",
          description:
            "Contact ISP NOC to activate the contracted scrubbing service. Re-route traffic through the 100 Gbps scrubbing center via BGP to filter amplified DNS responses before they reach your network.",
        },
        {
          id: "rem-blackhole-ip",
          label: "BGP Blackhole the Victim IP (203.0.113.10)",
          description:
            "Announce the victim IP with the blackhole community (64500:666) to drop all traffic to 203.0.113.10 at the ISP edge.",
        },
        {
          id: "rem-firewall-acl",
          label: "Block UDP Port 53 Inbound on the Firewall",
          description:
            "Create an ACL on the edge firewall to drop all inbound UDP port 53 traffic to stop the amplified responses.",
        },
        {
          id: "rem-rate-limit-local",
          label: "Rate Limit UDP Traffic on the Edge Router",
          description:
            "Apply a rate limiter on the edge router to cap inbound UDP traffic at 1 Gbps.",
        },
      ],
      correctRemediationId: "rem-activate-scrubbing",
      rationales: [
        {
          id: "rat-scrubbing-correct",
          text: "The attack volume (48 Gbps) saturates the 10 Gbps upstream link. Local mitigations (firewall ACLs, rate limiting) cannot help because the link is already saturated upstream. The contracted scrubbing service has 100 Gbps capacity and can filter the amplified DNS responses before they reach your network, restoring legitimate traffic flow.",
        },
        {
          id: "rat-blackhole-bad",
          text: "BGP blackholing drops ALL traffic to the victim IP, including legitimate users. This achieves the attacker's goal of making the service unavailable. It should only be used as a last resort if scrubbing is unavailable.",
        },
        {
          id: "rat-firewall-ineffective",
          text: "The firewall ACL approach fails because the 10 Gbps link is already saturated with 48 Gbps of attack traffic upstream. The firewall cannot drop packets that never arrive - the congestion is at the ISP handoff, not at your firewall.",
        },
        {
          id: "rat-rate-limit-insufficient",
          text: "Local rate limiting cannot address upstream saturation. The 48 Gbps of attack traffic is congesting the link before it reaches your router. Only upstream mitigation can address volumetric attacks that exceed local link capacity.",
        },
      ],
      correctRationaleId: "rat-scrubbing-correct",
      feedback: {
        perfect:
          "Excellent. You correctly identified the DNS amplification vector (source port 53, ~4KB responses, spoofed queries) and recognized that upstream scrubbing is the only viable mitigation when attack volume exceeds local link capacity.",
        partial:
          "You identified the attack type correctly, but the chosen mitigation cannot address a volumetric attack that exceeds your link capacity. When 48 Gbps hits a 10 Gbps link, only upstream mitigation works.",
        wrong:
          "The NetFlow data shows 97.3% UDP with 94.1% from source port 53 - this is DNS amplification. At 48 Gbps vs a 10 Gbps link, local mitigations fail because the link is saturated upstream. Activate the contracted scrubbing service.",
      },
    },
    {
      type: "triage-remediate",
      id: "slowloris-attack",
      title: "Application-Layer Slowloris Attack",
      description:
        "The web application team reports that app.example.com is responding extremely slowly despite normal bandwidth utilization. The CDN reports no anomalies. Server monitoring shows Apache worker threads are exhausted but CPU and memory usage are low.",
      evidence: [
        {
          type: "log",
          content:
            "# Server metrics\n$ uptime\n 11:42:01 up 47 days, load average: 0.82, 0.91, 0.88\n\n$ free -h\n              total    used    free    shared  buff/cache   available\nMem:          64Gi    12Gi    38Gi    1.2Gi    14Gi         50Gi\n\n$ ss -s\nTotal: 10247\nTCP:   10238 (estab 10214, closed 8, orphaned 4, timewait 12)\n\n# Apache status\n$ curl -s localhost/server-status | grep -E 'workers|connections'\nBusyWorkers: 10000\nIdleWorkers: 0\nMaxRequestWorkers: 10000\nConnsTotal: 10214\nConnsAsyncWriting: 42\nConnsAsyncKeepAlive: 9847\nConnsAsyncClosing: 311",
          icon: "terminal",
        },
        {
          type: "log",
          content:
            "# Connection analysis\n$ ss -tn state established '( dport = :443 )' | awk '{print $4}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -20\n   847 45.33.32.100\n   823 45.33.32.101\n   819 45.33.32.102\n   811 45.33.32.103\n   798 45.33.32.104\n   ... (12 more IPs in 45.33.32.0/24, 400-800 connections each)\n\n# Incomplete request analysis\n$ timeout 10 tcpdump -i eth0 -c 100 'tcp port 443' -A 2>/dev/null | grep -c 'GET\\|POST\\|HEAD'\n3\n\n# Only 3 complete HTTP requests out of 100 captured packets\n# Most connections are sending partial headers at 1 byte every 15-30 seconds:\n# \"GET / HTTP/1.1\\r\\nHost: app.example.com\\r\\nX-Custom-Header-1: value\\r\\n\"\n# (header never completed with \\r\\n\\r\\n)",
          icon: "terminal",
        },
        {
          type: "log",
          content:
            "# Bandwidth utilization\n$ vnstat -tr 60\nrx:  187 Mbit/s (normal baseline: 180 Mbit/s)\ntx:  94 Mbit/s (normal baseline: 120 Mbit/s)\n\n# Apache access log (last 60 seconds)\n$ wc -l /var/log/apache2/access.log.current_minute\n47 /var/log/apache2/access.log.current_minute\n# Normal: ~2000 requests/minute\n\n# Apache error log\n[Sat Mar 28 11:41:58 2026] [error] server reached MaxRequestWorkers setting, consider raising the MaxRequestWorkers setting\n[Sat Mar 28 11:41:59 2026] [error] server reached MaxRequestWorkers setting, consider raising the MaxRequestWorkers setting",
          icon: "terminal",
        },
      ],
      classifications: [
        {
          id: "class-slowloris",
          label: "Slowloris Slow-Header Application-Layer Attack",
          description:
            "Attackers maintain thousands of connections by sending partial HTTP headers at extremely slow rates, exhausting Apache worker threads without completing requests. Low bandwidth but high connection count.",
        },
        {
          id: "class-http-flood",
          label: "HTTP GET/POST Flood",
          description:
            "High-volume legitimate-looking HTTP requests overwhelming the web server application logic.",
        },
        {
          id: "class-rudy",
          label: "R.U.D.Y. (Slow POST Body) Attack",
          description:
            "Slow-rate attack sending POST request bodies one byte at a time to hold connections open.",
        },
        {
          id: "class-server-issue",
          label: "Server Misconfiguration / Memory Leak",
          description:
            "Apache is misconfigured or has a memory leak causing worker thread exhaustion.",
        },
      ],
      correctClassificationId: "class-slowloris",
      remediations: [
        {
          id: "rem-reqtimeout-module",
          label: "Enable mod_reqtimeout with Strict Header Timeouts",
          description:
            "Configure Apache's mod_reqtimeout to enforce: RequestReadTimeout header=10-20,MinRate=500 body=20,MinRate=500. This drops connections that don't complete headers within 10-20 seconds, directly countering the slow-header technique.",
        },
        {
          id: "rem-increase-workers",
          label: "Increase MaxRequestWorkers to 20000",
          description:
            "Double the worker limit to handle more concurrent connections and absorb the attack.",
        },
        {
          id: "rem-block-subnet",
          label: "Block the 45.33.32.0/24 Subnet at the Firewall",
          description:
            "Add a firewall ACL to drop all traffic from the attacking /24 subnet.",
        },
        {
          id: "rem-switch-nginx",
          label: "Switch to Nginx Reverse Proxy",
          description:
            "Deploy Nginx as a reverse proxy in front of Apache to handle connection management with its event-driven architecture.",
        },
      ],
      correctRemediationId: "rem-reqtimeout-module",
      rationales: [
        {
          id: "rat-reqtimeout",
          text: "mod_reqtimeout directly addresses the Slowloris attack mechanism by enforcing a minimum data rate for header completion. Connections that fail to complete headers within 10-20 seconds are dropped, freeing worker threads. This is Apache's built-in defense against slow-header attacks and can be enabled without service restart using graceful reload.",
        },
        {
          id: "rat-workers-futile",
          text: "Increasing MaxRequestWorkers only delays the exhaustion. The attacker can simply open more slow connections. It also increases memory consumption. The root cause is that incomplete connections are never timed out, not that the worker limit is too low.",
        },
        {
          id: "rat-block-partial",
          text: "Blocking the /24 subnet addresses the current attack source but is easily bypassed by rotating to different source IPs. Slowloris attacks require very few resources per attacking IP, so the attacker can use thousands of IPs. mod_reqtimeout provides protocol-level defense regardless of source.",
        },
      ],
      correctRationaleId: "rat-reqtimeout",
      feedback: {
        perfect:
          "Perfect analysis. You identified the Slowloris signature (9847 async keepalive connections, partial headers, exhausted workers with low CPU/bandwidth) and chose mod_reqtimeout, which directly counters the slow-header attack by enforcing header completion timeouts.",
        partial:
          "You recognized the connection exhaustion pattern, but the mitigation should address the protocol-level vulnerability. Slowloris exploits the lack of header completion timeouts - mod_reqtimeout is the targeted fix.",
        wrong:
          "Key indicators: 9847 connections in async keepalive, only 3 complete HTTP requests per 100 packets, 47 logged requests/minute vs normal 2000, low bandwidth. This is Slowloris. mod_reqtimeout enforces header completion deadlines.",
      },
    },
    {
      type: "triage-remediate",
      id: "carpet-bombing",
      title: "Carpet Bombing DDoS Across IP Range",
      description:
        "Multiple services across the 203.0.113.0/24 prefix are experiencing degraded performance. Unlike a traditional DDoS targeting a single IP, traffic analysis reveals attack traffic is distributed across every IP in the /24 block, keeping per-IP volume below individual detection thresholds.",
      evidence: [
        {
          type: "log",
          content:
            "# Per-IP traffic analysis (203.0.113.0/24)\n$ for ip in $(seq 1 254); do echo -n \"203.0.113.$ip: \"; nfdump -r current -c 1 \"dst ip 203.0.113.$ip\" -o \"fmt:%bps\" 2>/dev/null; done | sort -t: -k2 -rn | head\n203.0.113.1: 187 Mbps (web-lb-01, normal: 95 Mbps)\n203.0.113.2: 183 Mbps (web-lb-02, normal: 90 Mbps)\n203.0.113.10: 176 Mbps (app-server, normal: 40 Mbps)\n203.0.113.11: 171 Mbps (app-server-02, normal: 35 Mbps)\n203.0.113.20: 168 Mbps (mail-server, normal: 15 Mbps)\n203.0.113.50: 165 Mbps (dns-auth-01, normal: 8 Mbps)\n... (all 254 IPs showing 150-190 Mbps each)\n\nAggregate: 43.2 Gbps across /24 (normal aggregate: 3.8 Gbps)\nPer-IP detection threshold: 500 Mbps (NO INDIVIDUAL IP TRIGGERS ALERT)",
          icon: "terminal",
        },
        {
          type: "log",
          content:
            "# Protocol distribution across the /24\n$ nfdump -r current \"dst net 203.0.113.0/24\" -s proto/bytes\nProto    Bytes       Pct\nUDP      28.4G      65.8%\nTCP      11.2G      25.9%\nICMP      2.1G       4.9%\nGRE       1.5G       3.4%\n\n# UDP breakdown\n$ nfdump -r current \"dst net 203.0.113.0/24 and proto udp\" -s dstport/bytes\nPort   Bytes     Pct    Service\n53     8.2G     28.9%   DNS\n123    7.1G     25.0%   NTP\n11211  6.8G     23.9%   Memcached\n1900   4.3G     15.1%   SSDP\n389    2.0G      7.1%   LDAP\n\n# Multiple amplification vectors in use simultaneously",
          icon: "terminal",
        },
        {
          type: "log",
          content:
            "# Current mitigation status\nScrubbing service: Active (activated for 203.0.113.10 only)\n  - Scrubbing 203.0.113.10 traffic effectively\n  - Other 253 IPs NOT being scrubbed\n\nBGP announcement: 203.0.113.0/24 via AS64500 (normal path)\nFlowSpec capability: Available (ISP supports BGP FlowSpec)\nRTBH capability: Available per-IP or per-prefix\n\n# ISP scrubbing contract\nCurrent: Per-IP scrubbing (up to 5 IPs)\nUpgrade available: Prefix-based scrubbing (/24 minimum)\nUpgrade activation: 15-minute provisioning",
          icon: "settings",
        },
      ],
      classifications: [
        {
          id: "class-carpet-bomb",
          label: "Multi-Vector Carpet Bombing DDoS",
          description:
            "Distributed attack spreading traffic across all 254 IPs in the /24 prefix using multiple amplification vectors (DNS, NTP, Memcached, SSDP, LDAP) to stay below per-IP detection thresholds.",
        },
        {
          id: "class-multi-target",
          label: "Coordinated Multi-Target DDoS",
          description:
            "Multiple independent DDoS attacks launched simultaneously against different services in the same network.",
        },
        {
          id: "class-bgp-hijack",
          label: "BGP Hijack with Traffic Redirect",
          description:
            "The /24 prefix has been hijacked, causing traffic to be redirected through an attacker-controlled network.",
        },
      ],
      correctClassificationId: "class-carpet-bomb",
      remediations: [
        {
          id: "rem-prefix-scrubbing",
          label: "Upgrade to Prefix-Based Scrubbing for the Entire /24",
          description:
            "Request the ISP to upgrade from per-IP to prefix-based scrubbing for 203.0.113.0/24. Route the entire prefix through the scrubbing center to filter all amplification traffic across all 254 IPs simultaneously.",
        },
        {
          id: "rem-per-ip-scrub",
          label: "Add Top 5 Affected IPs to Per-IP Scrubbing",
          description:
            "Add the 5 most affected IPs to the existing per-IP scrubbing contract to protect critical services.",
        },
        {
          id: "rem-blackhole-prefix",
          label: "RTBH the Entire /24 Prefix",
          description:
            "Announce the /24 with the blackhole community to drop all traffic at the ISP edge.",
        },
        {
          id: "rem-flowspec-filter",
          label: "Deploy BGP FlowSpec Rules for Each Amplification Protocol",
          description:
            "Use BGP FlowSpec to push rate-limit rules for UDP ports 53, 123, 11211, 1900, and 389 destined to 203.0.113.0/24 at the ISP edge.",
        },
      ],
      correctRemediationId: "rem-prefix-scrubbing",
      rationales: [
        {
          id: "rat-prefix-scrub",
          text: "Carpet bombing specifically evades per-IP defenses by distributing attack volume below individual thresholds. Prefix-based scrubbing routes the entire /24 through the scrubbing center, which can analyze aggregate traffic patterns and filter all five amplification vectors (DNS, NTP, Memcached, SSDP, LDAP) across all 254 IPs. The 15-minute provisioning is acceptable for an active incident.",
        },
        {
          id: "rat-per-ip-insufficient",
          text: "Per-IP scrubbing for only 5 IPs leaves 249 IPs unprotected. The attacker can shift volume to unscrubbed IPs or maintain enough aggregate pressure to saturate the upstream link. Carpet bombing requires prefix-level defense.",
        },
        {
          id: "rat-flowspec-partial",
          text: "BGP FlowSpec can rate-limit the amplification protocols but requires a rule for each port/protocol combination and may not distinguish amplified responses from legitimate DNS/NTP traffic. Prefix-based scrubbing applies deep inspection and behavioral analysis that FlowSpec cannot match.",
        },
      ],
      correctRationaleId: "rat-prefix-scrub",
      feedback: {
        perfect:
          "Excellent. You recognized the carpet bombing technique - distributing attack traffic below per-IP thresholds across the entire /24 - and correctly chose prefix-based scrubbing to defend the entire address space against all five amplification vectors simultaneously.",
        partial:
          "You identified the distributed nature of the attack, but the mitigation must cover the entire /24 prefix. Per-IP defenses are exactly what carpet bombing is designed to evade.",
        wrong:
          "This is a carpet bombing attack: traffic is spread across all 254 IPs to stay below per-IP detection thresholds. Five amplification vectors are used simultaneously. Only prefix-level scrubbing protects the entire address space.",
      },
    },
  ],
  hints: [
    "When attack volume exceeds your link capacity, local defenses (firewalls, ACLs, rate limiters) are ineffective because the congestion occurs upstream. You must engage upstream mitigation like scrubbing services or BGP-based filtering.",
    "Slowloris attacks have a distinctive signature: high connection count, low bandwidth, exhausted worker threads, and very few completed HTTP requests. The defense must enforce header/request completion timeouts.",
    "Carpet bombing DDoS distributes attack traffic below per-IP detection thresholds. If individual IPs look normal but aggregate traffic is anomalous, you need prefix-level rather than per-IP mitigation.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "DDoS mitigation is a high-pressure, high-visibility skill. Security engineers who can quickly classify attack vectors and activate the correct mitigation during an active incident are critical to any organization's incident response capability. Understanding the distinction between volumetric, protocol, and application-layer attacks determines whether your response takes seconds or hours.",
  toolRelevance: [
    "Cloudflare Magic Transit",
    "AWS Shield Advanced",
    "Arbor Networks / NETSCOUT",
    "Akamai Prolexic",
    "BGP FlowSpec (RFC 5575)",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
