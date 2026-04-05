import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "hsrp-failover-analysis",
  version: 1,
  title: "Analyze HSRP Failover Events",

  tier: "intermediate",
  track: "routing-switching",
  difficulty: "moderate",
  accessLevel: "premium",
  tags: ["hsrp", "fhrp", "redundancy", "failover"],

  description:
    "Investigate HSRP failover events to understand priority, preemption, tracking, and virtual IP configuration issues in first-hop redundancy scenarios.",
  estimatedMinutes: 14,
  learningObjectives: [
    "Interpret HSRP state transitions and priority/preemption behavior",
    "Diagnose virtual IP and group number mismatches",
    "Configure interface tracking to trigger automatic failover",
  ],
  sortOrder: 211,

  status: "published",
  prerequisites: [],

  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "no-preempt",
      title: "Primary Router Not Reclaiming Active Role",
      objective:
        "Router1 (priority 110) had an interface flap and lost HSRP active status. Router2 (priority 100) took over. Router1 is back up but is stuck in standby state. Users report suboptimal routing.",
      investigationData: [
        {
          id: "show-hsrp-r1",
          label: "show standby brief (Router1)",
          content:
            "Interface   Grp  Pri P State    Active          Standby         Virtual IP\nVl10        1    110   Standby  192.168.10.3    local           192.168.10.1",
          isCritical: true,
        },
        {
          id: "show-hsrp-r2",
          label: "show standby brief (Router2)",
          content:
            "Interface   Grp  Pri P State    Active          Standby         Virtual IP\nVl10        1    100   Active   local           192.168.10.2    192.168.10.1",
        },
        {
          id: "show-run-r1",
          label: "show run int Vlan10 (Router1)",
          content:
            "interface Vlan10\n ip address 192.168.10.2 255.255.255.0\n standby 1 ip 192.168.10.1\n standby 1 priority 110\n no standby 1 preempt",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "enable-preempt",
          label: "Enable preemption on Router1: standby 1 preempt",
          color: "green",
        },
        {
          id: "reboot-r2",
          label: "Reboot Router2 to force failback",
          color: "red",
        },
        {
          id: "increase-priority",
          label: "Increase Router1 priority to 200",
          color: "yellow",
        },
        {
          id: "clear-standby",
          label: "Clear the standby process on Router1",
          color: "orange",
        },
      ],
      correctActionId: "enable-preempt",
      rationales: [
        {
          id: "r1",
          text: "Without 'standby preempt', a higher-priority router cannot reclaim active status after recovering. The 'P' column in show standby brief is empty, confirming preempt is disabled.",
        },
        {
          id: "r2",
          text: "Rebooting Router2 would temporarily restore Router1 as active, but without preemption enabled, the same problem recurs on the next failover.",
        },
        {
          id: "r3",
          text: "Increasing priority does not help without preemption. A higher priority only matters during an election if the router is willing to preempt.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The 'standby 1 preempt' command allows Router1 to reclaim the active role when it comes back with a higher priority.",
        partial:
          "You're addressing the symptom but not the root cause. Without preemption enabled, higher priority alone cannot reclaim the active state.",
        wrong:
          "HSRP preemption must be explicitly enabled. Without it, the current active router stays active regardless of priority until it fails.",
      },
    },
    {
      type: "investigate-decide",
      id: "vip-mismatch",
      title: "HSRP Virtual IP Mismatch",
      objective:
        "Some hosts on VLAN 20 cannot reach the gateway while others can. Both Router1 and Router2 are running HSRP on VLAN 20. Investigate the HSRP configuration.",
      investigationData: [
        {
          id: "show-hsrp-r1",
          label: "show standby Vlan20 (Router1)",
          content:
            "Vlan20 - Group 2\n  State is Active\n  Virtual IP address is 172.16.20.1\n  Active virtual MAC address is 0000.0c07.ac02\n  Local virtual MAC address is 0000.0c07.ac02\n  Hello time 3 sec, hold time 10 sec\n  Priority 110\n  Preemption enabled",
          isCritical: true,
        },
        {
          id: "show-hsrp-r2",
          label: "show standby Vlan20 (Router2)",
          content:
            "Vlan20 - Group 2\n  State is Active\n  Virtual IP address is 172.16.20.254\n  Active virtual MAC address is 0000.0c07.ac02\n  Local virtual MAC address is 0000.0c07.ac02\n  Hello time 3 sec, hold time 10 sec\n  Priority 100\n  Preemption enabled",
          isCritical: true,
        },
        {
          id: "host-config",
          label: "Host Default Gateway Configuration",
          content:
            "Hosts configured via DHCP:\n  Default Gateway: 172.16.20.1\n  Some manually configured hosts: 172.16.20.254",
        },
      ],
      actions: [
        {
          id: "fix-vip-r2",
          label: "Change Router2 VIP to 172.16.20.1 to match Router1",
          color: "green",
        },
        {
          id: "fix-vip-r1",
          label: "Change Router1 VIP to 172.16.20.254 to match Router2",
          color: "yellow",
        },
        {
          id: "different-groups",
          label: "Put Router2 in a different HSRP group",
          color: "red",
        },
        {
          id: "reconfigure-dhcp",
          label: "Change DHCP gateway to 172.16.20.254",
          color: "orange",
        },
      ],
      correctActionId: "fix-vip-r2",
      rationales: [
        {
          id: "r1",
          text: "Both routers are in Group 2 but have different virtual IPs, which means they both think they are active independently. Router2 must use 172.16.20.1 to match Router1 and DHCP.",
        },
        {
          id: "r2",
          text: "Changing Router1's VIP would require updating DHCP and all manual configs. Since DHCP already uses .1, fixing Router2 to match is less disruptive.",
        },
        {
          id: "r3",
          text: "Different groups would create two separate HSRP instances, which does not solve the redundancy problem for a single gateway address.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The VIP mismatch causes both routers to claim active in the same group. Matching the VIPs to 172.16.20.1 (consistent with DHCP) fixes the split-brain.",
        partial:
          "You identified the VIP mismatch but consider which VIP aligns with the DHCP configuration to minimize client disruption.",
        wrong:
          "All HSRP routers in the same group must share the same virtual IP. A mismatch causes a split-brain where both routers think they are active.",
      },
    },
    {
      type: "investigate-decide",
      id: "tracking-config",
      title: "HSRP Not Failing Over on Uplink Loss",
      objective:
        "Router1 is the HSRP active router for VLAN 10. Its uplink to the core (Gi0/0) went down, but HSRP did not fail over to Router2. Users lost internet access.",
      investigationData: [
        {
          id: "show-hsrp",
          label: "show standby Vlan10 (Router1)",
          content:
            "Vlan10 - Group 1\n  State is Active\n  Virtual IP address is 10.1.10.1\n  Priority 110 (configured 110)\n  Preemption enabled\n  Track object 1 state Down decrement 5",
          isCritical: true,
        },
        {
          id: "show-track",
          label: "show track (Router1)",
          content:
            "Track 1\n  Interface GigabitEthernet0/0 line-protocol\n  Line protocol is Down (hw down)\n  1 change, last change 00:02:15\n  Tracked by:\n    HSRP Vlan10 1",
        },
        {
          id: "show-hsrp-r2",
          label: "show standby Vlan10 brief (Router2)",
          content:
            "Interface   Grp  Pri P State    Active          Standby         Virtual IP\nVl10        1    100 P Standby  10.1.10.2       local           10.1.10.1",
          isCritical: true,
        },
      ],
      actions: [
        {
          id: "increase-decrement",
          label: "Increase tracking decrement to at least 11",
          color: "green",
        },
        {
          id: "add-second-track",
          label: "Add a second track object for the internet link",
          color: "yellow",
        },
        {
          id: "lower-r2-priority",
          label: "Lower Router2 priority to 90",
          color: "red",
        },
        {
          id: "manual-failover",
          label: "Manually set Router1 to standby mode",
          color: "orange",
        },
      ],
      correctActionId: "increase-decrement",
      rationales: [
        {
          id: "r1",
          text: "Router1 priority is 110, decrement is only 5. After tracking: 110 - 5 = 105, which is still higher than Router2's 100. The decrement must be > 10 (e.g., 15 or 20) to drop below 100.",
        },
        {
          id: "r2",
          text: "A second track object would add more monitoring but does not fix the current issue. The decrement is too small to trigger a failover.",
        },
        {
          id: "r3",
          text: "Lowering Router2 priority would make the problem worse. It needs to be HIGHER than Router1's decremented priority.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Exactly! The decrement of 5 reduces Router1's priority to 105, which is still above Router2's 100. Setting it to 11 or higher makes Router1's effective priority < 100, triggering failover.",
        partial:
          "You see the tracking problem. Calculate: Router1 priority (110) - decrement (5) = 105. This must drop below Router2's priority (100) to trigger failover.",
        wrong:
          "HSRP tracking decrements the active router's priority when a tracked object goes down. The decremented priority must fall below the standby router's priority.",
      },
    },
  ],
  hints: [
    "HSRP preemption must be explicitly enabled for a higher-priority router to reclaim the active role after recovery.",
    "All HSRP routers in the same group must have the same virtual IP address. A mismatch causes both to become active independently.",
    "HSRP tracking decrement must be large enough to drop the active router's priority below the standby's priority for failover to occur.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "HSRP and other FHRPs provide gateway redundancy in enterprise networks. Understanding preemption and tracking is essential for maintaining high availability.",
  toolRelevance: [
    "Cisco IOS CLI",
    "Network monitoring (SNMP traps for HSRP state changes)",
    "Syslog analysis",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
