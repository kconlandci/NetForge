import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "qos-policy-design",
  version: 1,
  title: "QoS Policy Design",
  tier: "intermediate",
  track: "network-services",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["qos", "dscp", "traffic-shaping", "policing", "priority-queuing"],
  description:
    "Design QoS policies for different traffic types including voice, video, and data to ensure optimal application performance.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Classify network traffic and assign appropriate DSCP markings",
    "Design queuing strategies that prioritize latency-sensitive applications",
    "Apply traffic policing and shaping to enforce bandwidth contracts",
  ],
  sortOrder: 505,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "qos-001",
      title: "Voice Traffic DSCP Classification",
      context:
        "The company is deploying IP phones across all offices. The voice team requires that voice bearer traffic (RTP) gets the highest QoS treatment, while voice signaling (SIP) gets a slightly lower priority. The current network has no QoS markings.\n\nRouter# show policy-map interface GigabitEthernet0/0\n  Service-policy output: WAN-QOS\n    Class-map: class-default (match-any)\n      0 packets, 0 bytes\n      30 second rate 0 bps\n\nThe WAN link is 100 Mbps and carries voice, video conferencing, and general data traffic.",
      displayFields: [
        { label: "WAN Bandwidth", value: "100 Mbps", emphasis: "normal" },
        { label: "Voice Traffic", value: "Unmarked (best-effort)", emphasis: "critical" },
        { label: "Current QoS", value: "No classification", emphasis: "warn" },
      ],
      actions: [
        { id: "a1", label: "Mark voice RTP as DSCP EF (46), SIP as CS3 (24)", color: "green" },
        { id: "a2", label: "Mark all voice traffic as DSCP AF41 (34)", color: "blue" },
        { id: "a3", label: "Mark voice RTP as CS7 (56), SIP as CS6 (48)", color: "yellow" },
        { id: "a4", label: "Use CoS markings at Layer 2 instead of DSCP", color: "orange" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "RFC 4594 recommends DSCP EF (Expedited Forwarding, 46) for voice bearer traffic because it provides low latency, low jitter, and low loss treatment in the priority queue. SIP signaling uses CS3 (24) per the same standard, giving it assured forwarding without consuming priority queue bandwidth.",
        },
        {
          id: "r2",
          text: "AF41 is designed for video conferencing traffic, not voice. Using the same DSCP for both RTP and SIP would prevent the network from differentiating between bearer and signaling traffic during congestion.",
        },
        {
          id: "r3",
          text: "CS6 and CS7 are reserved for network control traffic (routing protocols) and network management. Using these for voice violates RFC 4594 and could interfere with critical network infrastructure communication.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! EF for voice RTP and CS3 for SIP signaling follows RFC 4594 best practices. Voice bearer gets strict priority queuing while signaling gets assured delivery.",
        partial:
          "Review RFC 4594 DSCP recommendations: voice bearer = EF (46), voice signaling = CS3 (24). This separation ensures RTP gets priority treatment while SIP is reliably delivered.",
        wrong:
          "The standard QoS marking for voice is EF (46) for RTP bearer traffic and CS3 (24) for SIP signaling per RFC 4594. CS6/CS7 are reserved for network control, and AF41 is for video.",
      },
    },
    {
      type: "action-rationale",
      id: "qos-002",
      title: "WAN Bandwidth Allocation",
      context:
        "The 100 Mbps WAN link needs bandwidth allocation across traffic classes. During peak hours, video conferencing is choppy and voice quality degrades. Current utilization data:\n\nRouter# show policy-map interface GigabitEthernet0/0\n  Class-map: VOICE (match-dscp ef)\n    5 minute rate: 8 Mbps\n  Class-map: VIDEO (match-dscp af41)\n    5 minute rate: 35 Mbps\n  Class-map: BUSINESS-DATA (match-dscp af21)\n    5 minute rate: 40 Mbps\n  Class-map: class-default\n    5 minute rate: 25 Mbps\n\nTotal: ~108 Mbps demand on 100 Mbps link. Voice needs guaranteed low-latency delivery. Video can tolerate minor packet loss. Data can be queued.",
      displayFields: [
        { label: "Link Capacity", value: "100 Mbps", emphasis: "normal" },
        { label: "Current Demand", value: "~108 Mbps (oversubscribed)", emphasis: "critical" },
        { label: "Voice Demand", value: "8 Mbps", emphasis: "normal" },
      ],
      actions: [
        { id: "a1", label: "Voice: 10% strict priority, Video: 30% CBWFQ, Data: 35% CBWFQ, Default: 25%", color: "green" },
        { id: "a2", label: "Voice: 50% strict priority, Video: 25% CBWFQ, Data: 15% CBWFQ, Default: 10%", color: "blue" },
        { id: "a3", label: "Equal 25% allocation to all four classes", color: "yellow" },
        { id: "a4", label: "Voice: 10% strict priority, Video: 50% strict priority, Data: 30%, Default: 10%", color: "orange" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "Voice at 10% strict priority (10 Mbps) covers the 8 Mbps demand with headroom. Cisco best practice limits strict priority to 33% of link capacity to prevent bandwidth starvation. Video at 30% CBWFQ handles its 35 Mbps demand with WRED for graceful degradation. Data and default classes share the remaining bandwidth.",
        },
        {
          id: "r2",
          text: "Allocating 50% to strict priority voice is wasteful since voice only uses 8 Mbps. Over-provisioning the priority queue wastes bandwidth that could be used by video and data traffic during congestion.",
        },
        {
          id: "r3",
          text: "Two strict priority classes (voice and video) are problematic because the priority queue processes all strict-priority traffic before other queues. 60% in priority queuing could starve data traffic entirely during congestion.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Well done! 10% strict priority for voice matches demand, 30% CBWFQ for video allows WRED-based quality adaptation, and data gets fair bandwidth sharing. This follows Cisco QoS best practices.",
        partial:
          "The key principles are: strict priority only for voice (limited to 33% of bandwidth), CBWFQ for video with WRED, and fair queuing for data. Over-allocating priority queue bandwidth starves other classes.",
        wrong:
          "Voice needs only 10% strict priority to cover its 8 Mbps demand. Video should use CBWFQ (not strict priority) at 30%. Cisco recommends keeping strict priority under 33% of link capacity to prevent starvation.",
      },
    },
    {
      type: "action-rationale",
      id: "qos-003",
      title: "Traffic Policing at the WAN Edge",
      context:
        "A branch office has a contracted 50 Mbps WAN circuit from the ISP, but the physical Ethernet handoff is 100 Mbps. Without shaping, the branch sends bursts above 50 Mbps that the ISP drops, causing TCP retransmissions and poor application performance.\n\nRouter# show interface GigabitEthernet0/1\nGigabitEthernet0/1 is up, line protocol is up\n  MTU 1500, BW 100000 Kbit/sec\n  5 minute input rate 52340000 bits/sec\n  5 minute output rate 48120000 bits/sec\n  Output drops: 0\n\nISP SLA: 50 Mbps committed, excess traffic dropped at ISP edge.\n\nThe router's interface shows no output drops because the ISP router is doing the dropping.",
      displayFields: [
        { label: "Physical Rate", value: "100 Mbps", emphasis: "normal" },
        { label: "Contracted Rate", value: "50 Mbps CIR", emphasis: "warn" },
        { label: "Current Output", value: "48 Mbps (near limit)", emphasis: "warn" },
      ],
      actions: [
        { id: "a1", label: "Apply traffic shaping at 50 Mbps on the WAN interface", color: "green" },
        { id: "a2", label: "Apply traffic policing at 50 Mbps on the WAN interface", color: "blue" },
        { id: "a3", label: "Request the ISP to upgrade the circuit to 100 Mbps", color: "yellow" },
        { id: "a4", label: "Enable TCP window scaling to handle the drops", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "Traffic shaping buffers excess traffic and smooths the output rate to match the 50 Mbps CIR. Unlike policing which drops excess packets immediately, shaping delays them in a queue, allowing TCP flows to adapt gracefully and reducing retransmissions caused by ISP-side drops.",
        },
        {
          id: "r2",
          text: "Policing at the local router would drop excess packets locally instead of at the ISP, but the effect on TCP is the same: packet drops cause retransmissions. Shaping is preferred on WAN egress because it smooths traffic rather than dropping it.",
        },
        {
          id: "r3",
          text: "TCP window scaling adjusts the receive window size but does not prevent the ISP from dropping packets that exceed the contracted rate. The fundamental issue is sending more than 50 Mbps on a 50 Mbps contract.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Traffic shaping on the WAN interface buffers excess traffic to stay within the 50 Mbps CIR. This prevents ISP-side drops and allows QoS policies to manage queuing during congestion.",
        partial:
          "Shaping and policing both enforce rate limits, but shaping buffers excess traffic (preferred for WAN egress) while policing drops it. For contracted WAN circuits, shaping provides better application performance.",
        wrong:
          "Traffic shaping at 50 Mbps is the correct answer. It buffers burst traffic instead of dropping it, preventing ISP-side policing from causing TCP retransmissions. Shaping is always preferred over policing on WAN egress.",
      },
    },
  ],
  hints: [
    "RFC 4594 defines standard DSCP markings: EF (46) for voice RTP, CS3 (24) for voice signaling, AF41 (34) for video conferencing.",
    "Strict priority queuing should be limited to voice traffic and capped below 33% of link capacity to prevent bandwidth starvation of other classes.",
    "Traffic shaping buffers excess traffic while policing drops it. Shaping is preferred on WAN egress to match contracted bandwidth rates.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "QoS design is critical for unified communications and cloud adoption. Engineers who can design and troubleshoot QoS policies are essential for ensuring voice and video quality across enterprise WANs.",
  toolRelevance: [
    "MQC (Modular QoS CLI)",
    "show policy-map interface",
    "show class-map",
    "NBAR",
    "Wireshark DSCP analysis",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
