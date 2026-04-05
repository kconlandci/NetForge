import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "bgp-peering-troubleshooting",
  version: 1,
  title: "Debug BGP Peer Establishment",

  tier: "intermediate",
  track: "routing-switching",
  difficulty: "moderate",
  accessLevel: "premium",
  tags: ["bgp", "peering", "ebgp", "ibgp", "troubleshooting"],

  description:
    "Debug BGP peering failures by investigating AS number mismatches, update-source issues, TTL problems, and authentication errors in eBGP and iBGP sessions.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Diagnose BGP peer establishment failures using show and debug commands",
    "Understand eBGP vs iBGP peering requirements",
    "Resolve update-source, multihop TTL, and AS number configuration issues",
  ],
  sortOrder: 212,

  status: "published",
  prerequisites: [],

  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "as-number-mismatch",
      title: "BGP Peer Stuck in Active State",
      objective:
        "Router1 (AS 65001) cannot establish an eBGP session with Router2 (AS 65002). The BGP state is stuck in Active. Investigate the BGP configuration.",
      investigationData: [
        {
          id: "show-bgp-summary-r1",
          label: "show ip bgp summary (Router1)",
          content:
            "BGP router identifier 1.1.1.1, local AS number 65001\nBGP table version is 1, main routing table version 1\n\nNeighbor        V    AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd\n10.0.12.2       4 65002       0       0        0    0    0 never    Active",
          isCritical: true,
        },
        {
          id: "show-bgp-summary-r2",
          label: "show ip bgp summary (Router2)",
          content:
            "BGP router identifier 2.2.2.2, local AS number 65002\nBGP table version is 1, main routing table version 1\n\nNeighbor        V    AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd\n10.0.12.1       4 65003       0       0        0    0    0 never    Active",
          isCritical: true,
        },
        {
          id: "show-run-bgp-r2",
          label: "show run | section bgp (Router2)",
          content:
            "router bgp 65002\n bgp router-id 2.2.2.2\n neighbor 10.0.12.1 remote-as 65003\n network 10.2.0.0 mask 255.255.0.0",
        },
      ],
      actions: [
        {
          id: "fix-remote-as-r2",
          label: "Change Router2's remote-as for 10.0.12.1 from 65003 to 65001",
          color: "green",
        },
        {
          id: "fix-remote-as-r1",
          label: "Change Router1's local AS from 65001 to 65003",
          color: "red",
        },
        {
          id: "clear-bgp",
          label: "Clear BGP sessions on both routers",
          color: "orange",
        },
        {
          id: "add-route-map",
          label: "Add a route-map to fix the peering",
          color: "red",
        },
      ],
      correctActionId: "fix-remote-as-r2",
      rationales: [
        {
          id: "r1",
          text: "Router2 has 'neighbor 10.0.12.1 remote-as 65003' but Router1 is in AS 65001. The remote-as must match the neighbor's actual AS number for BGP to establish.",
        },
        {
          id: "r2",
          text: "Changing Router1's AS number would disrupt all its existing BGP sessions and is the wrong fix. The typo is in Router2's configuration.",
        },
        {
          id: "r3",
          text: "Clearing BGP sessions does not fix configuration errors. The session will remain in Active state until the AS number mismatch is corrected.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Router2 has the wrong remote-as configured. Changing it from 65003 to 65001 allows the BGP OPEN messages to match and the peering to establish.",
        partial:
          "You identified a BGP configuration issue but check which router has the error. Compare the remote-as values against the actual AS numbers.",
        wrong:
          "BGP requires the remote-as in the neighbor command to match the peer's actual AS number. Compare show bgp summary outputs to find the mismatch.",
      },
    },
    {
      type: "investigate-decide",
      id: "ibgp-update-source",
      title: "iBGP Peer Using Wrong Source Address",
      objective:
        "An iBGP session between Router1 and Router3 (both AS 65001) keeps dropping. The session uses physical interface IPs, but the route to the peer's IP sometimes disappears during link flaps.",
      investigationData: [
        {
          id: "show-bgp-r1",
          label: "show ip bgp neighbors 10.0.13.2 (Router1)",
          content:
            "BGP neighbor is 10.0.13.2, remote AS 65001, internal link\n  BGP state = Idle\n  Last read 00:05:32, last write 00:05:32\n  TCP connection using address 10.0.13.1 as source\n  External BGP neighbor not directly connected.",
        },
        {
          id: "show-loopback",
          label: "show ip interface brief (Router1 & Router3)",
          content:
            "Router1:\nLoopback0   1.1.1.1   YES manual up    up\nGi0/0       10.0.13.1 YES manual up    up\n\nRouter3:\nLoopback0   3.3.3.3   YES manual up    up\nGi0/0       10.0.13.2 YES manual up    up",
          isCritical: true,
        },
        {
          id: "show-run-bgp-r1",
          label: "show run | section bgp (Router1)",
          content:
            "router bgp 65001\n bgp router-id 1.1.1.1\n neighbor 10.0.13.2 remote-as 65001\n neighbor 10.0.13.2 next-hop-self",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "peer-loopbacks",
          label: "Peer using loopback IPs with update-source Loopback0",
          color: "green",
        },
        {
          id: "add-keepalive",
          label: "Reduce BGP keepalive timers to detect failures faster",
          color: "yellow",
        },
        {
          id: "add-static-route",
          label: "Add static routes to prevent peer IP from disappearing",
          color: "orange",
        },
        {
          id: "change-to-ebgp",
          label: "Change to eBGP peering between different AS numbers",
          color: "red",
        },
      ],
      correctActionId: "peer-loopbacks",
      rationales: [
        {
          id: "r1",
          text: "iBGP best practice is to peer using loopback addresses with 'neighbor x.x.x.x update-source Loopback0'. Loopbacks do not go down during physical link flaps if alternate paths exist.",
        },
        {
          id: "r2",
          text: "Faster keepalives detect failures sooner but do not prevent the session from dropping. The root cause is peering on a physical interface that can flap.",
        },
        {
          id: "r3",
          text: "Static routes are fragile and do not scale. Using loopback peering with an IGP providing reachability is the standard approach.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Peering iBGP over loopbacks with 'update-source Loopback0' provides resilience against physical link flaps as long as an alternate path exists.",
        partial:
          "Your approach helps but does not address the fundamental issue. iBGP should always peer over loopback interfaces for stability.",
        wrong:
          "iBGP peering should use loopback interfaces, not physical interfaces. Configure 'neighbor <loopback-ip> update-source Loopback0' on both sides.",
      },
    },
    {
      type: "investigate-decide",
      id: "ebgp-multihop",
      title: "eBGP Multihop TTL Issue",
      objective:
        "An eBGP peering between Router1 (AS 65001) and an ISP router (AS 65100) uses loopback addresses but the session stays in Active state. The ISP router is 2 hops away.",
      investigationData: [
        {
          id: "show-bgp-r1",
          label: "show ip bgp neighbors 100.100.100.1 (Router1)",
          content:
            "BGP neighbor is 100.100.100.1, remote AS 65100, external link\n  BGP state = Active\n  Last read 00:00:00, last write 00:00:00\n  External BGP neighbor may be up to 1 hop away.",
          isCritical: true,
        },
        {
          id: "traceroute",
          label: "traceroute 100.100.100.1 source 1.1.1.1",
          content:
            "Type escape sequence to abort.\nTracing the route to 100.100.100.1\n  1 10.0.12.2  4 msec\n  2 100.100.100.1  8 msec",
          isCritical: true,
        },
        {
          id: "show-run-bgp",
          label: "show run | section bgp (Router1)",
          content:
            "router bgp 65001\n bgp router-id 1.1.1.1\n neighbor 100.100.100.1 remote-as 65100\n neighbor 100.100.100.1 update-source Loopback0",
        },
      ],
      actions: [
        {
          id: "add-ebgp-multihop",
          label: "Add 'neighbor 100.100.100.1 ebgp-multihop 2' on Router1",
          color: "green",
        },
        {
          id: "peer-directly",
          label: "Change to peer using directly connected interface IPs",
          color: "yellow",
        },
        {
          id: "increase-keepalive",
          label: "Increase BGP keepalive timer",
          color: "red",
        },
        {
          id: "add-password",
          label: "Add BGP MD5 authentication",
          color: "red",
        },
      ],
      correctActionId: "add-ebgp-multihop",
      rationales: [
        {
          id: "r1",
          text: "eBGP defaults to TTL=1, which means the BGP packet expires before reaching a peer 2 hops away. 'ebgp-multihop 2' increases the TTL to allow the packets through.",
        },
        {
          id: "r2",
          text: "Peering on directly connected interfaces avoids the TTL issue but loses the stability benefits of loopback peering, which may be required by the ISP.",
        },
        {
          id: "r3",
          text: "Keepalive timers and authentication are unrelated to the TTL issue. The BGP OPEN packets never reach the peer because they expire in transit.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! eBGP uses TTL=1 by default. Since the ISP is 2 hops away, 'ebgp-multihop 2' (or higher) is needed for the TCP session to establish.",
        partial:
          "Your approach avoids the problem but may not be what the ISP requires. eBGP multihop is specifically designed for peering over non-directly-connected addresses.",
        wrong:
          "eBGP defaults to TTL=1. If the peer is more than 1 hop away, you need 'neighbor x.x.x.x ebgp-multihop <n>' where n >= number of hops.",
      },
    },
  ],
  hints: [
    "BGP 'Active' state means the router is trying to establish a TCP session but failing. Check AS numbers, reachability, and TTL settings.",
    "iBGP should peer over loopback addresses with 'update-source Loopback0' for resilience against physical link failures.",
    "eBGP uses TTL=1 by default. If the peer is more than 1 hop away, enable 'ebgp-multihop' with an appropriate hop count.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "BGP is the protocol that runs the internet. Troubleshooting BGP peering is a critical skill for ISP engineers and enterprise architects managing WAN connections.",
  toolRelevance: [
    "Cisco IOS CLI",
    "Looking glass servers",
    "BGP route collectors",
    "Wireshark (BGP message analysis)",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
