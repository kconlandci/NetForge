import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "cloud-dns-architecture",
  version: 1,
  title: "Cloud DNS Architecture Design",
  tier: "advanced",
  track: "network-services",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["cloud-dns", "hybrid-dns", "split-horizon", "route53", "private-zones"],
  description:
    "Design cloud DNS architecture for hybrid environments including split-horizon DNS, private hosted zones, and conditional forwarding.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Design split-horizon DNS for hybrid cloud environments",
    "Configure DNS forwarding between on-premises and cloud VPCs",
    "Triage DNS resolution failures in multi-cloud architectures",
  ],
  sortOrder: 511,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "cdns-001",
      title: "Hybrid DNS Resolution Failure",
      description:
        "On-premises servers cannot resolve hostnames for resources in the cloud VPC private hosted zone, while cloud instances can resolve on-premises hostnames.",
      evidence: [
        {
          type: "cli-output",
          content:
            "On-premises server:\n$ nslookup app.cloud.corp.internal 10.0.1.10\nServer: 10.0.1.10 (on-prem DNS)\n** server can't find app.cloud.corp.internal: NXDOMAIN\n\n$ nslookup app.cloud.corp.internal 10.100.0.2\nServer: 10.100.0.2 (cloud DNS resolver)\nConnection timed out; no servers could be reached",
        },
        {
          type: "network",
          content:
            "Cloud VPC DNS Resolver: 10.100.0.2 (AmazonProvidedDNS)\nOn-premises DNS: 10.0.1.10\nVPN tunnel between on-prem and cloud: UP\n\nRoute53 Private Hosted Zone: cloud.corp.internal\n  Associated with: VPC-Production\n  Records: app.cloud.corp.internal -> 10.100.1.50\n\nOn-premises DNS conditional forwarder for cloud.corp.internal: NOT CONFIGURED",
          icon: "cloud",
        },
        {
          type: "log",
          content:
            "Cloud -> On-prem DNS: Working (Route53 outbound resolver endpoint forwards to 10.0.1.10)\nOn-prem -> Cloud DNS: No forwarding path configured\n\nThe VPN allows IP connectivity between 10.0.0.0/16 (on-prem) and 10.100.0.0/16 (cloud), but the AmazonProvidedDNS at 10.100.0.2 only responds to queries from within the VPC.",
        },
      ],
      classifications: [
        { id: "c1", label: "Missing Route53 Inbound Resolver Endpoint", description: "No DNS endpoint exists for on-premises servers to query cloud private zones" },
        { id: "c2", label: "VPN Routing Issue", description: "DNS traffic cannot traverse the VPN tunnel to reach cloud DNS" },
        { id: "c3", label: "Private Zone Not Associated", description: "The Route53 private zone is not associated with the correct VPC" },
        { id: "c4", label: "On-Premises DNS Cache Poisoning", description: "Stale DNS cache entries on the on-premises server" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem-1", label: "Create Route53 inbound resolver endpoint and configure on-prem conditional forwarder", description: "Deploy inbound endpoints in the VPC and forward cloud.corp.internal queries from on-prem DNS to them" },
        { id: "rem-2", label: "Configure on-prem DNS to forward directly to AmazonProvidedDNS (10.100.0.2)", description: "Point the conditional forwarder at the VPC's built-in resolver" },
        { id: "rem-3", label: "Replicate all cloud DNS records to the on-premises DNS server", description: "Manually sync all cloud hostnames to the on-prem DNS zone" },
        { id: "rem-4", label: "Configure split-horizon DNS with identical zones on both sides", description: "Create matching zones on-prem and in the cloud" },
      ],
      correctRemediationId: "rem-1",
      rationales: [
        {
          id: "r1",
          text: "The AmazonProvidedDNS (10.100.0.2) only serves queries originating from within the VPC. On-premises servers cannot query it directly. A Route53 inbound resolver endpoint creates ENIs with IP addresses in the VPC that accept DNS queries from external networks (via VPN/Direct Connect). On-prem DNS then conditionally forwards cloud.corp.internal to these endpoint IPs.",
        },
        {
          id: "r2",
          text: "Replicating DNS records manually between cloud and on-premises does not scale, requires constant synchronization, and misses dynamic cloud resources. The inbound resolver endpoint provides real-time resolution of cloud-hosted zones from on-premises.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! AmazonProvidedDNS (10.100.0.2) only responds to VPC-internal queries. A Route53 inbound resolver endpoint provides a queryable IP for on-prem DNS conditional forwarding. This is the standard hybrid DNS pattern.",
        partial:
          "The key issue is that AmazonProvidedDNS cannot be queried from outside the VPC. Route53 inbound resolver endpoints bridge this gap by providing DNS endpoints accessible over VPN.",
        wrong:
          "On-prem cannot query AmazonProvidedDNS directly. The solution is Route53 inbound resolver endpoints (queryable from on-prem via VPN) combined with a conditional forwarder on the on-prem DNS server.",
      },
    },
    {
      type: "triage-remediate",
      id: "cdns-002",
      title: "DNS Failover Not Triggering",
      description:
        "A Route53 health check is not triggering DNS failover to the disaster recovery site even though the primary web server is down.",
      evidence: [
        {
          type: "cli-output",
          content:
            "$ dig app.corp.example.com\n;; ANSWER SECTION:\napp.corp.example.com.  60  IN  A  203.0.113.10\n\n$ curl -I http://203.0.113.10\ncurl: (7) Failed to connect to 203.0.113.10 port 80: Connection refused\n\nDR site (198.51.100.10) is healthy and responding:\n$ curl -I http://198.51.100.10\nHTTP/1.1 200 OK",
        },
        {
          type: "network",
          content:
            "Route53 Failover Record Set:\n  Primary: 203.0.113.10 (Health Check: hc-primary)\n  Secondary: 198.51.100.10 (no health check)\n\nHealth Check hc-primary:\n  Endpoint: 203.0.113.10:80\n  Protocol: HTTP\n  Path: /health\n  Status: HEALTHY\n  Regions checking: us-east-1 only\n  Invert health check: No",
          icon: "cloud",
        },
        {
          type: "log",
          content:
            "The health check is configured to check from us-east-1 only.\nRoute53 requires checks from at least 3 regions to properly determine health.\n\nThe primary server at 203.0.113.10 has a firewall that only allows HTTP from the corporate IP range. Route53 health checker IPs are blocked by the firewall.",
        },
      ],
      classifications: [
        { id: "c1", label: "Health Check Firewall Blocking", description: "Route53 health checker IPs are blocked by the primary server's firewall, causing false-healthy status" },
        { id: "c2", label: "Insufficient Health Check Regions", description: "Single-region health checks cannot provide reliable failure detection" },
        { id: "c3", label: "DNS TTL Caching", description: "Clients are caching the old DNS record and not querying Route53 for updates" },
        { id: "c4", label: "Missing Health Check on Secondary", description: "The DR site does not have a health check attached" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem-1", label: "Allow Route53 health checker IP ranges in the primary server's firewall", description: "Permit Route53 health check source IPs to reach the HTTP endpoint" },
        { id: "rem-2", label: "Switch to a CloudWatch alarm-based health check instead", description: "Use an internal CloudWatch metric to drive the health check without requiring external access" },
        { id: "rem-3", label: "Remove the firewall rules entirely", description: "Allow all traffic to reach the web server for health checking" },
        { id: "rem-4", label: "Configure the health check to use TCP instead of HTTP", description: "TCP checks may bypass application-layer firewall rules" },
      ],
      correctRemediationId: "rem-1",
      rationales: [
        {
          id: "r1",
          text: "The primary server's firewall blocks Route53 health checker IPs, so the health check never receives a response. However, Route53 treats unreachable endpoints based on the check configuration. Since the check shows HEALTHY, the firewall is likely causing the health check to report a false-positive status because only one region is configured and its results are ambiguous. The fix is to allow Route53 health checker IPs in the firewall so the health check can accurately detect when the server is truly down.",
        },
        {
          id: "r2",
          text: "A CloudWatch alarm-based health check is an alternative when the endpoint cannot be reached externally, but the proper solution is to allow Route53 health checker traffic so the standard HTTP health check works correctly across multiple regions.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The firewall blocks Route53 health checker IPs, causing inaccurate health status. Allow the published Route53 health checker IP ranges through the firewall for accurate failure detection.",
        partial:
          "The health check shows HEALTHY despite the server being down because the firewall blocks Route53 health checker IPs. Without accurate health checks, failover cannot trigger.",
        wrong:
          "Route53 health checkers need to reach the endpoint to detect failures. The firewall blocks them, so the health check cannot accurately determine server status. Allow Route53 health checker IPs in the firewall.",
      },
    },
    {
      type: "triage-remediate",
      id: "cdns-003",
      title: "Cross-VPC DNS Resolution Failure",
      description:
        "A microservices application deployed across three VPCs cannot resolve service hostnames in other VPCs despite VPC peering being established.",
      evidence: [
        {
          type: "cli-output",
          content:
            "VPC-A instance (10.100.0.50):\n$ nslookup api.services.internal\nServer: 10.100.0.2\n** server can't find api.services.internal: NXDOMAIN\n\n$ nslookup api.services.internal 10.200.0.2\nConnection timed out\n\napi.services.internal is hosted in VPC-B's private hosted zone.\nVPC-B resolver: 10.200.0.2",
        },
        {
          type: "network",
          content:
            "VPC-A (10.100.0.0/16) <-> VPC-B (10.200.0.0/16): Peered\nVPC-B (10.200.0.0/16) <-> VPC-C (10.300.0.0/16): Peered\n\nPrivate Hosted Zones:\n  services.internal -> Associated with VPC-B ONLY\n  data.internal -> Associated with VPC-C ONLY\n\nVPC-A needs to resolve records in both services.internal and data.internal.",
          icon: "cloud",
        },
        {
          type: "log",
          content:
            "Route53 private hosted zones are only resolvable from VPCs with which they are associated. VPC peering provides IP connectivity but does NOT automatically share DNS resolution. Each private zone must be explicitly associated with every VPC that needs to resolve its records.",
        },
      ],
      classifications: [
        { id: "c1", label: "Missing Private Zone VPC Associations", description: "Private hosted zones are not associated with all VPCs that need to resolve their records" },
        { id: "c2", label: "VPC Peering DNS Resolution Disabled", description: "DNS resolution across VPC peering connections is not enabled" },
        { id: "c3", label: "Security Group Blocking DNS", description: "Security groups preventing DNS traffic between VPCs" },
        { id: "c4", label: "Route Table Missing Entries", description: "Missing routes for DNS traffic between peered VPCs" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem-1", label: "Associate private hosted zones with all VPCs that need resolution", description: "Add VPC-A to the services.internal and data.internal zone associations" },
        { id: "rem-2", label: "Enable DNS resolution in VPC peering connections", description: "Turn on DNS hostname resolution in the peering connection settings" },
        { id: "rem-3", label: "Deploy Route53 resolver endpoints in each VPC", description: "Create inbound/outbound resolver endpoints for cross-VPC DNS forwarding" },
        { id: "rem-4", label: "Use IP addresses instead of hostnames for cross-VPC communication", description: "Bypass DNS by hardcoding IP addresses in application configuration" },
      ],
      correctRemediationId: "rem-1",
      rationales: [
        { id: "rat-1", text: "Route53 private hosted zones are only resolvable from VPCs explicitly associated with them. VPC peering provides IP connectivity but does not share DNS resolution. Adding VPC-A to the zone associations is the correct and simplest fix." },
        { id: "rat-2", text: "Resolver endpoints are useful for on-premises to VPC DNS forwarding but are unnecessary when the zones can simply be associated with additional VPCs." },
      ],
      correctRationaleId: "rat-1",
      feedback: {
        perfect:
          "Perfect! Route53 private hosted zones must be explicitly associated with each VPC that needs resolution. Adding VPC-A to the zone associations for services.internal and data.internal is the direct fix.",
        partial:
          "Private hosted zones are only resolvable from associated VPCs. VPC peering provides IP connectivity but not DNS sharing. The zones need explicit VPC associations.",
        wrong:
          "Route53 private hosted zones require explicit VPC association. The services.internal zone is only associated with VPC-B. Associate it with VPC-A (and data.internal with VPC-A) for cross-VPC resolution.",
      },
    },
  ],
  hints: [
    "AmazonProvidedDNS (x.x.0.2) only responds to queries from within the VPC. Use Route53 inbound resolver endpoints for on-premises queries.",
    "Route53 health checks require the health checker IPs to reach the endpoint. Firewalls blocking these IPs cause false health status.",
    "Route53 private hosted zones must be explicitly associated with each VPC that needs to resolve their records. VPC peering alone does not share DNS.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Hybrid and multi-cloud DNS architecture is one of the most complex and critical design areas in cloud networking. Mastering Route53 resolver endpoints, private zones, and conditional forwarding is essential for cloud network architects.",
  toolRelevance: [
    "AWS Route53",
    "Route53 Resolver",
    "dig",
    "nslookup",
    "AWS CLI route53resolver",
    "VPC Flow Logs",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
