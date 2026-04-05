import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "subnet-mask-configuration",
  version: 1,
  title: "Subnet Mask Configuration",
  tier: "beginner",
  track: "network-fundamentals",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["subnetting", "subnet-mask", "cidr", "network-design"],
  description:
    "Set proper subnet masks for network segments to ensure correct communication boundaries.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Convert between CIDR notation and dotted-decimal subnet masks",
    "Select appropriate subnet masks for given host requirements",
    "Identify communication failures caused by mismatched subnet masks",
  ],
  sortOrder: 103,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "smc-001",
      title: "Branch Office Subnet Mask Mismatch",
      description:
        "A branch office has 50 hosts that need to communicate on the same network segment. The router interface is configured with 192.168.5.1/26, but several workstations have incorrect masks preventing communication.",
      targetSystem: "Branch Office Workstations",
      items: [
        {
          id: "item1",
          label: "WS-Finance IP/Mask",
          detail: "Workstation at 192.168.5.30 with incorrect mask. Router is /26 (255.255.255.192).",
          currentState: "255.255.255.0",
          correctState: "255.255.255.192",
          states: ["255.255.255.0", "255.255.255.192", "255.255.255.128", "255.255.255.224"],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "WS-HR IP/Mask",
          detail: "Workstation at 192.168.5.45 with incorrect mask",
          currentState: "255.255.255.128",
          correctState: "255.255.255.192",
          states: ["255.255.255.128", "255.255.255.192", "255.255.255.0", "255.255.255.224"],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "WS-Sales IP/Mask",
          detail: "Workstation at 192.168.5.62 with correct mask",
          currentState: "255.255.255.192",
          correctState: "255.255.255.192",
          states: ["255.255.255.192", "255.255.255.0", "255.255.255.128", "255.255.255.224"],
          rationaleId: "rat3",
        },
        {
          id: "item4",
          label: "Printer IP Address",
          detail: "Printer needs to be in the same /26 subnet (192.168.5.0/26). Currently assigned 192.168.5.65.",
          currentState: "192.168.5.65",
          correctState: "192.168.5.50",
          states: ["192.168.5.65", "192.168.5.50", "192.168.5.0", "192.168.5.128"],
          rationaleId: "rat4",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "A /24 mask (255.255.255.0) is too broad. The router is configured for /26, so all hosts must use 255.255.255.192 to be in the same broadcast domain.",
        },
        {
          id: "rat2",
          text: "A /25 mask (255.255.255.128) creates a different subnet boundary than /26. Both the router and all hosts must agree on the mask for correct communication.",
        },
        {
          id: "rat3",
          text: "This workstation already has the correct /26 mask matching the router configuration.",
        },
        {
          id: "rat4",
          text: "192.168.5.65 falls in the 192.168.5.64/26 subnet, not 192.168.5.0/26. The printer must have an address between 192.168.5.1-62 to be in the same subnet.",
        },
      ],
      feedback: {
        perfect:
          "All subnet masks now match the /26 configuration and the printer is in the correct subnet range. All 50 hosts can communicate properly.",
        partial:
          "Some masks are corrected but mismatches remain. Every device must use the same /26 (255.255.255.192) mask to be in the same subnet.",
        wrong:
          "Subnet mask mismatches will cause hosts to incorrectly calculate which addresses are local vs remote, breaking direct communication. All devices need 255.255.255.192.",
      },
    },
    {
      type: "toggle-config",
      id: "smc-002",
      title: "CIDR Sizing for Department VLANs",
      description:
        "You are assigning subnet masks for three department VLANs. Engineering needs 100 hosts, Marketing needs 25 hosts, and Executive needs 10 hosts. Choose the smallest subnet mask that accommodates each department.",
      targetSystem: "Core Switch VLAN Configuration",
      items: [
        {
          id: "item1",
          label: "VLAN 10 - Engineering Subnet Mask",
          detail: "Needs to support 100 hosts. Current mask is too small.",
          currentState: "/25",
          correctState: "/25",
          states: ["/24", "/25", "/26", "/27"],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "VLAN 20 - Marketing Subnet Mask",
          detail: "Needs to support 25 hosts. Current mask wastes addresses.",
          currentState: "/24",
          correctState: "/27",
          states: ["/24", "/25", "/26", "/27"],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "VLAN 30 - Executive Subnet Mask",
          detail: "Needs to support 10 hosts. Current mask is too restrictive.",
          currentState: "/29",
          correctState: "/28",
          states: ["/28", "/29", "/27", "/30"],
          rationaleId: "rat3",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "A /25 provides 126 usable host addresses (128 - 2 for network and broadcast), which is the smallest prefix that accommodates 100 hosts.",
        },
        {
          id: "rat2",
          text: "A /27 provides 30 usable addresses (32 - 2), sufficient for 25 hosts. A /24 with 254 addresses wastes over 200 addresses.",
        },
        {
          id: "rat3",
          text: "A /29 only provides 6 usable addresses, insufficient for 10 hosts. A /28 provides 14 usable addresses (16 - 2), the smallest prefix that fits.",
        },
      ],
      feedback: {
        perfect:
          "Optimal subnet sizing! Each VLAN has the smallest subnet that meets its host requirements, maximizing address space efficiency.",
        partial:
          "Some subnets are correctly sized but others waste addresses or are too small. Remember to subtract 2 from total addresses for network and broadcast.",
        wrong:
          "Subnet sizes don't match the requirements. Calculate usable hosts as 2^(32-prefix) - 2. For example, /27 = 2^5 - 2 = 30 usable hosts.",
      },
    },
    {
      type: "toggle-config",
      id: "smc-003",
      title: "Point-to-Point Link Mask Selection",
      description:
        "You are configuring WAN point-to-point links between routers. Each link connects exactly two routers. Select the most efficient subnet mask for each link from the 10.0.0.0/8 address space.",
      targetSystem: "WAN Router Interfaces",
      items: [
        {
          id: "item1",
          label: "Link R1-R2 Subnet Mask",
          detail: "Point-to-point link needing exactly 2 host addresses",
          currentState: "/24",
          correctState: "/30",
          states: ["/24", "/28", "/30", "/31"],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "Link R2-R3 Subnet Mask",
          detail: "Point-to-point link needing exactly 2 host addresses",
          currentState: "/28",
          correctState: "/30",
          states: ["/24", "/28", "/30", "/31"],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "Link R3-R4 Subnet Mask",
          detail: "Point-to-point link - same requirement as other links",
          currentState: "/30",
          correctState: "/30",
          states: ["/24", "/28", "/30", "/31"],
          rationaleId: "rat3",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "A /30 provides exactly 2 usable host addresses (4 total - network - broadcast), which is the traditional choice for point-to-point links. /24 wastes 252 addresses.",
        },
        {
          id: "rat2",
          text: "Like all point-to-point links, only 2 addresses are needed. A /28 with 14 usable addresses wastes 12 addresses per link.",
        },
        {
          id: "rat3",
          text: "This link already has the correct /30 mask. While /31 (RFC 3021) can be used on point-to-point links, /30 is the standard and most widely supported choice.",
        },
      ],
      feedback: {
        perfect:
          "All WAN links use /30 masks, the standard for point-to-point connections. This conserves the maximum number of addresses while providing exactly what each link needs.",
        partial:
          "Some links are correctly sized, but others waste addresses. Point-to-point links only need 2 host addresses, making /30 the optimal choice.",
        wrong:
          "Using large subnets on point-to-point links wastes address space. A /30 gives exactly 2 usable addresses - perfect for a link connecting two routers.",
      },
    },
  ],
  hints: [
    "To calculate usable hosts: 2^(host bits) - 2. Host bits = 32 - prefix length. For example: /26 has 6 host bits, so 2^6 - 2 = 62 usable hosts.",
    "All devices on the same network segment must use the same subnet mask. A mask mismatch causes hosts to miscalculate which destinations are local versus remote.",
    "For point-to-point links, /30 is the standard choice providing exactly 2 usable addresses. Larger masks waste address space across many WAN links.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Efficient subnet design is a core skill tested in CCNA and evaluated in network architecture roles. Over-allocating addresses leads to routing table bloat and wasted IP space.",
  toolRelevance: ["ipcalc", "sipcalc", "show ip interface brief", "ipconfig"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
