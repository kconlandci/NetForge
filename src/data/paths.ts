// ============================================================
// NetForge — Learning Paths
// Ordered sequences of labs forming a curriculum.
// ============================================================

export interface LearningPath {
  id: string;
  title: string;
  name: string;
  description: string;
  targetAudience: string;
  labIds: string[];
  icon: string;
}

export const learningPaths: LearningPath[] = [
  {
    id: "network-foundations",
    title: "Network Foundations",
    name: "Network Foundations",
    description:
      "Build the core networking knowledge every engineer needs — from OSI model decisions to DNS/DHCP troubleshooting.",
    targetAudience: "Career changers, helpdesk moving to networking",
    icon: "Router",
    labIds: [
      // --- FREE (14) ---
      "osi-model-troubleshooting",
      "tcp-vs-udp-selection",
      "ip-addressing-basics",
      "subnet-mask-configuration",
      "dns-resolution-troubleshooting",
      "dhcp-scope-issues",
      "arp-table-analysis",
      "port-identification-triage",
      "ipv6-transition-planning",
      "network-topology-selection",
      "ethernet-frame-analysis",
      "mac-address-filtering",
      "broadcast-domain-design",
      "tcp-handshake-diagnosis",
      // --- PREMIUM (6) ---
      "encapsulation-troubleshooting",
      "nat-configuration-review",
      "vlsm-subnetting",
      "qos-marking-classification",
      "multicast-routing-decisions",
      "network-baseline-analysis",
    ],
  },
  {
    id: "route-switch-master",
    title: "Route & Switch Master",
    name: "Route & Switch Master",
    description:
      "Master VLANs, routing protocols, and switching — from basic config to OSPF multi-area design.",
    targetAudience: "Aspiring network engineers, CCNA candidates",
    icon: "Network",
    labIds: [
      // --- FREE (12) ---
      "vlan-configuration",
      "static-route-configuration",
      "port-security-setup",
      "default-gateway-issues",
      "inter-vlan-routing",
      "stp-troubleshooting",
      "trunk-port-configuration",
      "eigrp-metric-tuning",
      "route-redistribution",
      "acl-traffic-filtering",
      "etherchannel-setup",
      "ospf-neighbor-troubleshooting",
      // --- PREMIUM (8) ---
      "bgp-peering-troubleshooting",
      "hsrp-failover-analysis",
      "ospf-area-design",
      "vtp-domain-management",
      "layer3-switch-routing",
      "route-summarization",
      "mpls-label-analysis",
      "network-convergence-optimization",
    ],
  },
  {
    id: "wireless-pro",
    title: "Wireless Pro",
    name: "Wireless Pro",
    description:
      "Design, deploy, and troubleshoot wireless networks — from channel planning to enterprise WLC management.",
    targetAudience: "Wireless engineers, network admins managing Wi-Fi",
    icon: "Wifi",
    labIds: [
      // --- FREE (10) ---
      "wifi-standard-selection",
      "wireless-channel-planning",
      "ap-placement-strategy",
      "wpa3-security-config",
      "wireless-interference-diagnosis",
      "roaming-configuration",
      "wireless-site-survey",
      "captive-portal-setup",
      "wireless-bridge-config",
      "mesh-network-troubleshooting",
      // --- PREMIUM (5) ---
      "controller-based-wifi",
      "spectrum-analysis",
      "wireless-ids-response",
      "802.1x-wireless-auth",
      "high-density-wifi-design",
    ],
  },
  {
    id: "network-defender",
    title: "Network Defender",
    name: "Network Defender",
    description:
      "Secure the network — from firewall rules and ACLs to VPN config, zero trust, and DDoS mitigation.",
    targetAudience: "Network security engineers, firewall administrators",
    icon: "Shield",
    labIds: [
      // --- FREE (10) ---
      "firewall-rule-creation",
      "acl-design-basics",
      "vpn-tunnel-configuration",
      "nac-policy-decisions",
      "ids-ips-placement",
      "port-scan-response",
      "dmz-design-review",
      "ssl-tls-inspection",
      "network-segmentation-security",
      "radius-authentication-debug",
      // --- PREMIUM (5) ---
      "ipsec-tunnel-troubleshooting",
      "waf-rule-tuning",
      "zero-trust-network-design",
      "ddos-mitigation-response",
      "siem-network-correlation",
    ],
  },
  {
    id: "services-infrastructure",
    title: "Services & Infrastructure",
    name: "Services & Infrastructure",
    description:
      "Deploy and manage network services — DNS, DHCP, NTP, monitoring, load balancing, and cloud infrastructure.",
    targetAudience: "Network admins, infrastructure engineers",
    icon: "Server",
    labIds: [
      // --- FREE (10) ---
      "dhcp-server-configuration",
      "dns-zone-management",
      "ntp-synchronization",
      "snmp-monitoring-setup",
      "syslog-configuration",
      "qos-policy-design",
      "load-balancer-configuration",
      "ftp-tftp-server-setup",
      "smtp-relay-troubleshooting",
      "proxy-server-configuration",
      // --- PREMIUM (5) ---
      "cloud-dns-architecture",
      "infrastructure-monitoring-design",
      "ip-telephony-qos",
      "network-automation-decisions",
      "sd-wan-deployment",
    ],
  },
  {
    id: "network-troubleshooter",
    title: "Network Troubleshooter",
    name: "Network Troubleshooter",
    description:
      "Master systematic troubleshooting — from ping/traceroute to packet captures and complex multi-vendor debugging.",
    targetAudience: "NOC analysts, network operations engineers",
    icon: "Wrench",
    labIds: [
      // --- FREE (10) ---
      "systematic-troubleshooting-methodology",
      "cable-testing-diagnosis",
      "packet-capture-analysis",
      "latency-diagnosis",
      "connectivity-failure-resolution",
      "performance-bottleneck-identification",
      "ping-traceroute-interpretation",
      "duplex-mismatch-detection",
      "mtu-path-discovery",
      "dns-network-troubleshooting",
      // --- PREMIUM (5) ---
      "asymmetric-routing-diagnosis",
      "intermittent-connectivity-analysis",
      "network-outage-rca",
      "distributed-denial-diagnosis",
      "complex-multi-vendor-troubleshooting",
    ],
  },
];
