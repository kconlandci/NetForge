import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "complex-multi-vendor-troubleshooting",
  version: 1,
  title: "Multi-Vendor Interoperability Troubleshooting",

  tier: "advanced",
  track: "network-troubleshooting",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: [
    "multi-vendor",
    "cisco",
    "juniper",
    "interoperability",
    "ospf",
    "bgp",
    "vlan",
    "troubleshooting",
  ],

  description:
    "Troubleshoot interoperability issues between Cisco, Juniper, and other vendor equipment involving OSPF adjacency failures, VLAN tag mismatches, and BGP attribute incompatibilities.",
  estimatedMinutes: 30,
  learningObjectives: [
    "Identify OSPF adjacency failures caused by differing vendor default configurations",
    "Resolve 802.1Q VLAN tagging interoperability issues between Cisco and Juniper switches",
    "Diagnose BGP attribute handling differences across vendor platforms",
    "Translate CLI commands and concepts between Cisco IOS, Juniper Junos, and Arista EOS",
    "Understand how different vendors implement standards-based protocols with varying defaults",
  ],
  sortOrder: 614,

  status: "published",
  prerequisites: [],

  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "ospf-mtu-mismatch",
      title: "OSPF Adjacency Stuck at ExStart Between Cisco and Juniper Routers",
      objective:
        "A new Juniper MX router was connected to an existing Cisco ISR for OSPF peering across a point-to-point link. The adjacency is stuck in ExStart/Exchange state and never reaches Full. Both sides can ping each other. Investigate the OSPF configuration on both platforms.",
      investigationData: [
        {
          id: "cisco-ospf-neighbor",
          label: "show ip ospf neighbor on Cisco ISR (IOS-XE)",
          content:
            "Neighbor ID     Pri   State           Dead Time   Address         Interface\n192.168.1.2     0     EXSTART/DR      00:00:38    10.0.0.2        Gi0/0/0\n\nNote: State has been EXSTART for over 10 minutes, never progresses to FULL.",
        },
        {
          id: "juniper-ospf-neighbor",
          label: "show ospf neighbor on Juniper MX (Junos)",
          content:
            "Address          Interface       State     ID               Pri  Dead\n10.0.0.1         ge-0/0/0.0      ExStart   192.168.1.1      0    38\n\nNote: Junos also shows ExStart. Both routers are stuck in DBD exchange.",
          isCritical: true,
        },
        {
          id: "cisco-interface",
          label: "show interfaces Gi0/0/0 on Cisco ISR",
          content:
            "GigabitEthernet0/0/0 is up, line protocol is up\n  Internet address is 10.0.0.1/30\n  MTU 1500 bytes, BW 1000000 Kbit/sec\n  OSPF: Network Type POINT_TO_POINT, Cost 1\n  ip ospf mtu-ignore is NOT set",
          isCritical: true,
        },
        {
          id: "juniper-interface",
          label: "show interfaces ge-0/0/0 detail on Juniper MX",
          content:
            "Physical interface: ge-0/0/0, Enabled, Physical link is Up\n  Link-level type: Ethernet, MTU: 1514\n  Protocol inet, MTU: 1500\n    Flags: Sendbcast-pkt-to-re\n    Addresses:\n      10.0.0.2/30\n\nroot@juniper> show ospf interface ge-0/0/0.0\nInterface           State   Area     DR ID           BDR ID    Nbrs\nge-0/0/0.0          PtToPt  0.0.0.0  0.0.0.0         0.0.0.0  1\n  Type: P2P, Address: 10.0.0.2, Mask: 255.255.255.252\n  MTU: 1514, Cost: 1, Hello: 10, Dead: 40\n\nNote: Juniper reports OSPF MTU as 1514 (includes L2 header by default)\nwhile Cisco uses 1500 (IP MTU only). This MTU mismatch in DBD packets\nprevents adjacency from progressing past ExStart.",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "set-juniper-mtu",
          label: "Set 'family inet mtu 1500' on the Juniper interface to match Cisco's OSPF MTU",
          color: "green",
        },
        {
          id: "enable-mtu-ignore-cisco",
          label: "Configure 'ip ospf mtu-ignore' on the Cisco interface",
          color: "yellow",
        },
        {
          id: "set-cisco-mtu-1514",
          label: "Change Cisco interface MTU to 1514",
          color: "orange",
        },
        {
          id: "change-to-broadcast",
          label: "Change OSPF network type to broadcast on both sides",
          color: "red",
        },
      ],
      correctActionId: "set-juniper-mtu",
      rationales: [
        {
          id: "r1",
          text: "Juniper includes the L2 header in its OSPF MTU advertisement (1514) while Cisco uses only the L3 IP MTU (1500). Setting 'family inet mtu 1500' on Juniper's interface makes it advertise 1500 in OSPF DBD packets, matching Cisco. This is the cleanest fix that keeps both sides at standard IP MTU.",
        },
        {
          id: "r2",
          text: "Using 'ip ospf mtu-ignore' on Cisco works as a quick fix but masks the mismatch rather than resolving it. If any other protocol or feature relies on consistent MTU advertisement, this can cause issues later. It is a valid workaround but not the best practice.",
        },
        {
          id: "r3",
          text: "Changing Cisco's MTU to 1514 would require reconfiguring all other interfaces and could break existing OSPF adjacencies with other Cisco devices. Changing the network type to broadcast is unrelated to the MTU issue.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Juniper advertises 1514 (including L2 header) while Cisco advertises 1500 (IP MTU only) in OSPF DBD packets. Setting 'family inet mtu 1500' on Juniper aligns both sides without workarounds.",
        partial:
          "Your approach resolves the adjacency but does not address the root cause cleanly. The best practice is to align the OSPF MTU values rather than ignoring the mismatch.",
        wrong:
          "OSPF ExStart means the routers cannot agree on DBD parameters. Juniper defaults to 1514 MTU (L2 included) while Cisco uses 1500 (IP only). The adjacency will not form until MTU values match in the DBD exchange.",
      },
    },
    {
      type: "investigate-decide",
      id: "vlan-native-vlan-mismatch",
      title: "Trunk Between Cisco Catalyst and Juniper EX Dropping Tagged Traffic",
      objective:
        "After connecting a new Juniper EX4300 switch to an existing Cisco Catalyst 9300 via a trunk link, only VLAN 1 traffic passes. All other VLANs are unreachable across the trunk. Investigate the trunk configuration on both platforms.",
      investigationData: [
        {
          id: "cisco-trunk-config",
          label: "show interfaces Gi1/0/48 switchport on Cisco Catalyst 9300",
          content:
            "Name: Gi1/0/48\nSwitchport: Enabled\nAdministrative Mode: trunk\nOperational Mode: trunk\nAdministrative Trunking Encapsulation: dot1q\nNative VLAN: 1\nTrunking VLANs Enabled: 1,10,20,30,40\nPruning VLANs Enabled: 2-1001\n\nshow run int Gi1/0/48:\n interface GigabitEthernet1/0/48\n  switchport trunk allowed vlan 1,10,20,30,40\n  switchport mode trunk",
          isCritical: true,
        },
        {
          id: "juniper-trunk-config",
          label: "show configuration interfaces ge-0/0/47 on Juniper EX4300",
          content:
            "ge-0/0/47 {\n    unit 0 {\n        family ethernet-switching {\n            interface-mode trunk;\n            vlan {\n                members [ vlan-10 vlan-20 vlan-30 vlan-40 ];\n            }\n        }\n    }\n}\n\nNote: Juniper trunk configuration does NOT include a native-vlan statement.\nBy default, Juniper EX does not configure a native (untagged) VLAN on trunks.\nCisco sends VLAN 1 untagged (native), but Juniper expects all VLANs tagged.",
          isCritical: true,
        },
        {
          id: "packet-capture",
          label: "Packet capture on Juniper ge-0/0/47 (inbound from Cisco)",
          content:
            "Frame 1: 64 bytes, VLAN tag: NONE, EtherType: 0x0800 (IPv4)\n  -> Juniper accepts: maps to default VLAN (VLAN 1 equivalent)\n\nFrame 2: 68 bytes, VLAN tag: 10, EtherType: 0x8100 (802.1Q)\n  -> Juniper DROPS: VLAN 10 is configured but ge-0/0/47 also\n     expects untagged frames to be VLAN 1. Juniper's default\n     behavior requires explicit native-vlan-id for untagged traffic.\n\nFrame 3: 68 bytes, VLAN tag: 20, EtherType: 0x8100 (802.1Q)\n  -> Juniper DROPS: same reason as Frame 2\n\nNote: Tagged frames ARE arriving but being dropped due to the\nJuniper interface not having VLAN 1 in its member list and native\nVLAN configuration conflict.",
        },
        {
          id: "juniper-vlan-config",
          label: "show vlans on Juniper EX4300",
          content:
            "Routing instance        VLAN name    Tag     Interfaces\ndefault-switch          default      1       None\ndefault-switch          vlan-10      10      ge-0/0/47.0*\ndefault-switch          vlan-20      20      ge-0/0/47.0*\ndefault-switch          vlan-30      30      ge-0/0/47.0*\ndefault-switch          vlan-40      40      ge-0/0/47.0*\n\n* = trunk member, traffic NOT flowing\n\nNote: VLANs are defined and assigned to the trunk port, but tagged\ntraffic is being dropped. The issue is the native VLAN handling\nmismatch between vendors.",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "add-native-vlan-juniper",
          label: "Configure 'native-vlan-id 1' on the Juniper trunk interface and add VLAN 1 to the member list",
          color: "green",
        },
        {
          id: "tag-all-cisco",
          label: "Configure 'vlan dot1q tag native' on Cisco to tag VLAN 1 and remove native VLAN",
          color: "yellow",
        },
        {
          id: "change-encapsulation",
          label: "Change trunk encapsulation to ISL on the Cisco side",
          color: "red",
        },
        {
          id: "recreate-vlans-juniper",
          label: "Delete and recreate all VLANs on the Juniper switch",
          color: "orange",
        },
      ],
      correctActionId: "add-native-vlan-juniper",
      rationales: [
        {
          id: "r1",
          text: "Cisco sends VLAN 1 untagged as the native VLAN by default. Juniper trunks require explicit 'native-vlan-id' configuration to handle untagged frames. Adding 'native-vlan-id 1' tells the Juniper switch to accept untagged frames as VLAN 1 and properly process tagged frames for other VLANs.",
        },
        {
          id: "r2",
          text: "Tagging all VLANs on Cisco ('vlan dot1q tag native') works but changes Cisco's default behavior across potentially many trunk ports. It is safer to configure Juniper to match Cisco's native VLAN handling on this specific interface.",
        },
        {
          id: "r3",
          text: "ISL is a deprecated Cisco-proprietary protocol that Juniper does not support. Recreating VLANs does not address the native VLAN handling mismatch, which is the root cause.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Cisco sends VLAN 1 untagged by default, but Juniper requires explicit 'native-vlan-id' configuration on trunks. Adding 'native-vlan-id 1' on Juniper resolves the interoperability issue.",
        partial:
          "Your approach would work, but modifying the Cisco side affects its standard behavior. The best practice for multi-vendor trunks is to configure the Juniper side to match Cisco's native VLAN convention.",
        wrong:
          "The issue is that Cisco sends VLAN 1 untagged (native VLAN) while Juniper expects explicit native-vlan-id configuration. Without it, Juniper cannot properly handle the mix of tagged and untagged frames.",
      },
    },
    {
      type: "investigate-decide",
      id: "bgp-community-incompatibility",
      title: "BGP Routes Accepted But Not Installed After Cisco-to-Arista Migration",
      objective:
        "After migrating a peering router from Cisco to Arista, BGP routes are being received but not installed in the routing table. The BGP session is established and routes show in 'show ip bgp', but with a status of 'not best'. The same route-map that worked on Cisco is not functioning correctly on Arista. Investigate the BGP configuration.",
      investigationData: [
        {
          id: "arista-bgp-table",
          label: "show ip bgp 10.200.0.0/16 on Arista 7280R (EOS)",
          content:
            "BGP routing table entry for 10.200.0.0/16\n  Paths: (1 available, no best path)\n    65200, (received & used)\n      172.16.0.2 from 172.16.0.2 (172.16.0.2)\n        Origin IGP, metric 0, localpref 100, valid, external\n        Community: 65001:100 65001:200 65001:999\n        Not best: matching route-map SET-LOCAL-PREF sets localpref to 50\n        Rx path-id: 0\n\nNote: Route is received but the route-map is setting local-pref to 50,\nmaking it non-preferred. On the old Cisco router, this route had\nlocal-pref 200.",
          isCritical: true,
        },
        {
          id: "arista-route-map",
          label: "show route-map SET-LOCAL-PREF on Arista",
          content:
            "route-map SET-LOCAL-PREF, permit, sequence 10\n  Match clauses:\n    community list PREFERRED-ROUTES\n  Set clauses:\n    local-preference 200\n  Matches: 0 routes\n\nroute-map SET-LOCAL-PREF, permit, sequence 20\n  Match clauses:\n  Set clauses:\n    local-preference 50\n  Matches: 847 routes\n\nNote: Sequence 10 matches 0 routes. All routes fall through to\nsequence 20 (default catch-all with local-pref 50).",
          isCritical: true,
        },
        {
          id: "community-list-comparison",
          label: "Community list configuration comparison (Cisco vs Arista)",
          content:
            "=== Old Cisco Config (worked correctly) ===\nip community-list expanded PREFERRED-ROUTES permit 65001:100\nip community-list expanded PREFERRED-ROUTES permit 65001:200\n\n=== New Arista Config (not matching) ===\nip community-list expanded PREFERRED-ROUTES permit 65001:100\nip community-list expanded PREFERRED-ROUTES permit 65001:200\n\n=== Arista 'show ip community-list PREFERRED-ROUTES' ===\nExpanded Community List PREFERRED-ROUTES:\n  permit 65001:100\n  permit 65001:200\n\n=== Key Difference ===\nArista EOS treats expanded community-list entries as REGEX patterns.\n'65001:100' matches the regex literally but Arista requires the\nentry to match the ENTIRE community string, not just one community.\nThe route has communities: '65001:100 65001:200 65001:999'\nArista regex '65001:100' does not match the full string.\n\nCisco expanded community-list matches if ANY community in the route\nmatches the pattern. Arista requires the regex to match the entire\ncommunity attribute string representation.",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "use-standard-community-list",
          label: "Replace expanded community-list with standard community-list which matches individual communities on both platforms",
          color: "green",
        },
        {
          id: "fix-regex-arista",
          label: "Modify the expanded community-list regex to '.*65001:100.*' to match substring",
          color: "yellow",
        },
        {
          id: "remove-route-map",
          label: "Remove the route-map and set local-pref manually per neighbor",
          color: "orange",
        },
        {
          id: "rollback-to-cisco",
          label: "Roll back to the Cisco router until the issue is resolved",
          color: "red",
        },
      ],
      correctActionId: "use-standard-community-list",
      rationales: [
        {
          id: "r1",
          text: "Standard community-lists match individual BGP community values consistently across Cisco, Arista, and Juniper. The expanded community-list regex behavior differs between vendors — Cisco matches any single community, while Arista matches against the entire serialized community string. Using standard community-lists eliminates this ambiguity.",
        },
        {
          id: "r2",
          text: "Modifying the regex to '.*65001:100.*' would work on Arista but creates a fragile, vendor-specific configuration. Standard community-lists are portable across vendors and less error-prone.",
        },
        {
          id: "r3",
          text: "Removing the route-map eliminates the community-based routing policy entirely, which was implemented for a reason. Rolling back delays the migration and does not solve the underlying interoperability issue.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Standard community-lists match individual community values consistently across vendors, unlike expanded lists where regex matching behavior differs. This is a common multi-vendor BGP pitfall.",
        partial:
          "Your approach would fix the immediate issue, but standard community-lists provide cross-vendor consistency and are the recommended best practice for multi-vendor environments.",
        wrong:
          "The expanded community-list regex matches differently on Arista vs Cisco. Cisco matches any individual community, while Arista matches the full community string. Standard community-lists behave consistently across both platforms.",
      },
    },
  ],
  hints: [
    "When OSPF adjacency is stuck in ExStart between different vendors, check MTU values. Juniper includes L2 header in its MTU (1514) while Cisco uses IP MTU (1500). This mismatch prevents DBD exchange.",
    "Cisco sends VLAN 1 untagged by default on 802.1Q trunks. Juniper requires explicit 'native-vlan-id' configuration. Always verify native VLAN handling when connecting different vendor switches.",
    "BGP expanded community-list regex behavior differs between vendors. Standard community-lists match individual values consistently. Always test community matching after vendor migrations.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "Multi-vendor environments are the norm in enterprise and service provider networks. Engineers who understand the subtle differences in how Cisco, Juniper, and Arista implement the same standards are invaluable during network integrations, migrations, and acquisitions.",
  toolRelevance: [
    "Cisco IOS-XE CLI",
    "Juniper Junos CLI",
    "Arista EOS CLI",
    "Wireshark (802.1Q and OSPF analysis)",
    "BGP Looking Glass servers",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
