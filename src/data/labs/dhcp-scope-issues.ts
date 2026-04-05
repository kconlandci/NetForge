import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "dhcp-scope-issues",
  version: 1,
  title: "DHCP Scope Issues",
  tier: "beginner",
  track: "network-fundamentals",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["dhcp", "address-exhaustion", "scope", "troubleshooting"],
  description:
    "Investigate DHCP address exhaustion and scope misconfiguration to restore automatic IP assignment.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Identify symptoms of DHCP address pool exhaustion",
    "Analyze DHCP scope statistics to determine available capacity",
    "Resolve DHCP configuration issues including rogue servers and lease problems",
  ],
  sortOrder: 105,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "dhcp-001",
      title: "New Devices Cannot Obtain IP Addresses",
      objective:
        "Several new laptops deployed to the Sales floor cannot get IP addresses via DHCP, but existing devices work fine. Determine the cause.",
      investigationData: [
        {
          id: "src1",
          label: "DHCP server scope statistics",
          content:
            "Scope: 192.168.10.0/24\nTotal Addresses: 254\nAddresses In Use: 251\nAddresses Available: 3\nReservations: 15\nLease Duration: 30 days\n\nNote: The Sales floor was expanded from 50 to 120 seats last week.",
          isCritical: true,
        },
        {
          id: "src2",
          label: "Client DHCP output",
          content:
            "C:\\> ipconfig /release\nNo operation can be performed on Ethernet while it has its media disconnected.\n\nC:\\> ipconfig /renew\nAn error occurred while renewing interface Ethernet:\nunable to contact your DHCP server. Request has timed out.",
          isCritical: true,
        },
        {
          id: "src3",
          label: "Active lease list (sample)",
          content:
            "IP Address       MAC Address        Lease Expires      Hostname\n192.168.10.45    00:1A:2B:3C:4D:5E  2026-04-15         OLD-PC-045\n192.168.10.46    00:1A:2B:3C:4D:5F  2026-04-15         OLD-PC-046\n192.168.10.47    00:1A:2B:3C:4D:60  2026-04-20         DECOMM-PC\n...(248 more similar entries, many for decommissioned devices)",
          isCritical: true,
        },
      ],
      actions: [
        { id: "a1", label: "Reduce the DHCP lease duration and clear stale leases", color: "green" },
        { id: "a2", label: "Reboot the DHCP server to refresh the pool", color: "blue" },
        { id: "a3", label: "Assign static IPs to all new laptops", color: "yellow" },
        { id: "a4", label: "Increase the subnet to /23 to add more addresses", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "With 251 of 254 addresses in use and many belonging to decommissioned devices, the 30-day lease is keeping stale addresses allocated. Reducing the lease to 4-8 hours and clearing expired/stale leases will free addresses for the new laptops.",
        },
        {
          id: "r2",
          text: "Rebooting the DHCP server will not clear active leases. The leases are stored persistently and will be reloaded after restart. The pool will remain exhausted.",
        },
        {
          id: "r3",
          text: "Static IPs for 120 laptops would create a management nightmare and negate the purpose of DHCP. The real fix is freeing the stale leases being held by decommissioned devices.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The long 30-day lease duration is holding addresses for devices that no longer exist. Shortening the lease and cleaning stale entries will immediately free addresses for the new laptops.",
        partial:
          "You're partially right. The core issue is that decommissioned devices still hold 30-day leases. Focus on the lease management as the primary fix.",
        wrong:
          "The DHCP pool is exhausted because stale 30-day leases for decommissioned PCs are consuming addresses. Reducing the lease time and clearing stale leases is the correct approach.",
      },
    },
    {
      type: "investigate-decide",
      id: "dhcp-002",
      title: "Clients Receiving Wrong Subnet Configuration",
      objective:
        "Workstations on VLAN 20 are getting IP addresses from the wrong range. They should receive 10.20.0.x but are getting 192.168.1.x addresses instead.",
      investigationData: [
        {
          id: "src1",
          label: "Affected workstation IP config",
          content:
            "C:\\> ipconfig /all\nIPv4 Address. . . . . . . : 192.168.1.105\nSubnet Mask . . . . . . . : 255.255.255.0\nDefault Gateway . . . . . : 192.168.1.1\nDHCP Server . . . . . . . : 192.168.1.1\nDNS Servers . . . . . . . : 8.8.8.8",
          isCritical: true,
        },
        {
          id: "src2",
          label: "Authorized DHCP server config",
          content:
            "Server: dhcp-server.company.local (10.0.0.5)\nScope VLAN20: 10.20.0.100 - 10.20.0.200\nSubnet: 10.20.0.0/24\nGateway: 10.20.0.1\nDNS: 10.0.0.10, 10.0.0.11",
          isCritical: true,
        },
        {
          id: "src3",
          label: "Network scan results",
          content:
            "Scanning VLAN 20 for DHCP servers...\nDHCP Server found: 10.0.0.5 (Authorized - company DHCP)\nDHCP Server found: 192.168.1.1 (UNAUTHORIZED - Unknown device)\n\nMAC of rogue device: AA:BB:CC:DD:EE:FF\nSwitch port: Gi1/0/15\nDevice type: Consumer-grade wireless router",
          isCritical: true,
        },
      ],
      actions: [
        { id: "a1", label: "Disable the rogue DHCP server by shutting down switch port Gi1/0/15", color: "green" },
        { id: "a2", label: "Reconfigure the authorized DHCP server scope", color: "blue" },
        { id: "a3", label: "Change the VLAN assignment for affected ports", color: "yellow" },
        { id: "a4", label: "Enable DHCP snooping to prevent future rogue servers", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "A rogue DHCP server (consumer router at 192.168.1.1) is responding to DHCP requests faster than the authorized server, handing out wrong addresses. Shutting down its switch port immediately stops the rogue from issuing leases.",
        },
        {
          id: "r2",
          text: "The authorized DHCP server is correctly configured for VLAN 20. The problem is the unauthorized device distributing conflicting addresses, not the legitimate server's settings.",
        },
        {
          id: "r3",
          text: "While DHCP snooping would prevent future rogue servers, it requires configuration time. The immediate action is to disconnect the rogue device to stop the bleeding.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Right! The rogue DHCP server is the immediate threat. Disconnecting it restores proper DHCP operation. As a follow-up, enable DHCP snooping to prevent this from recurring.",
        partial:
          "You identified part of the solution. The primary action is neutralizing the rogue DHCP server on port Gi1/0/15 that is handing out 192.168.1.x addresses.",
        wrong:
          "A rogue DHCP server (unauthorized consumer router) is distributing wrong IP configurations. Shutting its switch port stops the incorrect leases and restores proper addressing.",
      },
    },
    {
      type: "investigate-decide",
      id: "dhcp-003",
      title: "DHCP Relay Not Forwarding to Remote Server",
      objective:
        "A new branch office VLAN has no local DHCP server. The ip helper-address was configured on the router, but clients are not receiving addresses.",
      investigationData: [
        {
          id: "src1",
          label: "Router VLAN interface config",
          content:
            "interface Vlan100\n ip address 10.100.0.1 255.255.255.0\n ip helper-address 10.0.0.5\n no shutdown\n\ninterface Vlan100 is up, line protocol is up",
          isCritical: false,
        },
        {
          id: "src2",
          label: "DHCP server scope check",
          content:
            "Server: 10.0.0.5\nConfigured scopes:\n  Scope 10.10.0.0/24 - VLAN 10 (Active)\n  Scope 10.20.0.0/24 - VLAN 20 (Active)\n  Scope 10.30.0.0/24 - VLAN 30 (Active)\n\nNo scope found for subnet 10.100.0.0/24",
          isCritical: true,
        },
        {
          id: "src3",
          label: "DHCP server logs",
          content:
            "Mar 28 09:15:22 dhcp-server dhcpd: DHCPDISCOVER from 00:11:22:33:44:55 via 10.100.0.1\nMar 28 09:15:22 dhcp-server dhcpd: no free leases on subnet 10.100.0.0/24\nMar 28 09:15:22 dhcp-server dhcpd: DHCPDISCOVER from 00:11:22:33:44:55 via 10.100.0.1: network 10.100.0.0/24: no free leases",
          isCritical: true,
        },
      ],
      actions: [
        { id: "a1", label: "Create a DHCP scope for 10.100.0.0/24 on the DHCP server", color: "green" },
        { id: "a2", label: "Fix the ip helper-address on the router", color: "blue" },
        { id: "a3", label: "Replace the DHCP relay with a local DHCP server", color: "yellow" },
        { id: "a4", label: "Check firewall rules blocking DHCP traffic", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The DHCP relay is working correctly - the server logs show it is receiving the relayed DHCPDISCOVER. However, no scope exists for the 10.100.0.0/24 network. Creating the scope will allow the server to issue addresses to the new branch VLAN.",
        },
        {
          id: "r2",
          text: "The ip helper-address is correct - logs prove the DHCP server at 10.0.0.5 is receiving requests relayed from 10.100.0.1. The relay configuration is not the issue.",
        },
        {
          id: "r3",
          text: "Replacing the relay with a local server is unnecessary and adds complexity. The relay is functioning; only the scope definition is missing on the central server.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! The relay is working (proven by server logs receiving the request), but the DHCP server has no scope for the new subnet. Creating the 10.100.0.0/24 scope completes the setup.",
        partial:
          "Close. The server logs are the key clue - they show the request arriving but the server reporting 'no free leases' because no scope exists for that subnet.",
        wrong:
          "The DHCP relay is functioning correctly (confirmed by server logs). The missing piece is a DHCP scope for 10.100.0.0/24 on the server. The relay forwards requests but the server has no addresses to hand out.",
      },
    },
  ],
  hints: [
    "When DHCP fails, check scope statistics first. If addresses in use equals total addresses, the pool is exhausted.",
    "If clients receive unexpected IP addresses, look for rogue DHCP servers on the network. Multiple DHCP servers on the same segment cause race conditions.",
    "DHCP relay (ip helper-address) forwards broadcast requests to a remote server. If the relay works but clients get no address, verify a scope exists for the relay's subnet.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "DHCP troubleshooting is a daily task for network and systems administrators. Understanding lease management, relay agents, and rogue server detection are skills that reduce downtime significantly.",
  toolRelevance: ["ipconfig /release", "ipconfig /renew", "dhcpd.conf", "show ip dhcp binding", "DHCP snooping"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
