import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "acl-traffic-filtering",
  version: 1,
  title: "Design ACL Rules for Traffic Filtering",

  tier: "intermediate",
  track: "routing-switching",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["acl", "access-control", "traffic-filtering", "security"],

  description:
    "Design and apply standard and extended ACLs to filter traffic based on source, destination, protocol, and port, following best practices for placement and ordering.",
  estimatedMinutes: 14,
  learningObjectives: [
    "Choose between standard and extended ACLs based on filtering requirements",
    "Apply ACLs to the correct interface and direction (inbound vs outbound)",
    "Understand the implicit deny and proper rule ordering",
  ],
  sortOrder: 213,

  status: "published",
  prerequisites: [],

  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "block-subnet-web",
      title: "Block a Subnet from Web Access",
      context:
        "The Guest VLAN (10.10.30.0/24) should be blocked from accessing the internal web server at 192.168.1.100 on port 80 and 443, but should still be able to reach the internet. The router has Gi0/0 facing the guest network and Gi0/1 facing the server network.",
      displayFields: [
        { label: "Guest Network", value: "10.10.30.0/24 (Gi0/0)" },
        { label: "Web Server", value: "192.168.1.100 (Gi0/1)" },
        { label: "Block", value: "HTTP/HTTPS to server only" },
        { label: "Allow", value: "All other traffic including internet" },
      ],
      actions: [
        {
          id: "extended-acl-inbound",
          label: "Extended ACL on Gi0/0 inbound denying 10.10.30.0/24 to 192.168.1.100 port 80,443",
          color: "green",
        },
        {
          id: "standard-acl-outbound",
          label: "Standard ACL on Gi0/1 outbound denying 10.10.30.0/24",
          color: "orange",
        },
        {
          id: "extended-acl-outbound-server",
          label: "Extended ACL on Gi0/1 outbound denying all to port 80,443",
          color: "red",
        },
        {
          id: "block-all-guest",
          label: "Standard ACL blocking all traffic from 10.10.30.0/24",
          color: "red",
        },
      ],
      correctActionId: "extended-acl-inbound",
      rationales: [
        {
          id: "r1",
          text: "An extended ACL on Gi0/0 inbound filters by source, destination, and port before the packet enters the router. This only blocks web traffic to the server while allowing all other guest traffic.",
        },
        {
          id: "r2",
          text: "A standard ACL cannot filter by destination or port. It would block all traffic from the guest subnet, not just web traffic to the server.",
        },
        {
          id: "r3",
          text: "Blocking all traffic to port 80/443 on Gi0/1 outbound would also block legitimate users from reaching the web server, not just guests.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Extended ACL on the inbound interface closest to the source provides granular filtering by source, destination, and port numbers.",
        partial:
          "Your approach filters traffic but either blocks too much or is placed incorrectly. Extended ACLs should be placed close to the source.",
        wrong:
          "Extended ACLs filter by source IP, destination IP, protocol, and port. Place them close to the source (inbound on Gi0/0) for efficiency.",
      },
    },
    {
      type: "action-rationale",
      id: "acl-ordering",
      title: "Fix ACL Rule Ordering Issue",
      context:
        "An ACL is applied inbound on Gi0/0 but SSH access from the admin subnet (10.1.1.0/24) to the server (192.168.1.50) is being denied despite a permit rule. Here is the ACL:\n\naccess-list 110 deny ip 10.1.0.0 0.0.255.255 192.168.1.0 0.0.0.255\naccess-list 110 permit tcp 10.1.1.0 0.0.0.255 host 192.168.1.50 eq 22\naccess-list 110 permit ip any any",
      displayFields: [
        { label: "ACL 110 Line 1", value: "deny ip 10.1.0.0/16 -> 192.168.1.0/24", emphasis: "critical" },
        { label: "ACL 110 Line 2", value: "permit tcp 10.1.1.0/24 -> 192.168.1.50 port 22" },
        { label: "ACL 110 Line 3", value: "permit ip any any" },
        { label: "Problem", value: "SSH from 10.1.1.0/24 is denied", emphasis: "warn" },
      ],
      actions: [
        {
          id: "reorder-acl",
          label: "Move the SSH permit rule above the broad deny rule",
          color: "green",
        },
        {
          id: "remove-deny",
          label: "Remove the deny rule entirely",
          color: "red",
        },
        {
          id: "change-wildcard",
          label: "Change the deny rule wildcard to 0.0.0.255",
          color: "yellow",
        },
        {
          id: "add-log",
          label: "Add 'log' keyword to all rules for debugging",
          color: "yellow",
        },
      ],
      correctActionId: "reorder-acl",
      rationales: [
        {
          id: "r1",
          text: "ACLs are processed top-down. The broad deny on line 1 matches the admin subnet (10.1.1.0 is within 10.1.0.0/16) before the specific SSH permit on line 2. Moving the permit above the deny fixes this.",
        },
        {
          id: "r2",
          text: "Removing the deny rule would allow all traffic from 10.1.0.0/16 to the server network, which is too permissive and defeats the security purpose.",
        },
        {
          id: "r3",
          text: "Changing the wildcard would narrow the deny, but the real issue is ordering. Specific permits should always come before broad denies.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! ACL rule ordering matters. Specific permits must come before broad denies. The SSH permit must be processed before the wide deny catches the traffic.",
        partial:
          "You identified an ACL issue but the most important principle is ordering: specific rules first, broad rules last. Rearranging is the cleanest fix.",
        wrong:
          "ACLs process rules top-down and stop at the first match. Place specific permits before broad denies to avoid unintended blocking.",
      },
    },
    {
      type: "action-rationale",
      id: "acl-direction",
      title: "ACL Applied in Wrong Direction",
      context:
        "An extended ACL 120 was created to block ICMP from the 10.2.0.0/16 network to the server VLAN (172.16.0.0/24). It was applied outbound on Gi0/0 (facing the 10.2.0.0 network), but pings are still going through.\n\naccess-list 120 deny icmp 10.2.0.0 0.0.255.255 172.16.0.0 0.0.0.255\naccess-list 120 permit ip any any\n\ninterface Gi0/0\n ip access-group 120 out",
      displayFields: [
        { label: "Source Network", value: "10.2.0.0/16 (behind Gi0/0)" },
        { label: "Destination", value: "172.16.0.0/24 (behind Gi0/1)" },
        { label: "ACL Placement", value: "Gi0/0 outbound", emphasis: "critical" },
        { label: "Symptom", value: "ICMP traffic still passes" },
      ],
      actions: [
        {
          id: "change-direction",
          label: "Change ACL to inbound on Gi0/0 (ip access-group 120 in)",
          color: "green",
        },
        {
          id: "move-to-gi01",
          label: "Move ACL to outbound on Gi0/1",
          color: "yellow",
        },
        {
          id: "add-another-acl",
          label: "Add a second ACL on Gi0/1 outbound",
          color: "orange",
        },
        {
          id: "change-to-deny-all",
          label: "Change the ACL to deny all traffic",
          color: "red",
        },
      ],
      correctActionId: "change-direction",
      rationales: [
        {
          id: "r1",
          text: "The ACL is outbound on Gi0/0, which filters traffic LEAVING the router toward 10.2.0.0. But the pings originate FROM 10.2.0.0 (entering via Gi0/0). Changing to inbound filters traffic as it enters.",
        },
        {
          id: "r2",
          text: "Moving to Gi0/1 outbound would also work since it filters before the traffic exits toward the server VLAN. However, best practice places extended ACLs close to the source (Gi0/0 in).",
        },
        {
          id: "r3",
          text: "Adding multiple ACLs increases complexity. The existing ACL is correct; it just needs to be applied in the right direction.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The ACL was applied outbound on Gi0/0, which filters traffic leaving toward the source. Changing to inbound captures the traffic as it enters from the source network.",
        partial:
          "Your fix would work but is not optimal. Extended ACLs should be placed close to the source, which means inbound on Gi0/0.",
        wrong:
          "Inbound ACLs filter traffic entering the interface. Outbound ACLs filter traffic leaving. Apply ACLs in the direction that matches the traffic flow.",
      },
    },
  ],
  hints: [
    "Extended ACLs should be placed close to the source of traffic. Standard ACLs should be placed close to the destination.",
    "ACLs are processed top-down, first-match. Specific rules must come before broad rules to avoid unintended matches.",
    "Inbound ACLs filter traffic entering the interface. Outbound ACLs filter traffic leaving. Match the direction to your traffic flow.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "ACLs are the foundation of network security. Proper ACL design, ordering, and placement is tested on every networking certification and used daily in production.",
  toolRelevance: [
    "Cisco IOS CLI",
    "Packet Tracer",
    "ACL analysis tools",
    "Network security auditing",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
