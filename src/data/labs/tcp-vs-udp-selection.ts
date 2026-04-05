import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "tcp-vs-udp-selection",
  version: 1,
  title: "TCP vs UDP Protocol Selection",
  tier: "beginner",
  track: "network-fundamentals",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["tcp", "udp", "transport-layer", "protocol-selection"],
  description:
    "Choose the correct transport protocol for various application requirements and network conditions.",
  estimatedMinutes: 8,
  learningObjectives: [
    "Compare TCP and UDP characteristics for different use cases",
    "Evaluate application requirements against protocol capabilities",
    "Justify transport protocol choices based on reliability, latency, and overhead needs",
  ],
  sortOrder: 101,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "tvu-001",
      title: "Real-Time Video Conferencing Platform",
      context:
        "Your company is deploying a new video conferencing system. The requirements state:\n\n- Maximum tolerable latency: 150ms one-way\n- Users are on a mix of wired and Wi-Fi connections\n- Packet loss of 1-2% is acceptable\n- The application implements its own error concealment\n- Simultaneous streams to 50+ participants\n\nThe development team asks you to recommend the transport protocol for the media streams.",
      displayFields: [],
      actions: [
        { id: "a1", label: "TCP - Reliable delivery ensures quality", color: "green" },
        { id: "a2", label: "UDP - Low latency for real-time media", color: "blue" },
        { id: "a3", label: "TCP with reduced window size", color: "yellow" },
        { id: "a4", label: "UDP with application-layer ACKs for every packet", color: "red" },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "UDP is the correct choice for real-time media because TCP's retransmission mechanism would add unacceptable latency. A retransmitted video frame arriving 300ms late is worse than a dropped frame that the error concealment algorithm can mask.",
        },
        {
          id: "r2",
          text: "TCP should be used because reliable delivery ensures every video frame arrives, resulting in higher quality video for all participants.",
        },
        {
          id: "r3",
          text: "UDP is preferred here because it avoids TCP's head-of-line blocking. With 50+ simultaneous streams, TCP's congestion control would also throttle bandwidth unnecessarily when the application can tolerate 1-2% loss.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Exactly right! Real-time media prioritizes latency over reliability. TCP's retransmission would cause stale frames to arrive late, creating worse user experience than occasional dropped frames.",
        partial:
          "You identified the right protocol or reasoning, but not both. The key insight is that for real-time media, late data is worse than lost data - making UDP the clear choice.",
        wrong:
          "UDP is the correct choice. TCP's guaranteed delivery adds latency through retransmissions that would violate the 150ms requirement. The application already handles packet loss through error concealment.",
      },
    },
    {
      type: "action-rationale",
      id: "tvu-002",
      title: "Financial Transaction Processing System",
      context:
        "A bank is building a transaction processing system between branch offices and the central data center. Requirements:\n\n- Zero tolerance for data loss\n- Transactions must arrive in exact order\n- Average transaction size: 2KB\n- Peak volume: 10,000 transactions/second\n- Regulatory requirement for delivery confirmation\n- Network path crosses multiple ISP boundaries\n\nYou must recommend the transport protocol for transaction data.",
      displayFields: [],
      actions: [
        { id: "a1", label: "UDP with custom reliability layer", color: "green" },
        { id: "a2", label: "TCP - Guaranteed ordered delivery", color: "blue" },
        { id: "a3", label: "UDP multicast for efficiency", color: "yellow" },
        { id: "a4", label: "Raw IP sockets for performance", color: "red" },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "TCP provides built-in ordered delivery, flow control, and congestion control - all critical for financial transactions. Its sequence numbering guarantees transactions arrive in order, and acknowledgments provide the delivery confirmation required by regulators.",
        },
        {
          id: "r2",
          text: "UDP with a custom reliability layer would be faster because you can optimize the retransmission strategy specifically for financial data patterns.",
        },
        {
          id: "r3",
          text: "TCP's three-way handshake adds too much overhead for 10,000 transactions per second. A connectionless protocol would handle the volume better.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Financial transactions require guaranteed ordered delivery. TCP's built-in reliability, sequencing, and acknowledgment mechanisms satisfy both the technical and regulatory requirements.",
        partial:
          "You're on the right track. Remember: zero data loss tolerance plus ordered delivery plus regulatory delivery confirmation all point strongly to TCP's built-in guarantees.",
        wrong:
          "TCP is the correct choice here. Financial transactions cannot tolerate data loss or reordering. TCP's sequence numbers, acknowledgments, and retransmission provide exactly the guarantees this system needs.",
      },
    },
    {
      type: "action-rationale",
      id: "tvu-003",
      title: "DNS Query Service Design",
      context:
        "You are reviewing the transport protocol used by a DNS resolver. The current behavior:\n\n- Standard queries use UDP port 53\n- Response size is typically 200-400 bytes\n- Queries timeout after 2 seconds with automatic retry\n- Zone transfers between DNS servers use TCP port 53\n- Some DNSSEC responses exceed 512 bytes\n\nA junior engineer asks why DNS uses UDP for queries instead of TCP. Select the best explanation.",
      displayFields: [],
      actions: [
        { id: "a1", label: "UDP reduces per-query overhead and latency", color: "green" },
        { id: "a2", label: "TCP cannot handle DNS query format", color: "blue" },
        { id: "a3", label: "UDP is more secure for DNS", color: "yellow" },
        { id: "a4", label: "DNS servers cannot maintain TCP state", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "UDP eliminates TCP's three-way handshake overhead, reducing a DNS query from a minimum of 4 round trips (SYN, SYN-ACK, request, response) to just 1 round trip (query and response). For small, frequent queries this dramatically reduces latency and server load.",
        },
        {
          id: "r2",
          text: "DNS uses UDP because TCP would require the server to maintain connection state for millions of clients, exhausting memory. The stateless nature of UDP allows DNS servers to scale.",
        },
        {
          id: "r3",
          text: "UDP is used because DNS responses are always small enough to fit in a single UDP datagram, eliminating any need for TCP's stream-oriented delivery.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Exactly! DNS queries use UDP to minimize latency - one round trip versus TCP's minimum of two (handshake + query). This is critical when every web page may trigger dozens of DNS lookups.",
        partial:
          "You identified the right answer or reasoning, but not both. The primary advantage is latency reduction: UDP needs one round trip for a DNS query, while TCP would need at least two.",
        wrong:
          "UDP is chosen for DNS queries because it reduces overhead and latency. A single UDP round trip handles a query, versus TCP's multi-round-trip handshake. Note that DNS does fall back to TCP for large responses or zone transfers.",
      },
    },
  ],
  hints: [
    "Consider the consequences of late vs lost data. Real-time applications prefer losing a packet over waiting for a retransmission.",
    "TCP adds overhead with its three-way handshake, acknowledgments, and congestion control. Evaluate whether the application needs these guarantees.",
    "Some protocols use both TCP and UDP depending on the operation - DNS uses UDP for queries but TCP for zone transfers.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Understanding TCP vs UDP trade-offs is essential for any role involving application architecture or network design. This knowledge is tested heavily in CompTIA Network+ and CCNA exams.",
  toolRelevance: ["Wireshark", "netstat", "tcpdump", "iperf"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
