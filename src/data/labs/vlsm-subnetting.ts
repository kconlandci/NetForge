import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "vlsm-subnetting",
  version: 1,
  title: "VLSM Subnetting",
  tier: "intermediate",
  track: "network-fundamentals",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["vlsm", "subnetting", "cidr", "ip-addressing", "network-design"],
  description:
    "Configure Variable Length Subnet Masking for efficient IP address allocation across networks of varying sizes.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Apply VLSM to allocate subnets of different sizes from a single address block",
    "Order subnet allocation from largest to smallest to prevent overlap",
    "Verify VLSM assignments do not create address conflicts between subnets",
  ],
  sortOrder: 115,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "vlsm-001",
      title: "VLSM Allocation for Multi-Site Network",
      description:
        "You have been allocated 172.16.0.0/22 (1022 usable addresses) for a network with three segments: HQ (500 hosts), Branch A (100 hosts), and Branch B (50 hosts). Assign the most efficient subnets starting with the largest requirement.",
      targetSystem: "Network Addressing Plan",
      items: [
        {
          id: "item1",
          label: "HQ Subnet (500 hosts needed)",
          detail: "Largest segment - assign first to avoid fragmentation",
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
          detail: "Second largest - starts after HQ subnet ends",
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
          detail: "Smallest segment - starts after Branch A subnet ends",
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
          text: "A /23 provides 510 usable hosts, the smallest subnet that accommodates 500 hosts. The HQ subnet spans 172.16.0.0-172.16.1.255, using the first half of the /22 allocation.",
        },
        {
          id: "rat2",
          text: "A /25 provides 126 usable hosts for the 100-host requirement. It starts at 172.16.2.0 (immediately after the /23 ends) and spans through 172.16.2.127.",
        },
        {
          id: "rat3",
          text: "A /26 provides 62 usable hosts for 50 hosts. It starts at 172.16.2.128 (immediately after the /25 ends). This precise allocation avoids wasting addresses and prevents overlap.",
        },
      ],
      feedback: {
        perfect:
          "Perfect VLSM allocation! Subnets are ordered from largest to smallest with no overlap and minimal waste. You used 702 of 1022 available addresses efficiently.",
        partial:
          "Some subnets are oversized or incorrectly positioned. Remember: allocate largest subnets first, each starting at the next available boundary after the previous subnet.",
        wrong:
          "VLSM requires allocating from largest to smallest: /23 for HQ (500 hosts), /25 for Branch A (100 hosts), /26 for Branch B (50 hosts), each starting at the next available boundary.",
      },
    },
    {
      type: "toggle-config",
      id: "vlsm-002",
      title: "Point-to-Point Link Addressing in VLSM Plan",
      description:
        "After allocating subnets for LAN segments from 10.10.0.0/20, you need to assign addresses for 4 point-to-point WAN links. Use the remaining address space efficiently.",
      targetSystem: "WAN Link Addressing",
      items: [
        {
          id: "item1",
          label: "WAN Link 1 (R1-R2) Subnet",
          detail: "Point-to-point link needing 2 host addresses",
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
          detail: "Next point-to-point link after WAN Link 1",
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
          detail: "Third point-to-point link",
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
          detail: "Fourth point-to-point link",
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
          text: "A /30 provides exactly 2 usable addresses for a point-to-point link. Starting at 10.10.15.0, this uses addresses .0-.3 (network .0, hosts .1 and .2, broadcast .3).",
        },
        {
          id: "rat2",
          text: "The second /30 starts at .4 (immediately after the first /30 ends at .3). This uses .4-.7 with no gap or overlap.",
        },
        {
          id: "rat3",
          text: "The third /30 starts at .8 (after the second ends at .7). Sequential /30 allocation uses 4 addresses per link: network, host, host, broadcast.",
        },
        {
          id: "rat4",
          text: "The fourth /30 starts at .12. All four WAN links use only 16 addresses (10.10.15.0-15), compared to 1024 if /24 subnets were used.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! Four WAN links in just 16 addresses using sequential /30 subnets. This is efficient VLSM design for point-to-point links.",
        partial:
          "Some /30 allocations have gaps. Sequential /30 subnets increment by 4: .0/30, .4/30, .8/30, .12/30. Each uses exactly 4 addresses.",
        wrong:
          "Point-to-point links use /30 subnets allocated sequentially: .0/30, .4/30, .8/30, .12/30. Skipping addresses wastes the limited address space.",
      },
    },
    {
      type: "toggle-config",
      id: "vlsm-003",
      title: "Fixing Overlapping VLSM Subnets",
      description:
        "A network engineer made VLSM allocation errors that cause routing conflicts. The address block is 192.168.100.0/24. Identify and fix the overlapping subnets.",
      targetSystem: "Routing Table Conflicts",
      items: [
        {
          id: "item1",
          label: "VLAN 10 Subnet",
          detail: "Needs 60 hosts. Current assignment overlaps with VLAN 20.",
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
          detail: "Needs 60 hosts. Currently starts inside VLAN 10's range.",
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
          detail: "Needs 25 hosts. Must not overlap with VLANs 10 or 20.",
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
          text: "The original /25 (192.168.100.0-127) is too large for 60 hosts and overlaps VLAN 20 at .64. Reducing to /26 (192.168.100.0-63) fits 60 hosts and frees .64-127 for other subnets.",
        },
        {
          id: "rat2",
          text: "With VLAN 10 reduced to /26 (.0-.63), VLAN 20 can use 192.168.100.64/26 (.64-.127) without overlap. Both VLANs get 62 usable addresses for their 60-host requirements.",
        },
        {
          id: "rat3",
          text: "VLAN 30 at 192.168.100.128/27 (.128-.159) provides 30 usable hosts for the 25-host requirement. Starting at .128 ensures no overlap with VLANs 10 (.0-.63) or 20 (.64-.127).",
        },
      ],
      feedback: {
        perfect:
          "All overlaps are resolved! VLAN 10 uses .0/26, VLAN 20 uses .64/26, and VLAN 30 uses .128/27. No address ranges overlap and all host requirements are met.",
        partial:
          "Some overlaps remain. Draw out the address ranges on paper: .0-63 (VLAN 10), .64-127 (VLAN 20), .128-159 (VLAN 30). No ranges should intersect.",
        wrong:
          "The subnets must not overlap. Right-size VLAN 10 to /26 (.0-63), keep VLAN 20 at .64/26 (.64-127), and move VLAN 30 to .128/27 (.128-159).",
      },
    },
  ],
  hints: [
    "Always allocate the largest subnet first, then progressively smaller ones. This prevents fragmentation and overlap in the address space.",
    "A /30 subnet uses 4 addresses (network + 2 hosts + broadcast). Sequential /30s increment by 4: .0, .4, .8, .12, .16, etc.",
    "To verify no overlap, write out the full range of each subnet. For example, 192.168.1.0/26 spans .0-.63 and 192.168.1.64/26 spans .64-.127.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "VLSM design is a key CCNA exam topic and a practical skill used daily by network architects. Efficient address allocation reduces routing table size and conserves limited IPv4 address space.",
  toolRelevance: ["ipcalc", "sipcalc", "show ip route", "Visual Subnet Calculator"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
