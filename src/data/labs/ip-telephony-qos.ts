import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ip-telephony-qos",
  version: 1,
  title: "IP Telephony QoS Triage",
  tier: "advanced",
  track: "network-services",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["voip", "qos", "jitter", "packet-loss", "ip-telephony", "rtp"],
  description:
    "Triage VoIP quality issues by analyzing jitter, latency, and packet loss metrics to classify root causes and apply targeted remediations.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Interpret VoIP quality metrics including jitter, latency, and MOS scores",
    "Classify voice quality degradation causes from network telemetry",
    "Apply targeted QoS remediations for specific VoIP impairments",
  ],
  sortOrder: 510,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "voip-001",
      title: "Choppy Audio on WAN Calls",
      description:
        "Users at the branch office report choppy, robotic-sounding audio during calls to headquarters. Local calls within the branch are clear.",
      evidence: [
        {
          type: "metrics",
          content:
            "IP SLA Voice Statistics (Branch to HQ):\n  RTT: 45ms (acceptable)\n  Jitter: 82ms (threshold: 30ms)\n  Packet Loss: 0.1%\n  MOS Score: 2.8 (threshold: 3.5)\n\nVoice VLAN utilization: 15% of allocated bandwidth",
        },
        {
          type: "cli-output",
          content:
            "Router# show policy-map interface GigabitEthernet0/1\n  Class-map: VOICE-EF\n    Strict Priority\n    Bandwidth 512 kbps, burst 12800 bytes\n    packets output: 45231\n    packets dropped: 0\n  Class-map: class-default\n    Fair-queue\n    packets output: 892341\n    packets dropped: 45678",
        },
        {
          type: "log",
          content:
            "WAN interface queue depth peaks at 95% during business hours.\nLLQ (Low Latency Queue) shows 0 drops for voice.\nDefault class shows significant drops indicating congestion.",
        },
      ],
      classifications: [
        { id: "c1", label: "Excessive Jitter", description: "Jitter exceeds 30ms threshold causing audio artifacts due to playout buffer underruns" },
        { id: "c2", label: "High Latency", description: "Round-trip delay exceeds acceptable voice thresholds" },
        { id: "c3", label: "Packet Loss", description: "Voice packets being dropped causing gaps in audio" },
        { id: "c4", label: "Codec Mismatch", description: "Incompatible codecs causing transcoding artifacts" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem-1", label: "Increase LLQ bandwidth allocation for voice", description: "Expand the strict priority queue bandwidth to reduce voice packet queuing delay" },
        { id: "rem-2", label: "Enable traffic shaping on the WAN interface to smooth bursts", description: "Apply shaping to prevent microbursts from causing jitter in the voice queue" },
        { id: "rem-3", label: "Reduce the WAN link utilization by adding bandwidth", description: "Upgrade the WAN circuit to eliminate congestion entirely" },
        { id: "rem-4", label: "Increase the jitter buffer size on IP phones", description: "Larger jitter buffers absorb variation but add latency" },
      ],
      correctRemediationId: "rem-2",
      rationales: [
        {
          id: "r1",
          text: "Jitter at 82ms far exceeds the 30ms threshold for acceptable voice quality, while latency (45ms) and packet loss (0.1%) are within limits. The choppy audio is caused by jitter buffer underruns when packet arrival intervals vary too much. The WAN queue at 95% depth with large data class drops indicates bursty traffic patterns causing variable queuing delays for all traffic.",
        },
        {
          id: "r2",
          text: "Traffic shaping smooths bursty output into a steady stream, reducing the variable queuing delays that cause jitter. While the LLQ protects voice from drops, it cannot prevent jitter caused by microbursts of data traffic that cause momentary queue depth spikes and serialization delays.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! Jitter at 82ms is the clear culprit. Traffic shaping smooths burst patterns that cause variable queuing delays, directly reducing jitter without adding latency like larger jitter buffers would.",
        partial:
          "The jitter metric at 82ms (threshold 30ms) is the key indicator. While LLQ prevents packet loss for voice, microbursts of data traffic cause variable delays. Traffic shaping addresses this root cause.",
        wrong:
          "Jitter at 82ms is 2.7x the acceptable threshold and directly causes the choppy audio. Latency and packet loss are fine. Traffic shaping on the WAN interface smooths bursty traffic patterns to reduce jitter.",
      },
    },
    {
      type: "triage-remediate",
      id: "voip-002",
      title: "One-Way Audio on VoIP Calls",
      description:
        "Users can hear the remote party but the remote party cannot hear them. The issue affects all calls from a specific floor's phones to external numbers.",
      evidence: [
        {
          type: "cli-output",
          content:
            "Voice Gateway# show voip rtp connections\nNo.  Codec   Dest Addr:Port    Tx Pkts  Rx Pkts\n1    G.711   203.0.113.5:8000  0        4521\n2    G.711   203.0.113.5:8002  0        3876\n3    G.711   203.0.113.5:8004  0        2901\n\nNote: Tx Pkts = 0 for all connections from this floor.",
        },
        {
          type: "log",
          content:
            "Phone VLAN: 172.16.30.0/24 (Floor 3)\nVoice Gateway: 10.0.1.100\nSIP Trunk: 203.0.113.5\n\nSwitch# show mac address-table vlan 30\nVlan  Mac Address      Type    Ports\n30    aabb.cc00.0001   DYNAMIC Gi0/1\n30    aabb.cc00.0002   DYNAMIC Gi0/2",
        },
        {
          type: "network",
          content:
            "Firewall ACL (applied to Floor 3 VLAN interface):\naccess-list 130 permit udp 172.16.30.0 0.0.0.255 host 10.0.1.100 range 5060 5061\naccess-list 130 permit udp 172.16.30.0 0.0.0.255 host 10.0.1.100 eq 2000\naccess-list 130 deny udp any any\naccess-list 130 permit ip any any\n\nNote: No ACL rules for RTP media ports (16384-32767).",
          icon: "firewall",
        },
      ],
      classifications: [
        { id: "c1", label: "RTP Media Port Blocking", description: "Firewall ACL blocking outbound RTP voice packets from the phone VLAN" },
        { id: "c2", label: "NAT Traversal Failure", description: "NAT not translating RTP media addresses in SIP headers" },
        { id: "c3", label: "Codec Negotiation Failure", description: "Phones unable to agree on a common codec with the gateway" },
        { id: "c4", label: "Phone Registration Issue", description: "Phones not properly registered with the call manager" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem-1", label: "Add ACL entry permitting UDP 16384-32767 from phone VLAN to voice gateway", description: "Allow RTP media traffic through the firewall between phones and the voice gateway" },
        { id: "rem-2", label: "Disable the firewall ACL on the phone VLAN", description: "Remove all filtering to allow unrestricted voice traffic" },
        { id: "rem-3", label: "Enable SIP ALG on the firewall", description: "Application layer gateway to inspect and modify SIP/RTP traffic" },
        { id: "rem-4", label: "Reconfigure phones to use TCP for media instead of UDP", description: "Switch media transport from UDP to TCP to bypass the ACL" },
      ],
      correctRemediationId: "rem-1",
      rationales: [
        {
          id: "r1",
          text: "The Tx Pkts count of 0 from all Floor 3 connections proves that RTP media packets from the phones are being blocked before reaching the gateway. The ACL permits SIP signaling (5060-5061) and SCCP (2000) but has 'deny udp any any' before the 'permit ip any any' rule, blocking all UDP traffic not explicitly allowed, including RTP media on ports 16384-32767.",
        },
        {
          id: "r2",
          text: "Adding a specific ACL entry for RTP ports (UDP 16384-32767) between the phone VLAN and voice gateway is the targeted fix. Disabling the entire ACL would remove security controls. The ACL should be updated to include the required voice media port range while maintaining other security rules.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Perfect! Tx Pkts = 0 proves outbound RTP is blocked. The ACL allows SIP signaling but denies UDP before the IP permit-any, blocking RTP media. Adding UDP 16384-32767 fixes one-way audio.",
        partial:
          "The zero Tx Pkts is the critical evidence. The ACL allows SIP signaling ports but blocks the RTP media port range (16384-32767) with the blanket 'deny udp any any' rule.",
        wrong:
          "One-way audio with Tx Pkts = 0 means outbound voice media is blocked. The ACL permits SIP (5060-5061) but denies all other UDP, including RTP media (16384-32767). Add an ACL entry for the RTP port range.",
      },
    },
    {
      type: "triage-remediate",
      id: "voip-003",
      title: "Echo and Delay on Long-Distance VoIP",
      description:
        "Callers on long-distance VoIP calls report hearing their own voice echoed back with a noticeable delay. The issue is worse on calls routed through the backup WAN path.",
      evidence: [
        {
          type: "metrics",
          content:
            "Primary WAN Path:\n  RTT: 85ms, Jitter: 12ms, Loss: 0%\n  Echo complaints: occasional\n\nBackup WAN Path (active during failover):\n  RTT: 210ms, Jitter: 15ms, Loss: 0%\n  Echo complaints: frequent and severe\n\nCodec: G.711 (no compression)\nEcho canceller: enabled (default tail length: 32ms)",
        },
        {
          type: "cli-output",
          content:
            "Voice-GW# show voice dsp\nDSP  Type    Codec   Echo-Cancel  Tail-Length\n1    C5510   G.711   Enabled      32ms\n2    C5510   G.711   Enabled      32ms\n3    C5510   G.711   Enabled      32ms\n\nVoice-GW# show call active voice\nDuration  Codec   TxPkts  RxPkts  RTT    Lost\n00:05:23  G.711   15672   15670   210ms  0",
        },
        {
          type: "log",
          content:
            "Echo cancellation works by sampling the outgoing signal and subtracting it from the incoming signal within the tail-length window. When one-way delay exceeds the tail length, the echo canceller cannot correlate the echo with the original signal.\n\nOne-way delay on backup path: ~105ms (RTT 210ms / 2)\nEcho canceller tail length: 32ms\nGap: 105ms - 32ms = 73ms uncovered",
        },
      ],
      classifications: [
        { id: "c1", label: "Insufficient Echo Canceller Tail Length", description: "Echo canceller window too short for the path delay on the backup WAN" },
        { id: "c2", label: "Jitter-Induced Echo", description: "Variable packet delays causing echo canceller desynchronization" },
        { id: "c3", label: "Acoustic Echo from Handsets", description: "Phone speaker-to-microphone coupling causing physical echo" },
        { id: "c4", label: "Impedance Mismatch at PSTN Gateway", description: "Hybrid circuit impedance mismatch at the 2-wire to 4-wire conversion" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem-1", label: "Increase echo canceller tail length to 128ms", description: "Extend the echo cancellation window to cover the full round-trip delay on the backup path" },
        { id: "rem-2", label: "Switch to G.729 codec to reduce bandwidth and delay", description: "Compressed codec reduces packet size and queuing delay" },
        { id: "rem-3", label: "Disable echo cancellation and rely on acoustic isolation", description: "Remove echo canceller processing to reduce latency" },
        { id: "rem-4", label: "Reduce WAN latency by upgrading the backup path", description: "Lower the RTT to within the current echo canceller range" },
      ],
      correctRemediationId: "rem-1",
      rationales: [
        {
          id: "r1",
          text: "The echo canceller tail length of 32ms is insufficient for the backup path's one-way delay of 105ms. The echo canceller cannot correlate the returned echo with the original signal when the delay exceeds its window. Increasing the tail length to 128ms covers the full delay and allows proper echo cancellation on both primary and backup paths.",
        },
        {
          id: "r2",
          text: "Switching to G.729 would reduce bandwidth usage but adds 25ms of algorithmic delay from compression, potentially worsening the problem. The root cause is the echo canceller configuration, not the codec or bandwidth.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The 32ms echo canceller tail length cannot handle the backup path's 105ms one-way delay. Increasing to 128ms covers both paths and eliminates the echo. This is a classic VoIP deployment issue.",
        partial:
          "The echo worsens on the backup path (210ms RTT) because the echo canceller's 32ms tail length is far shorter than the 105ms one-way delay. Extending the tail length is the direct fix.",
        wrong:
          "Echo cancellation requires a tail length that covers the round-trip acoustic path. At 105ms one-way delay on the backup WAN, the 32ms tail length leaves 73ms of echo uncancelled. Increase to 128ms.",
      },
    },
  ],
  hints: [
    "VoIP quality is measured by jitter (variation in delay), latency (one-way delay), packet loss, and MOS score. Each metric points to a different root cause.",
    "One-way audio (Tx Pkts = 0) usually indicates a firewall or ACL blocking RTP media traffic while allowing SIP signaling to pass.",
    "Echo cancellers have a tail length parameter that must exceed the one-way network delay. When calls traverse high-latency paths, this parameter often needs increasing.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "VoIP troubleshooting combines networking, QoS, and telephony knowledge. As organizations move to cloud-based unified communications, the ability to diagnose voice quality issues across complex network paths is a highly sought-after skill.",
  toolRelevance: [
    "show voip rtp connections",
    "IP SLA voice",
    "Wireshark RTP analysis",
    "show policy-map interface",
    "show voice dsp",
    "MOS scoring",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
