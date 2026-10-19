import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "mtu-path-discovery",
  version: 2,
  title: "Override the NOC Bot",
  tier: "intermediate",
  track: "network-troubleshooting",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["mtu", "fragmentation", "pmtud", "icmp", "df-bit", "ai-triage"],
  description:
    "The NOC's AI triage assistant has closed three tickets this week with confident, wrong diagnoses — DNS, 'firewall resolved,' and a jumbo-frame fix. Work the packet evidence yourself, classify the real fault in each case, and choose the remediation the bot should have chosen.",
  estimatedMinutes: 13,
  learningObjectives: [
    "Use ping with the Don't Fragment bit to discover path MTU limitations and prove an MTU black hole",
    "Weigh device evidence against an automated triage summary and override the tool when they disagree",
    "Identify MTU black holes caused by ICMP filtering breaking Path MTU Discovery",
    "Calculate effective tunnel MTU from encapsulation overhead (IPsec, GRE) and apply MSS clamping",
  ],
  sortOrder: 608,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "noc-bot-vpn-dns",
      title: "The Bot Says DNS. The Packets Say MTU.",
      description:
        "Users at a branch connected by a site-to-site IPsec VPN can browse and send email, but large file downloads fail and some web pages never finish loading. The AI triage assistant classified the ticket as a DNS resolution failure, flushed the resolver cache, and closed it. Users reopened it within the hour. The ticket is yours now.",
      evidence: [
        {
          type: "log",
          content:
            "AI TRIAGE SUMMARY (auto-closed):\n  Classification: DNS resolution failure\n  Confidence: 94%\n  Action taken: Resolver cache flushed on branch DNS forwarder\n  Bot note: 'Intermittent page loads are consistent with stale\n  DNS records. No further action required.'",
        },
        {
          type: "cli-output",
          content:
            "Router# ping 10.200.1.50 size 1500 df-bit\n.....\nSuccess rate is 0 percent (0/5)\n\nRouter# ping 10.200.1.50 size 1450 df-bit\n.....\nSuccess rate is 0 percent (0/5)\n\nRouter# ping 10.200.1.50 size 1430 df-bit\n.....\nSuccess rate is 0 percent (0/5)\n\nRouter# ping 10.200.1.50 size 1420 df-bit\n!!!!!\nSuccess rate is 100 percent (5/5)\n\nRouter# ping 10.200.1.50 size 1400 df-bit\n!!!!!\nSuccess rate is 100 percent (5/5)",
          icon: "terminal",
        },
        {
          type: "metrics",
          content:
            "Router# show interfaces Tunnel0\n  Tunnel protocol/transport IPsec/IP (ESP-AES256-SHA256)\n  IPsec overhead: 73 bytes\n  WAN interface MTU: 1500 bytes\n  Configured tunnel MTU: 1500 (never adjusted for overhead)\n\nEffective payload through tunnel: 1500 - 73 = 1427 bytes\nDNS check: branch resolver answers all queries correctly;\nname resolution succeeds for every failing site.",
        },
      ],
      classifications: [
        { id: "c1", label: "DNS resolution failure", description: "The bot's classification: stale records causing intermittent page loads" },
        { id: "c2", label: "MTU black hole from tunnel overhead", description: "Packets above the tunnel's effective MTU are dropped; small packets pass" },
        { id: "c3", label: "WAN packet loss", description: "The provider circuit is dropping traffic indiscriminately" },
        { id: "c4", label: "Branch server NIC fault", description: "The destination server is dropping large frames at its interface" },
      ],
      correctClassificationId: "c2",
      remediations: [
        { id: "rem-1", label: "Follow the bot: flush DNS caches again and monitor", description: "Repeat the automated action and wait to see if the problem recurs" },
        { id: "rem-2", label: "Set the tunnel interface MTU to 1427 and clamp TCP MSS to 1387", description: "Account for the 73-byte IPsec overhead so the router fragments before encryption and TCP sessions negotiate segments that fit" },
        { id: "rem-3", label: "Raise the WAN interface MTU to 9000 (jumbo frames)", description: "Give the tunnel more headroom by enlarging the physical path MTU" },
        { id: "rem-4", label: "Disable the DF bit on all VPN traffic", description: "Force fragmentation everywhere so oversized packets get through in pieces" },
      ],
      correctRemediationId: "rem-2",
      rationales: [
        { id: "r1", text: "The evidence pattern is deterministic, not intermittent: every packet above ~1427 bytes fails, everything below succeeds, and DNS resolution itself tests clean. That is the signature of an MTU black hole — the 1500-byte tunnel MTU was never reduced by the 73 bytes of IPsec ESP overhead. The bot pattern-matched 'pages fail to load' to DNS because it never ran a single packet-size test." },
        { id: "r2", text: "Setting the tunnel MTU to 1427 (1500 − 73) and clamping TCP MSS to 1387 (1427 − 40 for TCP/IP headers) fixes both TCP and non-TCP traffic at the actual constraint. Jumbo frames would require every device in the provider path to agree, and clearing the DF bit trades one clean fix for permanent fragmentation overhead." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Exactly the override the situation needed. The bot was 94% confident and completely wrong: the DF-bit sweep brackets the path MTU between 1420 and 1430, the overhead math lands on 1427, and DNS was never broken. Confidence is not evidence — packet tests are.",
        partial: "You moved past the bot's answer, but land the classification precisely: failures are size-dependent and total above a threshold, which is an MTU black hole, not loss or DNS. The remediation must address the 73-byte overhead directly — tunnel MTU 1427 plus MSS clamp 1387.",
        wrong: "Repeating the bot's DNS flush changes nothing, because name resolution was never the fault — it tests clean. Read the ping sweep: 100% success at 1420 bytes, 0% at 1430. A hard size threshold means MTU, and the tunnel was configured at 1500 without subtracting IPsec's 73 bytes.",
      },
    },
    {
      type: "triage-remediate",
      id: "noc-bot-pmtud-firewall",
      title: "'Firewall Blocking Traffic — Resolved,' Says the Bot",
      description:
        "An application server's calls to a cloud API succeed for small requests and hang forever on transfers over ~1400 bytes. The AI assistant reviewed the firewall, found an ACL with a very high match count on ICMP denies, classified the ticket 'expected firewall behavior — working as intended,' and closed it.",
      evidence: [
        {
          type: "log",
          content:
            "AI TRIAGE SUMMARY (auto-closed):\n  Classification: Firewall policy working as intended\n  Confidence: 91%\n  Bot note: 'ACL 110 is denying ICMP at high volume (289,412\n  matches). This is the firewall performing its security\n  function. Application timeouts are an application-layer\n  issue. Closing.'",
        },
        {
          type: "cli-output",
          content:
            "Server$ ping -M do -s 1472 203.0.113.100\n5 packets transmitted, 0 received, 100% packet loss\n\nServer$ ping -M do -s 1372 203.0.113.100\n5 packets transmitted, 5 received, 0% packet loss\n\nRouter# show access-lists 110\nExtended IP access list 110\n  10 deny icmp any any unreachable log (289412 matches)\n  20 deny icmp any any time-exceeded log (12841 matches)\n  30 permit ip any any (8924102 matches)\n\nNote: ACL 110 is applied inbound on the WAN interface.",
          icon: "terminal",
        },
        {
          type: "metrics",
          content:
            "All WAN interface MTUs: 1500 bytes\nPath MTU to the cloud API: somewhere below 1500 (a tunnel\nsegment in the provider path) — endpoints can only learn it\nvia ICMP Type 3 Code 4 'Fragmentation Needed' messages.\nThose messages are ICMP 'unreachable' type — the exact class\nACL 110 line 10 denies, 289,412 times.",
        },
      ],
      classifications: [
        { id: "c1", label: "Firewall working as intended", description: "The bot's classification: high ICMP deny counts are normal security behavior" },
        { id: "c2", label: "PMTUD black hole caused by ICMP filtering", description: "Blocking Type 3 Code 4 messages prevents endpoints from learning the real path MTU" },
        { id: "c3", label: "Application-layer defect", description: "The API client mishandles large responses" },
        { id: "c4", label: "Cloud provider outage", description: "The API endpoint is partially unavailable for large transfers" },
      ],
      correctClassificationId: "c2",
      remediations: [
        { id: "rem-1", label: "Accept the bot's closure and hand the ticket to the app team", description: "Treat the timeouts as an application problem, as the summary recommends" },
        { id: "rem-2", label: "Permit ICMP Type 3 Code 4 (Fragmentation Needed) in ACL 110", description: "Allow only the specific ICMP messages PMTUD requires, keeping the rest of the ICMP policy intact" },
        { id: "rem-3", label: "Reduce the server's interface MTU to 1400 permanently", description: "Work around the path limit on this one host" },
        { id: "rem-4", label: "Remove the ICMP deny lines from ACL 110 entirely", description: "Allow all ICMP unreachable and time-exceeded traffic inbound" },
      ],
      correctRemediationId: "rem-2",
      rationales: [
        { id: "r1", text: "The bot read the ACL's high deny count as proof the firewall was doing its job. Read the ACL itself: line 10 denies ALL ICMP unreachable messages — including Type 3 Code 4, the Fragmentation Needed signal Path MTU Discovery depends on. Without it, the server never learns the path MTU is below 1500, keeps sending full-size DF packets, and they vanish silently. The 289,412 matches are not the firewall succeeding; they are the black hole's body count." },
        { id: "r2", text: "Permitting the single type/code PMTUD needs restores discovery for every flow, not just this server. Lowering one server's MTU is a partial workaround that leaves the black hole in place for the next host, and removing the ICMP denies entirely throws away a deliberate security policy to fix a one-line problem." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Right override. The deny count the bot celebrated was the failure itself: ACL 110 blocks the Fragmentation Needed messages PMTUD lives on. Permitting ICMP Type 3 Code 4 — surgically, not wholesale — restores path MTU discovery while the rest of the policy stands.",
        partial: "You rejected the bot's closure, good — now be precise about the mechanism. It is not 'the firewall blocks traffic' in general; it is one ACL line eating the specific ICMP type/code that tells endpoints to shrink their packets. The fix is equally specific.",
        wrong: "The bot's confidence came from a match counter, not from reading the ACL. Line 10 denies all ICMP unreachables, which includes the Fragmentation Needed messages PMTUD requires — so large packets die silently and forever. Working as intended is the one thing this firewall is not doing.",
      },
    },
    {
      type: "triage-remediate",
      id: "noc-bot-gre-jumbo",
      title: "The Bot Wants Jumbo Frames on the WAN",
      description:
        "A branch office on a GRE tunnel to HQ reports its ERP application failing on large form submissions while small queries work. The AI assistant has proposed a remediation and is waiting for a human to approve it — the first time this week it has asked. Read its proposal against the interface evidence before you decide.",
      evidence: [
        {
          type: "log",
          content:
            "AI REMEDIATION PROPOSAL (awaiting approval):\n  Diagnosis: 'Tunnel MTU mismatch'\n  Proposed action: Set the physical WAN interface MTU to\n  1524 bytes 'to accommodate the 24-byte GRE overhead'\n  Confidence: 88%\n  Bot note: 'This preserves the full 1500-byte tunnel MTU\n  for end hosts.'",
        },
        {
          type: "cli-output",
          content:
            "Router-Branch# show interfaces Tunnel1\n  Description: GRE to HQ\n  Tunnel transport MTU 1476 bytes\n  IP MTU is 1500 bytes (configured — overhead not applied)\n\nRouter-Branch# ping 10.200.1.100 source Tunnel1 size 1500 df-bit\n.....\nSuccess rate is 0 percent (0/5)\n\nRouter-Branch# ping 10.200.1.100 source Tunnel1 size 1476 df-bit\n!!!!!\nSuccess rate is 100 percent (5/5)\n\nRouter-Branch# show running-config interface Tunnel1\n  ! No ip mtu or ip tcp adjust-mss configured",
          icon: "terminal",
        },
        {
          type: "metrics",
          content:
            "GRE overhead: 24 bytes (20-byte outer IP + 4-byte GRE header)\nPhysical WAN MTU: 1500 bytes (provider Ethernet handoff;\nprovider does not support baby jumbo or jumbo frames on this\ncircuit — confirmed in the service contract)\nEffective tunnel payload: 1500 - 24 = 1476 bytes",
        },
      ],
      classifications: [
        { id: "c1", label: "Tunnel MTU not adjusted for GRE overhead", description: "Tunnel accepts 1500-byte packets it can only carry as 1476 after encapsulation" },
        { id: "c2", label: "Physical MTU too small", description: "The bot's framing: the WAN interface must grow to fit tunnel + overhead" },
        { id: "c3", label: "ERP application defect", description: "Large form submissions are an application bug" },
        { id: "c4", label: "GRE tunnel instability", description: "The tunnel is flapping and dropping long transfers" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem-1", label: "Approve the bot's proposal: set the WAN interface to 1524", description: "Enlarge the physical MTU so the tunnel keeps a full 1500-byte payload" },
        { id: "rem-2", label: "Reject it: set 'ip mtu 1476' and 'ip tcp adjust-mss 1436' on Tunnel1", description: "Shrink the tunnel's view of the path to what the physical circuit can actually carry, and clamp TCP sessions to fit" },
        { id: "rem-3", label: "Enable 'tunnel path-mtu-discovery' and leave static values unset", description: "Let the tunnel discover its path MTU dynamically" },
        { id: "rem-4", label: "Replace the GRE tunnel with a direct IPsec tunnel", description: "Change tunnel technology to avoid the overhead question" },
      ],
      correctRemediationId: "rem-2",
      rationales: [
        { id: "r1", text: "The bot's diagnosis is right and its arithmetic is right — 24 bytes of GRE overhead — but its remedy points the wrong way. The provider circuit is fixed at 1500 and does not carry jumbo frames, so a 1524-byte physical MTU would simply move the drops to the provider edge. The constraint is the physical path; the tunnel must be told the truth about it: ip mtu 1476, with TCP MSS clamped to 1436 so sessions never offer a segment the tunnel cannot carry." },
        { id: "r2", text: "Dynamic tunnel PMTUD helps but depends on ICMP messages surviving the path — the failure in the previous ticket shows why that cannot be the only mechanism. Explicit values are deterministic. And replacing GRE with IPsec changes the overhead number, not the problem: IPsec overhead is larger." },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect: "Correct — and this is the subtle one. The bot's diagnosis and math were right; only its remedy was impossible on a 1500-byte provider circuit. Overriding a mostly-right tool on the one point where it matters is exactly the judgment this lab is training.",
        partial: "You were right to hesitate at the 1524 proposal — the provider cannot carry it. Complete the picture: classify this as the tunnel never being told its real payload (1476), and fix it deterministically with ip mtu 1476 and adjust-mss 1436 on the tunnel interface.",
        wrong: "Approving the bot's fix would have moved the failure, not fixed it: the WAN circuit is contractually 1500 bytes with no jumbo support. Work within the constraint — set the tunnel MTU to the true payload of 1476 and clamp MSS to 1436.",
      },
    },
  ],
  hints: [
    "An automated summary is a hypothesis. When the bot names a layer (DNS, firewall, application), ask what packet-level evidence would prove it — then check whether anyone collected that evidence.",
    "Size-dependent failure is the MTU signature: 100% success below a threshold, 0% above it. Binary-search the threshold with DF-bit pings, then match it against the overhead math (IPsec ~73 bytes, GRE 24 bytes).",
    "TCP MSS clamping should be the tunnel MTU minus 40 bytes (20 IP + 20 TCP headers). This prevents TCP sessions from negotiating segments larger than the tunnel can carry without fragmentation.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Every NOC is adding AI triage, and every AI triage system inherits the failure mode on display here: fluent, confident classification from pattern-matching, with no packet ever tested. The engineers who advance are the ones who treat the bot's summary as a first draft — verify it against device evidence, override it when the evidence disagrees, and document why. MTU faults are the perfect training ground: they are invisible to symptom-matching and obvious to anyone who runs one DF-bit ping sweep.",
  toolRelevance: ["ping", "traceroute", "show interfaces", "Wireshark", "ip tcp adjust-mss"],
  createdAt: "2026-03-28",
  updatedAt: "2026-10-18",
};

export default lab;
