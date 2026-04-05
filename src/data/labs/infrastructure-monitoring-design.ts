import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "infrastructure-monitoring-design",
  version: 1,
  title: "Infrastructure Monitoring Stack Design",
  tier: "advanced",
  track: "network-services",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["monitoring", "observability", "prometheus", "grafana", "alerting", "siem"],
  description:
    "Design a comprehensive network monitoring stack by triaging monitoring requirements and selecting appropriate tools, metrics, and alerting strategies.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Design a monitoring architecture covering network, application, and security telemetry",
    "Select appropriate monitoring tools and data collection methods for different requirements",
    "Implement effective alerting strategies that minimize false positives and alert fatigue",
  ],
  sortOrder: 514,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "mon-001",
      title: "Alert Storm During Maintenance",
      description:
        "The NOC received 2,400 alerts in 30 minutes during a scheduled core router maintenance. Engineers could not identify real issues among the noise. The alerting system needs to be redesigned to prevent alert storms.",
      evidence: [
        {
          type: "metrics",
          content:
            "Alert breakdown during maintenance:\n- 800 alerts: Interface down on core router (expected)\n- 600 alerts: BGP neighbor down (cascading from core)\n- 400 alerts: OSPF adjacency lost (cascading from core)\n- 300 alerts: Ping failures to downstream devices (cascading)\n- 200 alerts: Application timeouts (cascading)\n- 100 alerts: Actual unrelated issues on other devices\n\nTotal: 2,400 alerts, 2,300 cascading from one planned event",
        },
        {
          type: "log",
          content:
            "Current alerting rules:\n- Every interface state change generates an individual alert\n- No maintenance windows defined in monitoring system\n- No alert correlation or deduplication\n- No dependency mapping between devices\n- All alerts have the same severity (Critical)\n- No alert grouping or suppression rules",
        },
        {
          type: "cli-output",
          content:
            "NOC feedback:\n- Cannot distinguish real issues from cascading alerts\n- Average 500 alerts/day normally, team reviews ~50\n- Alert fatigue has caused real incidents to be missed\n- 96% of alerts are never acknowledged or investigated",
        },
      ],
      classifications: [
        { id: "c1", label: "Missing Alert Correlation and Suppression", description: "No dependency-based alert suppression or maintenance window handling" },
        { id: "c2", label: "Insufficient Monitoring Coverage", description: "Not enough devices or metrics are being monitored" },
        { id: "c3", label: "Wrong Monitoring Tool", description: "The current monitoring platform lacks required features" },
        { id: "c4", label: "Alert Threshold Misconfiguration", description: "Alert thresholds are set too sensitively" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem-1", label: "Implement alert correlation, dependency mapping, maintenance windows, and severity tiers", description: "Add topology-aware alert suppression, schedule-based muting, parent-child correlation, and tiered severity levels" },
        { id: "rem-2", label: "Reduce the number of monitored interfaces to critical ones only", description: "Monitor fewer things to reduce alert volume" },
        { id: "rem-3", label: "Increase all alert thresholds to reduce sensitivity", description: "Make alerts less sensitive so fewer fire" },
        { id: "rem-4", label: "Add more NOC staff to handle the alert volume", description: "Scale the team to match the alert output" },
      ],
      correctRemediationId: "rem-1",
      rationales: [
        {
          id: "r1",
          text: "The root cause is that 2,300 of 2,400 alerts cascaded from a single planned event. Implementing dependency mapping suppresses child alerts when a parent device is down. Maintenance windows mute expected alerts during planned work. Severity tiers ensure only actionable alerts demand immediate attention. Alert correlation groups related events into a single incident.",
        },
        {
          id: "r2",
          text: "Reducing monitoring coverage creates blind spots. The issue is not too many things being monitored but too many alerts being generated without intelligence. Smart correlation maintains visibility while dramatically reducing noise.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! Alert correlation with dependency mapping, maintenance windows, and severity tiers transforms 2,400 alerts into a handful of actionable incidents. This is the hallmark of mature monitoring.",
        partial:
          "The core issue is alert intelligence, not alert volume. Dependency mapping, correlation, and maintenance windows would have reduced 2,400 alerts to ~100 actionable notifications during this event.",
        wrong:
          "2,300 cascading alerts from one event indicates missing alert correlation. Implement dependency mapping (suppress child alerts), maintenance windows (mute planned changes), and severity tiers (prioritize actionable alerts).",
      },
    },
    {
      type: "triage-remediate",
      id: "mon-002",
      title: "Monitoring Blind Spot: WAN Performance",
      description:
        "Users report slow application performance at branch offices, but the monitoring system shows all devices as green/healthy. The current monitoring only checks device availability (ping) and CPU/memory utilization.",
      evidence: [
        {
          type: "metrics",
          content:
            "Current monitoring coverage:\n  Device availability (ICMP ping): 100% up\n  CPU utilization: All devices < 40%\n  Memory utilization: All devices < 60%\n  Interface errors: 0 on all WAN interfaces\n\nUser complaints:\n  Branch A: SAP transactions taking 15 seconds (normally 2 seconds)\n  Branch B: Video calls dropping every 10 minutes\n  Branch C: File transfers at 10% of expected speed",
        },
        {
          type: "network",
          content:
            "Missing metrics (not currently collected):\n  - WAN link utilization (bandwidth consumption)\n  - Latency between sites (RTT measurements)\n  - Jitter on WAN paths\n  - Packet loss rate on WAN interfaces\n  - Application response time\n  - TCP retransmission rates\n  - QoS queue drops per class",
          icon: "dashboard",
        },
        {
          type: "log",
          content:
            "Investigation findings:\n  Branch A WAN: 95% utilized (10 Mbps link saturated)\n  Branch B WAN: Jitter spikes to 80ms during business hours\n  Branch C WAN: 2% packet loss causing TCP window collapse\n\nNone of these conditions trigger alerts because the metrics are not monitored.",
        },
      ],
      classifications: [
        { id: "c1", label: "Insufficient Performance Metrics Collection", description: "Monitoring only tracks availability, not performance. Key WAN metrics are not collected." },
        { id: "c2", label: "Alert Threshold Too High", description: "Existing thresholds are not sensitive enough to detect degradation" },
        { id: "c3", label: "Device Monitoring Gap", description: "Some network devices are not being monitored at all" },
        { id: "c4", label: "User Perception Issue", description: "Network is fine but application servers are slow" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem-1", label: "Deploy IP SLA probes for latency/jitter/loss and add SNMP polling for interface utilization and QoS queue metrics", description: "Add active probes between sites and poll WAN performance counters to detect degradation before users notice" },
        { id: "rem-2", label: "Upgrade all WAN links to higher bandwidth", description: "Increase bandwidth to prevent saturation" },
        { id: "rem-3", label: "Deploy packet capture on all WAN interfaces", description: "Capture all WAN traffic for analysis" },
        { id: "rem-4", label: "Add more frequent ping checks to detect outages faster", description: "Increase ping polling interval from 5 minutes to 30 seconds" },
      ],
      correctRemediationId: "rem-1",
      rationales: [
        {
          id: "r1",
          text: "The monitoring gap is the absence of WAN performance metrics. IP SLA probes actively measure latency, jitter, and packet loss between sites. SNMP polling of interface utilization and QoS counters provides passive monitoring of bandwidth consumption and queue drops. Together, these metrics detect the exact conditions causing user complaints: saturation, jitter, and packet loss.",
        },
        {
          id: "r2",
          text: "Upgrading bandwidth would fix Branch A's saturation but not Branch B's jitter or Branch C's packet loss. More frequent ping checks only detect outages, not performance degradation. The fundamental issue is not collecting the right metrics.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Perfect! IP SLA probes (active) and SNMP interface/QoS polling (passive) fill the monitoring blind spot. These metrics directly detect the saturation, jitter, and packet loss causing user complaints.",
        partial:
          "The monitoring system needs performance metrics, not just availability. IP SLA probes measure path quality while SNMP polling tracks utilization and queue drops.",
        wrong:
          "Ping-only monitoring misses performance degradation. Add IP SLA probes for latency/jitter/loss measurement and SNMP polling for interface utilization and QoS queue counters to detect WAN performance issues.",
      },
    },
    {
      type: "triage-remediate",
      id: "mon-003",
      title: "Log Management Architecture Scaling",
      description:
        "The centralized syslog server is dropping messages under load. The 500 GB disk fills up every 3 days, and searching through logs takes over 10 minutes. The security team needs 90-day log retention for compliance.",
      evidence: [
        {
          type: "metrics",
          content:
            "Current state:\n  Log volume: 180 GB/day from 500 network devices\n  Storage: Single 500 GB disk (fills in ~3 days)\n  Retention: Only 2.5 days before overwrite\n  Search speed: 10+ minutes for simple queries\n  Ingestion drops: 15% during peak hours\n\nCompliance requirement: 90 days retention = ~16 TB storage needed",
        },
        {
          type: "log",
          content:
            "Current architecture:\n  rsyslog on a single server with flat file storage\n  No indexing or structured log parsing\n  Manual grep-based searching\n  No redundancy or high availability\n  No log enrichment or normalization",
        },
        {
          type: "network",
          content:
            "Requirements:\n  - Handle 180 GB/day sustained ingestion with no drops\n  - 90-day searchable retention\n  - Sub-10-second search response time\n  - Real-time dashboards for NOC\n  - Alert on log patterns (failed logins, config changes)\n  - Role-based access to log data\n\nBudget: Approved for infrastructure upgrade, prefer open-source stack",
          icon: "storage",
        },
      ],
      classifications: [
        { id: "c1", label: "Undersized Log Infrastructure", description: "Current single-server architecture cannot handle the volume, retention, or search requirements" },
        { id: "c2", label: "Log Format Issue", description: "Unstructured log format causing search performance problems" },
        { id: "c3", label: "Network Bandwidth Limitation", description: "Network cannot transport the log volume to the central server" },
        { id: "c4", label: "Too Many Log Sources", description: "500 devices generating too much data that needs to be reduced" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem-1", label: "Deploy an ELK stack (Elasticsearch, Logstash, Kibana) cluster with tiered storage", description: "Multi-node Elasticsearch cluster with hot/warm/cold storage tiers for 90-day retention, Logstash for parsing, and Kibana for dashboards and alerting" },
        { id: "rem-2", label: "Add more disk space to the existing rsyslog server", description: "Expand storage to 20 TB and keep the current flat-file architecture" },
        { id: "rem-3", label: "Reduce log verbosity on all devices to decrease volume", description: "Lower syslog severity levels to reduce the amount of data collected" },
        { id: "rem-4", label: "Rotate logs faster and archive to tape storage", description: "Compress old logs and move to offline tape for compliance retention" },
      ],
      correctRemediationId: "rem-1",
      rationales: [
        {
          id: "r1",
          text: "An ELK cluster addresses all requirements: Elasticsearch provides distributed indexing for sub-second searches, Logstash normalizes and enriches logs, and Kibana delivers real-time dashboards with alerting. Tiered storage (hot/warm/cold) optimizes costs for 90-day retention by moving older data to cheaper storage while keeping it searchable. The cluster architecture handles 180 GB/day without drops.",
        },
        {
          id: "r2",
          text: "Simply adding disk space does not fix search performance (grep on flat files), ingestion drops, or provide dashboards and alerting. The architecture itself needs to change from single-server flat files to a distributed, indexed log management platform.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! An ELK cluster with tiered storage solves all requirements: high-volume ingestion, 90-day retention, fast searches, real-time dashboards, and alerting. This is the standard open-source log management architecture.",
        partial:
          "The single-server rsyslog approach cannot meet the requirements regardless of disk size. A distributed log management platform like ELK provides indexing, dashboards, and tiered retention.",
        wrong:
          "Deploy an ELK stack: Elasticsearch for indexed, searchable storage with tiered retention, Logstash for log parsing and enrichment, and Kibana for dashboards and alerting. This handles 180 GB/day with 90-day retention.",
      },
    },
  ],
  hints: [
    "Alert storms during maintenance indicate missing alert correlation and dependency mapping. Parent-child relationships suppress cascading alerts from a single root cause.",
    "Monitoring availability (ping) without performance metrics (utilization, latency, jitter, loss) creates blind spots. Both active probes and passive polling are needed.",
    "Flat-file log storage does not scale. Distributed indexed platforms (ELK, Splunk) provide fast search, dashboards, and tiered retention for enterprise log volumes.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Monitoring and observability design is a cornerstone of both network operations and SRE practices. Engineers who can design effective monitoring stacks, reduce alert fatigue, and implement actionable dashboards are critical for maintaining service reliability at scale.",
  toolRelevance: [
    "Prometheus/Grafana",
    "ELK Stack",
    "Zabbix/Nagios",
    "IP SLA",
    "SNMP polling",
    "PagerDuty/OpsGenie",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
