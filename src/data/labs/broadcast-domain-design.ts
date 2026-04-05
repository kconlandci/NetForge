import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "broadcast-domain-design",
  version: 1,
  title: "Broadcast Domain Design",
  tier: "beginner",
  track: "network-fundamentals",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["broadcast-domain", "vlan", "network-design", "segmentation"],
  description:
    "Design broadcast domains for efficiency by determining optimal VLAN segmentation and understanding broadcast traffic impact.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Understand the relationship between VLANs and broadcast domains",
    "Calculate broadcast traffic impact on network segments",
    "Design VLAN-based segmentation to reduce broadcast overhead",
  ],
  sortOrder: 112,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "bdd-001",
      title: "Flat Network Performance Degradation",
      context:
        "A growing company has 500 devices on a single flat VLAN. Users complain about slow network performance:\n\n- All 500 devices are in VLAN 1 (default)\n- No inter-VLAN routing configured\n- ARP broadcasts alone generate ~15,000 frames/minute\n- DHCP renewals add another ~2,000 broadcasts/minute\n- Network monitoring shows 12% of all traffic is broadcast\n- Recommended broadcast threshold: under 5% of total traffic\n\nManagement asks you to propose a solution to reduce broadcast overhead.",
      displayFields: [],
      actions: [
        { id: "a1", label: "Segment into multiple VLANs by department (5-6 VLANs)", color: "green" },
        { id: "a2", label: "Upgrade all switches to faster models", color: "blue" },
        { id: "a3", label: "Enable broadcast storm control at 5%", color: "yellow" },
        { id: "a4", label: "Convert all devices to static IP to eliminate DHCP broadcasts", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "Segmenting 500 devices into 5-6 VLANs of ~80-100 devices each reduces broadcast traffic per segment by 80%. Each VLAN is its own broadcast domain, so ARP and DHCP broadcasts only affect devices in the same VLAN.",
        },
        {
          id: "r2",
          text: "Faster switches do not reduce broadcast traffic volume - they just process the same broadcasts quicker. The fundamental problem of 500 devices in one broadcast domain remains.",
        },
        {
          id: "r3",
          text: "Storm control drops broadcasts above a threshold, which could break ARP and DHCP functionality. It treats the symptom by dropping traffic rather than addressing the root cause of an oversized broadcast domain.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! VLAN segmentation is the correct solution. Dividing 500 devices into smaller broadcast domains directly reduces per-segment broadcast overhead from 12% to well under 5%.",
        partial:
          "Close. The root cause is too many devices in a single broadcast domain. VLANs create separate broadcast domains, directly solving the excessive broadcast traffic.",
        wrong:
          "VLAN segmentation is the answer. 500 devices in one broadcast domain generates excessive broadcast traffic. Splitting into 5-6 VLANs reduces per-VLAN broadcasts by 80%.",
      },
    },
    {
      type: "action-rationale",
      id: "bdd-002",
      title: "VoIP Quality Issues From Broadcast Traffic",
      context:
        "A company deployed IP phones on the same VLAN as data devices. Voice quality is poor during business hours:\n\n- 200 data devices and 200 IP phones share VLAN 10\n- During peak hours, broadcast traffic reaches 8% of total\n- IP phones are sensitive to broadcast processing overhead\n- Phone CPU utilization spikes to 60% during broadcast storms\n- Voice packets experience 20ms additional jitter from broadcast processing\n- QoS is configured but cannot help with broadcast overhead on the phones themselves",
      displayFields: [],
      actions: [
        { id: "a1", label: "Create a separate Voice VLAN for all IP phones", color: "green" },
        { id: "a2", label: "Increase QoS priority for voice traffic", color: "blue" },
        { id: "a3", label: "Replace IP phones with models that have faster CPUs", color: "yellow" },
        { id: "a4", label: "Reduce the number of data devices on the VLAN", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "A dedicated Voice VLAN isolates phones from data broadcast traffic. The phones will only process broadcasts from other phones (200 instead of 400 devices), dramatically reducing CPU overhead and eliminating the broadcast-induced jitter.",
        },
        {
          id: "r2",
          text: "QoS prioritizes voice packets in transit but cannot reduce the broadcast processing load on the phone's CPU. The phone still has to process every broadcast frame on its VLAN regardless of QoS settings.",
        },
        {
          id: "r3",
          text: "Faster phone CPUs would increase headroom but don't solve the architectural problem. As the network grows, the broadcast issue will return. VLAN separation is the proper architectural solution.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! A separate Voice VLAN is the industry standard practice. It isolates phones from data broadcast traffic, reducing CPU load and eliminating broadcast-induced jitter.",
        partial:
          "You're on the right track. The key is that broadcast traffic affects phone CPU regardless of QoS. Voice VLAN separation removes phones from the data broadcast domain entirely.",
        wrong:
          "A dedicated Voice VLAN is the correct solution. It separates phones into their own broadcast domain, eliminating data broadcast overhead that causes CPU spikes and voice quality degradation.",
      },
    },
    {
      type: "action-rationale",
      id: "bdd-003",
      title: "Security Segmentation for PCI Compliance",
      context:
        "An auditor flags that point-of-sale (POS) terminals share a broadcast domain with general employee workstations:\n\n- 20 POS terminals processing credit card transactions\n- 150 employee workstations on the same VLAN\n- PCI DSS requires cardholder data environment (CDE) to be segmented\n- ARP spoofing on the shared VLAN could intercept payment data\n- The auditor requires network-level isolation of the CDE\n- Current flat network provides no broadcast domain separation",
      displayFields: [],
      actions: [
        { id: "a1", label: "Create a dedicated CDE VLAN for POS terminals with ACLs", color: "green" },
        { id: "a2", label: "Install host-based firewalls on each POS terminal", color: "blue" },
        { id: "a3", label: "Encrypt all POS traffic with TLS", color: "yellow" },
        { id: "a4", label: "Enable DHCP snooping and dynamic ARP inspection on the shared VLAN", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "PCI DSS mandates network segmentation of the cardholder data environment. A dedicated VLAN with ACLs provides both broadcast domain isolation (preventing ARP-based attacks) and network-level access control required by the audit finding.",
        },
        {
          id: "r2",
          text: "Host firewalls on POS terminals add defense in depth but do not satisfy the PCI requirement for network-level segmentation. The auditor specifically requires broadcast domain separation.",
        },
        {
          id: "r3",
          text: "While ARP inspection mitigates spoofing attacks, it does not provide the network segmentation that PCI DSS requires. The CDE must be in its own isolated broadcast domain.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! PCI DSS requires network segmentation of the CDE. A dedicated VLAN with ACLs satisfies both the broadcast isolation requirement and the audit finding for network-level access control.",
        partial:
          "Close. The PCI audit specifically requires network segmentation, not just traffic security. A separate VLAN provides the broadcast domain isolation the auditor is looking for.",
        wrong:
          "A dedicated CDE VLAN with ACLs is required. PCI DSS mandates network-level segmentation of payment processing systems. This separates the broadcast domain and restricts access to the CDE.",
      },
    },
  ],
  hints: [
    "Each VLAN creates a separate broadcast domain. Broadcasts in one VLAN do not reach devices in other VLANs, reducing per-device broadcast processing.",
    "Voice VLANs are an industry standard practice because IP phones are particularly sensitive to broadcast overhead. Most enterprise switches support dedicated voice VLANs per port.",
    "Broadcast domain segmentation serves both performance and security. PCI DSS, HIPAA, and other compliance frameworks require network-level isolation of sensitive systems.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Broadcast domain design is a core skill for network architects. Poor segmentation causes both performance and security issues, making this a common interview topic for mid-level network roles.",
  toolRelevance: ["show vlan brief", "show interfaces switchport", "Wireshark", "show mac address-table"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
