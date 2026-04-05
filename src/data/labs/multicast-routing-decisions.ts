import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "multicast-routing-decisions",
  version: 1,
  title: "Multicast Routing Decisions",
  tier: "intermediate",
  track: "network-fundamentals",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["multicast", "igmp", "pim", "group-addressing"],
  description:
    "Classify and address multicast routing issues including IGMP membership problems, PIM neighbor failures, and multicast addressing errors.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Identify multicast address ranges and their purposes",
    "Diagnose IGMP membership and PIM neighbor issues",
    "Classify multicast problems by severity and determine correct remediation",
  ],
  sortOrder: 116,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "mrd-001",
      title: "Video Stream Not Reaching Remote Site",
      description:
        "A multicast video stream (239.1.1.10) from headquarters is not reaching the branch office. Local HQ viewers receive the stream fine.",
      evidence: [
        {
          type: "log",
          content:
            "HQ Router# show ip mroute 239.1.1.10\n(10.1.1.100, 239.1.1.10), uptime 00:15:00\n  Incoming interface: GigabitEthernet0/0\n  Outgoing interface list:\n    GigabitEthernet0/1 - Forward/Dense\n  No outgoing interface toward Branch (GigabitEthernet0/2)",
        },
        {
          type: "log",
          content:
            "HQ Router# show ip pim neighbor\nNeighbor     Interface        Uptime    Expires   DR Priority\n10.1.2.2     Gi0/1            02:30:00  00:01:15  1\n\nNo PIM neighbor on Gi0/2 (WAN link to branch)\n\nBranch Router# show ip pim interface\nPIM is not enabled on any interface.",
        },
      ],
      classifications: [
        { id: "c1", label: "PIM Not Enabled on Branch Router", description: "The branch router has no PIM configuration, preventing multicast routing across the WAN" },
        { id: "c2", label: "IGMP Snooping Blocking Multicast", description: "IGMP snooping is filtering the multicast traffic at the switch level" },
        { id: "c3", label: "Multicast Address Conflict", description: "The group address 239.1.1.10 conflicts with another service" },
        { id: "c4", label: "WAN Link Failure", description: "The physical WAN link between HQ and branch is down" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Enable PIM sparse-mode on all branch router interfaces", description: "Configure ip pim sparse-mode on the WAN interface and LAN interface of the branch router" },
        { id: "rem2", label: "Configure static IGMP join on the HQ router WAN interface", description: "Force the HQ router to send multicast traffic out the WAN link" },
        { id: "rem3", label: "Replace multicast with unicast replication", description: "Convert the video stream to unicast for the branch office" },
        { id: "rem4", label: "Enable IGMP snooping on the branch switch", description: "Configure IGMP snooping to properly forward multicast frames" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "Without PIM enabled on the branch router, there is no PIM neighbor relationship across the WAN. The HQ router has no downstream PIM neighbor on Gi0/2, so it does not add that interface to the outgoing interface list for any multicast group." },
        { id: "rat2", text: "Static IGMP joins would be a workaround, not a proper fix. Enabling PIM on the branch router establishes the neighbor relationship and allows dynamic multicast routing to function correctly." },
        { id: "rat3", text: "Converting to unicast defeats the purpose of multicast and wastes bandwidth. The correct approach is to fix the multicast routing configuration." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Excellent! PIM must be enabled on both ends of a multicast-carrying link. Without PIM on the branch router, no neighbor relationship forms and multicast traffic is not forwarded across the WAN.",
        partial: "You identified part of the issue. The root cause is that PIM is not enabled on the branch router, preventing a PIM neighbor relationship from forming across the WAN link.",
        wrong: "PIM is not enabled on the branch router. Without PIM neighbors on both sides of the WAN link, the HQ router cannot forward multicast traffic to the branch. Enable PIM sparse-mode on the branch router interfaces.",
      },
    },
    {
      type: "triage-remediate",
      id: "mrd-002",
      title: "IGMP Membership Reports Not Being Processed",
      description:
        "Hosts on VLAN 50 are joining multicast group 239.10.10.10 but the switch is flooding multicast to all ports instead of only to interested receivers.",
      evidence: [
        {
          type: "log",
          content:
            "Switch# show ip igmp snooping\nGlobal IGMP Snooping: Disabled\n\nSwitch# show ip igmp snooping vlan 50\nIGMP Snooping: Disabled (follows global)\n\nMulticast traffic is being flooded to all ports in VLAN 50.\n200 ports in VLAN 50, only 5 hosts actually need the stream.",
        },
        {
          type: "log",
          content:
            "Switch# show mac address-table multicast vlan 50\nVlan  Mac Address       Type      Ports\n50    0100.5e0a.0a0a    STATIC    All ports in VLAN 50\n\nBandwidth impact: 10Mbps video stream x 200 ports = 2Gbps total\nActual need: 10Mbps x 5 ports = 50Mbps",
        },
      ],
      classifications: [
        { id: "c1", label: "IGMP Snooping Disabled - Multicast Flooding", description: "Without IGMP snooping, the switch treats multicast as broadcast and floods to all VLAN ports" },
        { id: "c2", label: "PIM Configuration Error on Router", description: "The router is not processing IGMP membership reports correctly" },
        { id: "c3", label: "Multicast Source Misconfigured", description: "The multicast source is sending to the wrong group address" },
        { id: "c4", label: "Switch Hardware Limitation", description: "The switch cannot handle multicast traffic at this rate" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Enable IGMP snooping globally and verify on VLAN 50", description: "Turn on IGMP snooping so the switch learns which ports have multicast receivers and only forwards to those ports" },
        { id: "rem2", label: "Manually configure static multicast MAC entries", description: "Create static multicast entries for each receiving port" },
        { id: "rem3", label: "Move multicast receivers to a dedicated VLAN", description: "Create a small VLAN with only the 5 receiving hosts" },
        { id: "rem4", label: "Rate-limit multicast traffic on all ports", description: "Apply a traffic policer to limit multicast bandwidth per port" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "IGMP snooping allows the switch to examine IGMP membership reports and build a table of which ports have interested receivers. With snooping enabled, the 10Mbps stream will only go to the 5 ports with actual receivers instead of all 200 ports." },
        { id: "rat2", text: "Static MAC entries are a fragile manual workaround. IGMP snooping dynamically tracks group membership, automatically adding and removing ports as hosts join and leave groups." },
        { id: "rat3", text: "Creating a dedicated VLAN disrupts the existing network design. IGMP snooping solves the flooding problem without reorganizing VLAN assignments." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! Enabling IGMP snooping reduces bandwidth from 2Gbps (flooding to all 200 ports) to 50Mbps (only 5 receiver ports). This is the standard solution for multicast flooding.",
        partial: "You identified the IGMP snooping issue. Enabling it globally will allow the switch to constrain multicast delivery to only ports with active receivers.",
        wrong: "IGMP snooping is disabled, causing the switch to flood multicast to all VLAN ports. Enabling IGMP snooping allows intelligent multicast forwarding based on receiver membership.",
      },
    },
    {
      type: "triage-remediate",
      id: "mrd-003",
      title: "Multicast Application Using Wrong Address Range",
      description:
        "A developer deployed a new application using multicast group 224.0.0.100. The application works on the local subnet but multicast traffic is not being routed between subnets.",
      evidence: [
        {
          type: "log",
          content:
            "Developer's multicast config:\nGroup address: 224.0.0.100\nTTL: 128\nSource: 10.1.1.50\n\nRouter# show ip mroute 224.0.0.100\n% No matching entries found\n\nRouter# debug ip mroute\nMROUTE: 224.0.0.100 - Link-local scope, not routing",
        },
        {
          type: "log",
          content:
            "Multicast address ranges:\n224.0.0.0/24 - Link-local (never routed, TTL=1)\n224.0.1.0/24 - Internetwork control\n239.0.0.0/8 - Administratively scoped (private use)\n\nThe 224.0.0.x range is reserved for link-local multicast that routers never forward, regardless of TTL setting.",
        },
      ],
      classifications: [
        { id: "c1", label: "Application Using Link-Local Multicast Range", description: "The group address 224.0.0.100 is in the link-local range (224.0.0.0/24) which routers will never forward between subnets" },
        { id: "c2", label: "TTL Too Low for Inter-Subnet Routing", description: "The multicast TTL needs to be increased for multi-hop routing" },
        { id: "c3", label: "Router Multicast Routing Not Configured", description: "The router needs multicast routing enabled to forward the traffic" },
        { id: "c4", label: "Firewall Blocking Multicast", description: "A firewall between subnets is dropping the multicast packets" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Change the application to use an address in the 239.x.x.x range", description: "Move to the administratively scoped range (239.0.0.0/8) which is designed for private multicast applications and is routable" },
        { id: "rem2", label: "Increase the TTL to 255", description: "Set a higher TTL to ensure packets survive multiple router hops" },
        { id: "rem3", label: "Add a static route for 224.0.0.100 on the router", description: "Force the router to forward the link-local multicast traffic" },
        { id: "rem4", label: "Enable PIM dense-mode on all interfaces", description: "Use dense mode to flood multicast everywhere" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "Addresses in 224.0.0.0/24 are link-local by RFC specification and are never forwarded by routers regardless of TTL or routing configuration. The application must use a routable range like 239.x.x.x (administratively scoped) for inter-subnet delivery." },
        { id: "rat2", text: "Increasing TTL has no effect on link-local multicast. The 224.0.0.0/24 range is hard-coded as non-routable in router implementations. The address range itself must change." },
        { id: "rat3", text: "Static routes cannot override the link-local multicast restriction. Routers are designed to never forward 224.0.0.x traffic between interfaces, regardless of configuration." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! The 224.0.0.0/24 range is link-local and never routed. Changing to the 239.x.x.x administratively scoped range allows the multicast traffic to be routed between subnets.",
        partial: "You identified the address range issue. The 224.0.0.x range is reserved for link-local protocols and cannot be routed. The application must move to a routable range like 239.x.x.x.",
        wrong: "The group address 224.0.0.100 is in the link-local range that routers never forward. The application must use a routable multicast address, ideally in the 239.x.x.x administratively scoped range.",
      },
    },
  ],
  hints: [
    "PIM must be enabled on all interfaces along the multicast path. Without PIM neighbors, routers will not add outgoing interfaces to the multicast routing table.",
    "IGMP snooping on switches constrains multicast delivery to ports with active receivers. Without it, multicast is flooded like broadcast.",
    "The 224.0.0.0/24 range is link-local and never routed. Use 239.0.0.0/8 for private multicast applications that need to cross subnet boundaries.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Multicast expertise is highly valued in enterprise video, financial trading, and service provider environments. It is a differentiating skill that is tested in CCNP and specialized certifications.",
  toolRelevance: ["show ip mroute", "show ip igmp groups", "show ip pim neighbor", "Wireshark", "mrinfo"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
