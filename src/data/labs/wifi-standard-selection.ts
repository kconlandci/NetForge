import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "wifi-standard-selection",
  version: 1,
  title: "Choose the Right Wi-Fi Standard",
  tier: "beginner",
  track: "wireless-networking",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["wifi", "802.11", "standards", "wireless", "selection"],
  description:
    "Evaluate wireless requirements and select the appropriate Wi-Fi standard (802.11a/b/g/n/ac/ax) for different deployment scenarios based on throughput, range, and device compatibility.",
  estimatedMinutes: 8,
  learningObjectives: [
    "Compare key specifications of Wi-Fi standards from 802.11b through 802.11ax",
    "Match Wi-Fi standards to specific deployment requirements",
    "Evaluate trade-offs between throughput, range, and backward compatibility",
  ],
  sortOrder: 300,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "wifi-std-office-upgrade",
      title: "Office Wireless Upgrade",
      context:
        "A 50-person office is upgrading their wireless infrastructure. They need to support video conferencing, cloud applications, and IoT devices. Current APs are 802.11n. Budget allows for a full refresh.",
      displayFields: [
        { label: "Current Standard", value: "802.11n (Wi-Fi 4)" },
        { label: "Client Devices", value: "~120 (laptops, phones, IoT sensors)" },
        { label: "Required Throughput", value: "500+ Mbps aggregate per AP" },
        { label: "Frequency Bands", value: "2.4 GHz and 5 GHz needed" },
      ],
      logEntry:
        "Site Survey Summary:\n  Current AP count: 8x 802.11n dual-band\n  Avg client count per AP: 15\n  Peak utilization: 85% airtime on 2.4 GHz\n  5 GHz utilization: 40%\n  Interference sources: 12 neighboring SSIDs on 2.4 GHz",
      actions: [
        { id: "act-ax", label: "Deploy Wi-Fi 6 (802.11ax) access points" },
        { id: "act-ac", label: "Deploy Wi-Fi 5 (802.11ac Wave 2) access points" },
        { id: "act-n5", label: "Deploy 802.11n 5 GHz-only access points" },
        { id: "act-ac-ax", label: "Deploy a mix of 802.11ac and 802.11ax APs" },
      ],
      correctActionId: "act-ax",
      rationales: [
        {
          id: "rat-ofdma",
          text: "Wi-Fi 6 uses OFDMA and MU-MIMO to efficiently handle many concurrent clients, which is ideal for high-density environments with 120+ devices.",
        },
        {
          id: "rat-bss",
          text: "BSS Coloring in 802.11ax reduces co-channel interference from neighboring networks, directly addressing the 12 neighboring SSIDs detected.",
        },
        {
          id: "rat-backward",
          text: "802.11ac Wave 2 provides adequate throughput but lacks the multi-user efficiency features needed for this client density.",
        },
        {
          id: "rat-twt",
          text: "Target Wake Time (TWT) in Wi-Fi 6 optimizes battery life for IoT sensors while reducing airtime contention.",
        },
      ],
      correctRationaleId: "rat-ofdma",
      feedback: {
        perfect:
          "Excellent! Wi-Fi 6 (802.11ax) with OFDMA is the right choice for this high-density office, efficiently serving 120+ devices with better airtime utilization.",
        partial:
          "You identified the right standard but the key advantage here is OFDMA's ability to serve multiple clients simultaneously, not just raw throughput.",
        wrong:
          "For 120+ devices in a dense environment, Wi-Fi 6's OFDMA technology is essential. Older standards cannot efficiently handle this many concurrent clients.",
      },
    },
    {
      type: "action-rationale",
      id: "wifi-std-warehouse",
      title: "Warehouse Coverage Deployment",
      context:
        "A large warehouse (50,000 sq ft) needs wireless coverage for barcode scanners and inventory tablets. Devices are older 802.11n-capable. The environment has metal shelving and forklifts creating multipath interference.",
      displayFields: [
        { label: "Area", value: "50,000 sq ft open warehouse" },
        { label: "Client Devices", value: "30 barcode scanners (802.11n)" },
        { label: "Application", value: "Inventory management (low bandwidth)" },
        { label: "Environment", value: "Metal shelving, high ceilings, forklifts" },
      ],
      logEntry:
        "RF Assessment:\n  2.4 GHz propagation: Good through metal racks (longer wavelength)\n  5 GHz propagation: Poor - significant attenuation at shelving\n  Recommended: 2.4 GHz primary with channel width 20 MHz\n  Noise floor: -90 dBm average",
      actions: [
        { id: "act-n24", label: "Deploy 802.11n APs on 2.4 GHz with 20 MHz channels" },
        { id: "act-ax6e", label: "Deploy Wi-Fi 6E APs using 6 GHz band" },
        { id: "act-ac5", label: "Deploy 802.11ac APs on 5 GHz only" },
        { id: "act-mesh", label: "Deploy Wi-Fi 6 mesh nodes across the warehouse" },
      ],
      correctActionId: "act-n24",
      rationales: [
        {
          id: "rat-compat",
          text: "The barcode scanners only support 802.11n, so deploying a compatible standard on 2.4 GHz ensures all devices can connect while leveraging the better propagation characteristics through metal shelving.",
        },
        {
          id: "rat-range",
          text: "6 GHz and 5 GHz signals attenuate heavily around metal obstacles, making 2.4 GHz the only practical frequency for reliable warehouse coverage.",
        },
        {
          id: "rat-mesh",
          text: "Mesh networking adds latency and complexity without solving the fundamental RF propagation challenge in a metal-heavy environment.",
        },
      ],
      correctRationaleId: "rat-compat",
      feedback: {
        perfect:
          "Correct! 802.11n on 2.4 GHz matches the scanner capabilities and provides the best penetration through metal shelving in the warehouse environment.",
        partial:
          "Right standard, but remember the primary driver is device compatibility -- the scanners only support 802.11n, and 2.4 GHz propagates better around metal obstacles.",
        wrong:
          "The barcode scanners are limited to 802.11n. Deploying a newer or higher-frequency standard would leave devices unable to connect or suffering from poor signal in the metal-heavy environment.",
      },
    },
    {
      type: "action-rationale",
      id: "wifi-std-lecture-hall",
      title: "University Lecture Hall Wi-Fi",
      context:
        "A 300-seat lecture hall needs wireless access for students streaming lecture content and submitting assignments. Peak usage occurs during class changes when 300 devices connect simultaneously.",
      displayFields: [
        { label: "Capacity", value: "300 seats" },
        { label: "Peak Devices", value: "300+ simultaneous" },
        { label: "Applications", value: "Video streaming, LMS access, web browsing" },
        { label: "Budget", value: "Premium (university IT funded)" },
      ],
      logEntry:
        "Capacity Planning:\n  Peak concurrent clients: 300\n  Avg throughput per client: 5 Mbps\n  Aggregate requirement: 1.5 Gbps\n  Recommended AP count: 6-8 (ceiling mount)\n  Channel plan: 5 GHz primary, 2.4 GHz fallback",
      actions: [
        { id: "act-ax-hdx", label: "Deploy Wi-Fi 6 (802.11ax) with OFDMA and BSS Coloring" },
        { id: "act-ac-w2", label: "Deploy Wi-Fi 5 (802.11ac Wave 2) with MU-MIMO" },
        { id: "act-ax-6e", label: "Deploy Wi-Fi 6E on 6 GHz exclusively" },
        { id: "act-ac-dfs", label: "Deploy 802.11ac using DFS channels only" },
      ],
      correctActionId: "act-ax-hdx",
      rationales: [
        {
          id: "rat-ofdma-density",
          text: "OFDMA in Wi-Fi 6 divides each channel into resource units, allowing a single AP to serve dozens of clients simultaneously -- critical for 300-device density.",
        },
        {
          id: "rat-6e-compat",
          text: "Wi-Fi 6E on 6 GHz lacks backward compatibility; many student devices do not yet support 6 GHz, leaving them unable to connect.",
        },
        {
          id: "rat-mumimo",
          text: "MU-MIMO in 802.11ac Wave 2 helps but only supports 4 simultaneous spatial streams, insufficient for 300 concurrent devices.",
        },
      ],
      correctRationaleId: "rat-ofdma-density",
      feedback: {
        perfect:
          "Excellent! Wi-Fi 6 with OFDMA is purpose-built for high-density venues like lecture halls, efficiently scheduling transmissions for hundreds of clients per AP.",
        partial:
          "Right choice, but the key technology is OFDMA subdividing channels into resource units, not just higher throughput numbers.",
        wrong:
          "With 300 simultaneous devices, OFDMA in Wi-Fi 6 is essential. Older standards or 6 GHz-only deployments cannot efficiently serve this density of mixed client devices.",
      },
    },
  ],
  hints: [
    "Consider both the client device capabilities and the physical environment when selecting a Wi-Fi standard.",
    "OFDMA in Wi-Fi 6 allows a single AP to transmit to multiple clients simultaneously using sub-channel resource units.",
    "Lower frequencies (2.4 GHz) penetrate obstacles better but have less available bandwidth than 5 GHz or 6 GHz.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Wireless network architects regularly evaluate Wi-Fi standards during RFP responses and site design. Understanding OFDMA, MU-MIMO, and BSS Coloring is essential for CompTIA Network+ and CWNA certifications.",
  toolRelevance: [
    "Ekahau / iBwave (site survey tools)",
    "Wi-Fi analyzer apps",
    "Cisco WLC / Aruba Central",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
