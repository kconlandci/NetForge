import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "acl-design-basics",
  version: 1,
  title: "Design Basic Access Control Lists",
  tier: "beginner",
  track: "network-security",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["acl", "access-control", "cisco", "standard", "extended"],
  description:
    "Design and apply standard and extended ACLs on routers to filter traffic based on source/destination IP, protocol, and port, implementing network segmentation policies.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Differentiate between standard ACLs (source-only) and extended ACLs (source, destination, protocol, port)",
    "Apply ACLs in the correct direction (inbound vs outbound) on the correct interface",
    "Use wildcard masks to match specific subnets in ACL entries",
  ],
  sortOrder: 401,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "acl-block-subnet",
      title: "Block Guest Subnet from Server VLAN",
      context:
        "The guest network (192.168.50.0/24) must be prevented from reaching the server VLAN (10.1.1.0/24). All other traffic between VLANs should continue flowing normally.",
      displayFields: [
        { label: "Guest Subnet", value: "192.168.50.0/24" },
        { label: "Server VLAN", value: "10.1.1.0/24" },
        { label: "Router Interface", value: "Gi0/0 (guest-facing), Gi0/1 (server-facing)" },
        { label: "Requirement", value: "Block guest -> server, allow all other inter-VLAN traffic" },
      ],
      logEntry:
        "Router config needed:\n  access-list 101 deny ip 192.168.50.0 0.0.0.255 10.1.1.0 0.0.0.255\n  access-list 101 permit ip any any\n  interface Gi0/0\n    ip access-group 101 in",
      actions: [
        { id: "act-extended-in", label: "Extended ACL 101 on Gi0/0 inbound: deny guest-to-server, permit all else" },
        { id: "act-standard-in", label: "Standard ACL 10 on Gi0/0 inbound: deny 192.168.50.0" },
        { id: "act-extended-out", label: "Extended ACL 101 on Gi0/1 outbound: deny guest-to-server" },
        { id: "act-standard-server", label: "Standard ACL 10 on Gi0/1 inbound: deny 192.168.50.0" },
      ],
      correctActionId: "act-extended-in",
      rationales: [
        {
          id: "rat-extended-in",
          text: "An extended ACL on Gi0/0 inbound filters traffic as close to the source as possible, matching both source (guest) and destination (server) subnets while permitting all other traffic.",
        },
        {
          id: "rat-standard-bad",
          text: "A standard ACL only matches the source IP. It would block ALL traffic from 192.168.50.0, not just traffic destined for the server VLAN.",
        },
        {
          id: "rat-direction",
          text: "Applying the ACL inbound on the guest-facing interface (Gi0/0) filters traffic before it enters the router, saving processing. Outbound on Gi0/1 works but processes traffic unnecessarily.",
        },
      ],
      correctRationaleId: "rat-extended-in",
      feedback: {
        perfect:
          "Correct! An extended ACL on Gi0/0 inbound filters at the source, matching both guest source and server destination for precise access control.",
        partial:
          "Right ACL type, but placement matters. Apply ACLs as close to the source as possible -- inbound on the guest-facing interface.",
        wrong:
          "Standard ACLs only match source IPs, blocking all guest traffic. Extended ACLs are needed for source+destination filtering. Apply inbound on the guest interface.",
      },
    },
    {
      type: "action-rationale",
      id: "acl-allow-dns-only",
      title: "IoT VLAN DNS-Only Access",
      context:
        "IoT devices on VLAN 100 (172.16.100.0/24) should only be allowed to reach the DNS server (10.1.1.53) on port 53 and nothing else. This limits IoT device attack surface.",
      displayFields: [
        { label: "IoT VLAN", value: "172.16.100.0/24 (VLAN 100)" },
        { label: "DNS Server", value: "10.1.1.53" },
        { label: "Allowed Port", value: "UDP 53 and TCP 53 only" },
        { label: "Policy", value: "Deny all other traffic from IoT VLAN" },
      ],
      logEntry:
        "Required ACL:\n  access-list 110 permit udp 172.16.100.0 0.0.0.255 host 10.1.1.53 eq 53\n  access-list 110 permit tcp 172.16.100.0 0.0.0.255 host 10.1.1.53 eq 53\n  access-list 110 deny ip any any log\n  interface Gi0/2\n    ip access-group 110 in",
      actions: [
        { id: "act-both-dns", label: "Allow UDP and TCP 53 to DNS server only, deny all else with logging" },
        { id: "act-udp-only", label: "Allow UDP 53 to DNS server only, deny all else" },
        { id: "act-dns-any", label: "Allow UDP 53 to any destination, deny all else" },
        { id: "act-port-range", label: "Allow ports 50-55 to DNS server to cover DNS and related protocols" },
      ],
      correctActionId: "act-both-dns",
      rationales: [
        {
          id: "rat-both",
          text: "DNS uses both UDP 53 (standard queries) and TCP 53 (zone transfers, large responses over 512 bytes, DNSSEC). Both must be permitted for reliable DNS resolution.",
        },
        {
          id: "rat-udp-insufficient",
          text: "UDP-only DNS fails for responses larger than 512 bytes, DNSSEC validation, and truncated query fallback. TCP 53 is required for complete DNS functionality.",
        },
        {
          id: "rat-specific-dest",
          text: "Restricting to the specific DNS server (host 10.1.1.53) prevents IoT devices from using DNS tunneling to exfiltrate data through unauthorized DNS servers.",
        },
      ],
      correctRationaleId: "rat-both",
      feedback: {
        perfect:
          "Correct! Both UDP and TCP 53 to the specific DNS server are needed. TCP handles large responses and DNSSEC. The deny-all-else with logging locks down the IoT VLAN.",
        partial:
          "Close, but DNS needs both UDP and TCP port 53. TCP 53 handles DNSSEC and large responses that exceed the 512-byte UDP limit.",
        wrong:
          "IoT security requires precise ACLs. Allow only UDP+TCP 53 to the specific DNS server. Allowing DNS to any destination enables DNS tunneling attacks.",
      },
    },
    {
      type: "action-rationale",
      id: "acl-wildcard-mask",
      title: "Wildcard Mask Selection",
      context:
        "You need to write an ACL entry that matches all hosts in the 10.20.0.0/16 network. Choose the correct wildcard mask for the ACL statement.",
      displayFields: [
        { label: "Network", value: "10.20.0.0/16" },
        { label: "Subnet Mask", value: "255.255.0.0" },
        { label: "Hosts to Match", value: "10.20.0.1 through 10.20.255.254" },
        { label: "ACL Type", value: "Extended ACL" },
      ],
      logEntry:
        "Wildcard mask calculation:\n  Subnet mask:   255.255.0.0\n  Wildcard mask:   0.  0.255.255\n  (Inverse of subnet mask)\n\n  ACL entry: permit ip 10.20.0.0 0.0.255.255 any\n  Matches: 10.20.0.0 - 10.20.255.255",
      actions: [
        { id: "act-correct-wc", label: "Wildcard 0.0.255.255 -- matches all hosts in 10.20.0.0/16" },
        { id: "act-subnet-mask", label: "Wildcard 255.255.0.0 -- the subnet mask itself" },
        { id: "act-wrong-wc", label: "Wildcard 0.0.0.255 -- matches a /24 subnet" },
        { id: "act-host", label: "Wildcard 0.0.0.0 -- matches a single host" },
      ],
      correctActionId: "act-correct-wc",
      rationales: [
        {
          id: "rat-wildcard",
          text: "A wildcard mask of 0.0.255.255 is the inverse of the /16 subnet mask (255.255.0.0). Zeros in the wildcard mean 'must match' and ones mean 'don't care', matching all 65,534 hosts in the /16.",
        },
        {
          id: "rat-not-subnet",
          text: "The subnet mask (255.255.0.0) is NOT the wildcard mask. ACLs require the inverse. Using the subnet mask would match the wrong range of addresses.",
        },
        {
          id: "rat-24-too-small",
          text: "Wildcard 0.0.0.255 matches only a /24 (256 addresses), not the full /16 (65,536 addresses). This would miss 10.20.1.0 through 10.20.255.255.",
        },
      ],
      correctRationaleId: "rat-wildcard",
      feedback: {
        perfect:
          "Correct! Wildcard 0.0.255.255 is the inverse of subnet mask 255.255.0.0, matching all hosts in the 10.20.0.0/16 network.",
        partial:
          "Right answer, but remember: wildcard = inverse of subnet mask. Zeros mean 'must match exactly', ones mean 'any value is accepted'.",
        wrong:
          "Wildcard masks are the inverse of subnet masks. For /16 (255.255.0.0), the wildcard is 0.0.255.255. Do not confuse wildcard masks with subnet masks.",
      },
    },
  ],
  hints: [
    "Extended ACLs filter on source IP, destination IP, protocol, and port. Standard ACLs only filter on source IP.",
    "Apply extended ACLs as close to the source as possible (inbound on the source-facing interface) to filter traffic early.",
    "Wildcard masks are the inverse of subnet masks: /16 (255.255.0.0) becomes wildcard 0.0.255.255.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "ACL design is tested on every networking certification from CompTIA Network+ to CCNP. It is the foundation of router-based security and a daily task for network administrators.",
  toolRelevance: [
    "Cisco IOS CLI",
    "Packet Tracer / GNS3",
    "ACL analysis tools",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
