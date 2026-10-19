import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "bgp-peering-troubleshooting",
  version: 2,
  title: "The AI's BGP Policy Doesn't Exist",

  tier: "intermediate",
  track: "routing-switching",
  difficulty: "moderate",
  accessLevel: "premium",
  tags: ["bgp", "peering", "route-map", "ai-review", "troubleshooting"],

  description:
    "An AI assistant drafted the BGP policy for a new peer — route-maps, communities, and AS-path prepending — and reported it ready to deploy. Validate the draft against the design document and live router output, and catch the community that doesn't exist and the prepend of the wrong AS.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Validate AI-generated BGP policy against ground truth (design documents and live show output) before deploying",
    "Detect hallucinated configuration references — communities, route-maps, and lists the draft assumes but never defines",
    "Verify AS-path prepending uses the local AS, and understand why prepending a neighbor's AS breaks the path",
    "Recognize when an AI troubleshooting summary contradicts the device evidence it claims to summarize",
  ],
  sortOrder: 212,

  status: "published",
  prerequisites: [],

  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "ai-bgp-community-prepend",
      title: "The Community That Doesn't Exist",
      objective:
        "Your team asked an AI assistant to draft the BGP policy for a new eBGP peer on the backup transit link. The design requires inbound routes to be tagged with community 65001:100 (the local-pref marker used by the traffic-engineering playbook) and the local AS prepended twice outbound to make this link the backup. The AI reports the policy 'complete and validated.' Review the draft against the design and the router's current state before approving deployment.",
      investigationData: [
        {
          id: "ai-draft-policy",
          label: "AI Assistant — Generated Policy Draft",
          content:
            "ip community-list standard TE-TAG permit 65001:100\n!\nroute-map PEER-IN permit 10\n match community TE-TAG\n set local-preference 150\n!\nroute-map PEER-OUT permit 10\n set community 65010:100\n set as-path prepend 65002 65002\n!\nrouter bgp 65001\n neighbor 203.0.113.2 remote-as 65002\n neighbor 203.0.113.2 route-map PEER-IN in\n neighbor 203.0.113.2 route-map PEER-OUT out\n\nAI summary: 'Tags inbound routes with community 65001:100 per the design and prepends your AS twice outbound so the link acts as backup. Ready to deploy.'",
          isCritical: true,
        },
        {
          id: "design-doc",
          label: "Design Document — BGP Traffic Engineering Standards",
          content:
            "Local AS: 65001. Peer AS (backup transit provider): 65002.\n\nCommunity plan (only these values are in use):\n  65001:100  = TE-TAG: mark for local-pref 150 handling\n  65001:200  = CUSTOMER-ROUTE\n  65001:300  = BACKUP-ONLY\n\nNo other 65001:xxx communities are defined. Communities in the\nform 65010:xxx do not exist in this network's plan.\n\nBackup-link requirement: prepend the LOCAL AS (65001) twice on\noutbound advertisements so this path is less preferred.",
        },
        {
          id: "show-bgp-peer",
          label: "show ip bgp summary / show run | section bgp (R1, current)",
          content:
            "BGP router identifier 1.1.1.1, local AS number 65001\n\nNeighbor        V    AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd\n203.0.113.2     4 65002       0       0        0    0    0 never    Idle\n\nrouter bgp 65001\n bgp router-id 1.1.1.1\n neighbor 203.0.113.2 remote-as 65002\n (no route-maps applied yet — policy not deployed)",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "deploy-as-written",
          label: "Deploy the AI's policy as written — the summary confirms it matches the design",
          color: "red",
        },
        {
          id: "send-back-community-prepend",
          label: "Send it back: outbound community must be 65001:100 (65010:100 does not exist in the plan) and the prepend must use the local AS 65001, not 65002",
          color: "green",
        },
        {
          id: "deploy-remove-prepend",
          label: "Deploy, but remove the AS-path prepend entirely to keep the config simple",
          color: "yellow",
        },
        {
          id: "renumber-design",
          label: "Change the design standard to community 65010:100 so the AI's draft becomes correct",
          color: "orange",
        },
      ],
      correctActionId: "send-back-community-prepend",
      rationales: [
        {
          id: "r1",
          text: "Two of the draft's values are invented. The outbound route-map sets community 65010:100 — a transposed-digit value that does not exist in the community plan, so downstream policy that keys off 65001:100 will never match. And 'set as-path prepend 65002 65002' prepends the PEER's AS, not the local AS: neighbors receiving that path see their own AS in it and discard the route as a loop. The summary claimed both were per design; the draft itself disagrees.",
        },
        {
          id: "r2",
          text: "Deploying as written means the backup link advertises paths the peer rejects outright, and inbound tagging silently diverges from the traffic-engineering playbook. The failure mode is a backup link that carries nothing when the primary fails — discovered during an outage.",
        },
        {
          id: "r3",
          text: "Removing the prepend avoids the wrong-AS error but abandons the design requirement: without prepending, the backup link is equally preferred and will carry production traffic it was not sized for. The fix is to correct the values, not delete the mechanism.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct. You checked the draft against the design instead of trusting the summary, and caught both inventions: a community value that doesn't exist in the plan (65010:100) and a prepend of the peer's AS that would make the peer reject the routes as loops. Generated BGP policy is only as good as its ground-truth check.",
        partial:
          "You hesitated to deploy, which is right, but identify the exact defects: the outbound community is 65010:100 (not in the plan) and the prepend uses AS 65002 — the neighbor's own AS — instead of local AS 65001. Both must be corrected, not worked around.",
        wrong:
          "The summary lied by transcription. The draft sets community 65010:100, which does not exist in the community plan, and prepends 65002 — the peer's AS — which makes the peer treat the path as a loop and drop it. Always diff generated policy against the design document and the live router state before deploying.",
      },
    },
    {
      type: "investigate-decide",
      id: "ai-bgp-ibgp-source",
      title: "The AI's iBGP Config Peers on Interfaces That Flap",
      objective:
        "The same assistant generated the configuration for a new iBGP session between Router1 and Router3 (both AS 65001). Its summary calls the config 'standard iBGP peering.' The routers have redundant paths via their loopbacks, but the generated neighbor statements use physical interface addresses. Decide whether this config should be deployed.",
      investigationData: [
        {
          id: "ai-ibgp-config",
          label: "AI Assistant — Generated iBGP Configuration",
          content:
            "Router1:\nrouter bgp 65001\n neighbor 10.0.13.2 remote-as 65001\n neighbor 10.0.13.2 next-hop-self\n\nRouter3:\nrouter bgp 65001\n neighbor 10.0.13.1 remote-as 65001\n neighbor 10.0.13.1 next-hop-self\n\nAI summary: 'Standard iBGP peering between R1 and R3 using their\ninterconnect addresses. No additional configuration required.'",
          isCritical: true,
        },
        {
          id: "show-loopback",
          label: "show ip interface brief (Router1 & Router3)",
          content:
            "Router1:\nLoopback0   1.1.1.1   YES manual up    up\nGi0/0       10.0.13.1 YES manual up    up\n\nRouter3:\nLoopback0   3.3.3.3   YES manual up    up\nGi0/0       10.0.13.2 YES manual up    up",
          isCritical: true,
        },
        {
          id: "show-bgp-r1",
          label: "show ip bgp neighbors 10.0.13.2 (Router1) — existing session behavior",
          content:
            "BGP neighbor is 10.0.13.2, remote AS 65001, internal link\n  BGP state = Idle\n  Last read 00:05:32, last write 00:05:32\n  TCP connection using address 10.0.13.1 as source\n  External BGP neighbor not directly connected.\n\nNote: the existing physical-interface peering drops whenever the\ndirect link flaps, even though an alternate path exists via the\nloopbacks.",
        },
      ],
      actions: [
        {
          id: "deploy-interface-peering",
          label: "Deploy the AI's config as written — it matches the interconnect addresses",
          color: "red",
        },
        {
          id: "fix-loopback-peering",
          label: "Send it back: peer on the loopback addresses with 'update-source Loopback0' on both routers",
          color: "green",
        },
        {
          id: "add-keepalive",
          label: "Deploy, and reduce BGP keepalive timers so the session recovers faster after flaps",
          color: "yellow",
        },
        {
          id: "change-to-ebgp",
          label: "Convert the session to eBGP between different AS numbers to avoid the issue",
          color: "orange",
        },
      ],
      correctActionId: "fix-loopback-peering",
      rationales: [
        {
          id: "r1",
          text: "iBGP best practice is to peer using loopback addresses with 'neighbor <loopback> update-source Loopback0'. Loopbacks stay reachable over any surviving path, so the session survives a single link flap. The AI reproduced the addressing it saw in the topology without applying the standard pattern — plausible, deployable, and fragile in exactly the way the existing session already demonstrates.",
        },
        {
          id: "r2",
          text: "Faster keepalives detect failures sooner but do not prevent the session from dropping. The root cause is peering on a physical interface that can flap, which the generated config repeats.",
        },
        {
          id: "r3",
          text: "Splitting one AS into two to dodge a peering-pattern problem would redesign the network's routing architecture. The fix is two lines per router, not a new design.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The AI's config would work on day one and fail on the first link flap — the exact behavior the existing session already shows. iBGP peers on loopbacks with 'update-source Loopback0' so any surviving path keeps the session up.",
        partial:
          "You spotted fragility, but timers and workarounds don't fix it. The generated config peers on physical interface IPs; the standard pattern is loopback peering with update-source, which the AI omitted.",
        wrong:
          "Generated configuration tends to mirror the most literal reading of a topology — interface addresses — and skip the operational pattern behind it. iBGP should peer over loopbacks with 'update-source Loopback0'. Deploying the draft repeats a failure the network is already having.",
      },
    },
    {
      type: "investigate-decide",
      id: "ai-bgp-multihop-claim",
      title: "'Directly Connected,' According to the Diagram",
      objective:
        "For an eBGP session to an ISP router (AS 65100) peered on loopbacks, the AI generated the neighbor configuration with no ebgp-multihop statement, explaining that 'the peer is directly connected per the topology diagram, so the default TTL is sufficient.' The session sits in Active. Verify the AI's claim against the device evidence.",
      investigationData: [
        {
          id: "show-bgp-isp",
          label: "show ip bgp neighbors 100.100.100.1 (Router1)",
          content:
            "BGP neighbor is 100.100.100.1, remote AS 65100, external link\n  BGP state = Active\n  Last read 00:00:00, last write 00:00:00\n  External BGP neighbor may be up to 1 hop away.",
          isCritical: true,
        },
        {
          id: "traceroute-isp",
          label: "traceroute 100.100.100.1 source 1.1.1.1",
          content:
            "Type escape sequence to abort.\nTracing the route to 100.100.100.1\n  1 10.0.12.2  4 msec\n  2 100.100.100.1  8 msec",
          isCritical: true,
        },
        {
          id: "show-run-isp",
          label: "show run | section bgp (Router1) — AI-generated neighbor block",
          content:
            "router bgp 65001\n bgp router-id 1.1.1.1\n neighbor 100.100.100.1 remote-as 65100\n neighbor 100.100.100.1 update-source Loopback0\n (no ebgp-multihop — AI note: 'not required, peer is directly connected')",
        },
      ],
      actions: [
        {
          id: "add-ebgp-multihop",
          label: "Correct the config: add 'neighbor 100.100.100.1 ebgp-multihop 2' — the traceroute proves the peer is 2 hops away",
          color: "green",
        },
        {
          id: "trust-diagram",
          label: "Trust the AI's reading of the diagram and troubleshoot cabling on the 'direct' link instead",
          color: "red",
        },
        {
          id: "peer-directly",
          label: "Abandon loopback peering and peer on the directly connected interface addresses",
          color: "yellow",
        },
        {
          id: "add-password",
          label: "Add BGP MD5 authentication, a common cause of sessions stuck in Active",
          color: "orange",
        },
      ],
      correctActionId: "add-ebgp-multihop",
      rationales: [
        {
          id: "r1",
          text: "The traceroute is the ground truth: two hops to 100.100.100.1. eBGP defaults to TTL=1, so the BGP packets expire at the intermediate router and the session can never leave Active. 'ebgp-multihop 2' raises the TTL to match reality. The AI reasoned from a diagram's appearance; the device output contradicts it.",
        },
        {
          id: "r2",
          text: "There is no direct link to troubleshoot — the topology the AI inferred from the diagram does not exist. Chasing cabling on a phantom connection wastes the change window while the one-line fix sits unused.",
        },
        {
          id: "r3",
          text: "Peering on directly connected interfaces would avoid the TTL problem but discards loopback peering, which the ISP requires for this service. The correct response to a wrong claim in generated config is to fix the claim, not redesign around it.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Two hops in the traceroute beats 'directly connected' in a summary. eBGP's default TTL of 1 expires before reaching the peer, so 'ebgp-multihop 2' is the fix — and the habit is the point: verify an AI's topological claims with device output.",
        partial:
          "You doubted the AI, but check the evidence hierarchy: the traceroute shows 2 hops, and eBGP defaults to TTL=1. That combination has exactly one standard fix — ebgp-multihop — without abandoning loopback peering.",
        wrong:
          "The AI's claim was checkable and wrong: the traceroute reaches the peer in 2 hops, and with eBGP's TTL=1 default the session can never establish. When generated config and device output disagree, the device output wins.",
      },
    },
  ],
  hints: [
    "Diff every generated value against a ground-truth source: the design document for communities and AS numbers, live show output for topology and state. AI drafts fail by transcription — transposed digits, the peer's AS instead of yours.",
    "Prepending the neighbor's own AS makes the neighbor discard your routes as loops. The prepend always uses your local AS.",
    "BGP 'Active' state means TCP never established. Check the AI's assumptions in order: reachability, hop count/TTL, then AS configuration.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "BGP policy errors announce themselves during outages, not during change windows. As AI assistants draft more routing policy, the scarce skill is verification: knowing which values must be checked against the design and the live network — communities, AS numbers, hop counts — because a generator produces wrong values with the same fluency as right ones.",
  toolRelevance: [
    "Cisco IOS CLI",
    "Looking glass servers",
    "BGP route collectors",
    "Wireshark (BGP message analysis)",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-10-18",
};

export default lab;
