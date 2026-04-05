import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "dns-resolution-troubleshooting",
  version: 1,
  title: "DNS Resolution Troubleshooting",
  tier: "beginner",
  track: "network-fundamentals",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["dns", "name-resolution", "troubleshooting", "nslookup"],
  description:
    "Diagnose DNS resolution failures by analyzing query results, server configurations, and network evidence.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Interpret nslookup and dig output to identify DNS failures",
    "Distinguish between DNS server unreachability and record misconfiguration",
    "Trace DNS resolution paths to locate the point of failure",
  ],
  sortOrder: 104,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "dns-001",
      title: "Complete DNS Resolution Failure",
      objective:
        "A user cannot access any websites by name but can reach them by IP address. Determine the root cause.",
      investigationData: [
        {
          id: "src1",
          label: "nslookup output",
          content:
            "C:\\> nslookup www.example.com\nDNS request timed out.\n    timeout was 2 seconds.\nServer:  UnKnown\nAddress:  192.168.1.1\n\nDNS request timed out.\n    timeout was 2 seconds.\n*** Request to 192.168.1.1 timed-out",
          isCritical: true,
        },
        {
          id: "src2",
          label: "IP configuration",
          content:
            "C:\\> ipconfig /all\nDNS Servers . . . . . . . . . . . : 192.168.1.1\nDefault Gateway . . . . . . . . . : 192.168.1.1\nDHCP Enabled. . . . . . . . . . . : Yes\nIPv4 Address. . . . . . . . . . . : 192.168.1.50",
          isCritical: true,
        },
        {
          id: "src3",
          label: "Ping to gateway",
          content:
            "C:\\> ping 192.168.1.1\nReply from 192.168.1.1: bytes=32 time=1ms TTL=64\nReply from 192.168.1.1: bytes=32 time=1ms TTL=64",
          isCritical: false,
        },
        {
          id: "src4",
          label: "Ping to external DNS",
          content:
            "C:\\> ping 8.8.8.8\nReply from 8.8.8.8: bytes=32 time=15ms TTL=118",
          isCritical: false,
        },
      ],
      actions: [
        { id: "a1", label: "DNS service on the router/gateway has stopped responding", color: "green" },
        { id: "a2", label: "The workstation has no network connectivity", color: "blue" },
        { id: "a3", label: "The DNS records for example.com have been deleted", color: "yellow" },
        { id: "a4", label: "The ISP's DNS servers are down globally", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The DNS server (192.168.1.1) is reachable via ping but DNS queries time out. This means the router is up but its DNS forwarding service has stopped. The workstation has Internet connectivity (8.8.8.8 responds), so the issue is specifically the DNS service on the local gateway.",
        },
        {
          id: "r2",
          text: "Since the user can ping external IPs successfully, the network path to the Internet is working. The problem is isolated to DNS resolution through the gateway.",
        },
        {
          id: "r3",
          text: "The DNS timeout affects all name resolution, not just one domain. If it were a record issue, nslookup would return NXDOMAIN rather than a timeout.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Exactly right! The gateway responds to ping but not DNS queries, indicating its DNS service has failed. Changing to an alternate DNS like 8.8.8.8 would be an immediate workaround.",
        partial:
          "Close. The critical evidence is that the gateway (192.168.1.1) responds to ping but DNS queries time out. This pinpoints the DNS service on the router as the failure point.",
        wrong:
          "The gateway's DNS service is the problem. Ping to 192.168.1.1 succeeds (router is up) and ping to 8.8.8.8 works (Internet path is fine), but DNS queries to 192.168.1.1 time out.",
      },
    },
    {
      type: "investigate-decide",
      id: "dns-002",
      title: "Website Resolves to Wrong IP Address",
      objective:
        "Users report that the internal portal (portal.company.local) loads an old version of the site. Investigate the DNS resolution chain.",
      investigationData: [
        {
          id: "src1",
          label: "nslookup from workstation",
          content:
            "C:\\> nslookup portal.company.local\nServer:  dc01.company.local\nAddress:  10.1.1.10\n\nName:    portal.company.local\nAddress:  10.1.1.50",
          isCritical: true,
        },
        {
          id: "src2",
          label: "DNS server A record",
          content:
            "Zone: company.local\nportal    A    10.1.1.50    (Static, last modified: 2024-06-15)\n\nNote: The portal was migrated to new server 10.1.1.75 on 2025-01-10",
          isCritical: true,
        },
        {
          id: "src3",
          label: "Ping to both IPs",
          content:
            "C:\\> ping 10.1.1.50\nReply from 10.1.1.50: bytes=32 time=1ms TTL=128\n\nC:\\> ping 10.1.1.75\nReply from 10.1.1.75: bytes=32 time=1ms TTL=128",
          isCritical: false,
        },
        {
          id: "src4",
          label: "Web test to new server",
          content:
            "C:\\> curl http://10.1.1.75\n<html><title>Company Portal v3.2</title>...</html>\n\nC:\\> curl http://10.1.1.50\n<html><title>Company Portal v2.1 (Archived)</title>...</html>",
          isCritical: false,
        },
      ],
      actions: [
        { id: "a1", label: "Update the DNS A record from 10.1.1.50 to 10.1.1.75", color: "green" },
        { id: "a2", label: "Flush the DNS cache on all workstations", color: "blue" },
        { id: "a3", label: "Restart the DNS server service", color: "yellow" },
        { id: "a4", label: "Reconfigure the web server at 10.1.1.50", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The DNS A record for portal.company.local still points to the old server IP (10.1.1.50) even though the portal was migrated to 10.1.1.75 months ago. The static DNS record was never updated during the migration.",
        },
        {
          id: "r2",
          text: "Flushing DNS caches would not help because the authoritative DNS server itself has the wrong record. Clients would re-resolve and get the same stale IP.",
        },
        {
          id: "r3",
          text: "The DNS server is functioning correctly - it's serving the record it has. The problem is the record data itself, not the DNS service.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The DNS A record was never updated when the portal migrated to its new server. Updating the record from 10.1.1.50 to 10.1.1.75 will direct users to the current portal.",
        partial:
          "You're on the right track. The root cause is the stale DNS record - the portal moved to 10.1.1.75 but DNS still points to 10.1.1.50.",
        wrong:
          "The DNS A record for the portal still points to the old server (10.1.1.50) instead of the migrated server (10.1.1.75). This is a common oversight during server migrations.",
      },
    },
    {
      type: "investigate-decide",
      id: "dns-003",
      title: "Sporadic DNS Failures Across Multiple Sites",
      objective:
        "Multiple branch offices report intermittent DNS failures. Some queries succeed while others fail randomly. Investigate the DNS infrastructure.",
      investigationData: [
        {
          id: "src1",
          label: "Repeated nslookup tests",
          content:
            "C:\\> nslookup www.example.com 10.0.0.53\nAddress: 93.184.216.34  (SUCCESS)\n\nC:\\> nslookup www.example.com 10.0.0.54\n*** 10.0.0.54 can't find www.example.com: Server failed\n\nC:\\> nslookup www.example.com 10.0.0.53\nAddress: 93.184.216.34  (SUCCESS)\n\nC:\\> nslookup www.example.com 10.0.0.54\n*** 10.0.0.54 can't find www.example.com: Server failed",
          isCritical: true,
        },
        {
          id: "src2",
          label: "DHCP DNS settings",
          content:
            "DHCP Scope Options:\n  DNS Server 1: 10.0.0.53\n  DNS Server 2: 10.0.0.54\n\nClients alternate between the two DNS servers via round-robin.",
          isCritical: true,
        },
        {
          id: "src3",
          label: "DNS server 10.0.0.54 status",
          content:
            "$ systemctl status named\nnamed.service - BIND DNS Server\n   Active: active (running)\n   Memory: 2.1G (limit: 2G)\n   Warning: OOM killer may terminate process\n\n$ tail /var/log/named/error.log\nout of memory; unable to allocate 65536 bytes\nout of memory; unable to allocate 65536 bytes\nrecursive query dropped: out of memory",
          isCritical: true,
        },
      ],
      actions: [
        { id: "a1", label: "Increase memory allocation for DNS server 10.0.0.54 and restart the service", color: "green" },
        { id: "a2", label: "Remove 10.0.0.54 from the DHCP scope DNS options", color: "blue" },
        { id: "a3", label: "Restart both DNS servers simultaneously", color: "yellow" },
        { id: "a4", label: "Change all clients to use public DNS servers instead", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "DNS server 10.0.0.54 is running out of memory, causing it to drop recursive queries. Increasing its memory limit and restarting will restore service. The server process is using 2.1G against a 2G limit, triggering OOM conditions.",
        },
        {
          id: "r2",
          text: "While removing the failing server from DHCP would stop the intermittent failures, it would leave the environment with a single point of failure. Fixing the root cause (memory) is the proper solution.",
        },
        {
          id: "r3",
          text: "Only one DNS server is failing. Restarting both would cause a brief outage for all clients unnecessarily. The fix should target the out-of-memory condition on 10.0.0.54.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent diagnosis! The secondary DNS server is memory-starved and dropping queries. Increasing the memory limit resolves the intermittent failures while maintaining DNS redundancy.",
        partial:
          "You identified part of the issue. The key evidence is that 10.0.0.54 consistently fails while 10.0.0.53 works, and the error logs show out-of-memory conditions on 10.0.0.54.",
        wrong:
          "DNS server 10.0.0.54 is out of memory and dropping queries. Since DHCP round-robins between both servers, about half of all client queries fail. Increasing the memory limit on 10.0.0.54 is the correct fix.",
      },
    },
  ],
  hints: [
    "When DNS queries time out, check if the DNS server itself is reachable via ping. A timeout means the server is not responding, while NXDOMAIN means it responded but has no record.",
    "Compare DNS query results against known-good servers. If one server consistently fails while another succeeds, the problem is server-specific.",
    "Always check DNS server logs for errors. Memory exhaustion, zone transfer failures, and configuration errors are common causes of intermittent DNS failures.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "DNS issues account for a large portion of helpdesk tickets. Being able to quickly isolate whether a problem is DNS-related versus network-related is a skill that sets efficient technicians apart.",
  toolRelevance: ["nslookup", "dig", "ipconfig /flushdns", "systemctl", "named-checkconf"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
