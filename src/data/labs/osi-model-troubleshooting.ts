import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "osi-model-troubleshooting",
  version: 1,
  title: "OSI Model Troubleshooting",
  tier: "beginner",
  track: "network-fundamentals",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["osi", "troubleshooting", "layers", "network-models"],
  description:
    "Determine which OSI layer is causing network issues based on symptoms and evidence.",
  estimatedMinutes: 8,
  learningObjectives: [
    "Identify symptoms associated with each OSI layer",
    "Apply systematic layer-by-layer troubleshooting",
    "Distinguish between physical, data link, and network layer problems",
  ],
  sortOrder: 100,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "osi-001",
      title: "Intermittent Connectivity on a New Cable Run",
      context:
        "A user reports that their workstation loses connectivity every few minutes. You check the switch port and see the link light flickering. Running 'show interface GigabitEthernet0/1' reveals:\n\nGigabitEthernet0/1 is up, line protocol is up\n  Input errors: 4521, CRC: 3876, frame: 645\n  Output errors: 0\n  Collisions: 0\n  Late collisions: 0\n\nThe cable was recently installed by a contractor.",
      displayFields: [],
      actions: [
        { id: "a1", label: "Layer 1 - Physical", color: "green" },
        { id: "a2", label: "Layer 2 - Data Link", color: "blue" },
        { id: "a3", label: "Layer 3 - Network", color: "yellow" },
        { id: "a4", label: "Layer 7 - Application", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "High CRC and frame errors on the interface indicate damaged or improperly terminated cabling. CRC errors occur when bits are corrupted during physical transmission, pointing to a Layer 1 issue with the new cable run.",
        },
        {
          id: "r2",
          text: "The flickering link light and zero collisions rule out duplex mismatch. CRC errors are generated before any Layer 2 frame processing occurs, indicating the signal is degraded at the physical layer.",
        },
        {
          id: "r3",
          text: "Since the user can sometimes connect, the application layer must be partially working. The intermittent nature combined with CRC errors points to a physical medium problem rather than a higher-layer issue.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! CRC errors and frame errors are classic Layer 1 indicators. The newly installed cable likely has a termination issue or a kink causing signal degradation.",
        partial:
          "You identified the right layer or the right reasoning, but not both. CRC errors are a hallmark of physical layer problems - they indicate bit-level corruption during transmission.",
        wrong:
          "This is a Layer 1 (Physical) issue. CRC errors at 3876 with frame errors at 645 indicate signal integrity problems with the cable. Higher-layer problems would not produce these specific error counters.",
      },
    },
    {
      type: "action-rationale",
      id: "osi-002",
      title: "Workstation Cannot Reach Remote Subnet",
      context:
        "A workstation at 10.1.1.50/24 cannot reach a server at 10.2.2.100/24. Local pings to 10.1.1.1 (default gateway) succeed. From the router, you run:\n\nRouter# show ip route 10.2.2.0\n% Network not in table\n\nRouter# show ip route\n  10.1.1.0/24 is directly connected, GigabitEthernet0/0\n  10.3.3.0/24 is directly connected, GigabitEthernet0/1\n\nThe 10.2.2.0/24 network was recently added but no routing updates have been configured.",
      displayFields: [],
      actions: [
        { id: "a1", label: "Layer 1 - Physical", color: "green" },
        { id: "a2", label: "Layer 2 - Data Link", color: "blue" },
        { id: "a3", label: "Layer 3 - Network", color: "yellow" },
        { id: "a4", label: "Layer 4 - Transport", color: "red" },
      ],
      correctActionId: "a3",
      rationales: [
        {
          id: "r1",
          text: "The routing table has no entry for the 10.2.2.0/24 network. Without a route, the router cannot forward packets to the destination. This is a Layer 3 routing issue that requires either a static route or dynamic routing protocol configuration.",
        },
        {
          id: "r2",
          text: "The workstation can reach its default gateway, so Layers 1 and 2 are functional on the local segment. The problem is that the router lacks the routing information to forward traffic to the remote subnet.",
        },
        {
          id: "r3",
          text: "Since the gateway responds to pings, there must be a DNS problem preventing name resolution to the 10.2.2.0 network.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The missing route in the routing table is a textbook Layer 3 problem. Adding a static route or enabling a routing protocol will resolve this.",
        partial:
          "You're close. The key evidence is 'Network not in table' from the routing table lookup. This confirms the router has no path to 10.2.2.0/24 - a Layer 3 issue.",
        wrong:
          "This is a Layer 3 (Network) issue. The router's routing table has no entry for the destination network. The workstation can reach the gateway (Layers 1-2 are fine), but the router cannot route to 10.2.2.0/24.",
      },
    },
    {
      type: "action-rationale",
      id: "osi-003",
      title: "Application Timeout Despite Network Connectivity",
      context:
        "Users report that a web application is timing out. You investigate:\n\n$ ping 10.5.5.20\nReply from 10.5.5.20: bytes=32 time=2ms TTL=128\n\n$ telnet 10.5.5.20 443\nConnecting To 10.5.5.20...Could not open connection to the host, on port 443: Connect failed\n\n$ telnet 10.5.5.20 80\nConnecting To 10.5.5.20...Connected\n\nThe application recently migrated from HTTP to HTTPS. The server firewall was not updated to allow port 443.",
      displayFields: [],
      actions: [
        { id: "a1", label: "Layer 3 - Network", color: "green" },
        { id: "a2", label: "Layer 4 - Transport", color: "blue" },
        { id: "a3", label: "Layer 6 - Presentation", color: "yellow" },
        { id: "a4", label: "Layer 7 - Application", color: "red" },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "The firewall is blocking TCP port 443, preventing the transport layer connection from being established. Ping (ICMP) succeeds and port 80 connects, but port 443 is filtered. This is a Layer 4 issue because the TCP session cannot be established on the required port.",
        },
        {
          id: "r2",
          text: "Since HTTPS uses TLS/SSL which operates at the Presentation layer (Layer 6), this must be a Layer 6 problem with certificate negotiation.",
        },
        {
          id: "r3",
          text: "The application timeout occurs because the web server software is misconfigured and not listening on port 443.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Spot on! The firewall blocking TCP 443 prevents transport-layer connection establishment. The telnet test proves Layer 3 is fine (port 80 connects) but the specific port is filtered.",
        partial:
          "Close, but focus on what the telnet test reveals: TCP connectivity to port 80 works but port 443 is blocked. This is a transport layer filtering issue, not an application or presentation problem.",
        wrong:
          "This is a Layer 4 (Transport) issue. The firewall blocks TCP port 443, preventing the three-way handshake. Ping works (Layer 3 is fine), port 80 connects (the host is reachable), but port 443 is specifically filtered.",
      },
    },
  ],
  hints: [
    "Start from the bottom of the OSI model and work upward - check physical connectivity before looking at higher layers.",
    "CRC errors and frame errors are generated at the physical/data-link boundary. Missing routes appear in Layer 3. Port filtering is a Layer 4 concern.",
    "Use the process of elimination: if ping succeeds, Layers 1-3 are likely functional. If telnet to a port fails but ping works, the issue is at Layer 4 or above.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "OSI model troubleshooting is the foundation of every network engineering interview. Senior engineers use layer-by-layer isolation instinctively to cut mean-time-to-resolution in half.",
  toolRelevance: ["Wireshark", "ping", "traceroute", "telnet", "show interface"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
