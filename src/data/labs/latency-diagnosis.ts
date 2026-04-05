import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "latency-diagnosis",
  version: 1,
  title: "Network Latency Diagnosis",
  tier: "intermediate",
  track: "network-troubleshooting",
  difficulty: "moderate",
  accessLevel: "free",
  tags: [
    "latency",
    "traceroute",
    "ping",
    "jitter",
    "performance",
    "qos",
  ],
  description:
    "Identify causes of network latency using traceroute, ping statistics, and interface counters to pinpoint bottlenecks and degradation points.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Interpret traceroute output to locate latency-introducing hops",
    "Distinguish between congestion, distance, and misconfiguration as latency causes",
    "Correlate interface statistics with observed latency patterns",
    "Recommend targeted remediation based on latency root cause analysis",
  ],
  sortOrder: 603,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "ld-001",
      title: "VoIP Call Quality Degradation During Business Hours",
      objective:
        "Determine why VoIP calls experience choppy audio and dropped packets between 9 AM and 5 PM but work perfectly outside business hours.",
      investigationData: [
        {
          id: "inv1",
          label: "Traceroute During Business Hours",
          content:
            "$ traceroute 10.20.1.50\ntraceroute to 10.20.1.50, 30 hops max, 60 byte packets\n 1  10.1.1.1 (10.1.1.1)  1.024 ms  0.987 ms  1.102 ms\n 2  10.10.0.1 (10.10.0.1)  2.341 ms  2.187 ms  2.445 ms\n 3  10.10.0.5 (10.10.0.5)  45.221 ms  78.445 ms  112.887 ms\n 4  10.20.0.1 (10.20.0.1)  46.112 ms  79.223 ms  115.001 ms\n 5  10.20.1.50 (10.20.1.50)  47.001 ms  80.112 ms  116.334 ms",
          isCritical: true,
        },
        {
          id: "inv2",
          label: "Traceroute After Hours (7 PM)",
          content:
            "$ traceroute 10.20.1.50\ntraceroute to 10.20.1.50, 30 hops max, 60 byte packets\n 1  10.1.1.1 (10.1.1.1)  0.998 ms  1.012 ms  0.945 ms\n 2  10.10.0.1 (10.10.0.1)  2.112 ms  2.045 ms  2.201 ms\n 3  10.10.0.5 (10.10.0.5)  3.445 ms  3.221 ms  3.587 ms\n 4  10.20.0.1 (10.20.0.1)  4.112 ms  4.001 ms  4.334 ms\n 5  10.20.1.50 (10.20.1.50)  5.001 ms  4.887 ms  5.112 ms",
        },
        {
          id: "inv3",
          label: "Interface Statistics on Hop 3 Router",
          content:
            "Router-Core# show interface GigabitEthernet0/1\nGigabitEthernet0/1 is up, line protocol is up\n  MTU 1500 bytes, BW 1000000 Kbit/sec\n  5 minute input rate 945000000 bits/sec, 78000 packets/sec\n  5 minute output rate 962000000 bits/sec, 80000 packets/sec\n  Output queue: 4521/8192 (current/max)\n  Total output drops: 34221\n  Input errors: 0, CRC: 0\n\nRouter-Core# show policy-map interface GigabitEthernet0/1\n  Class-map: class-default\n    Weighted Fair Queueing\n    No priority queue configured",
        },
      ],
      actions: [
        {
          id: "a1",
          label: "WAN link congestion at hop 3 with no QoS prioritization",
          color: "green",
        },
        {
          id: "a2",
          label: "Routing loop between hops 3 and 4 during business hours",
          color: "yellow",
        },
        {
          id: "a3",
          label: "VoIP codec mismatch causing excessive bandwidth usage",
          color: "orange",
        },
        {
          id: "a4",
          label: "Spanning tree reconvergence during peak hours",
          color: "blue",
        },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "Hop 3 (10.10.0.5) shows a massive latency spike during business hours (45-112ms vs 3ms after hours) with high jitter. The interface is running at 94.5% utilization with 34,221 output drops and a half-full output queue. No QoS policy prioritizes VoIP traffic, so voice packets compete equally with bulk data transfers. The congestion clears after hours when traffic volume drops.",
        },
        {
          id: "r2",
          text: "A routing loop would show the same hop appearing multiple times in traceroute with increasing TTL, or would cause packet loss rather than consistent high latency with jitter. The traceroute path is clean with no repeated hops.",
        },
        {
          id: "r3",
          text: "The latency increase starts exactly at hop 3 and carries through all subsequent hops by the same amount. Hops after the congestion point inherit the delay, confirming hop 3 is the bottleneck.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! The hop 3 interface is nearly saturated at 94.5% with output drops and no QoS. VoIP needs priority queuing (LLQ) to guarantee low latency and jitter. Implementing QoS with an EF marking for voice traffic is the correct solution.",
        partial:
          "You are close. Compare the two traceroutes: hop 3 jumps from 3ms to 45-112ms during business hours. The interface stats show near-saturation and output drops with no QoS policy. Voice traffic needs prioritization.",
        wrong:
          "This is link congestion at hop 3 without QoS. The interface runs at 94.5% utilization during business hours with 34K output drops. No priority queue is configured, so VoIP packets are queued equally with all other traffic, causing the latency spikes and jitter that degrade call quality.",
      },
    },
    {
      type: "investigate-decide",
      id: "ld-002",
      title: "Consistently High Latency to Remote Branch Office",
      objective:
        "Determine why the latency to a new remote branch office is consistently 180ms regardless of time of day, when the SLA guarantees under 50ms.",
      investigationData: [
        {
          id: "inv1",
          label: "Traceroute to Branch Office",
          content:
            "$ traceroute 172.16.50.1\ntraceroute to 172.16.50.1, 30 hops max, 60 byte packets\n 1  10.1.1.1 (10.1.1.1)  1.002 ms  0.998 ms  1.045 ms\n 2  10.10.0.1 (10.10.0.1)  2.112 ms  2.001 ms  2.201 ms\n 3  isp-gw1.provider.net (203.0.113.1)  3.445 ms  3.221 ms  3.112 ms\n 4  core-rtr.provider.net (203.0.113.5)  15.887 ms  15.445 ms  15.992 ms\n 5  lon-edge.provider.net (203.0.113.21)  85.112 ms  84.998 ms  85.334 ms\n 6  sgp-core.provider.net (203.0.113.45)  165.221 ms  165.001 ms  165.445 ms\n 7  172.16.50.1 (172.16.50.1)  180.112 ms  179.887 ms  180.334 ms",
          isCritical: true,
        },
        {
          id: "inv2",
          label: "ISP Circuit Documentation",
          content:
            "Circuit ID: MPLS-2026-0451\nService: MPLS VPN - Best Effort\nEndpoint A: New York Office (HQ)\nEndpoint B: Branch Office\nExpected Path: NYC → London → Singapore → Branch\nSLA: 50ms latency (domestic routing)\n\nNote: Branch office is located in Newark, NJ (30 miles from HQ).",
        },
        {
          id: "inv3",
          label: "Ping Statistics",
          content:
            "$ ping 172.16.50.1 -c 100\n100 packets transmitted, 100 received, 0% packet loss\nrtt min/avg/max/mdev = 178.112/180.445/182.001/0.887 ms\n\nLatency is rock-steady with minimal jitter (0.887ms std dev).\nNo packet loss observed over 24-hour monitoring period.",
        },
      ],
      actions: [
        {
          id: "a1",
          label: "ISP is routing traffic through London and Singapore instead of direct domestic path",
          color: "green",
        },
        {
          id: "a2",
          label: "Branch office firewall is adding processing delay",
          color: "yellow",
        },
        {
          id: "a3",
          label: "MPLS label switching overhead is causing latency",
          color: "blue",
        },
        {
          id: "a4",
          label: "Duplex mismatch on the WAN circuit",
          color: "orange",
        },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The traceroute shows traffic routing NYC → London (85ms, matching transatlantic latency) → Singapore (165ms, matching Europe-to-Asia latency) → Branch. The branch is in Newark, NJ - only 30 miles from HQ. The ISP is routing the MPLS circuit through international PoPs instead of a direct domestic path. The consistent latency with no jitter confirms this is a routing path issue, not congestion. The ISP needs to correct the circuit routing.",
        },
        {
          id: "r2",
          text: "The hop names (lon-edge, sgp-core) reveal geographic locations: London and Singapore. Speed-of-light propagation through fiber over these distances accounts for the 180ms. No amount of local optimization can overcome physics - the path must be fixed.",
        },
        {
          id: "r3",
          text: "A duplex mismatch would cause packet loss, CRC errors, and variable latency. The observed latency is rock-steady at 180ms with zero packet loss and sub-1ms jitter, which is consistent with a long but clean fiber path.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Perfect! The traceroute reveals an absurd routing path: NYC to London to Singapore for a circuit that should stay in the New York metro area. The 180ms is speed-of-light delay across intercontinental fiber. Contact the ISP to fix the MPLS circuit routing.",
        partial:
          "You are on the right track. Look at the hop names and the circuit documentation: traffic to a Newark, NJ branch is traversing London and Singapore. This is a provider routing error, not a local issue.",
        wrong:
          "The ISP is routing traffic internationally (London, Singapore) for a 30-mile domestic circuit. The traceroute hop names and latency increments match intercontinental distances. The 180ms is physics - light through fiber across those distances. The ISP must correct the MPLS path.",
      },
    },
    {
      type: "investigate-decide",
      id: "ld-003",
      title: "Intermittent Latency Spikes on Local Network",
      objective:
        "Determine why a database server on the local LAN experiences periodic latency spikes of 200-500ms every 30 seconds despite being on the same switch.",
      investigationData: [
        {
          id: "inv1",
          label: "Extended Ping to Database Server",
          content:
            "$ ping 10.1.1.100 -c 20 -i 5\nPING 10.1.1.100 (10.1.1.100): 56 data bytes\n64 bytes: icmp_seq=0  time=0.4 ms\n64 bytes: icmp_seq=1  time=0.3 ms\n64 bytes: icmp_seq=2  time=0.5 ms\n64 bytes: icmp_seq=3  time=0.4 ms\n64 bytes: icmp_seq=4  time=0.3 ms\n64 bytes: icmp_seq=5  time=245.2 ms\n64 bytes: icmp_seq=6  time=0.4 ms\n64 bytes: icmp_seq=7  time=0.3 ms\n64 bytes: icmp_seq=8  time=0.4 ms\n64 bytes: icmp_seq=9  time=0.3 ms\n64 bytes: icmp_seq=10 time=0.4 ms\n64 bytes: icmp_seq=11 time=312.7 ms\n64 bytes: icmp_seq=12 time=0.4 ms\n...\nSpikes of 200-500ms occur every ~30 seconds",
          isCritical: true,
        },
        {
          id: "inv2",
          label: "Switch Interface Counters",
          content:
            "Switch# show interface GigabitEthernet0/24\nGigabitEthernet0/24 is up, line protocol is up\n  Full-duplex, 1000Mb/s, media type is 10/100/1000BaseTX\n  Input rate: 1200 bits/sec\n  Output rate: 800 bits/sec\n  Input errors: 0, CRC: 0\n  Output errors: 0, Output drops: 0\n\nSwitch# show spanning-tree interface GigabitEthernet0/24\nPort 24 (GigabitEthernet0/24) of VLAN0001 is forwarding",
        },
        {
          id: "inv3",
          label: "Database Server System Logs",
          content:
            "admin@dbsrv:~$ dmesg | tail -20\n[1520834.221] e1000e 0000:00:19.0 eth0: Detected Hardware Unit Hang\n[1520834.221] e1000e 0000:00:19.0 eth0:   TDH                  <78>\n[1520834.221] e1000e 0000:00:19.0 eth0:   TDT                  <80>\n[1520834.221] e1000e 0000:00:19.0 eth0:   next_to_use          <80>\n[1520834.221] e1000e 0000:00:19.0 eth0:   next_to_clean        <78>\n[1520834.521] e1000e 0000:00:19.0 eth0: Reset adapter\n[1520864.223] e1000e 0000:00:19.0 eth0: Detected Hardware Unit Hang\n[1520864.523] e1000e 0000:00:19.0 eth0: Reset adapter\n[1520894.221] e1000e 0000:00:19.0 eth0: Detected Hardware Unit Hang\n[1520894.521] e1000e 0000:00:19.0 eth0: Reset adapter\n\nHang events repeat every ~30 seconds, matching the latency spike interval.",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "a1",
          label: "Spanning tree topology changes causing periodic reconvergence",
          color: "yellow",
        },
        {
          id: "a2",
          label: "Switch port buffer overflow from traffic bursts",
          color: "orange",
        },
        {
          id: "a3",
          label: "Server NIC hardware hang causing periodic adapter resets",
          color: "green",
        },
        {
          id: "a4",
          label: "ARP table timeout causing periodic resolution delays",
          color: "blue",
        },
      ],
      correctActionId: "a3",
      rationales: [
        {
          id: "r1",
          text: "The dmesg logs show 'Detected Hardware Unit Hang' on the e1000e NIC driver every 30 seconds, exactly matching the latency spike interval. When the NIC hangs, the driver resets the adapter, causing a ~200-500ms interruption. The switch port is clean (no errors, low utilization, STP forwarding) and the network path is fine. This is a known issue with certain Intel e1000e NICs that can be resolved by updating the NIC firmware/driver or replacing the network adapter.",
        },
        {
          id: "r2",
          text: "The switch shows zero output drops, minimal traffic rates, and STP forwarding state. Network infrastructure is not the cause. The problem is isolated to the server's NIC hardware.",
        },
        {
          id: "r3",
          text: "ARP timeouts on a local LAN would show as a single delayed packet followed by normal traffic, not a 200-500ms spike every 30 seconds with adapter reset messages in the kernel log.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! The e1000e 'Hardware Unit Hang' in dmesg is the smoking gun. The NIC is periodically hanging and the driver resets it, causing the latency spikes. Update the NIC driver/firmware or replace the adapter.",
        partial:
          "You are close. The 30-second periodicity of the latency spikes matches the kernel log entries. Check the dmesg output for the 'Hardware Unit Hang' messages on the e1000e driver.",
        wrong:
          "The server NIC is experiencing hardware hangs every 30 seconds. The dmesg log clearly shows 'Detected Hardware Unit Hang' followed by adapter resets on the e1000e driver. The switch and network are healthy. Update the NIC driver/firmware or replace the network adapter.",
      },
    },
  ],
  hints: [
    "Compare traceroute results at different times of day. If latency changes with traffic load, it is congestion. If latency is constant, it is either distance or a hardware issue.",
    "Look at hop-by-hop latency increments in traceroute. A large jump between two hops pinpoints the congested or long-distance link. Subsequent hops inherit the delay.",
    "Check system logs on the endpoint, not just network devices. NIC driver issues, CPU scheduling, and power management can all introduce latency that looks like a network problem.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Latency diagnosis is a daily challenge for network engineers supporting real-time applications like VoIP and video. Knowing how to read traceroute output and correlate it with interface stats is essential for meeting SLA requirements.",
  toolRelevance: [
    "traceroute",
    "ping",
    "show interface",
    "show policy-map",
    "Wireshark",
    "dmesg",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
