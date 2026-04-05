import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "asymmetric-routing-diagnosis",
  version: 1,
  title: "Diagnose Asymmetric Routing & Firewall State Issues",

  tier: "advanced",
  track: "network-troubleshooting",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: [
    "asymmetric-routing",
    "firewall",
    "state-table",
    "traceroute",
    "routing",
    "troubleshooting",
  ],

  description:
    "Diagnose asymmetric routing causing firewall state table mismatches and dropped return traffic across multi-path network topologies.",
  estimatedMinutes: 25,
  learningObjectives: [
    "Identify asymmetric routing through traceroute and flow analysis",
    "Understand how stateful firewalls drop traffic when return paths differ from forward paths",
    "Determine correct remediation strategies for asymmetric routing issues",
    "Analyze firewall session tables to correlate dropped connections with missing state entries",
  ],
  sortOrder: 610,

  status: "published",
  prerequisites: [],

  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "asymmetric-path-detection",
      title: "Users Report Intermittent Connection Drops Through Dual-Firewall Setup",
      objective:
        "Users on VLAN 10 report intermittent TCP connection resets when accessing servers in the DMZ. The network has two firewalls in an active/active configuration. Investigate the traffic flow to determine why connections are being reset.",
      investigationData: [
        {
          id: "traceroute-forward",
          label: "traceroute from Client (10.10.10.50) to DMZ Server (172.16.1.100)",
          content:
            "traceroute to 172.16.1.100, 30 hops max, 60 byte packets\n 1  10.10.10.1    1.203 ms  (core-sw1)\n 2  10.0.0.1      2.415 ms  (fw-primary)\n 3  172.16.1.1    3.102 ms  (dmz-gw)\n 4  172.16.1.100  3.540 ms  (dmz-srv01)",
          isCritical: true,
        },
        {
          id: "traceroute-return",
          label: "traceroute from DMZ Server (172.16.1.100) to Client (10.10.10.50)",
          content:
            "traceroute to 10.10.10.50, 30 hops max, 60 byte packets\n 1  172.16.1.1    0.892 ms  (dmz-gw)\n 2  10.0.0.2      1.705 ms  (fw-secondary)\n 3  10.10.10.1    2.311 ms  (core-sw1)\n 4  10.10.10.50   2.780 ms  (client)",
          isCritical: true,
        },
        {
          id: "fw-primary-sessions",
          label: "show session table on fw-primary (Palo Alto)",
          content:
            "admin@fw-primary> show session all filter destination 172.16.1.100\n\nID       Application  State   Type   Src              Dst              Sport  Dport\n------   -----------  ------  -----  ---------------  ---------------  -----  -----\n148823   web-browsing ACTIVE  FLOW   10.10.10.50      172.16.1.100     49213  443\n148830   web-browsing ACTIVE  FLOW   10.10.10.50      172.16.1.100     49220  443\n148835   ssl          DISCARD FLOW   10.10.10.50      172.16.1.100     49225  443\n\nNote: Multiple sessions show DISCARD state — return traffic not seen on this firewall.",
          isCritical: true,
        },
        {
          id: "fw-secondary-sessions",
          label: "show session table on fw-secondary (Palo Alto)",
          content:
            "admin@fw-secondary> show session all filter source 172.16.1.100\n\nID       Application  State   Type   Src              Dst              Sport  Dport\n------   -----------  ------  -----  ---------------  ---------------  -----  -----\n(no matching sessions)\n\nNote: fw-secondary sees return SYN-ACK packets but has no matching session — packets are dropped as asymmetric.",
        },
      ],
      actions: [
        {
          id: "fix-routing-symmetry",
          label: "Adjust routing to ensure forward and return paths traverse the same firewall",
          color: "green",
        },
        {
          id: "disable-stateful-inspection",
          label: "Disable stateful inspection on both firewalls",
          color: "red",
        },
        {
          id: "add-static-routes",
          label: "Add static routes on the DMZ server to force return traffic through fw-primary",
          color: "yellow",
        },
        {
          id: "increase-session-timeout",
          label: "Increase session timeout values on fw-primary",
          color: "orange",
        },
      ],
      correctActionId: "fix-routing-symmetry",
      rationales: [
        {
          id: "r1",
          text: "The traceroutes prove asymmetric routing: forward traffic flows through fw-primary while return traffic flows through fw-secondary. fw-secondary drops the return SYN-ACK because it has no session state. Fixing routing ensures both directions traverse the same firewall.",
        },
        {
          id: "r2",
          text: "Disabling stateful inspection would allow the traffic through but eliminates a critical security control. This is never an acceptable production solution.",
        },
        {
          id: "r3",
          text: "Static routes on the server are fragile and do not scale. If the DMZ gateway's routing table sends return traffic via fw-secondary, host-level static routes may be overridden.",
        },
        {
          id: "r4",
          text: "Session timeouts are irrelevant here. The issue is not timeout-related — fw-secondary never had a session entry to begin with because the initial SYN was handled by fw-primary.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Asymmetric routing through an active/active firewall pair causes return traffic to arrive at a firewall with no matching session state. Ensuring symmetric routing is the proper fix.",
        partial:
          "You identified a workaround, but the root cause is asymmetric routing. The best solution ensures both forward and return traffic traverse the same firewall.",
        wrong:
          "The traceroutes clearly show different paths for forward and return traffic. Stateful firewalls require both directions to traverse the same device to maintain session state.",
      },
    },
    {
      type: "investigate-decide",
      id: "policy-based-routing-conflict",
      title: "PBR Causing Asymmetric Paths Through Redundant Firewalls",
      objective:
        "After implementing policy-based routing (PBR) on the core switch to load-balance traffic across two firewalls, the NOC reports that approximately 50% of new TCP connections from the engineering VLAN fail. Investigate the PBR configuration and its effect on traffic symmetry.",
      investigationData: [
        {
          id: "pbr-config",
          label: "show route-map PBR-BALANCE on core-sw1 (Cisco IOS)",
          content:
            "route-map PBR-BALANCE, permit, sequence 10\n  Match clauses:\n    ip address (access-lists): ACL-EVEN-HOSTS\n  Set clauses:\n    ip next-hop 10.0.0.1 (fw-primary)\n  Policy routing matches: 148230 packets\n\nroute-map PBR-BALANCE, permit, sequence 20\n  Match clauses:\n    ip address (access-lists): ACL-ODD-HOSTS\n  Set clauses:\n    ip next-hop 10.0.0.2 (fw-secondary)\n  Policy routing matches: 152017 packets",
          isCritical: true,
        },
        {
          id: "dmz-routing",
          label: "show ip route 10.10.10.0 on dmz-gw",
          content:
            "Routing entry for 10.10.10.0/24\n  Known via \"ospf 1\", distance 110, metric 20, type inter area\n  Last update from 10.0.0.1 on Gi0/1, 02:15:33 ago\n  Routing Descriptor Blocks:\n    * 10.0.0.1, from 10.0.0.1, via Gi0/1  (fw-primary)\n        Route metric is 20, traffic share count is 1",
          isCritical: true,
        },
        {
          id: "fw-secondary-drops",
          label: "show counter global filter severity drop on fw-secondary",
          content:
            "Global counters:\nSeverity  Name                             Value     Rate\n--------  -------------------------------  --------  ----\ndrop      flow_rcv_dot1q_tag_err           0         0/s\ndrop      flow_no_matching_session          87432     12/s\ndrop      tcp_drop_out_of_window            234       0/s\n\nflow_no_matching_session is incrementing rapidly.",
        },
      ],
      actions: [
        {
          id: "enable-ecmp-dmz",
          label: "Configure ECMP on dmz-gw with source-hash to match PBR logic on core-sw1",
          color: "green",
        },
        {
          id: "remove-pbr",
          label: "Remove PBR entirely and use standard OSPF routing",
          color: "yellow",
        },
        {
          id: "enable-session-sync",
          label: "Enable session state synchronization between the two firewalls",
          color: "orange",
        },
        {
          id: "add-pbr-dmz",
          label: "Create identical PBR rules on dmz-gw to mirror core-sw1 logic",
          color: "yellow",
        },
      ],
      correctActionId: "enable-ecmp-dmz",
      rationales: [
        {
          id: "r1",
          text: "The PBR on core-sw1 splits outbound traffic by host across two firewalls, but dmz-gw returns ALL traffic through fw-primary via OSPF. Configuring ECMP with consistent source-based hashing on dmz-gw ensures return traffic follows the same firewall as the forward path.",
        },
        {
          id: "r2",
          text: "Removing PBR solves the asymmetry but eliminates the load-balancing benefit. The correct approach is to make the return path aware of the same distribution logic.",
        },
        {
          id: "r3",
          text: "Session synchronization between firewalls is a valid alternative but adds complexity, licensing cost, and introduces synchronization latency. Fixing the routing is the cleaner solution.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The PBR on core-sw1 distributes traffic across both firewalls, but dmz-gw only routes return traffic through fw-primary. ECMP with consistent hashing on dmz-gw ensures symmetric paths.",
        partial:
          "Your approach would work but is not optimal. The ideal solution maintains load balancing while ensuring symmetric paths through consistent hashing.",
        wrong:
          "The PBR on core-sw1 splits outbound traffic across two firewalls, but dmz-gw routes all return traffic through fw-primary only. This mismatch causes half of sessions to be dropped by the firewall that never saw the initial SYN.",
      },
    },
    {
      type: "investigate-decide",
      id: "vrrp-asymmetric-failback",
      title: "VRRP Failback Causes Established Sessions to Break",
      objective:
        "After a brief outage on the primary gateway, VRRP failed over to the backup. When the primary recovered, VRRP failed back and existing sessions started dropping. Investigate why established connections broke after failback.",
      investigationData: [
        {
          id: "vrrp-status",
          label: "show vrrp brief on both routers",
          content:
            "fw-primary# show vrrp brief\nInterface   Grp  A-F Pri  Time Own Pre State   Master addr/Group addr\nEth1/1      1    AFV 120  3218      Y   Master  10.10.10.1\n\nfw-secondary# show vrrp brief\nInterface   Grp  A-F Pri  Time Own Pre State   Master addr/Group addr\nEth1/1      1    AFV 100  3609      Y   Backup  10.10.10.1",
          isCritical: true,
        },
        {
          id: "session-table-primary",
          label: "show session table on fw-primary after failback",
          content:
            "admin@fw-primary> show session all\n\nTotal sessions: 23\n\nNote: Only 23 new sessions since failback. The ~4500 sessions that were\nactive during the failover period are NOT present in fw-primary's table.\nThose sessions were created on fw-secondary during the outage window.",
          isCritical: true,
        },
        {
          id: "session-table-secondary",
          label: "show session table on fw-secondary after failback",
          content:
            "admin@fw-secondary> show session all\n\nTotal sessions: 4487\n\nNote: fw-secondary still holds state for all sessions created during the\nfailover window, but traffic for these sessions is now arriving at\nfw-primary (the new VRRP master) which has no matching state entries.",
        },
        {
          id: "syslog-drops",
          label: "tail -f /var/log/traffic.log on fw-primary",
          content:
            "2026-03-28T14:22:01 TRAFFIC DROP src=10.10.10.85 dst=172.16.1.50 proto=TCP sport=44120 dport=443 reason=\"no matching session\"\n2026-03-28T14:22:01 TRAFFIC DROP src=10.10.10.112 dst=172.16.1.50 proto=TCP sport=52340 dport=8080 reason=\"no matching session\"\n2026-03-28T14:22:02 TRAFFIC DROP src=10.10.10.67 dst=172.16.1.25 proto=TCP sport=39871 dport=22 reason=\"no matching session\"\n... (hundreds of similar entries per second)",
        },
      ],
      actions: [
        {
          id: "enable-preempt-delay",
          label: "Configure VRRP preempt delay and enable session sync between firewalls",
          color: "green",
        },
        {
          id: "disable-preempt",
          label: "Disable VRRP preemption so the backup remains master after failover",
          color: "yellow",
        },
        {
          id: "clear-sessions-secondary",
          label: "Clear all sessions on fw-secondary to force clients to reconnect",
          color: "orange",
        },
        {
          id: "reduce-vrrp-priority",
          label: "Lower fw-primary VRRP priority below fw-secondary",
          color: "red",
        },
      ],
      correctActionId: "enable-preempt-delay",
      rationales: [
        {
          id: "r1",
          text: "VRRP preempt delay gives time for session state to synchronize from fw-secondary to fw-primary before failback completes. Combined with active session sync, fw-primary will have all session entries when it becomes master, preventing drops.",
        },
        {
          id: "r2",
          text: "Disabling preemption avoids the immediate problem but means the higher-capacity primary firewall stays as backup permanently. This is a workaround, not a solution.",
        },
        {
          id: "r3",
          text: "Clearing sessions on the secondary forces all 4500+ users to re-establish connections, causing a service disruption. Session sync is the correct approach.",
        },
        {
          id: "r4",
          text: "Lowering the primary's priority permanently delegates mastership to the secondary, which defeats the purpose of having a higher-spec primary firewall.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! VRRP preempt delay combined with session state synchronization ensures that fw-primary has all active session entries before it resumes the master role, preventing drops of established connections.",
        partial:
          "Your approach addresses the symptom but not the root cause. The best solution uses preempt delay with session synchronization so failback is seamless.",
        wrong:
          "When VRRP fails back to the primary, sessions created on the secondary are unknown to the primary. Session state synchronization and preempt delay prevent this disruption.",
      },
    },
  ],
  hints: [
    "Compare the forward and return paths using traceroute from both endpoints. If they traverse different firewalls, you have asymmetric routing.",
    "Stateful firewalls require both directions of a flow to pass through the same device. Check session tables on both firewalls to confirm which one is dropping traffic.",
    "VRRP/HSRP failback without session synchronization causes established sessions to break because the new master has no state for flows created during the failover window.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "Asymmetric routing through stateful firewalls is one of the most common and difficult-to-diagnose issues in enterprise networks with redundant security appliances. Mastering this topic is essential for senior network and security engineers.",
  toolRelevance: [
    "Palo Alto PAN-OS CLI",
    "Cisco IOS / NX-OS",
    "Wireshark",
    "traceroute / mtr",
    "SNMP flow monitoring",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
