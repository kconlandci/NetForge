import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "wireless-bridge-config",
  version: 1,
  title: "Configure Wireless Bridge Links",
  tier: "intermediate",
  track: "wireless-networking",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["wireless-bridge", "point-to-point", "backhaul", "outdoor", "antenna"],
  description:
    "Configure point-to-point and point-to-multipoint wireless bridge links between buildings, including antenna alignment, channel selection, and link budget calculations.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Configure point-to-point wireless bridge parameters for inter-building links",
    "Calculate link budget including free-space path loss, antenna gain, and fade margin",
    "Select appropriate channel width and frequency for bridge distance and throughput requirements",
  ],
  sortOrder: 308,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "bridge-ptp-basic",
      title: "Point-to-Point Bridge Between Buildings",
      description:
        "Two office buildings 500 meters apart need a wireless backhaul link. The link must carry 200 Mbps for 50 users in Building B. Configure the bridge radios on both sides.",
      targetSystem: "Ubiquiti airOS > Wireless Bridge Configuration",
      items: [
        {
          id: "bridge-mode",
          label: "Wireless Mode",
          detail: "Bridge radio operating mode",
          currentState: "Access Point",
          correctState: "Bridge (PtP)",
          states: ["Access Point", "Station", "Bridge (PtP)", "Bridge (PtMP)"],
          rationaleId: "rat-ptp",
        },
        {
          id: "bridge-freq",
          label: "Frequency Band",
          detail: "Operating frequency for the bridge link",
          currentState: "2.4 GHz",
          correctState: "5 GHz",
          states: ["2.4 GHz", "5 GHz", "60 GHz"],
          rationaleId: "rat-5ghz",
        },
        {
          id: "bridge-width",
          label: "Channel Width",
          detail: "Radio channel bandwidth",
          currentState: "20 MHz",
          correctState: "40 MHz",
          states: ["20 MHz", "40 MHz", "80 MHz"],
          rationaleId: "rat-width",
        },
        {
          id: "bridge-power",
          label: "TX Power",
          detail: "Transmit power level",
          currentState: "Max (30 dBm)",
          correctState: "20 dBm",
          states: ["10 dBm", "15 dBm", "20 dBm", "Max (30 dBm)"],
          rationaleId: "rat-power",
        },
        {
          id: "bridge-encrypt",
          label: "Link Encryption",
          detail: "Encryption for bridge traffic",
          currentState: "None",
          correctState: "AES-256",
          states: ["None", "AES-128", "AES-256"],
          rationaleId: "rat-encrypt",
        },
      ],
      rationales: [
        {
          id: "rat-ptp",
          text: "Point-to-Point bridge mode creates a dedicated link between exactly two radios, optimizing the protocol for single-peer communication with minimal overhead.",
        },
        {
          id: "rat-5ghz",
          text: "5 GHz provides more bandwidth and less interference than 2.4 GHz for bridge links. At 500m with directional antennas, 5 GHz propagation is excellent.",
        },
        {
          id: "rat-width",
          text: "40 MHz channel width provides ~200 Mbps real throughput to meet the requirement. 80 MHz is overkill and reduces available channels for future links.",
        },
        {
          id: "rat-power",
          text: "At 500m with high-gain directional antennas, 20 dBm provides adequate link margin. Max power wastes energy and may violate EIRP regulatory limits with high-gain antennas.",
        },
        {
          id: "rat-encrypt",
          text: "AES-256 encryption protects traffic traversing the air between buildings, preventing eavesdropping on the wireless backhaul link.",
        },
      ],
      feedback: {
        perfect:
          "Perfect bridge configuration! PtP mode on 5 GHz with 40 MHz width and AES-256 provides a secure, efficient 200 Mbps backhaul link.",
        partial:
          "Close, but check that you are using PtP mode (not AP or PtMP) and that TX power is appropriate for the distance with directional antennas.",
        wrong:
          "A 500m bridge needs PtP mode on 5 GHz with appropriate power. 2.4 GHz has too much interference, and AP mode is for serving clients, not bridging buildings.",
      },
    },
    {
      type: "toggle-config",
      id: "bridge-link-budget",
      title: "Link Budget Optimization",
      description:
        "A 2 km bridge link is experiencing intermittent drops during rain. The current configuration has insufficient fade margin. Adjust parameters to ensure reliable operation in adverse weather.",
      targetSystem: "Cambium cnMaestro > PTP Link Configuration",
      items: [
        {
          id: "antenna-gain",
          label: "Antenna Type",
          detail: "Directional antenna selection for each end",
          currentState: "16 dBi panel",
          correctState: "25 dBi dish",
          states: ["8 dBi sector", "16 dBi panel", "25 dBi dish", "30 dBi dish"],
          rationaleId: "rat-antenna",
        },
        {
          id: "link-freq",
          label: "Frequency",
          detail: "Operating frequency for rain fade resilience",
          currentState: "5.8 GHz",
          correctState: "5.8 GHz",
          states: ["2.4 GHz", "5.8 GHz", "60 GHz"],
          rationaleId: "rat-freq",
        },
        {
          id: "link-adapt",
          label: "Rate Adaptation",
          detail: "Automatic modulation adjustment during fade events",
          currentState: "Fixed MCS 7",
          correctState: "Adaptive",
          states: ["Fixed MCS 3", "Fixed MCS 7", "Adaptive"],
          rationaleId: "rat-adapt",
        },
        {
          id: "link-ack",
          label: "ACK Timeout",
          detail: "Frame acknowledgment timeout for distance",
          currentState: "Default (auto)",
          correctState: "Distance-tuned (2 km)",
          states: ["Default (auto)", "Distance-tuned (2 km)", "Maximum"],
          rationaleId: "rat-ack",
        },
      ],
      rationales: [
        {
          id: "rat-antenna",
          text: "Upgrading from 16 dBi to 25 dBi dish antennas adds 18 dB of link budget (9 dB per end), providing the fade margin needed for rain attenuation at 2 km.",
        },
        {
          id: "rat-freq",
          text: "5.8 GHz is the correct choice for 2 km. 60 GHz suffers extreme rain fade; 2.4 GHz has too much interference. 5 GHz balances throughput and weather resilience.",
        },
        {
          id: "rat-adapt",
          text: "Adaptive rate selection automatically drops to lower modulation schemes during rain fade, maintaining link stability at reduced throughput rather than dropping entirely.",
        },
        {
          id: "rat-ack",
          text: "Distance-tuned ACK timeout accounts for the 2 km propagation delay. Default values may be too short, causing unnecessary retransmissions.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! Higher-gain antennas with adaptive rate selection provide the fade margin and resilience needed for a 2 km link in rain conditions.",
        partial:
          "Good antenna upgrade, but adaptive rate selection is critical for maintaining the link during fade events instead of dropping entirely.",
        wrong:
          "Rain fade requires additional link budget. Higher-gain directional antennas and adaptive modulation are the standard solutions for weather-affected bridge links.",
      },
    },
    {
      type: "toggle-config",
      id: "bridge-ptmp",
      title: "Point-to-Multipoint Hub Site",
      description:
        "A main campus building needs to provide wireless backhaul to 4 remote buildings. Configure the hub radio as a PtMP base station with proper sector coverage.",
      targetSystem: "Mimosa Cloud > PtMP Base Station Configuration",
      items: [
        {
          id: "ptmp-mode",
          label: "Radio Mode",
          detail: "Base station operating mode",
          currentState: "Bridge (PtP)",
          correctState: "Bridge (PtMP)",
          states: ["Access Point", "Bridge (PtP)", "Bridge (PtMP)"],
          rationaleId: "rat-ptmp",
        },
        {
          id: "ptmp-antenna",
          label: "Hub Antenna Type",
          detail: "Antenna for 120-degree sector coverage",
          currentState: "Omni 8 dBi",
          correctState: "Sector 17 dBi (120°)",
          states: ["Omni 8 dBi", "Sector 17 dBi (120°)", "Dish 25 dBi", "Panel 14 dBi (60°)"],
          rationaleId: "rat-sector",
        },
        {
          id: "ptmp-protocol",
          label: "MAC Protocol",
          detail: "Medium access control for multiple clients",
          currentState: "CSMA/CA",
          correctState: "GPS-Sync TDMA",
          states: ["CSMA/CA", "TDMA", "GPS-Sync TDMA"],
          rationaleId: "rat-tdma",
        },
        {
          id: "ptmp-qos",
          label: "Per-Client Bandwidth Limit",
          detail: "Fair-share allocation across 4 remote sites",
          currentState: "Unlimited",
          correctState: "100 Mbps per client",
          states: ["Unlimited", "50 Mbps per client", "100 Mbps per client", "200 Mbps per client"],
          rationaleId: "rat-qos",
        },
      ],
      rationales: [
        {
          id: "rat-ptmp",
          text: "PtMP mode allows one base station radio to serve multiple remote subscriber stations simultaneously, connecting all 4 buildings from a single hub.",
        },
        {
          id: "rat-sector",
          text: "A 120-degree sector antenna focuses energy toward the 4 remote buildings while providing enough beamwidth to cover their spread, with higher gain than an omni.",
        },
        {
          id: "rat-tdma",
          text: "GPS-Sync TDMA allocates precise time slots to each subscriber, eliminating collisions and ensuring predictable throughput. CSMA/CA degrades rapidly with multiple stations.",
        },
        {
          id: "rat-qos",
          text: "100 Mbps per client ensures fair bandwidth allocation. Without limits, one high-traffic site could starve the others.",
        },
      ],
      feedback: {
        perfect:
          "Perfect PtMP configuration! Sector antenna with GPS-Sync TDMA and per-client limits provides efficient, fair bandwidth distribution across all 4 remote sites.",
        partial:
          "Good mode selection, but GPS-Sync TDMA is essential for PtMP. CSMA/CA causes severe collisions with multiple subscriber stations.",
        wrong:
          "PtMP requires a sector antenna (not omni or dish) and TDMA scheduling. PtP mode only supports one remote site. CSMA/CA causes collisions in multi-subscriber environments.",
      },
    },
  ],
  hints: [
    "Point-to-Point bridges use dedicated paired radios. Point-to-Multipoint uses one base station with sector antenna serving multiple subscribers.",
    "Link budget = TX Power + TX Antenna Gain + RX Antenna Gain - Free Space Path Loss. Each doubling of antenna gain adds 3 dB.",
    "GPS-Sync TDMA in PtMP deployments eliminates contention by assigning time slots, critical when multiple subscriber stations share a base radio.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Wireless bridge design is essential for WISPs and campus networks. Understanding link budgets, antenna gain, and fade margins is tested on CWDP and valued in outdoor wireless engineering roles.",
  toolRelevance: [
    "Ubiquiti UISP / airOS",
    "Cambium cnMaestro",
    "Link budget calculators (RF Line of Sight, airLink)",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
