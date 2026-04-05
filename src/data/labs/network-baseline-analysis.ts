import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "network-baseline-analysis",
  version: 1,
  title: "Network Baseline Analysis",
  tier: "intermediate",
  track: "network-fundamentals",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["baseline", "monitoring", "performance", "snmp", "anomaly-detection"],
  description:
    "Analyze deviations from network performance baselines to identify emerging issues before they cause outages.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Interpret network baseline metrics and identify significant deviations",
    "Classify baseline deviations by severity and likely root cause",
    "Determine appropriate remediation for performance anomalies",
  ],
  sortOrder: 119,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "nba-001",
      title: "Gradual Bandwidth Utilization Increase",
      description:
        "Weekly monitoring reports show a steady increase in WAN bandwidth utilization over the past 3 months. The link has not hit capacity yet, but the trend projects exhaustion within 6 weeks.",
      evidence: [
        {
          type: "log",
          content:
            "WAN Link: 100Mbps committed rate\n\nMonthly average utilization (business hours):\nJanuary:   45% (45Mbps) - Baseline established\nFebruary:  58% (58Mbps) - +13% from baseline\nMarch:     72% (72Mbps) - +27% from baseline\nCurrent:   78% (78Mbps) - +33% from baseline\n\nPeak utilization: 92% (recorded Tuesday 2PM)\nBaseline deviation threshold: >20% is actionable",
        },
        {
          type: "log",
          content:
            "Traffic composition analysis:\nJanuary: Web 30%, Email 15%, File Transfer 20%, Video 10%, Other 25%\nCurrent: Web 25%, Email 10%, File Transfer 15%, Video 35%, Other 15%\n\nVideo conferencing traffic has grown from 10% to 35% of total bandwidth since the company expanded remote meeting usage.\nNumber of daily video conferences: January 15, Current: 85",
        },
      ],
      classifications: [
        { id: "c1", label: "Organic Growth From Increased Video Usage", description: "Legitimate business growth in video conferencing is driving the bandwidth increase. This is a capacity planning concern, not a fault." },
        { id: "c2", label: "Network Attack or Data Exfiltration", description: "The bandwidth increase could indicate unauthorized data transfer" },
        { id: "c3", label: "Application Misconfiguration", description: "Video conferencing codecs are set too high" },
        { id: "c4", label: "Routing Change Sending Extra Traffic Over WAN", description: "A routing change is directing traffic over this link that should go elsewhere" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Plan WAN bandwidth upgrade and implement QoS to protect critical traffic", description: "Begin the procurement process for increased bandwidth, and implement QoS policies to prioritize video and business-critical traffic during the interim period" },
        { id: "rem2", label: "Block video conferencing during peak hours", description: "Restrict video calls to off-peak hours to reduce utilization" },
        { id: "rem3", label: "Compress all WAN traffic with a WAN optimizer", description: "Deploy WAN optimization appliances to reduce bandwidth consumption" },
        { id: "rem4", label: "Reduce video quality settings company-wide", description: "Force all video calls to use lower resolution" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "The traffic composition analysis clearly shows legitimate video conferencing growth driving the increase. The dual approach of planning a bandwidth upgrade while implementing QoS addresses both the long-term capacity need and the short-term protection of critical traffic." },
        { id: "rat2", text: "Blocking video during business hours would disrupt the company's remote meeting workflow. QoS can protect other critical traffic while accommodating the increased video usage until bandwidth is upgraded." },
        { id: "rat3", text: "WAN optimization helps but may not be sufficient long-term. Real-time video is difficult to compress further. A bandwidth upgrade is the sustainable solution for genuine growth." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Excellent analysis! You correctly identified organic growth and proposed the balanced approach of long-term capacity planning with short-term QoS protection. This is proactive network management.",
        partial: "You identified part of the solution. Both capacity planning (bandwidth upgrade) and interim protection (QoS) are needed to handle the legitimate growth in video conferencing usage.",
        wrong: "The bandwidth increase is from legitimate video conferencing growth (10% to 35% of traffic). Plan a WAN upgrade and implement QoS to protect critical traffic in the interim.",
      },
    },
    {
      type: "triage-remediate",
      id: "nba-002",
      title: "Sudden Spike in Interface Errors",
      description:
        "A core switch uplink that normally shows zero errors suddenly started logging thousands of CRC errors overnight. No configuration changes were made.",
      evidence: [
        {
          type: "log",
          content:
            "Interface: TenGigabitEthernet1/0/49 (core uplink)\n\nError baseline (past 6 months): 0-5 CRC errors per day\nCurrent: 15,847 CRC errors in the last 8 hours\n\nSwitch# show interfaces TenGigabitEthernet1/0/49\n  Input errors: 15847, CRC: 15601, frame: 246\n  Output errors: 0\n  Speed: 10Gbps, Duplex: Full\n  SFP module: Cisco SFP-10G-SR (installed 2 years ago)\n  SFP temperature: 78C (warning threshold: 70C, critical: 85C)",
        },
        {
          type: "log",
          content:
            "Environmental monitoring:\nServer room temperature: 28C (baseline: 22C)\nCooling system alert: HVAC Unit 2 offline since 22:00 last night\n\nSFP DOM (Digital Optical Monitoring):\nTx Power: -2.5 dBm (normal: -2.0 dBm)\nRx Power: -8.2 dBm (normal: -4.0 dBm, warning: -7.0 dBm)\nTemperature: 78C (normal range: 20-65C)",
        },
      ],
      classifications: [
        { id: "c1", label: "SFP Module Overheating Due to HVAC Failure", description: "The failed cooling system raised room temperature, causing the SFP to overheat. The elevated temperature degrades optical signal quality, producing CRC errors." },
        { id: "c2", label: "Fiber Cable Damage", description: "The fiber optic cable was physically damaged" },
        { id: "c3", label: "Switch Software Bug", description: "A firmware issue is generating false error counts" },
        { id: "c4", label: "Electromagnetic Interference", description: "A new source of EMI is corrupting the signal" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Restore HVAC cooling and monitor SFP temperature until it returns to normal range", description: "Fix the root cause (HVAC failure) and monitor the SFP. If errors persist after temperature normalizes, replace the SFP module." },
        { id: "rem2", label: "Immediately replace the SFP module", description: "Swap the overheating SFP with a spare" },
        { id: "rem3", label: "Replace the fiber cable run", description: "Install new fiber between the switches" },
        { id: "rem4", label: "Upgrade to a higher-rated SFP module", description: "Install an SFP rated for higher operating temperatures" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "The HVAC failure caused the room temperature to rise from 22C to 28C, pushing the SFP to 78C (well above its 65C normal range). The degraded Rx power (-8.2 dBm vs normal -4.0 dBm) confirms heat-related optical degradation. Restoring cooling addresses the root cause." },
        { id: "rat2", text: "Replacing the SFP may provide temporary relief, but the new SFP will also overheat if the room temperature remains elevated. The HVAC must be fixed first to address the environmental root cause." },
        { id: "rat3", text: "The timeline correlation (HVAC failed at 22:00, errors started overnight) combined with the SFP DOM readings proving thermal degradation confirm this is a cooling issue, not a cable or software problem." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Perfect diagnosis! The correlation between HVAC failure, elevated room temperature, SFP overheating, and degraded optical power conclusively identifies the root cause. Restoring cooling is the correct first action.",
        partial: "You're on the right track. The SFP DOM readings show thermal stress, but the root cause is the HVAC failure. Fix the cooling first, then assess if the SFP needs replacement.",
        wrong: "The HVAC failure caused room temperature to rise, overheating the SFP module. The degraded optical power readings confirm heat-related signal degradation. Restore cooling as the primary fix.",
      },
    },
    {
      type: "triage-remediate",
      id: "nba-003",
      title: "Latency Increase on Critical Application Path",
      description:
        "Monitoring shows that latency to a cloud-hosted ERP application has increased from a baseline of 15ms to 85ms. Users report slow response times.",
      evidence: [
        {
          type: "log",
          content:
            "Latency baseline (past 12 months):\nAverage: 15ms\nP95: 22ms\nP99: 30ms\n\nCurrent measurements:\nAverage: 85ms (467% above baseline)\nP95: 120ms\nP99: 200ms\n\nLatency increase started at 14:00 yesterday.\nNo internal network changes in the past week.",
        },
        {
          type: "log",
          content:
            "Traceroute comparison:\nBaseline path (normal):\n1  10.1.1.1      1ms   (gateway)\n2  203.0.113.1   3ms   (ISP-A edge)\n3  198.51.100.5  8ms   (ISP-A core)\n4  192.0.2.10    12ms  (Cloud provider edge)\n5  10.100.1.5    15ms  (ERP server)\n\nCurrent path:\n1  10.1.1.1      1ms   (gateway)\n2  203.0.113.1   3ms   (ISP-A edge)\n3  198.51.100.5  8ms   (ISP-A core)\n4  172.16.50.1   45ms  (ISP-B transit - NEW HOP)\n5  172.16.51.1   65ms  (ISP-B core - NEW HOP)\n6  192.0.2.10    80ms  (Cloud provider edge)\n7  10.100.1.5    85ms  (ERP server)\n\nThe traffic path changed - now routing through ISP-B transit instead of directly to the cloud provider.",
        },
      ],
      classifications: [
        { id: "c1", label: "ISP Routing Change Adding Extra Hops", description: "ISP-A's BGP routing changed, sending traffic through ISP-B transit instead of the direct peering with the cloud provider. This adds 2 extra hops and 70ms of latency." },
        { id: "c2", label: "Cloud Provider Server Performance Issue", description: "The ERP server is overloaded and responding slowly" },
        { id: "c3", label: "Internal Network Congestion", description: "Local network links are congested causing delays" },
        { id: "c4", label: "DNS Resolution Delay", description: "DNS is taking longer to resolve the ERP application hostname" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Contact ISP-A about the routing change and request restoration of the direct peering path", description: "Engage ISP-A's NOC to investigate why the BGP route changed and request that the direct path to the cloud provider be restored" },
        { id: "rem2", label: "Switch to ISP-B as the primary provider", description: "Move all traffic to ISP-B since it now has the path" },
        { id: "rem3", label: "Upgrade the WAN link bandwidth", description: "Increase bandwidth to compensate for the added latency" },
        { id: "rem4", label: "Deploy a WAN accelerator for the ERP traffic", description: "Install WAN optimization to reduce the impact of increased latency" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "The traceroute comparison shows the path changed from a direct ISP-A to cloud provider peering (4 hops, 15ms) to ISP-A through ISP-B transit (6 hops, 85ms). Contacting ISP-A to restore the direct peering path addresses the root cause of the latency increase." },
        { id: "rat2", text: "Internal network hops (gateway at 1ms) are unchanged, confirming the problem is in the ISP transit path. Bandwidth upgrades or WAN acceleration cannot fix a suboptimal routing path - the extra hops add physical distance." },
        { id: "rat3", text: "The precise timestamp of when latency increased (14:00 yesterday) and the new traceroute hops through ISP-B transit prove this is a BGP routing change, not a server or application issue." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Excellent baseline analysis! Comparing the current traceroute against the baseline path immediately reveals the ISP routing change. Engaging the ISP to restore the direct peering is the correct action.",
        partial: "You identified the routing change. The key is comparing the current path against the baseline traceroute to see the extra hops through ISP-B transit adding 70ms.",
        wrong: "The ISP changed the BGP routing path, adding 2 hops through ISP-B transit instead of direct peering with the cloud provider. Contact ISP-A to investigate and restore the original direct path.",
      },
    },
  ],
  hints: [
    "Network baselines establish what 'normal' looks like. Deviations of more than 20% from baseline metrics warrant investigation. Track utilization, error rates, and latency over time.",
    "Compare current traceroute output against baseline traceroutes. New hops or missing hops indicate routing changes that can significantly affect performance.",
    "Correlate events across systems: a sudden spike in interface errors coinciding with an HVAC alert points to an environmental cause, not a network configuration issue.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Baseline analysis and trend monitoring are core skills for NOC engineers and capacity planners. Being able to predict issues before they cause outages is what distinguishes senior network engineers from reactive troubleshooters.",
  toolRelevance: ["SNMP/MRTG", "SolarWinds", "PRTG", "Nagios", "traceroute", "smokeping"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
