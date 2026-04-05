import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "etherchannel-setup",
  version: 1,
  title: "Investigate EtherChannel Bundle Failures",

  tier: "intermediate",
  track: "routing-switching",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["etherchannel", "lacp", "pagp", "link-aggregation"],

  description:
    "Investigate why EtherChannel bundles fail to form by analyzing protocol mismatches, speed/duplex inconsistencies, and VLAN mismatches across member ports.",
  estimatedMinutes: 14,
  learningObjectives: [
    "Identify LACP and PAgP negotiation requirements for EtherChannel",
    "Diagnose port-channel formation failures using show commands",
    "Verify member port consistency for speed, duplex, and VLAN settings",
  ],
  sortOrder: 210,

  status: "published",
  prerequisites: [],

  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "protocol-mismatch",
      title: "EtherChannel Protocol Mismatch",
      objective:
        "Switch1 and Switch2 each have Gi0/1-2 configured for EtherChannel but the bundle is not forming. Investigate the channel-group configuration.",
      investigationData: [
        {
          id: "show-ethchan-sw1",
          label: "show etherchannel summary (Switch1)",
          content:
            "Flags:  D - down        P - bundled in port-channel\n        I - stand-alone  s - suspended\n        H - Hot-standby\n\nGroup  Port-channel  Protocol    Ports\n------+-------------+-----------+--------------------\n1      Po1(SD)         LACP      Gi0/1(I)    Gi0/2(I)",
          isCritical: true,
        },
        {
          id: "show-ethchan-sw2",
          label: "show etherchannel summary (Switch2)",
          content:
            "Group  Port-channel  Protocol    Ports\n------+-------------+-----------+--------------------\n1      Po1(SD)         PAgP      Gi0/1(I)    Gi0/2(I)",
          isCritical: true,
        },
        {
          id: "show-run-sw1",
          label: "show run int Gi0/1 (Switch1)",
          content:
            "interface GigabitEthernet0/1\n switchport mode trunk\n channel-group 1 mode active",
        },
        {
          id: "show-run-sw2",
          label: "show run int Gi0/1 (Switch2)",
          content:
            "interface GigabitEthernet0/1\n switchport mode trunk\n channel-group 1 mode desirable",
        },
      ],
      actions: [
        {
          id: "fix-sw2-lacp",
          label: "Change Switch2 to LACP (mode active or passive)",
          color: "green",
        },
        {
          id: "fix-sw1-pagp",
          label: "Change Switch1 to PAgP (mode desirable or auto)",
          color: "yellow",
        },
        {
          id: "force-on",
          label: "Set both to mode 'on' to bypass negotiation",
          color: "orange",
        },
        {
          id: "reboot-both",
          label: "Reboot both switches to reset EtherChannel",
          color: "red",
        },
      ],
      correctActionId: "fix-sw2-lacp",
      rationales: [
        {
          id: "r1",
          text: "Switch1 uses LACP (active) and Switch2 uses PAgP (desirable). These protocols are incompatible. Changing Switch2 to LACP active or passive will allow the bundle to form.",
        },
        {
          id: "r2",
          text: "Changing Switch1 to PAgP would also work, but LACP is the industry standard (IEEE 802.3ad) and preferred over the Cisco-proprietary PAgP.",
        },
        {
          id: "r3",
          text: "Mode 'on' forces bundling without negotiation, which is risky. If one side goes down, the other may still send traffic into a dead link.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! LACP and PAgP cannot interoperate. Both sides must use the same protocol. LACP (active/passive) is the preferred standard.",
        partial:
          "You identified the protocol issue but consider which protocol to standardize on. LACP is IEEE 802.3ad and preferred in multi-vendor environments.",
        wrong:
          "EtherChannel requires the same negotiation protocol on both sides. LACP modes: active/passive. PAgP modes: desirable/auto. They cannot be mixed.",
      },
    },
    {
      type: "investigate-decide",
      id: "vlan-mismatch-member",
      title: "Member Port VLAN Mismatch",
      objective:
        "An EtherChannel between Switch1 and Switch3 shows ports suspended (s). All ports should be trunking with the same allowed VLANs. Investigate the member port configuration.",
      investigationData: [
        {
          id: "show-ethchan",
          label: "show etherchannel summary (Switch1)",
          content:
            "Group  Port-channel  Protocol    Ports\n------+-------------+-----------+--------------------\n2      Po2(SU)         LACP      Gi0/3(P)    Gi0/4(s)",
          isCritical: true,
        },
        {
          id: "show-trunk-gi03",
          label: "show int Gi0/3 trunk (Switch1)",
          content:
            "Port        Mode         Encapsulation  Status        Native vlan\nGi0/3       on           802.1q         trunking      1\n\nPort        Vlans allowed on trunk\nGi0/3       10,20,30",
        },
        {
          id: "show-trunk-gi04",
          label: "show int Gi0/4 trunk (Switch1)",
          content:
            "Port        Mode         Encapsulation  Status        Native vlan\nGi0/4       on           802.1q         trunking      1\n\nPort        Vlans allowed on trunk\nGi0/4       10,20,30,40",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "fix-allowed-vlans",
          label: "Set Gi0/4 allowed VLANs to match Gi0/3 (10,20,30)",
          color: "green",
        },
        {
          id: "add-vlan40-gi03",
          label: "Add VLAN 40 to Gi0/3 to match Gi0/4",
          color: "yellow",
        },
        {
          id: "remove-gi04",
          label: "Remove Gi0/4 from the EtherChannel",
          color: "orange",
        },
        {
          id: "reset-ethchan",
          label: "Delete and recreate the port-channel",
          color: "red",
        },
      ],
      correctActionId: "fix-allowed-vlans",
      rationales: [
        {
          id: "r1",
          text: "All EtherChannel member ports must have identical configurations: same trunk mode, allowed VLANs, native VLAN, speed, and duplex. Gi0/4 has VLAN 40 extra, causing suspension.",
        },
        {
          id: "r2",
          text: "Adding VLAN 40 to Gi0/3 would also make them match, but if VLAN 40 is not needed on this trunk, it is better to remove the extra VLAN from Gi0/4.",
        },
        {
          id: "r3",
          text: "Removing the port or recreating the channel is excessive. The fix is simply making the allowed VLAN lists identical across all member ports.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Member ports must have identical configurations. Gi0/4 has an extra allowed VLAN (40) that does not match Gi0/3, causing it to be suspended.",
        partial:
          "You identified the VLAN mismatch. Either add VLAN 40 to Gi0/3 or remove it from Gi0/4. Both make the configs match, but removing the unneeded VLAN is cleaner.",
        wrong:
          "EtherChannel requires identical config on all member ports. Check allowed VLANs, native VLAN, speed, duplex, and switchport mode across all members.",
      },
    },
    {
      type: "investigate-decide",
      id: "lacp-passive-passive",
      title: "LACP Passive-Passive Stalemate",
      objective:
        "The EtherChannel between Switch1 and Switch4 is not forming despite both sides being configured with LACP. Ports show as stand-alone (I).",
      investigationData: [
        {
          id: "show-ethchan-sw1",
          label: "show etherchannel summary (Switch1)",
          content:
            "Group  Port-channel  Protocol    Ports\n------+-------------+-----------+--------------------\n3      Po3(SD)         LACP      Gi0/5(I)    Gi0/6(I)",
          isCritical: true,
        },
        {
          id: "show-run-sw1-gi05",
          label: "show run int Gi0/5 (Switch1)",
          content:
            "interface GigabitEthernet0/5\n switchport mode trunk\n channel-group 3 mode passive",
        },
        {
          id: "show-run-sw4-gi01",
          label: "show run int Gi0/1 (Switch4)",
          content:
            "interface GigabitEthernet0/1\n switchport mode trunk\n channel-group 3 mode passive",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "change-one-active",
          label: "Change one side to LACP active mode",
          color: "green",
        },
        {
          id: "change-both-active",
          label: "Change both sides to LACP active mode",
          color: "green",
        },
        {
          id: "change-both-on",
          label: "Change both sides to mode 'on'",
          color: "orange",
        },
        {
          id: "add-more-ports",
          label: "Add more ports to the channel-group",
          color: "red",
        },
      ],
      correctActionId: "change-one-active",
      rationales: [
        {
          id: "r1",
          text: "LACP passive-passive never forms because neither side initiates LACP negotiation. At least one side must be 'active' to send LACP PDUs and start the negotiation.",
        },
        {
          id: "r2",
          text: "Both active would also work, but changing just one side to active is the minimum change needed. Active-passive is a common and valid configuration.",
        },
        {
          id: "r3",
          text: "Mode 'on' bypasses LACP negotiation entirely, losing the benefits of LACP monitoring (dead-link detection, graceful failover).",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! LACP passive-passive is a stalemate. At least one side must be active to initiate LACP PDU exchange and form the bundle.",
        partial:
          "Both active works too. The key insight is that passive-passive never initiates negotiation. At least one active side is required.",
        wrong:
          "LACP mode combinations: active+active = bundle, active+passive = bundle, passive+passive = NO bundle. At least one side must be active.",
      },
    },
  ],
  hints: [
    "EtherChannel requires matching protocols: LACP (active/passive) or PAgP (desirable/auto). They cannot be mixed between switches.",
    "All member ports must have identical configurations: speed, duplex, switchport mode, allowed VLANs, and native VLAN.",
    "LACP passive+passive and PAgP auto+auto will never form a bundle. At least one side must be active/desirable.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "EtherChannel increases bandwidth and provides redundancy between switches. Diagnosing bundle failures quickly is critical in data center and campus environments.",
  toolRelevance: [
    "Cisco IOS CLI",
    "Wireshark (LACP PDU analysis)",
    "Network monitoring (link utilization)",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
