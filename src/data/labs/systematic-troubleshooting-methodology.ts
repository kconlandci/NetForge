import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "systematic-troubleshooting-methodology",
  version: 1,
  title: "Systematic Troubleshooting Methodology",
  tier: "beginner",
  track: "network-troubleshooting",
  difficulty: "easy",
  accessLevel: "free",
  tags: [
    "troubleshooting",
    "methodology",
    "top-down",
    "bottom-up",
    "divide-and-conquer",
  ],
  description:
    "Choose the right troubleshooting methodology for different network problems by analyzing symptoms, CLI output, and environmental context.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Distinguish between top-down, bottom-up, and divide-and-conquer troubleshooting approaches",
    "Select the optimal methodology based on reported symptoms and available evidence",
    "Justify methodology selection using systematic reasoning",
  ],
  sortOrder: 600,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "stm-001",
      title: "Users Cannot Access Cloud Application After Office Move",
      context:
        "After a weekend office relocation, 40 users report they cannot access the company's cloud-hosted CRM. The help desk has received calls from every floor. You run initial checks from a workstation:\n\n$ ipconfig\nEthernet adapter Ethernet:\n   Connection-specific DNS Suffix: \n   Link-local IPv6 Address: fe80::1\n   Autoconfiguration IPv4 Address: 169.254.12.87\n   Subnet Mask: 255.255.0.0\n   Default Gateway: \n\n$ ping 8.8.8.8\nPing request could not find host 8.8.8.8. Please check the name and try again.\n\nThe switches and patch panels were reconnected by the moving crew.",
      displayFields: [],
      actions: [
        { id: "a1", label: "Top-Down (Application first)", color: "blue" },
        { id: "a2", label: "Bottom-Up (Physical first)", color: "green" },
        {
          id: "a3",
          label: "Divide-and-Conquer (Middle layer first)",
          color: "yellow",
        },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "The 169.254.x.x APIPA address means the workstation never received a DHCP lease, and the empty default gateway confirms no Layer 3 connectivity. After a physical office move where cabling was reconnected, starting at Layer 1 is the fastest path to resolution because the most likely cause is a physical or DHCP infrastructure issue.",
        },
        {
          id: "r2",
          text: "Since users cannot access a cloud application, we should start by checking the CRM application servers and work downward through DNS, TCP connectivity, and then physical links.",
        },
        {
          id: "r3",
          text: "We should start at Layer 3/4 by checking the core router and firewall first, since the ping fails and the issue is likely a routing or NAT problem introduced during the move.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! The APIPA address and missing gateway are dead giveaways that the infrastructure failed at a fundamental level. After a physical move, bottom-up is the right call - check cables, switch uplinks, and DHCP server reachability first.",
        partial:
          "You identified part of the problem. The APIPA address (169.254.x.x) tells you DHCP failed entirely, and the physical move makes Layer 1 the most probable root cause. Bottom-up saves time here.",
        wrong:
          "Bottom-up is correct here. The workstation has an APIPA address (169.254.x.x), meaning it never contacted a DHCP server. After a physical office relocation, cabling and switch connections are the most likely failure point - start at the physical layer.",
      },
    },
    {
      type: "action-rationale",
      id: "stm-002",
      title: "Single User Reports Slow File Transfers",
      context:
        'A single user complains that file transfers to the NAS are extremely slow. Other users on the same switch report no issues. You gather data from the affected workstation:\n\n$ ping 10.0.1.50 -c 5\nPING 10.0.1.50 (10.0.1.50): 56 data bytes\n64 bytes from 10.0.1.50: icmp_seq=0 ttl=64 time=1.2 ms\n64 bytes from 10.0.1.50: icmp_seq=1 ttl=64 time=0.8 ms\n64 bytes from 10.0.1.50: icmp_seq=2 ttl=64 time=1.1 ms\n--- 10.0.1.50 ping statistics ---\n5 packets transmitted, 5 packets received, 0% packet loss\nround-trip min/avg/max = 0.8/1.0/1.2 ms\n\nSwitch# show interface GigabitEthernet0/12\nGigabitEthernet0/12 is up, line protocol is up\n  Hardware is Gigabit Ethernet\n  Full-duplex, 100Mb/s\n  Input errors: 0, CRC: 0\n  Output errors: 0\n\nThe NAS port shows Full-duplex, 1000Mb/s. All other workstation ports negotiate at 1000Mb/s.',
      displayFields: [],
      actions: [
        { id: "a1", label: "Top-Down (Application first)", color: "blue" },
        { id: "a2", label: "Bottom-Up (Physical first)", color: "green" },
        {
          id: "a3",
          label: "Divide-and-Conquer (Middle layer first)",
          color: "yellow",
        },
      ],
      correctActionId: "a3",
      rationales: [
        {
          id: "r1",
          text: "Ping succeeds with low latency, so Layers 1-3 are functional. The application (file transfer) works but slowly. The key clue is the speed mismatch: the port negotiated at 100 Mb/s instead of 1000 Mb/s. Divide-and-conquer lets us jump to the data link/physical boundary where the autonegotiation issue lives, rather than wasting time at the top or bottom.",
        },
        {
          id: "r2",
          text: "Since the issue is slow file transfers, we should start by examining the NAS application logs and SMB/NFS protocol settings to check for application-layer bottlenecks.",
        },
        {
          id: "r3",
          text: "We should start bottom-up by replacing the cable and testing the wall jack, since physical issues are always the most common cause of network problems.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Great analysis! The 100 Mb/s negotiation on a Gigabit port is the smoking gun. Divide-and-conquer is ideal when you already have diagnostic data pointing to a specific layer - you can skip directly to the autonegotiation issue.",
        partial:
          "You are on the right track. Notice that the port negotiated at 100 Mb/s while all others run at 1000 Mb/s. With ping working fine, you can skip the extremes and target the speed negotiation issue directly.",
        wrong:
          "Divide-and-conquer is best here. Ping works (lower layers functional) and the app works (just slowly). The port speed mismatch (100 Mb/s vs 1000 Mb/s) is visible in the show interface output - jump straight to that layer instead of starting from the top or bottom.",
      },
    },
    {
      type: "action-rationale",
      id: "stm-003",
      title: "Intermittent Errors in Web Application",
      context:
        'Users report occasional HTTP 502 Bad Gateway errors from an internal web application. The errors come and go every few minutes. Infrastructure appears stable:\n\nSwitch# show interface GigabitEthernet0/1\nGigabitEthernet0/1 is up, line protocol is up\n  Full-duplex, 1000Mb/s\n  Input errors: 0, CRC: 0\n\n$ ping webserver.corp.local\nPING webserver.corp.local (10.10.5.20): 56 data bytes\n64 bytes from 10.10.5.20: icmp_seq=0 ttl=64 time=0.5 ms\n\n$ curl -I https://app.corp.local\nHTTP/1.1 502 Bad Gateway\nServer: nginx/1.24.0\nDate: Fri, 27 Mar 2026 14:22:18 GMT\n\n$ curl -I https://app.corp.local\nHTTP/1.1 200 OK\nServer: nginx/1.24.0\nX-Upstream: 10.10.5.21:8080\n\nThe nginx reverse proxy load-balances across two backend app servers: 10.10.5.21 and 10.10.5.22.',
      displayFields: [],
      actions: [
        { id: "a1", label: "Top-Down (Application first)", color: "blue" },
        { id: "a2", label: "Bottom-Up (Physical first)", color: "green" },
        {
          id: "a3",
          label: "Divide-and-Conquer (Middle layer first)",
          color: "yellow",
        },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The HTTP 502 Bad Gateway from nginx means the reverse proxy cannot reach one of its backend servers. Physical and network layers are clean (no errors, low latency ping). The intermittent nature matches a load balancer alternating between a healthy and unhealthy backend. Starting top-down at the application layer lets us check backend health, nginx upstream configuration, and app server logs directly.",
        },
        {
          id: "r2",
          text: "Since there are intermittent errors, there might be a flapping physical link causing periodic packet loss. We should check cable integrity and switch port status on all links.",
        },
        {
          id: "r3",
          text: "The intermittent nature suggests a routing loop or STP reconvergence event. We should start at Layer 2/3 and check spanning tree topology and routing tables.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Spot on! The 502 Bad Gateway is an application-layer signal that nginx cannot proxy to a backend. With clean physical/network layers, top-down is efficient - check the health of 10.10.5.22, which is likely the failing upstream.",
        partial:
          "Close. The 502 error is application-specific and the infrastructure is clean. When symptoms clearly point to the application layer and lower layers check out, top-down avoids wasting time on healthy infrastructure.",
        wrong:
          "Top-down is the right approach here. The 502 Bad Gateway is an application-layer error from the nginx reverse proxy. Physical links show no errors and ping works fine. Starting at the application layer to investigate the failing backend server is the most efficient path.",
      },
    },
  ],
  hints: [
    "Look at the initial evidence: does it point to a specific layer, or is the failure so broad that you must start from the foundation?",
    "Bottom-up works best after physical changes. Top-down works best when app-specific errors appear and infrastructure is healthy. Divide-and-conquer works best when you have data pointing to a specific middle layer.",
    "The APIPA address (169.254.x.x) always means DHCP failed. A 502 Bad Gateway is always an application/proxy error. A speed mismatch is a Layer 1/2 boundary issue.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Choosing the right troubleshooting methodology before diving in is what separates junior and senior network engineers. Experienced engineers save hours by picking the right starting point based on initial evidence.",
  toolRelevance: [
    "ping",
    "ipconfig",
    "show interface",
    "curl",
    "traceroute",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
