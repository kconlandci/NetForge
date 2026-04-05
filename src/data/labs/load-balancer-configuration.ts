import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "load-balancer-configuration",
  version: 1,
  title: "Load Balancer Configuration",
  tier: "intermediate",
  track: "network-services",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["load-balancing", "high-availability", "health-checks", "vip"],
  description:
    "Configure server load balancing including virtual IPs, pool members, health monitors, and persistence settings.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Configure virtual server addresses and backend server pools",
    "Implement health check monitors for automatic failover",
    "Select appropriate load balancing algorithms and persistence methods",
  ],
  sortOrder: 506,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "lb-001",
      title: "Web Server Pool Health Monitoring",
      description:
        "A load balancer fronts three web servers but is sending traffic to a server that is returning HTTP 503 errors. Users intermittently see error pages. The health monitor only checks TCP port connectivity, not HTTP response codes.\n\n$ curl -I http://10.0.10.11\nHTTP/1.1 200 OK\n\n$ curl -I http://10.0.10.12\nHTTP/1.1 503 Service Unavailable\n\n$ curl -I http://10.0.10.13\nHTTP/1.1 200 OK\n\nLoad Balancer# show pool WEB-POOL\n  Name: WEB-POOL\n  Monitor: TCP (port 80)\n  Members:\n    10.0.10.11:80 - UP (TCP check passed)\n    10.0.10.12:80 - UP (TCP check passed)\n    10.0.10.13:80 - UP (TCP check passed)",
      targetSystem: "Load Balancer Configuration",
      items: [
        {
          id: "item-1",
          label: "Health Monitor Type",
          detail: "Method used to check backend server health",
          currentState: "TCP port check",
          correctState: "HTTP GET with status code validation",
          states: [
            "TCP port check",
            "HTTP GET with status code validation",
            "ICMP ping",
            "No health monitor",
          ],
          rationaleId: "rat-1",
        },
        {
          id: "item-2",
          label: "HTTP Monitor Expected Response",
          detail: "Valid HTTP status codes for health check pass",
          currentState: "Not configured (TCP only)",
          correctState: "HTTP 200 OK",
          states: [
            "Not configured (TCP only)",
            "HTTP 200 OK",
            "Any HTTP response",
            "HTTP 200-399 range",
          ],
          rationaleId: "rat-2",
        },
        {
          id: "item-3",
          label: "Monitor Interval and Timeout",
          detail: "How frequently health checks run and when to mark down",
          currentState: "30 second interval, 90 second timeout",
          correctState: "5 second interval, 16 second timeout (3 failures)",
          states: [
            "30 second interval, 90 second timeout",
            "5 second interval, 16 second timeout (3 failures)",
            "1 second interval, 3 second timeout",
            "60 second interval, 180 second timeout",
          ],
          rationaleId: "rat-3",
        },
      ],
      rationales: [
        {
          id: "rat-1",
          text: "A TCP port check only verifies that the port is accepting connections, not that the application is serving valid responses. An HTTP GET monitor sends an actual request and validates the response code, detecting application-level failures like 503 errors.",
        },
        {
          id: "rat-2",
          text: "The health check should expect HTTP 200 OK to confirm the web server is functioning correctly. A server returning 503 should be marked as down and removed from the pool until it recovers.",
        },
        {
          id: "rat-3",
          text: "A 5-second interval with a 16-second timeout (allowing 3 consecutive failures before marking down) balances quick detection with avoiding false positives from transient network hiccups. A 30-second interval means users could receive errors for up to 90 seconds before failover.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! An HTTP health monitor checking for 200 OK with a 5-second interval will detect the 503 error quickly and remove the unhealthy server from the pool within seconds.",
        partial:
          "The monitor needs to validate HTTP response codes, not just TCP connectivity. Ensure the check expects HTTP 200 and runs frequently enough for quick failover.",
        wrong:
          "TCP-only health checks miss application-level failures. Switch to an HTTP GET monitor that validates 200 OK responses with a 5-second interval for rapid detection of 503 errors.",
      },
    },
    {
      type: "toggle-config",
      id: "lb-002",
      title: "Session Persistence Configuration",
      description:
        "An e-commerce application uses server-side sessions. Users report losing their shopping carts mid-session. Investigation shows requests from the same user are being distributed across different backend servers with each page load.\n\nLoad Balancer# show virtual-server ECOMMERCE-VS\n  VIP: 203.0.113.50:443\n  Pool: ECOMMERCE-POOL\n  LB Method: Round Robin\n  Persistence: None\n  SSL: Terminated at LB\n\nLoad Balancer# show persistence ECOMMERCE-VS\n  No persistence profile configured\n  Active persistence records: 0",
      targetSystem: "Load Balancer Virtual Server",
      items: [
        {
          id: "item-1",
          label: "Persistence Method",
          detail: "How returning users are directed to the same backend",
          currentState: "None",
          correctState: "Cookie-based persistence",
          states: [
            "None",
            "Source IP persistence",
            "Cookie-based persistence",
            "SSL Session ID persistence",
          ],
          rationaleId: "rat-1",
        },
        {
          id: "item-2",
          label: "Load Balancing Algorithm",
          detail: "Method for distributing new connections across pool members",
          currentState: "Round Robin",
          correctState: "Least Connections",
          states: [
            "Round Robin",
            "Least Connections",
            "Weighted Round Robin",
            "Random",
          ],
          rationaleId: "rat-2",
        },
        {
          id: "item-3",
          label: "Persistence Timeout",
          detail: "How long a persistence record is maintained after last activity",
          currentState: "N/A (no persistence)",
          correctState: "3600 seconds (1 hour)",
          states: [
            "N/A (no persistence)",
            "300 seconds (5 minutes)",
            "3600 seconds (1 hour)",
            "86400 seconds (1 day)",
          ],
          rationaleId: "rat-3",
        },
      ],
      rationales: [
        {
          id: "rat-1",
          text: "Cookie-based persistence inserts a cookie that identifies the backend server. Since SSL is terminated at the LB, the LB can insert and read HTTP cookies. This is more reliable than source IP persistence, which fails when multiple users share a NAT gateway.",
        },
        {
          id: "rat-2",
          text: "Least Connections distributes new sessions to the server handling the fewest active connections, providing better load distribution than Round Robin when request processing times vary. This prevents a slow server from accumulating a backlog.",
        },
        {
          id: "rat-3",
          text: "A 1-hour persistence timeout matches a typical e-commerce shopping session. Too short (5 minutes) causes cart loss during browsing. Too long (1 day) wastes persistence table entries and can cause uneven server loading.",
        },
      ],
      feedback: {
        perfect:
          "Perfect! Cookie-based persistence maintains shopping sessions, Least Connections optimizes distribution, and a 1-hour timeout matches e-commerce browsing patterns.",
        partial:
          "The persistence method is key - cookie-based persistence works best for web applications behind SSL-terminating load balancers. Also consider the timeout matching typical session duration.",
        wrong:
          "Without persistence, each request goes to a different server, losing the shopping cart. Cookie-based persistence with a 1-hour timeout ensures session continuity for e-commerce applications.",
      },
    },
    {
      type: "toggle-config",
      id: "lb-003",
      title: "High Availability LB Pair Configuration",
      description:
        "The primary load balancer failed last week and there was no failover. The secondary LB was configured but the HA heartbeat was not properly set up. The pair needs active-standby configuration.\n\nPrimary-LB# show ha status\n  HA Mode: standalone\n  Peer Address: not configured\n  Heartbeat: disabled\n  Config Sync: disabled\n  Failover: not ready\n\nPrimary LB Management: 10.0.5.30\nSecondary LB Management: 10.0.5.31\nHA Heartbeat Interface: dedicated link between units",
      targetSystem: "Load Balancer HA Configuration",
      items: [
        {
          id: "item-1",
          label: "HA Mode",
          detail: "High availability operational mode",
          currentState: "Standalone",
          correctState: "Active-Standby",
          states: [
            "Standalone",
            "Active-Standby",
            "Active-Active",
            "N+1 Clustering",
          ],
          rationaleId: "rat-1",
        },
        {
          id: "item-2",
          label: "Heartbeat Configuration",
          detail: "HA health monitoring between LB peers",
          currentState: "Disabled",
          correctState: "Enabled on dedicated HA interface",
          states: [
            "Disabled",
            "Enabled on dedicated HA interface",
            "Enabled on management interface",
            "Enabled on data interface",
          ],
          rationaleId: "rat-2",
        },
        {
          id: "item-3",
          label: "Configuration Synchronization",
          detail: "Keeping configs identical between primary and secondary",
          currentState: "Disabled",
          correctState: "Automatic config sync enabled",
          states: [
            "Disabled",
            "Automatic config sync enabled",
            "Manual sync only",
            "One-way sync (primary to secondary)",
          ],
          rationaleId: "rat-3",
        },
      ],
      rationales: [
        {
          id: "rat-1",
          text: "Active-Standby provides simple, predictable failover. The standby unit monitors the active unit and takes over all VIPs if the active fails. This is recommended for most deployments because it avoids the complexity of Active-Active session mirroring.",
        },
        {
          id: "rat-2",
          text: "The heartbeat must run on a dedicated HA interface to prevent false failovers caused by data interface congestion. A dedicated link ensures heartbeat packets are never delayed by production traffic, providing accurate failure detection.",
        },
        {
          id: "rat-3",
          text: "Automatic configuration synchronization ensures the standby unit has identical virtual servers, pools, and policies. Without config sync, failover would occur but the standby might have stale or missing configurations.",
        },
      ],
      feedback: {
        perfect:
          "Well done! Active-Standby mode with heartbeat on a dedicated interface and automatic config sync ensures reliable failover with identical configurations on both units.",
        partial:
          "All three components are needed for proper HA: the mode must be Active-Standby, heartbeat must use a dedicated link, and config sync must be automatic to keep both units identical.",
        wrong:
          "The LB pair needs Active-Standby mode, heartbeat on a dedicated interface (not management or data), and automatic config sync. Without all three, failover will not work reliably.",
      },
    },
  ],
  hints: [
    "TCP health checks only verify port connectivity. HTTP health monitors can detect application-level failures like 503 errors by validating response codes.",
    "Cookie-based persistence is more reliable than source IP for web applications, especially when users are behind NAT gateways.",
    "Load balancer HA requires all three: correct mode (Active-Standby), heartbeat on a dedicated link, and automatic configuration synchronization.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Load balancing is a core skill for both network engineers and DevOps/SRE roles. Understanding health monitors, persistence, and HA designs is critical for maintaining application availability at scale.",
  toolRelevance: [
    "F5 BIG-IP",
    "HAProxy",
    "NGINX",
    "AWS ALB/NLB",
    "show pool",
    "show virtual-server",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
