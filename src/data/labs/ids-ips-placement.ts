import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ids-ips-placement",
  version: 1,
  title: "Decide IDS/IPS Sensor Placement",
  tier: "beginner",
  track: "network-security",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["ids", "ips", "sensor", "placement", "inline", "passive"],
  description:
    "Determine optimal placement for network IDS and IPS sensors based on traffic flow, network architecture, and detection requirements, choosing between inline and passive deployment modes.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Choose between inline IPS (prevention) and passive IDS (detection) based on the deployment scenario",
    "Determine optimal sensor placement relative to firewalls, switches, and network segments",
    "Understand the trade-offs between detection coverage and network performance impact",
  ],
  sortOrder: 404,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "ips-internet-edge",
      title: "Internet Edge Protection",
      context:
        "A company needs to detect and block known exploits and malware entering from the internet. The sensor must protect the DMZ web servers and internal network. Traffic volume is 2 Gbps.",
      displayFields: [
        { label: "Traffic Volume", value: "2 Gbps peak" },
        { label: "Protected Assets", value: "DMZ web servers, internal network" },
        { label: "Requirement", value: "Block known exploits in real-time" },
        { label: "Topology", value: "Internet -> Firewall -> IDS/IPS -> DMZ/LAN" },
      ],
      logEntry:
        "Deployment options:\n  A. Inline IPS behind firewall (between FW and internal switch)\n     - Can block malicious traffic in real-time\n     - Adds 1-2ms latency\n     - Single point of failure (needs bypass mode)\n  B. Passive IDS on SPAN port from firewall\n     - Detection only, cannot block\n     - Zero latency impact\n     - No risk of disrupting traffic flow\n  C. Inline IPS in front of firewall\n     - Sees all traffic including denied\n     - Higher load, more false positives",
      actions: [
        { id: "act-inline-behind", label: "Deploy inline IPS behind the firewall to inspect post-firewall traffic and block exploits" },
        { id: "act-passive-span", label: "Deploy passive IDS on a SPAN port for detection and alerting only" },
        { id: "act-inline-front", label: "Deploy inline IPS in front of the firewall to see all traffic" },
        { id: "act-both", label: "Deploy both IPS inline and IDS on a SPAN port" },
      ],
      correctActionId: "act-inline-behind",
      rationales: [
        {
          id: "rat-inline-behind",
          text: "Inline IPS behind the firewall inspects only traffic the firewall allows, reducing load and false positives. It can block exploits in real-time before they reach servers.",
        },
        {
          id: "rat-passive-insufficient",
          text: "Passive IDS detects threats but cannot block them. The requirement specifies blocking known exploits, which requires inline prevention mode.",
        },
        {
          id: "rat-front-wasteful",
          text: "Placing IPS in front of the firewall wastes resources inspecting traffic the firewall would block anyway. Behind the firewall, the IPS focuses on allowed-but-malicious traffic.",
        },
      ],
      correctRationaleId: "rat-inline-behind",
      feedback: {
        perfect:
          "Correct! Inline IPS behind the firewall provides real-time blocking of exploits while only inspecting firewall-permitted traffic, reducing load and false positives.",
        partial:
          "Right placement, but inline mode is required (not passive) since the requirement is to block exploits, not just detect them.",
        wrong:
          "The requirement is to block exploits in real-time, requiring inline IPS (not passive IDS). Placing it behind the firewall reduces the inspection load.",
      },
    },
    {
      type: "action-rationale",
      id: "ids-internal-monitoring",
      title: "Internal Network Threat Detection",
      context:
        "The security team wants to detect lateral movement and insider threats on the internal network without disrupting production traffic. They need visibility into east-west traffic between server VLANs.",
      displayFields: [
        { label: "Goal", value: "Detect lateral movement (east-west traffic)" },
        { label: "Constraint", value: "Zero disruption to production" },
        { label: "Traffic", value: "Inter-VLAN traffic between server VLANs" },
        { label: "Network", value: "Core switch with SPAN capability" },
      ],
      logEntry:
        "East-west traffic monitoring options:\n  1. Passive IDS on SPAN port from core switch\n     - Sees copies of inter-VLAN traffic\n     - Zero impact on production\n     - Detection + alerting only\n  2. Inline IPS between VLANs\n     - Can block lateral movement\n     - Adds latency to ALL inter-VLAN traffic\n     - Risk: IPS failure disrupts production\n  3. Network TAP + IDS\n     - Physical tap copies traffic to IDS\n     - Zero latency, no disruption\n     - Hardware cost for TAPs",
      actions: [
        { id: "act-span-ids", label: "Deploy passive IDS on SPAN port from the core switch to monitor east-west traffic" },
        { id: "act-inline-vlan", label: "Deploy inline IPS between server VLANs for active blocking" },
        { id: "act-tap-ids", label: "Deploy network TAPs with passive IDS sensors" },
        { id: "act-endpoint", label: "Deploy endpoint detection only, skip network IDS" },
      ],
      correctActionId: "act-span-ids",
      rationales: [
        {
          id: "rat-span",
          text: "A passive IDS on the core switch SPAN port provides east-west visibility with zero production impact. For internal monitoring where the priority is detection over prevention, passive mode is appropriate.",
        },
        {
          id: "rat-inline-risk",
          text: "Inline IPS between production VLANs risks disrupting all inter-VLAN communication if the IPS fails or generates false positives. The constraint specifies zero disruption.",
        },
        {
          id: "rat-detection-first",
          text: "For lateral movement detection, the security team needs visibility first. Passive IDS feeds alerts to the SOC, which can then investigate and contain threats through other controls.",
        },
      ],
      correctRationaleId: "rat-span",
      feedback: {
        perfect:
          "Correct! Passive IDS via SPAN provides east-west visibility with zero production impact -- exactly what is needed for internal threat detection without disruption.",
        partial:
          "Right mode (passive), but SPAN from the core switch is the simplest deployment. TAPs work too but add hardware cost and complexity.",
        wrong:
          "The requirement is detection without disruption. Passive IDS on a SPAN port provides traffic visibility with zero impact on production. Inline IPS risks disrupting inter-VLAN traffic.",
      },
    },
    {
      type: "action-rationale",
      id: "ips-bypass-ha",
      title: "IPS High Availability Design",
      context:
        "An inline IPS protects the internet edge. During a firmware update last week, the IPS rebooted and caused a 3-minute network outage. Design a high-availability solution to prevent future outages.",
      displayFields: [
        { label: "Current Setup", value: "Single inline IPS, no bypass" },
        { label: "Incident", value: "3-minute outage during firmware update" },
        { label: "SLA", value: "99.99% uptime (max 52 min/year downtime)" },
        { label: "Budget", value: "Approved for HA upgrade" },
      ],
      logEntry:
        "HA options:\n  1. Hardware bypass (fail-open): IPS failure passes traffic through\n     - Pro: No outage during failure\n     - Con: Traffic unprotected during bypass\n  2. Active-passive IPS pair: Second IPS takes over during failure\n     - Pro: Continuous protection\n     - Con: 2x hardware cost\n  3. Active-active IPS pair with load balancing\n     - Pro: Performance + redundancy\n     - Con: Complex configuration",
      actions: [
        { id: "act-active-passive", label: "Deploy active-passive IPS pair with stateful failover" },
        { id: "act-bypass", label: "Enable hardware fail-open bypass on the current IPS" },
        { id: "act-active-active", label: "Deploy active-active pair with load balancing" },
        { id: "act-schedule", label: "Schedule maintenance windows and accept the downtime risk" },
      ],
      correctActionId: "act-active-passive",
      rationales: [
        {
          id: "rat-ap",
          text: "Active-passive failover maintains continuous inspection during failures. The standby IPS takes over with the same signatures and policies, providing both availability and security.",
        },
        {
          id: "rat-bypass-insecure",
          text: "Hardware bypass (fail-open) maintains connectivity but passes all traffic uninspected. During the bypass window, exploits can enter the network undetected.",
        },
        {
          id: "rat-schedule-sla",
          text: "Scheduled maintenance windows cannot guarantee the 99.99% SLA. Unplanned failures would add to planned downtime, exceeding the 52-minute annual budget.",
        },
      ],
      correctRationaleId: "rat-ap",
      feedback: {
        perfect:
          "Correct! Active-passive IPS failover maintains both availability and security. The standby unit takes over seamlessly during updates or failures.",
        partial:
          "Good instinct for redundancy, but active-passive is preferred over fail-open bypass because it maintains security during failover.",
        wrong:
          "Hardware bypass sacrifices security during failure. Active-passive failover provides both continuous uptime AND continuous inspection, meeting the 99.99% SLA.",
      },
    },
  ],
  hints: [
    "Place IPS inline behind the firewall (not in front) to inspect only firewall-permitted traffic, reducing load and false positives.",
    "For internal monitoring without disruption, use passive IDS on a SPAN port. Inline IPS risks disrupting production if it fails.",
    "Active-passive IPS pairs provide both availability and continuous security. Hardware bypass (fail-open) maintains connectivity but loses protection.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "IDS/IPS placement is a key design decision tested on CompTIA Security+ and CySA+. Security architects must balance detection capability with network performance and availability.",
  toolRelevance: [
    "Snort / Suricata (open-source IDS/IPS)",
    "Cisco Firepower / Palo Alto Threat Prevention",
    "Wireshark (IDS rule validation)",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
