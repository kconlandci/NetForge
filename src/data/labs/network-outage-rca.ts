import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "network-outage-rca",
  version: 1,
  title: "Network Outage Root Cause Analysis",

  tier: "advanced",
  track: "network-troubleshooting",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: [
    "root-cause-analysis",
    "outage",
    "timeline",
    "log-analysis",
    "triage",
    "remediation",
  ],

  description:
    "Perform root cause analysis after a major network outage by correlating event timelines, syslog entries, and device state across the infrastructure.",
  estimatedMinutes: 30,
  learningObjectives: [
    "Build an outage timeline from correlated log entries across multiple devices",
    "Classify outage root causes by distinguishing symptoms from triggers",
    "Select appropriate remediation strategies that address root cause rather than symptoms",
    "Identify cascading failure patterns in redundant network architectures",
  ],
  sortOrder: 612,

  status: "published",
  prerequisites: [],

  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "spanning-tree-cascade",
      title: "Data Center Spanning Tree Meltdown After Firmware Upgrade",
      description:
        "At 02:15 AM, a scheduled firmware upgrade on agg-sw1 triggered a 45-minute data center outage affecting all production services. The upgrade was supposed to be non-disruptive. Analyze the timeline and logs to classify the root cause and determine the correct remediation.",
      evidence: [
        {
          type: "timeline",
          content:
            "02:15:00 - agg-sw1 firmware upgrade initiated (ISSU)\n02:15:12 - agg-sw1 supervisor switchover begins\n02:15:14 - agg-sw1 sends TC (Topology Change) BPDUs on all trunk ports\n02:15:15 - core-sw1 receives TC, flushes MAC table (248,000 entries cleared)\n02:15:15 - core-sw2 receives TC, flushes MAC table (251,000 entries cleared)\n02:15:16 - Broadcast storm detected: 2.1 Mpps on VLAN 100-110\n02:15:18 - agg-sw2 ports Gi1/0/1-48 transition to BLK (STP reconvergence)\n02:15:20 - All access switches lose uplink connectivity\n02:15:25 - Monitoring: 100% packet loss to all production servers\n02:30:00 - agg-sw1 firmware upgrade completes, switch rejoins STP domain\n02:45:00 - STP reconverges, broadcast storm subsides\n03:00:00 - Full connectivity restored after manual MAC table repopulation",
          icon: "clock",
        },
        {
          type: "log",
          content:
            "agg-sw1# show logging | include SPANTREE\n02:15:14 %SPANTREE-5-EXTENDED_SYSID: Extended SysId enabled for type vlan\n02:15:14 %SPANTREE-2-ROOTCHANGE: Root changed for vlan 100: New root port is Gi1/0/49\n02:15:14 %SPANTREE-2-ROOTCHANGE: Root changed for vlan 101: New root port is Gi1/0/49\n... (root changes on all 11 VLANs)\n\ncore-sw1# show logging | include MAC\n02:15:15 %L2FM-4-L2FM_MAC_FLUSH: Topology change; flushing MAC table VLAN 100-110",
          icon: "terminal",
        },
        {
          type: "config",
          content:
            "agg-sw1# show spanning-tree summary\nRoot bridge for: VLAN100, VLAN101, VLAN102, VLAN103, VLAN104,\n                 VLAN105, VLAN106, VLAN107, VLAN108, VLAN109, VLAN110\nSTP mode: PVST+ (not Rapid-PVST+)\nPortfast BPDU Guard: Disabled globally\nTopology Change Notification: Enabled\n\nNote: agg-sw1 is the STP root for ALL production VLANs.\nNo pre-upgrade STP isolation was performed.",
          icon: "settings",
        },
      ],
      classifications: [
        {
          id: "change-management-failure",
          label: "Change Management Process Failure",
          description:
            "The firmware upgrade was executed without proper STP impact analysis or pre-change isolation of the root bridge role.",
        },
        {
          id: "hardware-failure",
          label: "Hardware / Firmware Bug",
          description:
            "The ISSU process failed and caused an unexpected supervisor switchover that disrupted STP.",
        },
        {
          id: "stp-design-flaw",
          label: "STP Architecture Design Flaw",
          description:
            "Running legacy PVST+ with a single root bridge for all VLANs and no topology change suppression.",
        },
      ],
      correctClassificationId: "change-management-failure",
      remediations: [
        {
          id: "implement-pre-change-stp-isolation",
          label: "Mandate STP Root Migration Before Maintenance",
          description:
            "Before any maintenance on the STP root bridge, migrate root role to a secondary switch, verify convergence, then proceed with the upgrade.",
        },
        {
          id: "migrate-to-rpvst",
          label: "Migrate to Rapid-PVST+ and Enable Root Guard",
          description:
            "Upgrade STP mode to Rapid-PVST+ for faster convergence and enable root guard on non-root ports to prevent unplanned root changes.",
        },
        {
          id: "replace-firmware",
          label: "Roll Back Firmware and File Vendor Bug",
          description:
            "Revert agg-sw1 to previous firmware version and open a TAC case for the ISSU failure.",
        },
      ],
      correctRemediationId: "implement-pre-change-stp-isolation",
      rationales: [
        {
          id: "r1",
          text: "The root cause is that the change process did not account for agg-sw1 being the STP root for all VLANs. The supervisor switchover during ISSU sent Topology Change BPDUs that flushed MAC tables and triggered a broadcast storm. Pre-change STP root migration would have completely prevented this.",
        },
        {
          id: "r2",
          text: "While migrating to Rapid-PVST+ is a good long-term improvement, it does not address the immediate process gap. Even with RPVST+, upgrading the root bridge without isolation would still cause a topology change event.",
        },
        {
          id: "r3",
          text: "The firmware itself completed the upgrade successfully at 02:30. The issue was not a firmware bug but the STP topology disruption caused by the supervisor switchover, which is expected behavior during ISSU.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The outage was caused by upgrading the STP root bridge without first migrating the root role to another switch. The TC BPDUs from the supervisor switchover triggered MAC table flushes and a broadcast storm. This is a change management failure.",
        partial:
          "You identified a contributing factor, but the primary root cause is the change process: no one verified that agg-sw1 was the STP root before initiating the upgrade. STP root migration is the correct pre-change step.",
        wrong:
          "Review the timeline: agg-sw1 is the STP root for all VLANs. The supervisor switchover during ISSU sent TC BPDUs that caused a cascade. The fix is to mandate STP root migration before maintenance on root bridges.",
      },
    },
    {
      type: "triage-remediate",
      id: "bgp-route-leak",
      title: "WAN Outage Caused by BGP Route Leak from Branch Office",
      description:
        "At 10:42 AM, all branch offices lost connectivity to the data center for 22 minutes. The NOC identified that a branch router began advertising the data center's /16 prefix, causing a routing black hole. Analyze the evidence to classify and remediate.",
      evidence: [
        {
          type: "log",
          content:
            "core-rtr1# show ip bgp 10.100.0.0/16\nBGP routing table entry for 10.100.0.0/16\nPaths: (3 available, best #3)\n  Path 1: 65010 (from branch-02, AS 65010)\n    10.0.2.1 from 10.0.2.1 (10.0.2.1)\n    Origin IGP, metric 0, localpref 100, valid, external\n    Received: 10:42:15\n  Path 2: (aggregated by 65001 core-rtr1)\n    0.0.0.0 from 0.0.0.0 (10.100.0.1)\n    Origin IGP, metric 0, localpref 100, valid, sourced, atomic-aggregate\n  Path 3: 65010 (from branch-02, AS 65010)\n    10.0.2.1 from 10.0.2.1 (10.0.2.1)\n    Origin IGP, metric 0, localpref 200, valid, external, best\n    Community: 65001:999\n    Received: 10:42:15\n\n** Path 3 selected as best due to higher local-pref (200 vs 100) **",
          icon: "terminal",
        },
        {
          type: "config",
          content:
            "branch-02# show run | section router bgp\nrouter bgp 65010\n  network 10.0.2.0 mask 255.255.255.0\n  network 10.100.0.0 mask 255.255.0.0\n  neighbor 10.0.0.1 remote-as 65001\n  neighbor 10.0.0.1 route-map SET-COMMUNITY out\n\nroute-map SET-COMMUNITY permit 10\n  set community 65001:999\n  set local-preference 200\n\nNote: branch-02 is advertising 10.100.0.0/16 (data center prefix)\nwith high local-pref via a route-map that was misconfigured during\na change window.",
          icon: "settings",
        },
        {
          type: "impact",
          content:
            "Impact Assessment:\n- Duration: 22 minutes (10:42 - 11:04)\n- Affected: All 47 branch offices lost data center access\n- Traffic to 10.100.0.0/16 was routed to branch-02 (black hole)\n- branch-02 had no route to forward the traffic, causing drops\n- Resolved when NOC manually removed the network statement on branch-02",
          icon: "alert",
        },
      ],
      classifications: [
        {
          id: "config-error",
          label: "Configuration Error During Change Window",
          description:
            "A misconfigured network statement on branch-02 advertised the data center prefix, and the route-map applied high local-pref making it preferred.",
        },
        {
          id: "bgp-hijack",
          label: "BGP Route Hijacking / Security Incident",
          description:
            "An unauthorized BGP advertisement originated from branch-02, possibly indicating a compromise.",
        },
        {
          id: "route-redistribution-bug",
          label: "Route Redistribution Bug",
          description:
            "An unintended route redistribution leaked the data center prefix into branch-02's BGP table.",
        },
      ],
      correctClassificationId: "config-error",
      remediations: [
        {
          id: "implement-prefix-filters",
          label: "Deploy Inbound Prefix Filters on All Branch Peerings",
          description:
            "Configure prefix-lists on core routers that only accept each branch's legitimate prefixes, rejecting any unauthorized advertisements.",
        },
        {
          id: "enable-rpki",
          label: "Deploy RPKI Route Origin Validation",
          description:
            "Implement RPKI to cryptographically validate the origin AS for each prefix, rejecting invalid origins.",
        },
        {
          id: "add-max-prefix",
          label: "Set BGP Max-Prefix Limits on Branch Sessions",
          description:
            "Configure maximum prefix limits on BGP sessions to branches so the session drops if a branch advertises too many routes.",
        },
      ],
      correctRemediationId: "implement-prefix-filters",
      rationales: [
        {
          id: "r1",
          text: "The branch router was misconfigured to advertise 10.100.0.0/16 with a route-map that set local-pref 200, making it preferred over the legitimate aggregate. Inbound prefix filters on core routers would have rejected this unauthorized prefix immediately, preventing the outage entirely.",
        },
        {
          id: "r2",
          text: "RPKI validates origin AS for public prefixes but is complex to deploy for internal (RFC 1918) address space. Prefix filters are simpler, more effective for this use case, and can be deployed immediately.",
        },
        {
          id: "r3",
          text: "Max-prefix limits would not have helped here because branch-02 only advertised 2 prefixes (its legitimate /24 plus the leaked /16). The limit would need to be set to 1, which is fragile.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! A misconfigured network statement on branch-02 leaked the data center /16 with high local-pref. Inbound prefix filters on core routers are the standard defense against route leaks from branch offices.",
        partial:
          "You identified a valid mitigation, but prefix filters are the most direct and effective remediation for preventing branch routers from advertising unauthorized prefixes.",
        wrong:
          "The evidence shows branch-02 advertised 10.100.0.0/16 due to a configuration error. The route-map gave it local-pref 200, making it preferred. Inbound prefix filters on the core would have blocked this immediately.",
      },
    },
    {
      type: "triage-remediate",
      id: "power-cascade-failure",
      title: "Cascading Failure After UPS Event in MDF",
      description:
        "At 03:22 AM, a UPS failure in the Main Distribution Frame (MDF) caused a cascading network failure that took 2 hours to fully resolve. Even after power was restored at 03:35, some network segments remained down. Analyze the evidence to identify the root cause and correct remediation.",
      evidence: [
        {
          type: "timeline",
          content:
            "03:22:00 - UPS-A in MDF fails, transfers to bypass (10ms interruption)\n03:22:00 - core-sw1, agg-sw1, agg-sw2 lose power (single PSU, connected to UPS-A)\n03:22:00 - core-sw2 remains online (dual PSU, UPS-A + UPS-B)\n03:22:01 - 340 SNMP traps: interface down on all core-sw1/agg-sw1/agg-sw2 ports\n03:22:03 - OSPF adjacencies torn down, full SPF recalculation on core-sw2\n03:22:05 - HSRP failover: core-sw2 becomes active for all VLANs\n03:22:10 - 50% of access switches reconnect via surviving uplinks to core-sw2\n03:35:00 - UPS-A repaired, power restored to MDF\n03:35:05 - core-sw1, agg-sw1, agg-sw2 begin boot sequence\n03:42:00 - agg-sw1 boot complete, ports come up in STP forwarding\n03:42:02 - Temporary loop detected on VLAN 50-60, STP reconverges\n03:55:00 - agg-sw2 boot complete with factory default config (NVRAM corruption)\n03:55:01 - agg-sw2 begins flooding traffic on all ports, no VLANs configured\n04:10:00 - NOC notices agg-sw2 issue, manually shuts down all ports\n05:22:00 - agg-sw2 reconfigured from backup, full service restored",
          icon: "clock",
        },
        {
          type: "config",
          content:
            "Power Supply Audit (post-incident):\n\nDevice      PSU-A     PSU-B     UPS-A   UPS-B   Power Redundancy\n----------  --------  --------  ------  ------  ----------------\ncore-sw1    Installed Empty     Yes     No      NONE\ncore-sw2    Installed Installed Yes     Yes     Full (A+B)\nagg-sw1     Installed Empty     Yes     No      NONE\nagg-sw2     Installed Empty     Yes     No      NONE\n\nNote: 3 of 4 critical switches have single PSU with no power redundancy.\nAll three are connected only to UPS-A.",
          icon: "settings",
        },
        {
          type: "log",
          content:
            "agg-sw2# (after reboot)\n%PLATFORM-2-PFM_SYSTEM_RESET: System reset due to power failure\n%NVRAM-4-CORRUPTION: NVRAM contents invalid, loading factory defaults\n%SYS-5-CONFIG_I: Configured from memory by console\n\nNote: NVRAM corruption likely caused by unclean power loss.\nNo automated config restore was in place.",
          icon: "terminal",
        },
      ],
      classifications: [
        {
          id: "power-redundancy-gap",
          label: "Infrastructure Power Redundancy Gap",
          description:
            "Critical network devices lacked power supply redundancy and were connected to a single UPS, creating a single point of failure.",
        },
        {
          id: "ups-hardware-failure",
          label: "UPS Hardware Failure",
          description:
            "The UPS-A unit failed, which is the primary cause of the outage.",
        },
        {
          id: "config-backup-failure",
          label: "Configuration Backup Process Failure",
          description:
            "The NVRAM corruption on agg-sw2 and lack of automated config restore extended the outage.",
        },
      ],
      correctClassificationId: "power-redundancy-gap",
      remediations: [
        {
          id: "dual-psu-dual-ups",
          label: "Install Dual PSUs and Connect to Separate UPS/Power Feeds",
          description:
            "Install second power supplies in all critical switches and connect PSU-A to UPS-A and PSU-B to UPS-B to eliminate single points of failure.",
        },
        {
          id: "replace-ups",
          label: "Replace UPS-A with Higher-Capacity Unit",
          description:
            "Replace the failed UPS-A with a more reliable, higher-capacity model to prevent future failures.",
        },
        {
          id: "automated-config-restore",
          label: "Implement Automated Configuration Restore on Boot",
          description:
            "Configure switches to pull their configuration from a TFTP/SCP server on boot if NVRAM is empty, using Cisco's resilient configuration feature.",
        },
      ],
      correctRemediationId: "dual-psu-dual-ups",
      rationales: [
        {
          id: "r1",
          text: "The root cause is that 3 of 4 critical switches had single PSUs connected to one UPS. A 10ms power interruption should not take down production infrastructure. Dual PSUs on separate UPS feeds provide true power redundancy and would have prevented the entire cascading failure.",
        },
        {
          id: "r2",
          text: "Replacing the UPS does not address the fundamental design flaw: single PSU devices connected to a single power source. Any UPS can fail. True redundancy requires dual PSUs on independent power feeds.",
        },
        {
          id: "r3",
          text: "Automated config restore is a good secondary measure that would have shortened the recovery time for agg-sw2, but it does not prevent the initial outage caused by the power redundancy gap.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The root cause is a power redundancy design flaw: critical switches with single PSUs on a single UPS. Installing dual PSUs connected to independent UPS feeds eliminates the single point of failure that caused the entire cascade.",
        partial:
          "You identified a contributing factor, but the primary root cause is the power redundancy gap. Three critical switches had single PSUs on one UPS — that is the single point of failure that must be eliminated first.",
        wrong:
          "The audit shows 3 of 4 critical switches have single PSUs connected only to UPS-A. When UPS-A failed, these switches lost power immediately. Dual PSUs on separate UPS feeds would have prevented the entire outage.",
      },
    },
  ],
  hints: [
    "In post-outage RCA, build a precise timeline first. The event that started the cascade is often different from the event that made it severe.",
    "When analyzing BGP route leaks, check both the network statements and any route-maps that modify attributes like local-preference, which can make a leaked route preferred.",
    "For infrastructure failures, look for single points of failure in power, cooling, and physical connectivity. Redundancy that shares a common dependency is not true redundancy.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "Root cause analysis is a core competency for network architects and operations leads. The ability to distinguish symptoms from root causes, and to recommend remediations that prevent recurrence rather than just treating symptoms, is what defines senior-level engineering.",
  toolRelevance: [
    "Syslog aggregation (Splunk, ELK Stack)",
    "SNMP monitoring platforms",
    "Cisco IOS / NX-OS CLI",
    "Network configuration management (RANCID, Oxidized)",
    "Incident management (PagerDuty, ServiceNow)",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
