import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "performance-bottleneck-identification",
  version: 1,
  title: "Performance Bottleneck Identification",
  tier: "intermediate",
  track: "network-troubleshooting",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["performance", "bottleneck", "throughput", "qos", "utilization"],
  description:
    "Identify network performance bottlenecks using interface utilization, QoS statistics, and throughput measurements to pinpoint congestion points.",
  estimatedMinutes: 14,
  learningObjectives: [
    "Interpret interface utilization statistics to identify saturated links",
    "Analyze QoS queue statistics to detect traffic starvation and drops",
    "Correlate throughput measurements across multiple hops to isolate bottleneck locations",
    "Determine appropriate remediation steps for different types of performance bottlenecks",
  ],
  sortOrder: 605,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "pbi-001",
      title: "Saturated Uplink During Business Hours",
      objective:
        "Users in the Sales department report extremely slow file transfers to the central file server every day between 10 AM and 2 PM. Investigate the network path to identify the bottleneck.",
      investigationData: [
        {
          id: "inv1",
          label: "Access Switch Interface Stats (Gi0/1 - Sales VLAN Uplink)",
          content:
            "Switch-Sales# show interfaces GigabitEthernet0/1\nGigabitEthernet0/1 is up, line protocol is up\n  Hardware is Gigabit Ethernet, address is aa11.bb22.cc33\n  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec\n  5 minute input rate 45,200,000 bits/sec, 3,800 packets/sec\n  5 minute output rate 52,100,000 bits/sec, 4,200 packets/sec\n  0 input errors, 0 CRC, 0 frame\n  0 output errors, 0 collisions\n  Utilization: Input 4.5%, Output 5.2%",
          isCritical: false,
        },
        {
          id: "inv2",
          label: "Distribution Switch Uplink Stats (Gi1/0/49 - Core Uplink)",
          content:
            "Switch-Dist# show interfaces GigabitEthernet1/0/49\nGigabitEthernet1/0/49 is up, line protocol is up\n  Hardware is Gigabit Ethernet, address is dd44.ee55.ff66\n  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec\n  5 minute input rate 948,000,000 bits/sec, 78,500 packets/sec\n  5 minute output rate 962,000,000 bits/sec, 80,100 packets/sec\n  4,287 input errors, 0 CRC, 0 frame\n  12,541 output errors, 0 collisions\n  312,488 output buffer failures, 287,331 output buffers swapped out\n  Utilization: Input 94.8%, Output 96.2%",
          isCritical: true,
        },
        {
          id: "inv3",
          label: "QoS Queue Statistics on Distribution Uplink",
          content:
            "Switch-Dist# show policy-map interface GigabitEthernet1/0/49\n\n  Class-map: BULK-DATA (match-any)\n    Match: dscp af11\n    478,291 packets, 523,102,400 bytes\n    30 second offered rate 412,000,000 bps\n    30 second drop rate 187,000,000 bps\n    Tail drops: 1,284,771\n\n  Class-map: INTERACTIVE (match-any)\n    Match: dscp af21\n    124,500 packets, 89,200,000 bytes\n    30 second offered rate 52,000,000 bps\n    30 second drop rate 12,000,000 bps\n    Tail drops: 84,221\n\n  Class-map: class-default (match-any)\n    892,410 packets, 1,124,500,000 bytes\n    30 second offered rate 498,000,000 bps\n    30 second drop rate 294,000,000 bps\n    Tail drops: 2,891,044",
          isCritical: true,
        },
        {
          id: "inv4",
          label: "Core Switch to File Server Path",
          content:
            "Core-Switch# show interfaces TenGigabitEthernet1/1/1\nTenGigabitEthernet1/1/1 is up, line protocol is up\n  Hardware is Ten Gigabit Ethernet\n  MTU 1500 bytes, BW 10000000 Kbit/sec\n  5 minute input rate 1,200,000,000 bits/sec, 98,000 packets/sec\n  5 minute output rate 320,000,000 bits/sec, 26,000 packets/sec\n  0 input errors, 0 CRC\n  0 output errors\n  Utilization: Input 12.0%, Output 3.2%",
          isCritical: false,
        },
      ],
      actions: [
        { id: "a1", label: "Upgrade the distribution-to-core uplink to 10Gbps", color: "green" },
        { id: "a2", label: "Replace the access switch with a higher-capacity model", color: "blue" },
        { id: "a3", label: "Increase the file server NIC speed", color: "yellow" },
        { id: "a4", label: "Add more QoS queues on the access switch", color: "orange" },
      ],
      correctActionId: "a1",
      rationales: [
        { id: "r1", text: "The distribution switch uplink (Gi1/0/49) is running at 94-96% utilization with massive tail drops across all QoS classes. This 1Gbps link is the clear bottleneck between the access/distribution layer and the 10Gbps core. Upgrading this link to 10Gbps eliminates the congestion point." },
        { id: "r2", text: "The access switch uplink is only at 5% utilization and the core-to-server path is at 12%, so those links are not bottlenecks. The problem is isolated to the distribution uplink." },
        { id: "r3", text: "QoS is dropping traffic across all classes because the pipe is saturated. More QoS queues or better policies cannot fix a capacity problem - the link itself must be upgraded." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Excellent! You correctly traced the path and identified the 1Gbps distribution uplink at 96% utilization as the bottleneck. The massive tail drops and buffer failures confirm this link is overwhelmed. A 10Gbps upgrade is the right fix.",
        partial: "You identified a congestion issue, but the key evidence is the distribution uplink at 96% utilization with 2.8M+ tail drops. That specific link is the bottleneck requiring a bandwidth upgrade.",
        wrong: "The distribution switch uplink (Gi1/0/49) is at 96% utilization with massive tail drops across all QoS classes. This 1Gbps link between distribution and core is the bottleneck. Upgrade it to 10Gbps.",
      },
    },
    {
      type: "investigate-decide",
      id: "pbi-002",
      title: "VoIP Quality Degradation Despite Low Utilization",
      objective:
        "VoIP users report intermittent choppy audio and dropped calls. Overall network utilization appears normal. Investigate to find the performance bottleneck affecting voice traffic.",
      investigationData: [
        {
          id: "inv1",
          label: "WAN Link Utilization",
          content:
            "Router-Edge# show interfaces GigabitEthernet0/0\nGigabitEthernet0/0 is up, line protocol is up\n  Description: WAN to ISP\n  MTU 1500 bytes, BW 100000 Kbit/sec\n  5 minute input rate 28,400,000 bits/sec, 3,100 packets/sec\n  5 minute output rate 31,200,000 bits/sec, 3,400 packets/sec\n  0 input errors, 0 CRC\n  0 output errors\n  Utilization: Input 28.4%, Output 31.2%",
          isCritical: false,
        },
        {
          id: "inv2",
          label: "QoS Policy on WAN Interface",
          content:
            "Router-Edge# show policy-map interface GigabitEthernet0/0 output\n\n  Class-map: VOICE (match-any)\n    Match: dscp ef\n    12,410 packets, 2,482,000 bytes\n    30 second offered rate 820,000 bps\n    30 second drop rate 0 bps\n    Queue depth: 0\n    Priority bandwidth: 10000 kbps (10Mbps strict priority)\n\n  Class-map: VIDEO (match-any)\n    Match: dscp af41\n    89,210 packets, 112,400,000 bytes\n    30 second offered rate 28,100,000 bps\n    30 second drop rate 0 bps\n    Bandwidth: 40000 kbps (40Mbps guaranteed)\n\n  Class-map: class-default\n    412,800 packets, 289,100,000 bytes\n    30 second offered rate 2,300,000 bps\n    30 second drop rate 0 bps",
          isCritical: false,
        },
        {
          id: "inv3",
          label: "IP SLA VoIP Jitter Probe Results",
          content:
            "Router-Edge# show ip sla statistics 10\nIPSLAs Latest Operation Statistics\n\nOperation ID: 10 (UDP Jitter to PBX 10.50.1.10)\n  Latest RTT: 145 ms\n  Source to Destination Jitter Min/Avg/Max: 2/48/124 ms\n  Destination to Source Jitter Min/Avg/Max: 3/52/131 ms\n  Packet Loss SD: 8, DS: 12\n  Out Of Sequence: 4\n  MOS score: 2.1 (Poor)\n  ICPIF: 42\n\n  Over last 60 minutes:\n  Jitter Avg: 45ms (threshold: <30ms for VoIP)\n  Packet Loss: 3.2% (threshold: <1% for VoIP)\n  Latency Avg: 138ms (threshold: <150ms for VoIP)",
          isCritical: true,
        },
        {
          id: "inv4",
          label: "Internal Switch Path to IP PBX",
          content:
            "Switch-Core# show interfaces GigabitEthernet1/0/24\nDescription: IP-PBX Server\n  5 minute input rate 4,200,000 bits/sec\n  5 minute output rate 5,800,000 bits/sec\n  0 input errors, 0 output errors\n  Utilization: Input 0.4%, Output 0.6%\n\nSwitch-Core# show mls qos interface GigabitEthernet1/0/24 statistics\n  dscp ef:   Ingress packets 124,500  Egress packets 124,500  Drops 0\n  dscp af41: Ingress packets 892,100  Egress packets 892,100  Drops 0\n\nSwitch-Access# show interfaces GigabitEthernet0/12\nDescription: VoIP Phone - Desk 412\n  5 minute input rate 82,000 bits/sec\n  5 minute output rate 88,000 bits/sec\n  0 input errors, 0 output errors\n  Input queue: 0/75/0/0 (size/max/drops/flushes)",
          isCritical: false,
        },
        {
          id: "inv5",
          label: "Traceroute from Phone VLAN to Remote PBX",
          content:
            "Router-Edge# traceroute 203.0.113.50 source 10.10.100.1\nTracing route to 203.0.113.50\n  1 10.1.1.1      1 ms    1 ms    1 ms   [Core Switch]\n  2 10.1.254.1    2 ms    2 ms    3 ms   [Router-Edge]\n  3 198.51.100.1  8 ms    9 ms    8 ms   [ISP PE Router]\n  4 198.51.100.5  12 ms   85 ms   11 ms  [ISP Core]\n  5 198.51.100.9  15 ms   92 ms   14 ms  [ISP Core 2]\n  6 203.0.113.1   18 ms   110 ms  17 ms  [Remote ISP Edge]\n  7 203.0.113.50  22 ms   135 ms  21 ms  [Remote PBX]\n\nNote: Intermittent high latency spikes visible at hops 4-7.\nPattern repeats every 2-3 seconds.",
          isCritical: true,
        },
      ],
      actions: [
        { id: "a1", label: "Contact the ISP about intermittent latency spikes on the transit path", color: "green" },
        { id: "a2", label: "Increase the voice priority queue bandwidth from 10Mbps to 20Mbps", color: "blue" },
        { id: "a3", label: "Replace the IP PBX server with higher-performance hardware", color: "yellow" },
        { id: "a4", label: "Upgrade the WAN link from 100Mbps to 1Gbps", color: "orange" },
      ],
      correctActionId: "a1",
      rationales: [
        { id: "r1", text: "The traceroute shows intermittent latency spikes starting at the ISP core (hop 4) with periodic 85-135ms spikes alongside normal 11-22ms responses. The IP SLA confirms 48ms average jitter and 3.2% packet loss. The internal network and QoS are working correctly - the bottleneck is in the ISP transit path." },
        { id: "r2", text: "The WAN link is only at 31% utilization and the QoS voice queue shows zero drops, so the local network is not the issue. The VoIP quality degradation is caused by the ISP path introducing jitter spikes every 2-3 seconds." },
        { id: "r3", text: "The internal path to the PBX shows zero drops and minimal utilization. The problem only manifests on the ISP transit path between hops 4-7, indicating an ISP-side congestion or routing issue." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Excellent investigation! You correctly identified that despite healthy local utilization and QoS, the ISP transit path is introducing periodic jitter spikes. The traceroute evidence at hops 4-7 combined with the IP SLA jitter data pinpoints an ISP-side issue.",
        partial: "You identified a problem in the network path. The key evidence is the traceroute showing periodic latency spikes starting at ISP hop 4, combined with the IP SLA showing 48ms jitter - well above the 30ms VoIP threshold.",
        wrong: "The local network is healthy (low utilization, zero QoS drops). The traceroute reveals periodic latency spikes at ISP hops 4-7, and IP SLA confirms 48ms jitter with 3.2% loss. Contact the ISP about their transit path issues.",
      },
    },
    {
      type: "investigate-decide",
      id: "pbi-003",
      title: "Asymmetric Throughput on Server Farm Link",
      objective:
        "Database replication between the primary and disaster recovery sites is falling behind schedule. The replication window is 4 hours but the job now takes over 7 hours. Investigate the throughput bottleneck.",
      investigationData: [
        {
          id: "inv1",
          label: "WAN Router Interface Stats (Primary Site)",
          content:
            "Router-Primary# show interfaces GigabitEthernet0/1\nDescription: WAN to DR Site (MPLS)\n  MTU 1500 bytes, BW 1000000 Kbit/sec\n  5 minute input rate 120,000,000 bits/sec, 12,000 packets/sec\n  5 minute output rate 480,000,000 bits/sec, 45,000 packets/sec\n  0 input errors, 0 CRC\n  0 output errors\n  Utilization: Input 12.0%, Output 48.0%",
          isCritical: false,
        },
        {
          id: "inv2",
          label: "MPLS Provider Traffic Policing Report",
          content:
            "Router-Primary# show policy-map interface GigabitEthernet0/1 output\n\n  Service-policy output: MPLS-SHAPE\n\n  Class-map: class-default\n    Queued packets: 48,291\n    Shape rate: 500000000 bps (500Mbps contracted CIR)\n    Current rate: 480,000,000 bps\n    Conform: 12,489,201 packets, 14,987,041,200 bytes\n    Exceed: 2,841,092 packets, 3,409,310,400 bytes\n    Exceed action: drop\n    Exceed drops: 2,841,092 packets\n\nNote: Contracted MPLS CIR is 500Mbps. Physical interface is 1Gbps.\nThe shaper is actively dropping traffic exceeding the 500Mbps CIR.",
          isCritical: true,
        },
        {
          id: "inv3",
          label: "Database Replication Transfer Stats",
          content:
            "DBA Report - Nightly Replication Job:\n  Total data to replicate: 850 GB\n  Required throughput for 4-hour window: ~475 Mbps sustained\n  Actual measured throughput: 280 Mbps average\n  Peak throughput: 480 Mbps (shaped limit)\n  Throughput valleys: 120-180 Mbps (during TCP backoff after drops)\n\n  TCP window analysis:\n  - Initial window ramp-up reaches 480Mbps in ~30 seconds\n  - Shaper drops trigger TCP congestion avoidance\n  - Throughput drops to ~150Mbps, then slowly ramps back\n  - Sawtooth pattern repeats every 45-60 seconds\n  - Effective average: 280Mbps (59% of shaped rate)",
          isCritical: true,
        },
        {
          id: "inv4",
          label: "DR Site WAN Interface Stats",
          content:
            "Router-DR# show interfaces GigabitEthernet0/1\nDescription: WAN from Primary Site (MPLS)\n  MTU 1500 bytes, BW 1000000 Kbit/sec\n  5 minute input rate 275,000,000 bits/sec, 28,000 packets/sec\n  5 minute output rate 85,000,000 bits/sec, 8,500 packets/sec\n  0 input errors, 0 CRC\n  0 output errors\n  Utilization: Input 27.5%, Output 8.5%",
          isCritical: false,
        },
      ],
      actions: [
        { id: "a1", label: "Upgrade the MPLS CIR from 500Mbps to 1Gbps to eliminate the shaper drops", color: "green" },
        { id: "a2", label: "Tune TCP window sizes and enable WRED to smooth the sawtooth pattern within the current 500Mbps CIR", color: "blue" },
        { id: "a3", label: "Upgrade the physical WAN interfaces to 10Gbps", color: "yellow" },
        { id: "a4", label: "Compress the replication data before transmission", color: "orange" },
      ],
      correctActionId: "a2",
      rationales: [
        { id: "r1", text: "The shaper at 500Mbps is causing tail drops, which triggers aggressive TCP congestion avoidance and creates a sawtooth throughput pattern averaging only 280Mbps - 59% of the available 500Mbps CIR. Implementing WRED instead of tail drop will signal TCP to slow down gradually, and tuning TCP windows will allow more efficient use of the existing 500Mbps. This can raise effective throughput to 420-460Mbps, fitting within the 4-hour window." },
        { id: "r2", text: "Upgrading the CIR is expensive and unnecessary. The current 500Mbps CIR is theoretically sufficient for 475Mbps needed, but tail drops waste 41% of available bandwidth. WRED and TCP tuning can recover most of that waste without additional circuit costs." },
        { id: "r3", text: "The physical interfaces are 1Gbps but the MPLS CIR limits to 500Mbps. Upgrading physical interfaces would have no effect since the shaper enforces the contracted rate. The problem is inefficient use of existing capacity, not insufficient capacity." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Outstanding analysis! You identified the TCP sawtooth pattern caused by tail drops at the shaper. WRED will provide early congestion notification to smooth TCP behavior, and window tuning will optimize throughput within the 500Mbps CIR - no expensive circuit upgrade needed.",
        partial: "You identified the shaper as related to the bottleneck. The critical insight is that tail drops cause TCP backoff creating a sawtooth pattern at only 59% efficiency. WRED and TCP tuning can recover that lost throughput within the existing CIR.",
        wrong: "The 500Mbps shaper is tail-dropping packets, causing TCP congestion avoidance to create a sawtooth pattern averaging only 280Mbps. Implement WRED to smooth drops and tune TCP windows to efficiently use the existing 500Mbps CIR.",
      },
    },
  ],
  hints: [
    "When investigating performance bottlenecks, check interface utilization at every hop along the path. The bottleneck is often not at the endpoint but at an intermediate link or aggregation point.",
    "Low overall utilization does not mean there is no bottleneck. QoS queue drops, jitter, and intermittent spikes can degrade specific traffic types even when average utilization looks healthy.",
    "TCP throughput is highly sensitive to packet loss. Even small amounts of drops from traffic shapers or policers can cause TCP congestion avoidance to dramatically reduce effective throughput below the available bandwidth.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Performance bottleneck analysis is a daily task for network engineers working in enterprise and service provider environments. The ability to methodically trace a path and isolate congestion points using interface stats, QoS counters, and throughput measurements is essential for maintaining SLAs.",
  toolRelevance: ["Wireshark", "SNMP/MRTG", "SolarWinds", "iPerf", "IP SLA", "PRTG"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
