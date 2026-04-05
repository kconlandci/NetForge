import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "sd-wan-deployment",
  version: 1,
  title: "SD-WAN Deployment Strategy",
  tier: "advanced",
  track: "network-services",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["sd-wan", "wan-optimization", "overlay", "ipsec", "mpls"],
  description:
    "Plan SD-WAN deployment strategy including transport selection, overlay design, application-aware routing policies, and migration from traditional MPLS.",
  estimatedMinutes: 14,
  learningObjectives: [
    "Evaluate SD-WAN transport options and overlay tunnel design",
    "Design application-aware routing policies for business-critical traffic",
    "Plan a phased migration strategy from traditional MPLS to SD-WAN",
  ],
  sortOrder: 513,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "sdwan-001",
      title: "Transport Selection for Branch Offices",
      context:
        "The company has 50 branch offices currently connected via MPLS at $800/month per site for 10 Mbps. The SD-WAN migration plan needs to select the transport strategy. Each branch has access to business-class broadband (100 Mbps, $150/month) and 4G/LTE backup.\n\nCurrent WAN traffic profile:\n- Voice/Video (real-time): 3 Mbps per branch\n- Business applications (SAP, CRM): 4 Mbps per branch\n- Internet/SaaS (O365, Salesforce): 8 Mbps per branch (currently hairpinned through HQ)\n- Total demand: 15 Mbps (exceeds current 10 Mbps MPLS)\n\nBudget constraint: Reduce WAN costs by 40% minimum.",
      displayFields: [
        { label: "Current Cost", value: "$40,000/mo (50 sites x $800)", emphasis: "warn" },
        { label: "Target Cost", value: "$24,000/mo (40% reduction)", emphasis: "normal" },
        { label: "Current BW", value: "10 Mbps MPLS per site", emphasis: "normal" },
      ],
      actions: [
        { id: "a1", label: "Dual broadband with 4G/LTE backup, eliminate MPLS entirely", color: "blue" },
        { id: "a2", label: "Hybrid: keep MPLS for voice/video, add broadband for data and internet", color: "green" },
        { id: "a3", label: "Single broadband with 4G/LTE backup, no MPLS", color: "yellow" },
        { id: "a4", label: "Keep MPLS and add broadband for internet breakout only", color: "orange" },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "A hybrid approach keeps MPLS for latency-sensitive voice and video traffic (3 Mbps) while offloading data and SaaS traffic to broadband. This reduces MPLS to a smaller circuit (5 Mbps at ~$500/mo) and adds broadband ($150/mo) for a total of ~$650/site ($32,500 total), achieving a 19% cost reduction. With local internet breakout for SaaS, the total bandwidth per site exceeds 100 Mbps.",
        },
        {
          id: "r2",
          text: "Eliminating MPLS entirely saves the most money but risks voice and video quality on best-effort broadband. While SD-WAN can prioritize traffic, broadband lacks the SLA guarantees that MPLS provides for real-time traffic. A phased hybrid approach is lower risk.",
        },
        {
          id: "r3",
          text: "Keeping full MPLS and adding broadband only for internet breakout does not achieve the 40% cost reduction target. The MPLS circuit cost remains unchanged at $800/site plus the additional broadband cost.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The hybrid approach balances cost reduction with quality of service: MPLS guarantees voice/video quality while broadband handles bulk data and SaaS with local internet breakout. This is the most common real-world SD-WAN migration strategy.",
        partial:
          "Consider the tradeoff between cost savings and voice/video quality. A hybrid approach with downsized MPLS for real-time traffic and broadband for everything else balances both goals.",
        wrong:
          "The hybrid approach (downsized MPLS + broadband) is optimal: it maintains SLA-backed transport for real-time voice/video while broadband handles data and enables local SaaS breakout, reducing costs while managing risk.",
      },
    },
    {
      type: "action-rationale",
      id: "sdwan-002",
      title: "Application-Aware Routing Policy",
      context:
        "The SD-WAN controller needs application-aware routing policies. The branch has two WAN transports:\n- Transport 1: MPLS (5 Mbps, latency 15ms, jitter 2ms, loss 0%)\n- Transport 2: Broadband (100 Mbps, latency 35ms, jitter 15ms, loss 0.5%)\n\nThe SAP ERP application requires low latency and reliable delivery. Users report that SAP transactions are slow when the SD-WAN sends them over broadband during load balancing.\n\nSD-WAN Dashboard:\n  Application: SAP\n  Current Policy: Load balance across all transports\n  SLA Thresholds: Not configured\n  Preferred Transport: None set",
      displayFields: [
        { label: "MPLS", value: "5 Mbps, 15ms, 0% loss", emphasis: "normal" },
        { label: "Broadband", value: "100 Mbps, 35ms, 0.5% loss", emphasis: "normal" },
        { label: "SAP Policy", value: "Load balanced (no SLA)", emphasis: "warn" },
      ],
      actions: [
        { id: "a1", label: "Set SAP to prefer MPLS with SLA thresholds: latency <50ms, loss <0.1%, jitter <10ms", color: "green" },
        { id: "a2", label: "Set SAP to MPLS-only with no failover to broadband", color: "blue" },
        { id: "a3", label: "Keep load balancing but increase broadband bandwidth", color: "yellow" },
        { id: "a4", label: "Set SAP to prefer broadband for higher bandwidth", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "SAP ERP is latency-sensitive with small, frequent transactions. Preferring MPLS (15ms latency, 0% loss) provides optimal performance. Adding SLA thresholds (latency <50ms, loss <0.1%, jitter <10ms) enables intelligent failover to broadband only when MPLS degrades below acceptable levels, maintaining application availability.",
        },
        {
          id: "r2",
          text: "MPLS-only with no failover provides the best SAP performance under normal conditions but eliminates resilience. If the MPLS circuit fails, SAP becomes completely unreachable. SLA-based failover provides both performance preference and high availability.",
        },
        {
          id: "r3",
          text: "Broadband preference would worsen SAP performance due to higher latency (35ms vs 15ms) and packet loss (0.5%). SAP's chatty protocol amplifies latency impact across many round-trip transactions.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! MPLS preference with SLA-based failover gives SAP optimal performance on the low-latency transport while maintaining availability through intelligent failover when MPLS degrades.",
        partial:
          "SAP needs the low-latency MPLS path, but availability requires failover capability. SLA thresholds enable the SD-WAN to automatically fail over to broadband only when MPLS performance degrades.",
        wrong:
          "SAP ERP requires low latency (MPLS preferred at 15ms) with SLA thresholds for intelligent failover. Load balancing across transports sends some transactions over the higher-latency broadband path, degrading performance.",
      },
    },
    {
      type: "action-rationale",
      id: "sdwan-003",
      title: "SD-WAN Migration Sequencing",
      context:
        "With 50 branches to migrate from traditional MPLS routing to SD-WAN, the project manager asks for the migration sequencing strategy. The branches vary in size and criticality:\n\n- 5 pilot branches (small, non-critical, < 20 users)\n- 20 standard branches (medium, 20-50 users)\n- 20 large branches (50-200 users, moderate criticality)\n- 5 critical branches (HQ-adjacent, data center connected, 200+ users)\n\nThe SD-WAN vendor provides zero-touch provisioning (ZTP) for edge devices. The team has completed lab testing and vendor training.",
      displayFields: [
        { label: "Total Sites", value: "50 branches", emphasis: "normal" },
        { label: "Timeline", value: "6 months", emphasis: "normal" },
        { label: "Rollback Plan", value: "Required for each phase", emphasis: "warn" },
      ],
      actions: [
        { id: "a1", label: "Pilot small sites first, then standard, large, and critical last", color: "green" },
        { id: "a2", label: "Migrate all 50 sites simultaneously using ZTP", color: "red" },
        { id: "a3", label: "Start with critical sites to prove the technology where it matters most", color: "yellow" },
        { id: "a4", label: "Migrate by geographic region regardless of size or criticality", color: "orange" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "Starting with pilot branches (small, non-critical) validates the deployment process and uncovers issues with minimal business impact. Lessons learned refine the process for standard branches, then large branches test scale. Critical sites migrate last with a proven, refined deployment methodology, minimizing risk to the most important locations.",
        },
        {
          id: "r2",
          text: "Simultaneous migration of all 50 sites is extremely high risk. Any systemic issue (controller misconfiguration, policy error) would impact the entire organization at once with no working reference sites for comparison.",
        },
        {
          id: "r3",
          text: "Starting with critical sites puts the highest-value locations at risk before the deployment process is proven. Issues discovered during migration affect the most users and most critical business operations.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The phased approach (pilot -> standard -> large -> critical) progressively builds confidence and refines the deployment process. Each phase informs the next with lower-risk sites validating the methodology first.",
        partial:
          "Migration sequencing should minimize risk by starting with lowest-impact sites. The phased approach lets the team learn and refine processes before touching critical infrastructure.",
        wrong:
          "Always start with small, non-critical pilot sites to validate the deployment process. Migrate standard and large sites next. Critical sites should be last, using a proven and refined methodology.",
      },
    },
  ],
  hints: [
    "Hybrid WAN strategies (MPLS + broadband) allow SD-WAN to use MPLS for latency-sensitive traffic while broadband handles bulk data and local internet breakout.",
    "Application-aware routing should prefer low-latency transports for interactive applications, with SLA thresholds enabling automatic failover for resilience.",
    "SD-WAN migration should follow a phased approach: pilot small sites first, then progressively migrate to larger and more critical locations.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "SD-WAN deployment is one of the most active areas in enterprise networking. Engineers who can plan migrations, design application-aware policies, and manage hybrid WAN architectures are in high demand as organizations modernize their WANs.",
  toolRelevance: [
    "Cisco Viptela/Meraki",
    "VMware VeloCloud",
    "Fortinet SD-WAN",
    "Silver Peak",
    "SD-WAN orchestrators",
    "WAN analytics",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
