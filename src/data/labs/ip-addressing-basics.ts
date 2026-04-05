import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ip-addressing-basics",
  version: 1,
  title: "IP Addressing Basics",
  tier: "beginner",
  track: "network-fundamentals",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["ip-addressing", "ipv4", "configuration", "subnetting"],
  description:
    "Configure correct IP addresses for a small network by identifying and correcting addressing errors.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Assign valid IP addresses to hosts within a given subnet",
    "Identify and correct common IP addressing mistakes",
    "Understand the relationship between IP addresses, subnet masks, and default gateways",
  ],
  sortOrder: 102,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "ipa-001",
      title: "Small Office Network Setup",
      description:
        "A small office has a router with interface 192.168.1.1/24 serving as the default gateway. Three workstations need IP configuration. Review each setting and correct any errors.",
      targetSystem: "Office Workstations (WS-01, WS-02, WS-03)",
      items: [
        {
          id: "item1",
          label: "WS-01 IP Address",
          detail: "Currently configured with a network address instead of a host address",
          currentState: "192.168.1.0",
          correctState: "192.168.1.10",
          states: ["192.168.1.0", "192.168.1.10", "192.168.1.255", "192.168.2.10"],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "WS-02 Default Gateway",
          detail: "The default gateway should point to the router interface on this subnet",
          currentState: "192.168.2.1",
          correctState: "192.168.1.1",
          states: ["192.168.2.1", "192.168.1.1", "192.168.1.254", "0.0.0.0"],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "WS-03 Subnet Mask",
          detail: "The subnet mask must match the network configuration of /24",
          currentState: "255.255.0.0",
          correctState: "255.255.255.0",
          states: ["255.255.0.0", "255.255.255.0", "255.255.255.128", "255.0.0.0"],
          rationaleId: "rat3",
        },
        {
          id: "item4",
          label: "WS-01 DNS Server",
          detail: "DNS server should be reachable and valid",
          currentState: "192.168.1.1",
          correctState: "192.168.1.1",
          states: ["192.168.1.1", "0.0.0.0", "255.255.255.255", "192.168.1.0"],
          rationaleId: "rat4",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "192.168.1.0 is the network address for the /24 subnet and cannot be assigned to a host. A valid host address like 192.168.1.10 must be used instead.",
        },
        {
          id: "rat2",
          text: "The default gateway must be on the same subnet as the workstation. The router's interface is 192.168.1.1, so the gateway must point there, not to a different subnet.",
        },
        {
          id: "rat3",
          text: "A /24 network uses subnet mask 255.255.255.0. Using 255.255.0.0 (/16) would place the workstation in a much larger subnet that doesn't match the router's configuration.",
        },
        {
          id: "rat4",
          text: "Using the router as DNS server is valid when the router is configured for DNS forwarding, which is common in small office setups.",
        },
      ],
      feedback: {
        perfect:
          "All IP configurations are correct. The workstations now have valid host addresses, matching subnet masks, and proper gateway assignments.",
        partial:
          "Some settings are correct but others still have issues. Double-check that all addresses are valid hosts within the 192.168.1.0/24 network.",
        wrong:
          "Multiple configuration errors remain. Remember: host addresses cannot be network or broadcast addresses, gateways must be on the local subnet, and subnet masks must match the network design.",
      },
    },
    {
      type: "toggle-config",
      id: "ipa-002",
      title: "Duplicate Address and Broadcast Conflict",
      description:
        "Two servers on the 10.0.50.0/24 network are experiencing intermittent connectivity. Investigation reveals IP addressing conflicts. Fix the configuration.",
      targetSystem: "Server VLAN (SRV-DB, SRV-APP)",
      items: [
        {
          id: "item1",
          label: "SRV-DB IP Address",
          detail: "This server has the same IP as SRV-APP, causing a duplicate address conflict",
          currentState: "10.0.50.20",
          correctState: "10.0.50.21",
          states: ["10.0.50.20", "10.0.50.21", "10.0.50.255", "10.0.50.0"],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "SRV-APP IP Address",
          detail: "SRV-APP is assigned the broadcast address of the subnet",
          currentState: "10.0.50.255",
          correctState: "10.0.50.20",
          states: ["10.0.50.255", "10.0.50.20", "10.0.50.0", "10.0.51.20"],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "SRV-DB Default Gateway",
          detail: "Gateway is set to an address outside the local subnet",
          currentState: "10.0.51.1",
          correctState: "10.0.50.1",
          states: ["10.0.51.1", "10.0.50.1", "10.0.50.254", "10.0.0.1"],
          rationaleId: "rat3",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "Two hosts cannot share the same IP address. SRV-DB needs a unique address within the 10.0.50.0/24 range to eliminate the duplicate IP conflict.",
        },
        {
          id: "rat2",
          text: "10.0.50.255 is the broadcast address for the /24 subnet and cannot be used as a host address. SRV-APP needs a valid unicast address.",
        },
        {
          id: "rat3",
          text: "The default gateway must be an address on the same subnet as the host. 10.0.51.1 is on a different subnet from 10.0.50.0/24.",
        },
      ],
      feedback: {
        perfect:
          "Both servers now have unique, valid host addresses with correct gateway configuration. The duplicate address conflict is resolved.",
        partial:
          "Some issues are fixed but conflicts may remain. Ensure no duplicate IPs exist and neither server uses the network or broadcast address.",
        wrong:
          "The addressing conflicts persist. Each server needs a unique IP within 10.0.50.1-10.0.50.254, and the gateway must be on the 10.0.50.0/24 subnet.",
      },
    },
    {
      type: "toggle-config",
      id: "ipa-003",
      title: "Multi-Subnet Router Configuration",
      description:
        "A router connects two subnets: 172.16.10.0/24 on Gig0/0 and 172.16.20.0/24 on Gig0/1. Hosts on both subnets cannot communicate. Review the router interface settings.",
      targetSystem: "Core-Router (Gig0/0, Gig0/1)",
      items: [
        {
          id: "item1",
          label: "Gig0/0 IP Address",
          detail: "Interface serving the 172.16.10.0/24 subnet",
          currentState: "172.16.20.1",
          correctState: "172.16.10.1",
          states: ["172.16.20.1", "172.16.10.1", "172.16.10.0", "172.16.0.1"],
          rationaleId: "rat1",
        },
        {
          id: "item2",
          label: "Gig0/1 IP Address",
          detail: "Interface serving the 172.16.20.0/24 subnet",
          currentState: "172.16.10.1",
          correctState: "172.16.20.1",
          states: ["172.16.10.1", "172.16.20.1", "172.16.20.0", "172.16.0.2"],
          rationaleId: "rat2",
        },
        {
          id: "item3",
          label: "Gig0/0 Interface Status",
          detail: "Interface administrative state",
          currentState: "shutdown",
          correctState: "no shutdown",
          states: ["shutdown", "no shutdown"],
          rationaleId: "rat3",
        },
        {
          id: "item4",
          label: "Gig0/1 Interface Status",
          detail: "Interface administrative state",
          currentState: "no shutdown",
          correctState: "no shutdown",
          states: ["shutdown", "no shutdown"],
          rationaleId: "rat4",
        },
      ],
      rationales: [
        {
          id: "rat1",
          text: "Gig0/0 serves the 172.16.10.0/24 subnet, so its IP must be in that range. It was incorrectly assigned a 172.16.20.x address, which belongs to the other subnet.",
        },
        {
          id: "rat2",
          text: "Gig0/1 serves 172.16.20.0/24 but was given a 172.16.10.x address. The two interface IPs were swapped, preventing routing between subnets.",
        },
        {
          id: "rat3",
          text: "An interface in shutdown state cannot pass traffic. The interface must be enabled with 'no shutdown' to serve its connected subnet.",
        },
        {
          id: "rat4",
          text: "Gig0/1 is already in the correct 'no shutdown' state and should remain active.",
        },
      ],
      feedback: {
        perfect:
          "The router interfaces are now correctly configured with proper IPs for their respective subnets and both interfaces are active. Inter-subnet routing will function.",
        partial:
          "Some corrections were made but routing may still fail. Verify each interface has an IP address within its connected subnet and is not shutdown.",
        wrong:
          "The router interfaces have swapped IP addresses and Gig0/0 is shutdown. Each interface must have an IP in its connected subnet and be administratively enabled.",
      },
    },
  ],
  hints: [
    "Remember that the first address in a subnet (e.g., x.x.x.0) is the network address and the last (e.g., x.x.x.255 for /24) is the broadcast address. Neither can be assigned to hosts.",
    "A default gateway must be a reachable IP address on the same subnet as the host. If the gateway is on a different subnet, the host cannot reach it.",
    "Every IP address on a network must be unique. Duplicate addresses cause intermittent connectivity as both hosts compete for the same address.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "IP addressing errors are among the most common issues network technicians troubleshoot daily. Mastering addressing fundamentals will save you hours of debugging in production environments.",
  toolRelevance: ["ipconfig", "ifconfig", "ip addr", "ping", "arp"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
