import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "connectivity-failure-resolution",
  version: 1,
  title: "Connectivity Failure Resolution",
  tier: "beginner",
  track: "network-troubleshooting",
  difficulty: "easy",
  accessLevel: "free",
  tags: [
    "connectivity",
    "troubleshooting",
    "gateway",
    "dns",
    "routing",
    "end-to-end",
  ],
  description:
    "Systematically resolve end-to-end connectivity failures by classifying symptoms, identifying root causes, and applying targeted remediation.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Classify connectivity failures by symptom type and affected layer",
    "Select the correct remediation for common connectivity issues",
    "Interpret ping, traceroute, and interface output to isolate failure points",
    "Distinguish between local, gateway, and remote connectivity failures",
  ],
  sortOrder: 604,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "cfr-001",
      title: "Workstation Cannot Reach Any External Hosts",
      description:
        "A user reports that they cannot access any websites or external resources. Internal file shares also fail. You gather the following from the workstation:\n\n$ ipconfig /all\nEthernet adapter Ethernet:\n   DHCP Enabled:            Yes\n   IPv4 Address:            10.1.1.87\n   Subnet Mask:             255.255.255.0\n   Default Gateway:         10.1.1.1\n   DNS Servers:             10.0.0.10\n   DHCP Server:             10.0.0.5\n\n$ ping 10.1.1.1\nReply from 10.1.1.87: Destination host unreachable.\n\n$ ping 10.1.1.50 (another PC on same subnet)\nReply from 10.1.1.50: bytes=32 time<1ms TTL=128\n\n$ arp -a\nInterface: 10.1.1.87\n  10.1.1.1          ff-ff-ff-ff-ff-ff     dynamic\n  10.1.1.50         00-1a-2b-3c-4d-5e     dynamic",
      evidence: [
        {
          type: "log",
          content:
            "Ping to default gateway 10.1.1.1 returns 'Destination host unreachable' from the local IP. ARP entry for 10.1.1.1 shows broadcast MAC (ff-ff-ff-ff-ff-ff), meaning ARP resolution failed.",
        },
        {
          type: "observation",
          content:
            "Workstation can reach 10.1.1.50 on the same subnet. DHCP lease is valid with correct IP, mask, gateway, and DNS configured.",
        },
      ],
      classifications: [
        {
          id: "c1",
          label: "Default Gateway Unreachable",
          description:
            "The gateway IP is configured correctly but the gateway device is not responding to ARP requests",
        },
        {
          id: "c2",
          label: "DNS Resolution Failure",
          description:
            "DNS server is not resolving domain names to IP addresses",
        },
        {
          id: "c3",
          label: "DHCP Misconfiguration",
          description:
            "DHCP is assigning incorrect network parameters to the client",
        },
        {
          id: "c4",
          label: "Subnet Mask Mismatch",
          description:
            "The workstation subnet mask does not match the network configuration",
        },
      ],
      correctClassificationId: "c1",
      remediations: [
        {
          id: "rm1",
          label: "Check and restore the default gateway device",
          description:
            "Verify the router/L3 switch at 10.1.1.1 is powered on, has the correct IP configured on its LAN interface, and the interface is in up/up state",
        },
        {
          id: "rm2",
          label: "Release and renew the DHCP lease",
          description:
            "Run ipconfig /release and ipconfig /renew to obtain fresh network parameters",
        },
        {
          id: "rm3",
          label: "Change the DNS server address",
          description:
            "Configure an alternate DNS server such as 8.8.8.8 to restore name resolution",
        },
      ],
      correctRemediationId: "rm1",
      rationales: [
        {
          id: "r1",
          text: "The ARP entry for 10.1.1.1 shows ff-ff-ff-ff-ff-ff (broadcast), meaning the workstation sent ARP requests but never received a reply from the gateway. Since the workstation can ping another host on the same subnet, Layer 1/2 connectivity is working. The gateway device itself is either down, has a misconfigured IP, or its interface is in a shutdown state.",
        },
        {
          id: "r2",
          text: "DHCP assigned correct parameters (IP, mask, gateway, DNS all look valid for the 10.1.1.0/24 subnet). Renewing the lease would return the same values since the DHCP server is working.",
        },
        {
          id: "r3",
          text: "DNS is not the issue because even raw IP pings to the gateway fail. DNS problems would only affect name resolution, not direct IP connectivity.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The failed ARP resolution (broadcast MAC for the gateway) combined with successful same-subnet pings proves the gateway device is unreachable. Check the router's power, interface status, and IP configuration.",
        partial:
          "You are on the right track. The key evidence is the ARP table: ff-ff-ff-ff-ff-ff for the gateway means ARP never resolved. Same-subnet connectivity works, so the problem is specifically the gateway device.",
        wrong:
          "This is a gateway unreachable issue. The ARP table shows the gateway MAC as broadcast (ff-ff-ff-ff-ff-ff), meaning the router at 10.1.1.1 is not responding. Same-subnet traffic works fine. Check the gateway device's power and interface status.",
      },
    },
    {
      type: "triage-remediate",
      id: "cfr-002",
      title: "Users Can Ping IPs But Cannot Browse Websites",
      description:
        "Multiple users report that web browsing fails with 'DNS_PROBE_FINISHED_NXDOMAIN' errors. You investigate from an affected workstation:\n\n$ ping 8.8.8.8\nReply from 8.8.8.8: bytes=32 time=12ms TTL=118\n\n$ ping google.com\nPing request could not find host google.com. Please check the name and try again.\n\n$ nslookup google.com\nServer:  10.0.0.10\nAddress: 10.0.0.10#53\n\n** server can't find google.com: SERVFAIL\n\n$ nslookup google.com 8.8.8.8\nServer:  8.8.8.8\nAddress: 8.8.8.8#53\n\nName:    google.com\nAddress: 142.250.80.46",
      evidence: [
        {
          type: "log",
          content:
            "Internal DNS server 10.0.0.10 returns SERVFAIL for external queries. Google Public DNS (8.8.8.8) resolves correctly. IP connectivity to external hosts works.",
        },
        {
          type: "observation",
          content:
            "All affected users are configured to use 10.0.0.10 as their DNS server via DHCP. The DNS server was recently patched and rebooted.",
        },
      ],
      classifications: [
        {
          id: "c1",
          label: "Internet Connectivity Failure",
          description:
            "No IP-level connectivity to external networks",
        },
        {
          id: "c2",
          label: "Internal DNS Server Failure",
          description:
            "The local DNS server is not resolving external queries, returning SERVFAIL",
        },
        {
          id: "c3",
          label: "Firewall Blocking DNS Traffic",
          description:
            "A firewall rule is preventing DNS queries from reaching the internet",
        },
      ],
      correctClassificationId: "c2",
      remediations: [
        {
          id: "rm1",
          label: "Restart the DNS server service and verify forwarders",
          description:
            "Restart the DNS service on 10.0.0.10, verify upstream forwarder configuration, and check that the server can resolve external names after the restart",
        },
        {
          id: "rm2",
          label: "Add a firewall rule to permit DNS traffic",
          description:
            "Create a permit rule for UDP/TCP port 53 outbound from the DNS server",
        },
        {
          id: "rm3",
          label: "Reconfigure all clients to use 8.8.8.8 directly",
          description:
            "Change the DHCP scope to distribute 8.8.8.8 as the primary DNS server",
        },
      ],
      correctRemediationId: "rm1",
      rationales: [
        {
          id: "r1",
          text: "The internal DNS server at 10.0.0.10 returns SERVFAIL, but the same query to 8.8.8.8 succeeds, proving the internet path for DNS is open. The server was recently rebooted after patching, which may have caused the DNS service to start incorrectly or lose its forwarder configuration. Restarting the service and verifying the forwarder settings is the correct fix.",
        },
        {
          id: "r2",
          text: "Pointing all clients directly to 8.8.8.8 would bypass the problem but also bypass internal DNS resolution for company resources (Active Directory, internal apps, etc.). This is a workaround, not a fix.",
        },
        {
          id: "r3",
          text: "The firewall is not blocking DNS since nslookup to 8.8.8.8 from the workstation works. The problem is specifically with the internal DNS server's ability to resolve, not network-level DNS blocking.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! SERVFAIL from the internal DNS server with successful resolution via 8.8.8.8 confirms the internal DNS service is broken, not the network. Restart the service and check the forwarder configuration.",
        partial:
          "You identified the DNS issue. The SERVFAIL response combined with successful external DNS resolution narrows it to the internal DNS server. After a recent reboot, the service likely needs attention.",
        wrong:
          "The internal DNS server is failing. It returns SERVFAIL while 8.8.8.8 resolves correctly, proving network DNS traffic is not blocked. The server was recently rebooted and the DNS service needs to be restarted with forwarder verification.",
      },
    },
    {
      type: "triage-remediate",
      id: "cfr-003",
      title: "Remote Branch Cannot Reach Headquarters Network",
      description:
        "The remote branch office at 172.16.10.0/24 reports complete loss of connectivity to the headquarters network at 10.1.0.0/16. Local branch connectivity works. You investigate from the branch router:\n\nBranch-RTR# show ip route\nCodes: C - connected, S - static, O - OSPF\n\nGateway of last resort is not set\n\nC    172.16.10.0/24 is directly connected, GigabitEthernet0/0\nC    192.168.100.0/30 is directly connected, Serial0/0/0\n\nBranch-RTR# ping 192.168.100.1\nType escape sequence to abort.\nSending 5, 100-byte ICMP Echos to 192.168.100.1, timeout is 2 seconds:\n!!!!!\nSuccess rate is 100 percent (5/5)\n\nBranch-RTR# ping 10.1.1.1\nType escape sequence to abort.\nSending 5, 100-byte ICMP Echos to 10.1.1.1, timeout is 2 seconds:\n.....\nSuccess rate is 0 percent (0/5)\n\nBranch-RTR# show ip ospf neighbor\n(no output)",
      evidence: [
        {
          type: "log",
          content:
            "Routing table shows only directly connected networks. No OSPF neighbors are formed. WAN link to HQ (192.168.100.0/30) is up and the far-end IP responds to ping.",
        },
        {
          type: "observation",
          content:
            "The branch was recently connected via a new MPLS circuit. OSPF was configured on the branch router but no neighbor adjacency has formed. The WAN link is physically operational.",
        },
      ],
      classifications: [
        {
          id: "c1",
          label: "WAN Circuit Failure",
          description:
            "The physical WAN link between the branch and headquarters is down",
        },
        {
          id: "c2",
          label: "OSPF Neighbor Adjacency Failure",
          description:
            "OSPF is configured but no neighbor relationship has formed, preventing route exchange",
        },
        {
          id: "c3",
          label: "Access List Blocking All Traffic",
          description:
            "An ACL on the WAN interface is filtering all traffic to the headquarters",
        },
      ],
      correctClassificationId: "c2",
      remediations: [
        {
          id: "rm1",
          label: "Verify and fix OSPF configuration on both routers",
          description:
            "Check that OSPF area IDs, network statements, hello/dead timers, and authentication settings match between the branch and HQ routers on the WAN link",
        },
        {
          id: "rm2",
          label: "Replace the WAN circuit",
          description:
            "Contact the ISP to reprovision the MPLS circuit between branch and HQ",
        },
        {
          id: "rm3",
          label: "Configure static routes as a permanent replacement",
          description:
            "Remove OSPF and add static routes for all HQ subnets on the branch router",
        },
      ],
      correctRemediationId: "rm1",
      rationales: [
        {
          id: "r1",
          text: "The WAN link is up (Serial0/0/0 is connected, ping to 192.168.100.1 succeeds), so the circuit is not the problem. OSPF shows no neighbors despite being configured, which means a configuration mismatch is preventing adjacency. Common causes include mismatched area IDs, hello/dead timers, authentication, or missing network statements. Fixing the OSPF configuration on both ends will establish the adjacency and exchange routes.",
        },
        {
          id: "r2",
          text: "Static routes would work as a temporary workaround but do not scale. The branch needs dynamic routing to receive updates as HQ networks change. OSPF should be fixed, not replaced.",
        },
        {
          id: "r3",
          text: "An ACL blocking traffic would also prevent the ping to 192.168.100.1 from succeeding. Since the WAN far-end responds, traffic is flowing on the link - the issue is routing information exchange.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Perfect! The WAN link works (ping succeeds to the far end) but OSPF has no neighbors. This is a classic OSPF misconfiguration - check area IDs, timers, authentication, and network statements on both routers.",
        partial:
          "You are close. The WAN link is operational (ping to 192.168.100.1 works). The missing piece is the OSPF adjacency - no neighbors means no route exchange. Check the OSPF configuration parameters on both sides.",
        wrong:
          "This is an OSPF adjacency failure. The WAN link works (ping to far end succeeds) but OSPF shows no neighbors, so no routes are exchanged. Verify OSPF area IDs, timers, authentication, and network statements match on both routers.",
      },
    },
  ],
  hints: [
    "Always test connectivity in layers: can you reach hosts on the same subnet? Can you reach the gateway? Can you reach remote IPs? Can you resolve DNS names? Each failure point narrows the diagnosis.",
    "If ping to an IP works but ping to a hostname fails, the issue is DNS, not connectivity. If ping to the gateway fails but same-subnet pings work, the gateway device is the problem.",
    "Check the ARP table for clues: a broadcast MAC (ff-ff-ff-ff-ff-ff) means ARP resolution failed. An empty OSPF neighbor table with a working link means a routing protocol configuration mismatch.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "End-to-end connectivity troubleshooting is the most common task for network support engineers. The ability to systematically isolate failures by layer and hop saves significant time and is expected in any network engineering role.",
  toolRelevance: [
    "ping",
    "traceroute",
    "ipconfig",
    "nslookup",
    "arp",
    "show ip route",
    "show ip ospf neighbor",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
