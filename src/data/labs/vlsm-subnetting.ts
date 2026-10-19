import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "vlsm-subnetting",
  version: 2,
  title: "Check the AI's Subnet Plan",
  tier: "intermediate",
  track: "network-fundamentals",
  difficulty: "challenging",
  accessLevel: "free",
  tags: ["vlsm", "subnetting", "cidr", "ip-addressing", "ai-review", "network-design"],
  description:
    "An AI assistant produced the VLSM plan for a growing office: subnet sizes, WAN link addressing, and a VLAN layout. Its arithmetic is fluent, confident — and wrong in the places arithmetic always is. Verify every allocation before the plan is deployed: two subnets overlap and one wastes a whole /24.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Verify AI-generated VLSM allocations host-count by host-count instead of trusting presented arithmetic",
    "Detect overlapping subnet ranges by writing out each allocation's full address span",
    "Apply the largest-first allocation order that prevents overlap and fragmentation",
    "Recognize waste patterns in generated plans (oversized subnets, skipped /30 blocks) and quantify what they cost",
  ],
  sortOrder: 115,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "ai-vlsm-multisite",
      title: "The AI's Plan for Three Sites",
      description:
        "The AI was given 172.16.0.0/22 (1022 usable addresses) and three segments: HQ (500 hosts), Branch A (100 hosts), and Branch B (50 hosts). Its plan 'allocates each site an appropriately sized subnet.' The values below are what it actually produced. Set each allocation to a correct one.",
      targetSystem: "Network Addressing Plan — AI Draft v1",
      items: [
        {
          id: "item1",
          label: "HQ Subnet (500 hosts needed)",
          detail: "The AI's plan assigns a /24: 254 usable addresses for a 500-host site",
          currentState: "172.16.0.0/24 (254 hosts - too small)",
          correctState: "172.16.0.0/23 (510 hosts)",
          states: [
            "172.16.0.0/24 (254 hosts - too small)",
            "172.16.0.0/23 (510 hosts)",
            "172.16.0.0/22 (1022 hosts - wastes space)",
            "172.16.0.0/25 (126 hosts - too small)",
          ],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "Branch A Subnet (100 hosts needed)",
          detail: "The AI sized this one generously instead: a /24 for 100 hosts, wasting 154 addresses",
          currentState: "172.16.2.0/24 (254 hosts - oversized)",
          correctState: "172.16.2.0/25 (126 hosts)",
          states: [
            "172.16.2.0/24 (254 hosts - oversized)",
            "172.16.2.0/25 (126 hosts)",
            "172.16.2.0/26 (62 hosts - too small)",
            "172.16.1.0/25 (overlaps HQ)",
          ],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "Branch B Subnet (50 hosts needed)",
          detail: "Smallest segment. The AI again assigned a full /24",
          currentState: "172.16.3.0/24 (254 hosts - oversized)",
          correctState: "172.16.2.128/26 (62 hosts)",
          states: [
            "172.16.3.0/24 (254 hosts - oversized)",
            "172.16.2.128/26 (62 hosts)",
            "172.16.2.128/27 (30 hosts - too small)",
            "172.16.2.64/26 (overlaps Branch A)",
          ],
          rationaleId: "rat3",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "The AI's first error is the one its summary least prepares you for: a /24 holds 254 usable hosts, and HQ needs 500. A /23 provides 510 — the smallest subnet that fits. The HQ subnet spans 172.16.0.0-172.16.1.255, the first half of the /22. Generated plans state requirements and allocations in the same confident tone whether or not the numbers satisfy them; the check is always: hosts needed <= hosts provided.",
        },
        {
          id: "rat2",
          text: "A /25 provides 126 usable hosts for the 100-host requirement. It starts at 172.16.2.0, immediately after the corrected /23 ends. The AI's /24 wastes 154 addresses — in a /22 with only 1022 total, that waste is what forces the next site into a corner.",
        },
        {
          id: "rat3",
          text: "A /26 provides 62 usable hosts for 50 hosts, starting at 172.16.2.128, immediately after Branch A's /25 ends. The corrected plan uses 702 of 1022 addresses with room to grow; the AI's plan both under-serves HQ and strands a full /24 on a 50-host site.",
        },
      ],
      feedback: {
        perfect:
          "Perfect verification. You caught the plan failing in both directions — too small where it mattered most (HQ), wastefully large everywhere else — and rebuilt it largest-first with no overlaps and 320 addresses to spare. That host-count check is the whole skill.",
        partial:
          "Some allocations are fixed, but re-verify each one against its requirement: largest first (/23 for 500), then /25 for 100, then /26 for 50, each starting at the next free boundary after the previous subnet.",
        wrong:
          "The AI's plan gives a 500-host site 254 addresses and burns two full /24s on sites needing 100 and 50. Never deploy generated arithmetic unchecked: write out each subnet's range and host count, and compare it to the requirement it claims to meet.",
      },
    },
    {
      type: "toggle-config",
      id: "ai-vlsm-wan-links",
      title: "The AI's WAN Link Addressing",
      description:
        "From the remaining space in 10.10.0.0/20, the AI addressed 4 point-to-point WAN links. Its plan uses /24s and widely spaced /30s 'for clarity and future growth.' Both habits waste the scarcest resource in the design. Correct each link.",
      targetSystem: "WAN Link Addressing — AI Draft v1",
      items: [
        {
          id: "item1",
          label: "WAN Link 1 (R1-R2) Subnet",
          detail: "Point-to-point link needing 2 host addresses. The AI assigned a full /24",
          currentState: "10.10.15.0/24 (wastes 252 addresses)",
          correctState: "10.10.15.0/30 (2 usable hosts)",
          states: [
            "10.10.15.0/24 (wastes 252 addresses)",
            "10.10.15.0/30 (2 usable hosts)",
            "10.10.15.0/28 (14 usable hosts)",
            "10.10.15.0/31 (2 hosts, no broadcast)",
          ],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "WAN Link 2 (R1-R3) Subnet",
          detail: "Next point-to-point link. The AI jumped to 10.10.15.16/30, leaving a gap",
          currentState: "10.10.15.16/30",
          correctState: "10.10.15.4/30 (2 usable hosts)",
          states: [
            "10.10.15.16/30",
            "10.10.15.4/30 (2 usable hosts)",
            "10.10.15.2/30 (overlaps Link 1)",
            "10.10.15.8/30",
          ],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "WAN Link 3 (R2-R3) Subnet",
          detail: "Third point-to-point link. The AI spaced this one at 10.10.15.64/30",
          currentState: "10.10.15.64/30",
          correctState: "10.10.15.8/30 (2 usable hosts)",
          states: [
            "10.10.15.64/30",
            "10.10.15.8/30 (2 usable hosts)",
            "10.10.15.4/30 (overlaps Link 2)",
            "10.10.15.12/30",
          ],
          rationaleId: "rat3",
        },
        {
          id: "item4",
          label: "WAN Link 4 (R3-R4) Subnet",
          detail: "Fourth point-to-point link. The AI continued the pattern at 10.10.15.128/30",
          currentState: "10.10.15.128/30",
          correctState: "10.10.15.12/30 (2 usable hosts)",
          states: [
            "10.10.15.128/30",
            "10.10.15.12/30 (2 usable hosts)",
            "10.10.15.8/30 (overlaps Link 3)",
            "10.10.15.16/30",
          ],
          rationaleId: "rat4",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "A /30 provides exactly 2 usable addresses for a point-to-point link: network .0, hosts .1 and .2, broadcast .3. The AI's /24 spends 254 addresses to do a 2-address job — the single most common waste pattern in generated addressing plans.",
        },
        {
          id: "rat2",
          text: "Sequential /30s increment by 4: the second link starts at .4, immediately after the first ends at .3. The AI's jump to .16 'for clarity' strands three usable /30 blocks (.4, .8, .12) — clarity that costs address space is just waste with good branding.",
        },
        {
          id: "rat3",
          text: "The third /30 starts at .8. All four links together need 16 addresses; the AI's spaced-out plan sprawls across 132.",
        },
        {
          id: "rat4",
          text: "The fourth /30 starts at .12, completing a contiguous block 10.10.15.0-15. Contiguity matters beyond efficiency: the whole WAN block summarizes into one route advertisement.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! Four WAN links in 16 contiguous addresses using sequential /30s — and you saw through the AI's 'clarity and growth' justification for a plan that sprawled across 132 addresses and spent a /24 on a two-host link.",
        partial:
          "Some links are corrected, but check the sequence: /30s increment by 4 (.0, .4, .8, .12) with no gaps. Gaps are how generated plans quietly fragment an address block.",
        wrong:
          "Point-to-point links take /30s allocated back-to-back: .0/30, .4/30, .8/30, .12/30 — 16 addresses total. A /24 for two hosts and /30s scattered at .16, .64, and .128 are both waste patterns, however tidy the plan looks.",
      },
    },
    {
      type: "toggle-config",
      id: "ai-vlsm-overlaps",
      title: "The AI's VLAN Plan Overlaps Itself",
      description:
        "For three office VLANs in 192.168.100.0/24, the AI produced the layout below and reported 'no conflicts detected.' It did not run the ranges. Run them yourself: VLAN 10 needs 60 hosts, VLAN 20 needs 60 hosts, VLAN 30 needs 25.",
      targetSystem: "Office VLAN Addressing — AI Draft v1",
      items: [
        {
          id: "item1",
          label: "VLAN 10 Subnet",
          detail: "Needs 60 hosts. The AI's /25 spans .0-.127 — swallowing the range VLAN 20 needs",
          currentState: "192.168.100.0/25 (126 hosts)",
          correctState: "192.168.100.0/26 (62 hosts)",
          states: [
            "192.168.100.0/25 (126 hosts)",
            "192.168.100.0/26 (62 hosts)",
            "192.168.100.0/27 (30 hosts - too small)",
            "192.168.100.128/26 (62 hosts)",
          ],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "VLAN 20 Subnet",
          detail: "Needs 60 hosts. The AI placed it at .64 — inside VLAN 10's /25 range",
          currentState: "192.168.100.64/26 (overlaps with /25 above)",
          correctState: "192.168.100.64/26 (62 hosts)",
          states: [
            "192.168.100.64/26 (overlaps with /25 above)",
            "192.168.100.64/26 (62 hosts)",
            "192.168.100.128/26 (62 hosts)",
            "192.168.100.0/26 (overlaps VLAN 10)",
          ],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "VLAN 30 Subnet",
          detail: "Needs 25 hosts. The AI placed it at .96 — inside VLAN 20's range as drafted",
          currentState: "192.168.100.96/27 (overlaps VLAN 20)",
          correctState: "192.168.100.128/27 (30 hosts)",
          states: [
            "192.168.100.96/27 (overlaps VLAN 20)",
            "192.168.100.128/27 (30 hosts)",
            "192.168.100.64/27 (overlaps VLAN 20)",
            "192.168.100.160/27 (30 hosts)",
          ],
          rationaleId: "rat3",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "The /25 (192.168.100.0-127) is oversized for 60 hosts and is the root of both overlaps: it covers the .64 boundary where VLAN 20 belongs. Right-sizing VLAN 10 to a /26 (.0-.63) fits 60 hosts and frees .64-127. An AI's 'no conflicts detected' means nothing until someone writes out the ranges — so write out the ranges.",
        },
        {
          id: "rat2",
          text: "With VLAN 10 at /26 (.0-.63), VLAN 20's .64/26 (.64-.127) no longer overlaps anything. The AI's error was not VLAN 20's placement; it was the oversized subnet upstream of it. Overlap defects in generated plans often have one root cause, not three.",
        },
        {
          id: "rat3",
          text: "VLAN 30 at 192.168.100.128/27 (.128-.159) gives 30 usable hosts for the 25-host requirement and starts exactly where VLAN 20 ends. The AI's .96 placement sits inside VLAN 20's range — an address conflict that would have produced intermittent, maddening routing behavior in production.",
        },
      ],
      feedback: {
        perfect:
          "All overlaps resolved: VLAN 10 at .0/26, VLAN 20 at .64/26, VLAN 30 at .128/27 — every requirement met, no ranges intersecting. And you found the single root cause (the oversized /25) instead of chasing three symptoms. That is how you audit a generated plan.",
        partial:
          "Some overlaps remain. Write out the full ranges: .0-63 (VLAN 10), .64-127 (VLAN 20), .128-159 (VLAN 30). No two ranges may intersect, and each must hold its host count.",
        wrong:
          "As drafted, VLAN 20 starts inside VLAN 10, and VLAN 30 starts inside VLAN 20 — two overlaps the AI's 'no conflicts detected' sailed past. Right-size VLAN 10 to /26, keep VLAN 20 at .64/26, move VLAN 30 to .128/27. Ranges first, confidence later.",
      },
    },
  ],
  hints: [
    "Verify generated arithmetic the slow way: for every subnet, write the full range (first address to last) and the usable host count, and compare both against the requirement it claims to meet.",
    "Always allocate the largest subnet first, then progressively smaller ones. This prevents fragmentation and overlap in the address space.",
    "A /30 subnet uses 4 addresses (network + 2 hosts + broadcast). Sequential /30s increment by 4: .0, .4, .8, .12, .16 — gaps between them are waste, not clarity.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Subnetting is the skill AI was supposed to make obsolete — assistants produce VLSM plans instantly. What they cannot do is be responsible for them. Plans fail in production as overlapping ranges, exhausted blocks, and 500-host sites squeezed into 254 addresses, all delivered in flawless formatting. The engineer who verifies the arithmetic owns the design; the one who pastes it owns the outage.",
  toolRelevance: ["ipcalc", "sipcalc", "show ip route", "Visual Subnet Calculator"],
  createdAt: "2026-03-28",
  updatedAt: "2026-10-18",
};

export default lab;
