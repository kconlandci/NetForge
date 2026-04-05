import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "mpls-label-analysis",
  version: 1,
  title: "Analyze MPLS Label Switching",

  tier: "advanced",
  track: "routing-switching",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["mpls", "label-switching", "ldp", "lsr", "service-provider"],

  description:
    "Analyze MPLS label switching operations including LDP adjacency failures, label allocation issues, and penultimate hop popping behavior in service provider networks.",
  estimatedMinutes: 18,
  learningObjectives: [
    "Interpret MPLS forwarding table entries and label operations",
    "Diagnose LDP session establishment failures",
    "Understand penultimate hop popping (PHP) and its role in MPLS",
  ],
  sortOrder: 218,

  status: "published",
  prerequisites: [],

  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "ldp-session-failure",
      title: "LDP Session Not Establishing",
      description:
        "Two PE routers (PE1 and PE2) connected via a P router cannot establish an LDP session. MPLS VPN traffic is not being label-switched. The IGP (OSPF) is fully converged.",
      evidence: [
        {
          type: "cli-output",
          content:
            "PE1# show mpls ldp neighbor\n(no output - no LDP neighbors)",
        },
        {
          type: "cli-output",
          content:
            "PE1# show mpls interfaces\nInterface              IP            Tunnel   BGP Static Operational\nGigabitEthernet0/0     No            No       No  No     No",
          icon: "alert",
        },
        {
          type: "cli-output",
          content:
            "PE1# show run int Gi0/0\ninterface GigabitEthernet0/0\n ip address 10.0.12.1 255.255.255.252\n ip ospf 1 area 0\n! Note: no mpls ip command",
        },
      ],
      classifications: [
        {
          id: "mpls-not-enabled",
          label: "MPLS Not Enabled on Interface",
          description: "The 'mpls ip' command is missing from the interface, preventing LDP hello messages from being sent.",
        },
        {
          id: "ldp-router-id",
          label: "LDP Router-ID Mismatch",
          description: "The LDP router-ID is using an unreachable address.",
        },
        {
          id: "ospf-issue",
          label: "OSPF Not Advertising Loopback",
          description: "The IGP is not advertising the LDP transport address.",
        },
      ],
      correctClassificationId: "mpls-not-enabled",
      remediations: [
        {
          id: "enable-mpls-ip",
          label: "Add 'mpls ip' to the interface Gi0/0",
          description: "Enable MPLS label switching on the interface to allow LDP hello messages and label distribution.",
        },
        {
          id: "configure-ldp",
          label: "Configure 'mpls ldp router-id Loopback0' globally",
          description: "Set the LDP router-ID to the loopback address for stability.",
        },
        {
          id: "restart-ldp",
          label: "Restart the LDP process",
          description: "Clear LDP sessions and restart the discovery process.",
        },
      ],
      correctRemediationId: "enable-mpls-ip",
      rationales: [
        {
          id: "r1",
          text: "The 'show mpls interfaces' output shows Gi0/0 as 'No' for IP label switching, and the running config confirms 'mpls ip' is missing. Without it, no LDP hellos are sent on the interface.",
        },
        {
          id: "r2",
          text: "Setting the LDP router-ID is a best practice but is not the root cause here. The interface itself is not participating in MPLS.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The 'mpls ip' command is missing from the interface. Without it, no LDP discovery messages are sent and no labels are distributed.",
        partial:
          "You identified an MPLS issue. Check 'show mpls interfaces' first. The interface must have 'mpls ip' enabled for LDP to operate.",
        wrong:
          "MPLS requires 'mpls ip' on each participating interface. Without it, the router does not send LDP hello messages or perform label switching on that link.",
      },
    },
    {
      type: "triage-remediate",
      id: "label-not-allocated",
      title: "Missing Label for Remote Prefix",
      description:
        "A P router in the MPLS core shows no label binding for a PE loopback prefix. Traffic to that PE is being IP-routed instead of label-switched, breaking VPN connectivity.",
      evidence: [
        {
          type: "cli-output",
          content:
            "P-Router# show mpls forwarding-table 10.255.0.2/32\nLocal      Outgoing   Prefix           Bytes Label   Outgoing         Next Hop\nLabel      Label or VC                 Switched      interface\n(no entry found)",
          icon: "alert",
        },
        {
          type: "cli-output",
          content:
            "P-Router# show ip route 10.255.0.2\nRouting entry for 10.255.0.2/32\n  Known via \"ospf 1\", distance 110, metric 3\n  Last update from 10.0.23.2 on GigabitEthernet0/1\n  * 10.0.23.2, from 10.255.0.2, via GigabitEthernet0/1",
        },
        {
          type: "cli-output",
          content:
            "P-Router# show mpls ldp bindings 10.255.0.2 32\n(no output - no label bindings exist for this prefix)",
        },
        {
          type: "cli-output",
          content:
            "PE2# show mpls ldp neighbor\nPeer LDP Ident: 10.255.0.3:0; Local LDP Ident 10.255.0.2:0\n  TCP connection: 10.255.0.3:646 - 10.255.0.2:45231\n  State: Oper; PIDs: none\n  Addresses bound to peer LDP Ident:\n    10.0.23.2",
        },
      ],
      classifications: [
        {
          id: "ldp-no-label-for-prefix",
          label: "LDP Not Allocating Label for PE Loopback",
          description: "The PE router is not advertising a label binding for its loopback prefix, possibly due to LDP label allocation policy or missing LDP session.",
        },
        {
          id: "igp-issue",
          label: "IGP Route Issue",
          description: "The OSPF route exists but has a problem preventing label allocation.",
        },
        {
          id: "forwarding-error",
          label: "MPLS Forwarding Table Corruption",
          description: "The LFIB is corrupted and needs to be cleared.",
        },
      ],
      correctClassificationId: "ldp-no-label-for-prefix",
      remediations: [
        {
          id: "check-ldp-session",
          label: "Verify LDP session between P-Router and PE2, and check LDP label allocation filters",
          description: "Ensure a direct or transitive LDP session exists and no label filters are blocking allocation for the PE loopback prefix.",
        },
        {
          id: "clear-mpls",
          label: "Clear the MPLS forwarding table",
          description: "Reset the LFIB to force label re-allocation.",
        },
        {
          id: "redistribute-into-ldp",
          label: "Redistribute OSPF routes into LDP",
          description: "Configure LDP to generate labels for OSPF-learned prefixes.",
        },
      ],
      correctRemediationId: "check-ldp-session",
      rationales: [
        {
          id: "r1",
          text: "The PE2 LDP neighbor output shows the session to 10.255.0.3 (P-Router) is operational but 'PIDs: none' suggests no label distribution is happening. Check for LDP label allocation ACLs or a missing targeted session.",
        },
        {
          id: "r2",
          text: "Clearing the forwarding table is a temporary measure. If the LDP session is not properly distributing labels, the entries will remain missing after the clear.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The LDP session shows 'PIDs: none', indicating no label distribution. Check for label allocation filters (access-lists) or LDP session issues.",
        partial:
          "You identified the label allocation problem. The key evidence is the missing bindings and 'PIDs: none' in the LDP neighbor output.",
        wrong:
          "MPLS relies on LDP to distribute labels for IGP prefixes. If no binding exists, check the LDP session status, label allocation policies, and filters.",
      },
    },
    {
      type: "triage-remediate",
      id: "php-behavior",
      title: "Unexpected Label Behavior at Penultimate Hop",
      description:
        "Traffic analysis shows MPLS-labeled packets arriving at the egress PE with labels still attached, causing the PE to drop packets. The penultimate hop router should be popping the label.",
      evidence: [
        {
          type: "cli-output",
          content:
            "P-Router# show mpls forwarding-table 10.255.0.2/32\nLocal      Outgoing   Prefix           Bytes Label   Outgoing         Next Hop\nLabel      Label or VC                 Switched      interface\n22         24         10.255.0.2/32    45230         Gi0/1            10.0.23.2",
          icon: "alert",
        },
        {
          type: "cli-output",
          content:
            "PE2# show mpls forwarding-table 10.255.0.2/32\nLocal      Outgoing   Prefix           Bytes Label   Outgoing         Next Hop\nLabel      Label or VC                 Switched      interface\n24         No Label   10.255.0.2/32    0             Gi0/0            connected",
        },
        {
          type: "cli-output",
          content:
            "P-Router# show mpls ldp bindings 10.255.0.2 32\n  lib entry: 10.255.0.2/32, rev 14\n    local binding:  label: 22\n    remote binding: tsr: 10.255.0.2:0, label: 24\n\nNote: PE2 advertised label 24 instead of implicit-null (3)",
        },
      ],
      classifications: [
        {
          id: "php-disabled",
          label: "Penultimate Hop Popping Disabled on Egress PE",
          description: "PE2 is advertising an explicit label (24) instead of implicit-null (label 3) for its own prefix, preventing PHP.",
        },
        {
          id: "label-corruption",
          label: "Label Table Corruption",
          description: "The label forwarding table has incorrect entries.",
        },
        {
          id: "mtu-issue",
          label: "MPLS MTU Problem",
          description: "The label is not being popped due to MTU constraints on the link.",
        },
      ],
      correctClassificationId: "php-disabled",
      remediations: [
        {
          id: "fix-php",
          label: "Remove 'no mpls ldp explicit-null' or check LDP label allocation on PE2",
          description: "Ensure PE2 advertises implicit-null (label 3) for directly connected prefixes so the penultimate hop performs PHP.",
        },
        {
          id: "increase-mtu",
          label: "Increase MTU on the PE-facing link",
          description: "Adjust MTU to accommodate the extra label header.",
        },
        {
          id: "clear-ldp",
          label: "Clear LDP bindings on all routers",
          description: "Force re-advertisement of all labels.",
        },
      ],
      correctRemediationId: "fix-php",
      rationales: [
        {
          id: "r1",
          text: "PE2 is advertising label 24 for its own loopback instead of implicit-null (label 3). This means 'mpls ldp explicit-null' may be configured, or there is a label allocation issue. The P-Router cannot perform PHP because it was given an explicit label to swap to instead of popping.",
        },
        {
          id: "r2",
          text: "MTU is not the issue here. The label is being swapped (22->24) instead of popped. This is a label advertisement problem, not a packet size problem.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! PE2 should advertise implicit-null (label 3) for its own prefix to enable PHP. Instead it advertises label 24, forcing a swap instead of a pop at the penultimate hop.",
        partial:
          "You identified the PHP issue. The key is that PE2 advertises an explicit label instead of implicit-null. Check for 'mpls ldp explicit-null' configuration.",
        wrong:
          "PHP (Penultimate Hop Popping) requires the egress PE to advertise implicit-null (label 3) for its own prefixes. An explicit label prevents the penultimate hop from popping.",
      },
    },
  ],
  hints: [
    "MPLS requires 'mpls ip' on each participating interface. Check 'show mpls interfaces' to verify which interfaces are enabled.",
    "LDP distributes labels for IGP-learned prefixes. If no label binding exists, check LDP neighbor sessions and label allocation policies.",
    "Penultimate Hop Popping (PHP) relies on the egress router advertising implicit-null (label 3). If it advertises an explicit label, PHP cannot occur.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "MPLS is the foundation of service provider networks and enterprise WANs. Understanding label operations, LDP, and PHP is essential for roles in ISP engineering and SD-WAN design.",
  toolRelevance: [
    "Cisco IOS / IOS-XR CLI",
    "Wireshark (MPLS label analysis)",
    "GNS3 / EVE-NG",
    "Service provider monitoring tools",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
