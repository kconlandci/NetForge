import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ping-traceroute-interpretation",
  version: 1,
  title: "Ping and Traceroute Interpretation",
  tier: "beginner",
  track: "network-troubleshooting",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["ping", "traceroute", "icmp", "packet-loss", "latency"],
  description:
    "Interpret ping and traceroute output to identify where packets are being dropped or delayed along a network path.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Read ping output to identify packet loss patterns and latency anomalies",
    "Interpret traceroute hop-by-hop output to locate the point of failure",
    "Distinguish between ICMP rate-limiting artifacts and genuine packet loss in traceroute results",
  ],
  sortOrder: 606,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "ptr-001",
      title: "Timeout at a Specific Hop",
      context:
        "A user reports they cannot reach the company's cloud-hosted CRM at 203.0.113.50. You run a traceroute from the user's workstation:\n\ntraceroute to 203.0.113.50\n 1  10.1.1.1       1 ms    1 ms    1 ms    [Default Gateway]\n 2  10.1.254.1     2 ms    2 ms    3 ms    [Core Router]\n 3  198.51.100.1   8 ms    8 ms    9 ms    [ISP Edge]\n 4  198.51.100.5   12 ms   11 ms   12 ms   [ISP Core]\n 5  * * *\n 6  * * *\n 7  * * *\n 8  * * *\n\nPing to 198.51.100.5 (hop 4): 100 packets, 100 received, 0% loss, avg 12ms\nPing to 203.0.113.50 (destination): 100 packets, 0 received, 100% loss",
      displayFields: [],
      actions: [
        { id: "a1", label: "The next hop router after 198.51.100.5 is unreachable or down", color: "green" },
        { id: "a2", label: "The ISP edge router at 198.51.100.1 is dropping packets", color: "yellow" },
        { id: "a3", label: "The user's default gateway is misconfigured", color: "orange" },
        { id: "a4", label: "The destination server firewall is blocking ICMP only", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        { id: "r1", text: "Hop 4 (198.51.100.5) responds normally with 0% loss and 12ms latency, but all subsequent hops show complete timeouts and the destination is 100% unreachable. This indicates the link or router between hop 4 and hop 5 is the failure point - the next-hop device after 198.51.100.5 is either down or unreachable." },
        { id: "r2", text: "If only the destination were blocking ICMP, we would see the intermediate hops responding normally up to the last hop before the destination. Here, ALL hops after hop 4 are timing out, indicating a routing or connectivity failure in the ISP network, not just a firewall block." },
        { id: "r3", text: "The default gateway and ISP edge are both responding normally (hops 1-4 with consistent low latency and 0% loss), so the problem is further upstream in the path." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Correct! The traceroute clearly shows successful hops through hop 4, then complete failure from hop 5 onward. Combined with 100% ping loss to the destination but 0% loss to hop 4, this pinpoints a failure between hop 4 and hop 5 in the ISP network.",
        partial: "You identified a problem in the ISP path. The key detail is that hop 4 is the last successful response - everything after it is unreachable, pointing to a failure between hop 4 and hop 5.",
        wrong: "Hops 1-4 respond normally. All hops after hop 4 timeout and the destination has 100% loss. The failure point is the link or router immediately after hop 4 (198.51.100.5) in the ISP network.",
      },
    },
    {
      type: "action-rationale",
      id: "ptr-002",
      title: "Intermittent Loss with Asterisks at Middle Hops",
      context:
        "Users report intermittent slowness reaching an external partner site at 192.0.2.100. You run a traceroute:\n\ntraceroute to 192.0.2.100\n 1  10.1.1.1       1 ms    1 ms    1 ms    [Default Gateway]\n 2  10.1.254.1     2 ms    3 ms    2 ms    [Core Router]\n 3  198.51.100.1   9 ms    8 ms    9 ms    [ISP-A Edge]\n 4  198.51.100.5   *       12 ms   *       [ISP-A Core]\n 5  172.16.0.1     *       *       18 ms   [ISP-B Peering]\n 6  172.16.0.5     22 ms   21 ms   22 ms   [ISP-B Core]\n 7  192.0.2.1      25 ms   24 ms   25 ms   [Partner Edge]\n 8  192.0.2.100    26 ms   25 ms   26 ms   [Destination]\n\nPing to 192.0.2.100: 500 packets, 498 received, 0.4% loss, avg 26ms\nPing to 198.51.100.5 (hop 4): 500 packets, 247 received, 50.6% loss, avg 12ms\nPing to 172.16.0.5 (hop 6): 500 packets, 500 received, 0% loss, avg 22ms",
      displayFields: [],
      actions: [
        { id: "a1", label: "Hops 4 and 5 are ICMP rate-limiting, not actually dropping user traffic", color: "green" },
        { id: "a2", label: "ISP-A Core at hop 4 is experiencing severe packet loss", color: "yellow" },
        { id: "a3", label: "The ISP-B peering link is congested and dropping packets", color: "orange" },
        { id: "a4", label: "The destination server is experiencing intermittent connectivity", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        { id: "r1", text: "The asterisks at hops 4 and 5 appear alarming, but the destination (hop 8) shows consistent 25-26ms latency with only 0.4% loss over 500 pings. If hops 4 and 5 were truly dropping transit traffic, the destination would show significant loss too. Many ISP routers rate-limit ICMP responses to protect their control plane while forwarding transit traffic normally." },
        { id: "r2", text: "The 50.6% ICMP loss when pinging hop 4 directly (198.51.100.5) confirms ICMP rate-limiting. The router is deprioritizing ICMP echo replies to itself, but forwarding transit packets without issue. Hop 6 onward shows perfect responses because those routers have different ICMP policies." },
        { id: "r3", text: "The consistent latency progression (1ms, 2ms, 9ms, 12ms, 18ms, 22ms, 25ms, 26ms) with no sudden jumps confirms a healthy path. The asterisks are cosmetic artifacts of ICMP rate-limiting, not indicators of a real forwarding problem." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Excellent! You correctly identified ICMP rate-limiting. The asterisks at hops 4-5 are misleading - the destination responds with 0.4% loss and consistent latency, proving transit traffic flows normally. This is one of the most common traceroute misinterpretations.",
        partial: "You are on the right track. The critical evidence is that the destination has only 0.4% loss despite the asterisks at middle hops. If those hops were truly dropping traffic, the destination loss would be much higher.",
        wrong: "The asterisks at hops 4-5 are ICMP rate-limiting, not real packet loss. The proof: the destination shows only 0.4% loss with consistent 26ms latency. Many ISP routers rate-limit ICMP replies to themselves while forwarding transit traffic normally.",
      },
    },
    {
      type: "action-rationale",
      id: "ptr-003",
      title: "Latency Jump at a Specific Hop",
      context:
        "A remote office reports that their VoIP calls to headquarters have noticeable delay. You run a traceroute from the remote office:\n\ntraceroute to 10.50.1.10 (HQ PBX)\n 1  10.20.1.1      1 ms    1 ms    1 ms    [Remote Office GW]\n 2  10.20.254.1    2 ms    2 ms    3 ms    [Remote Office Router]\n 3  198.51.100.1   15 ms   14 ms   15 ms   [ISP Edge - Chicago]\n 4  198.51.100.9   16 ms   15 ms   16 ms   [ISP Core - Chicago]\n 5  198.51.100.33  78 ms   77 ms   79 ms   [ISP Core - London]\n 6  198.51.100.37  79 ms   78 ms   80 ms   [ISP Core - London]\n 7  203.0.113.1    80 ms   79 ms   81 ms   [ISP Edge - Frankfurt]\n 8  10.50.254.1    82 ms   81 ms   83 ms   [HQ Router - Frankfurt]\n 9  10.50.1.10     83 ms   82 ms   84 ms   [HQ PBX]\n\nPing to 10.50.1.10: 200 packets, 200 received, 0% loss\n  min/avg/max = 80/83/86 ms\n\nExpected latency (Chicago to Frankfurt direct): ~35-40ms\nISP contract route: Chicago -> Frankfurt direct peering",
      displayFields: [],
      actions: [
        { id: "a1", label: "ISP is routing traffic through London instead of direct Chicago-Frankfurt peering", color: "green" },
        { id: "a2", label: "The HQ router in Frankfurt is adding excessive processing delay", color: "yellow" },
        { id: "a3", label: "The remote office WAN link is congested", color: "orange" },
        { id: "a4", label: "The ISP edge router in Chicago is overloaded", color: "blue" },
      ],
      correctActionId: "a1",
      rationales: [
        { id: "r1", text: "The 62ms latency jump between hop 4 (Chicago, 16ms) and hop 5 (London, 78ms) reveals the traffic is being routed through London instead of directly to Frankfurt. The ISP contract specifies direct Chicago-Frankfurt peering (~35-40ms expected), but the traceroute shows a Chicago-London-Frankfurt path adding approximately 40ms of unnecessary latency." },
        { id: "r2", text: "After hop 5 (London), the latency remains stable (78-84ms) with only 1-2ms increments per hop, confirming no additional bottlenecks beyond the suboptimal routing. The entire excess latency is introduced at the Chicago-to-London hop." },
        { id: "r3", text: "The remote office local hops (1-2ms) and the ISP Chicago hops (14-16ms) are all normal. The HQ side (82-84ms) is consistent with the accumulated path latency. The problem is purely the ISP routing decision to transit through London." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Perfect interpretation! The 62ms jump between hops 4 and 5 reveals a transatlantic detour through London. With the ISP contract promising direct Chicago-Frankfurt peering at ~35-40ms, you should contact the ISP about the BGP routing change causing this suboptimal path.",
        partial: "You identified a routing issue. The key evidence is the 62ms jump at hop 5, revealing London as an unexpected transit point. The contract specifies direct Chicago-Frankfurt peering which should yield ~35-40ms, not the observed 83ms.",
        wrong: "The traceroute shows traffic routing through London (hop 5, 78ms) instead of direct Chicago-Frankfurt peering. The 62ms jump between hops 4 and 5 is the giveaway. Contact the ISP to restore the direct peering path per the contract.",
      },
    },
  ],
  hints: [
    "When reading traceroute output, focus on where the latency jumps occur between consecutive hops. A large increase between two hops indicates either geographic distance or congestion at that link.",
    "Asterisks (*) in traceroute do not always mean packet loss. Many routers rate-limit ICMP responses. Check if the destination is reachable with acceptable loss before concluding that middle hops are problematic.",
    "Always compare observed latency against expected baseline values. Knowing the geographic distance between sites helps you identify whether the routing path is optimal or includes unnecessary detours.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Ping and traceroute are the first tools every network engineer reaches for when troubleshooting. Mastering their interpretation - especially understanding ICMP rate-limiting artifacts and latency jump analysis - separates beginners from competent troubleshooters.",
  toolRelevance: ["ping", "traceroute", "mtr", "pathping", "WinMTR"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
