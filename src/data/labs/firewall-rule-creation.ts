import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "firewall-rule-creation",
  version: 1,
  title: "Create Firewall Rules for a Network",
  tier: "beginner",
  track: "network-security",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["firewall", "rules", "stateful", "zones", "traffic-filtering"],
  description:
    "Create and configure stateful firewall rules to control traffic between network zones, implementing allow, deny, and logging policies based on source, destination, port, and protocol.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Create firewall rules with correct source, destination, port, and protocol parameters",
    "Apply the principle of least privilege when designing firewall policies",
    "Understand implicit deny and rule processing order in firewall rule sets",
  ],
  sortOrder: 400,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "fw-web-server",
      title: "Web Server Firewall Policy",
      description:
        "A web server in the DMZ needs to accept HTTP/HTTPS from the internet, allow management SSH from the internal network only, and block everything else. Configure the firewall rules.",
      targetSystem: "pfSense > Firewall > Rules > DMZ Interface",
      items: [
        {
          id: "rule-http",
          label: "Rule 1: HTTP Access",
          detail: "Allow inbound HTTP to web server",
          currentState: "Disabled",
          correctState: "Allow TCP Any -> 10.10.10.5:80",
          states: ["Disabled", "Allow TCP Any -> 10.10.10.5:80", "Allow TCP Any -> Any:80", "Allow Any Any -> 10.10.10.5:Any"],
          rationaleId: "rat-http",
        },
        {
          id: "rule-https",
          label: "Rule 2: HTTPS Access",
          detail: "Allow inbound HTTPS to web server",
          currentState: "Disabled",
          correctState: "Allow TCP Any -> 10.10.10.5:443",
          states: ["Disabled", "Allow TCP Any -> 10.10.10.5:443", "Allow TCP Any -> Any:443", "Allow Any Any -> Any:443"],
          rationaleId: "rat-https",
        },
        {
          id: "rule-ssh",
          label: "Rule 3: SSH Management",
          detail: "Allow SSH from internal network only",
          currentState: "Allow TCP Any -> 10.10.10.5:22",
          correctState: "Allow TCP 192.168.1.0/24 -> 10.10.10.5:22",
          states: ["Disabled", "Allow TCP Any -> 10.10.10.5:22", "Allow TCP 192.168.1.0/24 -> 10.10.10.5:22", "Allow TCP 10.10.10.0/24 -> 10.10.10.5:22"],
          rationaleId: "rat-ssh",
        },
        {
          id: "rule-deny-log",
          label: "Rule 4: Default Deny with Logging",
          detail: "Final rule - block and log all other traffic",
          currentState: "Disabled",
          correctState: "Deny + Log Any Any -> Any Any",
          states: ["Disabled", "Deny Any Any -> Any Any", "Deny + Log Any Any -> Any Any", "Allow Any Any -> Any Any"],
          rationaleId: "rat-deny",
        },
      ],
      rationales: [
        {
          id: "rat-http",
          text: "HTTP is allowed from any source but only to the specific web server IP on port 80. Allowing to 'Any' destination would expose other DMZ hosts.",
        },
        {
          id: "rat-https",
          text: "HTTPS follows the same pattern as HTTP: specific destination IP and port 443 only. This implements the principle of least privilege.",
        },
        {
          id: "rat-ssh",
          text: "SSH management must be restricted to the internal network (192.168.1.0/24). Allowing SSH from Any source exposes the server to brute-force attacks from the internet.",
        },
        {
          id: "rat-deny",
          text: "The explicit deny-all with logging as the final rule ensures no unmatched traffic is allowed and all denied attempts are logged for security monitoring.",
        },
      ],
      feedback: {
        perfect:
          "Perfect firewall policy! Specific destination IPs, restricted SSH, and deny-all with logging implements defense in depth correctly.",
        partial:
          "Close, but check that SSH is restricted to the internal subnet only and the default deny includes logging for security visibility.",
        wrong:
          "Firewall rules must follow least privilege: specific IPs and ports for web, internal-only SSH, and explicit deny+log as the final rule.",
      },
    },
    {
      type: "toggle-config",
      id: "fw-outbound-control",
      title: "Outbound Traffic Filtering",
      description:
        "The internal network currently allows all outbound traffic. Implement outbound filtering to restrict traffic to only necessary services while preventing data exfiltration.",
      targetSystem: "Fortinet FortiGate > Policy & Objects > Firewall Policy (LAN -> WAN)",
      items: [
        {
          id: "out-web",
          label: "Outbound Web Browsing",
          detail: "Allow HTTP/HTTPS for employee web access",
          currentState: "Allow All Ports",
          correctState: "Allow TCP LAN -> Any:80,443",
          states: ["Disabled", "Allow All Ports", "Allow TCP LAN -> Any:80,443", "Allow TCP LAN -> Any:80,443,8080,8443"],
          rationaleId: "rat-web",
        },
        {
          id: "out-dns",
          label: "Outbound DNS",
          detail: "Allow DNS resolution",
          currentState: "Allow UDP Any -> Any:53",
          correctState: "Allow UDP/TCP LAN -> DNS-Servers:53",
          states: ["Allow UDP Any -> Any:53", "Allow UDP/TCP LAN -> DNS-Servers:53", "Allow UDP LAN -> Any:53", "Disabled"],
          rationaleId: "rat-dns",
        },
        {
          id: "out-email",
          label: "Outbound Email",
          detail: "Allow SMTP submission for email clients",
          currentState: "Allow TCP Any -> Any:25",
          correctState: "Allow TCP LAN -> Mail-Server:587",
          states: ["Allow TCP Any -> Any:25", "Allow TCP LAN -> Any:25", "Allow TCP LAN -> Mail-Server:587", "Disabled"],
          rationaleId: "rat-email",
        },
        {
          id: "out-default",
          label: "Default Outbound Policy",
          detail: "Action for traffic not matching any rule",
          currentState: "Allow",
          correctState: "Deny + Log",
          states: ["Allow", "Deny", "Deny + Log"],
          rationaleId: "rat-default",
        },
      ],
      rationales: [
        {
          id: "rat-web",
          text: "Limiting outbound to ports 80 and 443 allows web browsing while blocking unauthorized protocols that could be used for data exfiltration or C2 communication.",
        },
        {
          id: "rat-dns",
          text: "DNS should only reach designated DNS servers, not any destination. Open DNS allows DNS tunneling exfiltration and bypasses content filtering.",
        },
        {
          id: "rat-email",
          text: "Port 587 (submission) with TLS is the correct SMTP port for clients. Port 25 is for server-to-server relay and should be blocked to prevent spam relay abuse.",
        },
        {
          id: "rat-default",
          text: "Default deny with logging prevents unauthorized outbound connections and creates an audit trail. A default-allow policy permits data exfiltration via any port.",
        },
      ],
      feedback: {
        perfect:
          "Excellent outbound policy! Restricting to specific ports, designated servers, and deny-all default prevents data exfiltration while allowing legitimate business traffic.",
        partial:
          "Good restrictions on web and email, but ensure DNS is limited to specific servers and the default policy is deny with logging.",
        wrong:
          "Outbound filtering is critical for preventing data exfiltration. Allow-all outbound or unrestricted DNS permits attackers to tunnel data out of the network.",
      },
    },
    {
      type: "toggle-config",
      id: "fw-rule-order",
      title: "Firewall Rule Ordering",
      description:
        "A firewall administrator added rules in the wrong order, causing a VPN block to be bypassed. Fix the rule ordering so that the specific deny rule is processed before the broader allow rule.",
      targetSystem: "Cisco ASA > Access Lists > Outside_Access_In",
      items: [
        {
          id: "rule-order-1",
          label: "Position 1 (processed first)",
          detail: "First rule evaluated for inbound traffic",
          currentState: "Allow TCP Any -> 10.0.0.0/8:443",
          correctState: "Deny TCP Blocked-Countries -> Any Any (Log)",
          states: ["Allow TCP Any -> 10.0.0.0/8:443", "Deny TCP Blocked-Countries -> Any Any (Log)", "Allow TCP Any -> 10.0.0.5:443", "Deny IP Any -> Any"],
          rationaleId: "rat-order1",
        },
        {
          id: "rule-order-2",
          label: "Position 2",
          detail: "Second rule evaluated",
          currentState: "Deny TCP Blocked-Countries -> Any Any (Log)",
          correctState: "Allow TCP Any -> 10.0.0.5:443",
          states: ["Allow TCP Any -> 10.0.0.0/8:443", "Deny TCP Blocked-Countries -> Any Any (Log)", "Allow TCP Any -> 10.0.0.5:443", "Deny IP Any -> Any"],
          rationaleId: "rat-order2",
        },
        {
          id: "rule-order-3",
          label: "Position 3 (processed last)",
          detail: "Final explicit rule",
          currentState: "Allow TCP Any -> 10.0.0.5:443",
          correctState: "Deny IP Any -> Any (Log)",
          states: ["Allow TCP Any -> 10.0.0.0/8:443", "Deny TCP Blocked-Countries -> Any Any (Log)", "Allow TCP Any -> 10.0.0.5:443", "Deny IP Any -> Any (Log)"],
          rationaleId: "rat-order3",
        },
      ],
      rationales: [
        {
          id: "rat-order1",
          text: "Specific deny rules must come before broader allow rules. The geo-block deny must be first so blocked countries are rejected before the allow rule matches their traffic.",
        },
        {
          id: "rat-order2",
          text: "The allow rule for the specific web server (10.0.0.5:443) comes after the geo-block. Traffic from allowed countries passes the deny rule and matches this specific allow.",
        },
        {
          id: "rat-order3",
          text: "The catch-all deny rule at the end blocks everything not explicitly allowed. With logging enabled, it captures unauthorized access attempts for analysis.",
        },
      ],
      feedback: {
        perfect:
          "Perfect rule ordering! Deny-specific rules first, then allow rules, then deny-all. Firewalls process rules top-down and stop at the first match.",
        partial:
          "Close, but remember firewalls process rules top-to-bottom. The geo-block deny MUST come before any allow rule that would match the same traffic.",
        wrong:
          "Firewall rule order is critical: rules are processed top-down with first-match-wins. Specific denies must precede broader allows, or blocked traffic slips through.",
      },
    },
  ],
  hints: [
    "Firewall rules are processed top-to-bottom with first-match-wins. Place specific deny rules before broader allow rules.",
    "Always specify the exact destination IP and port in allow rules. Using 'Any' destination exposes more hosts than intended.",
    "The implicit or explicit deny-all rule should always be the final rule with logging enabled for security monitoring.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Firewall rule management is the most fundamental security skill. Every network security role from SOC analyst to security architect requires understanding rule logic, ordering, and least privilege.",
  toolRelevance: [
    "pfSense / OPNsense",
    "Cisco ASA / Firepower",
    "Palo Alto / FortiGate",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
