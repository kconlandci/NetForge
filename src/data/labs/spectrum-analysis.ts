import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "spectrum-analysis",
  version: 1,
  title: "Analyze RF Spectrum Problems",
  tier: "advanced",
  track: "wireless-networking",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["spectrum", "rf", "analysis", "interference", "chanalyzer"],
  description:
    "Analyze RF spectrum captures to identify, classify, and remediate complex interference patterns from radar, industrial equipment, and rogue transmitters affecting wireless network performance.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Classify RF interference signatures from spectrum analyzer captures",
    "Distinguish between radar, industrial, and consumer device interference patterns",
    "Recommend spectrum-aware remediation strategies for complex RF environments",
  ],
  sortOrder: 311,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "spectrum-radar-dfs",
      title: "DFS Radar Events Causing Channel Hopping",
      description:
        "APs on DFS channels are constantly changing channels, causing 30-second client disconnections every few minutes. The building is near an airport.",
      evidence: [
        {
          type: "log",
          content:
            "AP-FLOOR4# show dot11 5ghz channel-change history\nTime                 From    To      Reason\n2026-03-27 14:00:12  100     36      Radar detected\n2026-03-27 14:03:45  116     149     Radar detected\n2026-03-27 14:07:22  132     153     Radar detected\n2026-03-27 14:10:58  52      157     Radar detected\n\n47 radar events in last 24 hours across DFS channels.\nAffected channels: 52, 100, 104, 108, 112, 116, 132, 136, 140",
        },
        {
          type: "log",
          content:
            "Spectrum Analyzer (5 GHz DFS band):\nChannel 100 (5500 MHz):\n  Radar pulse detected: Width 1 us, PRI 1000 us\n  Pattern: FCC Type 1 (short pulse)\n  Duty cycle: 0.1%\n  Confidence: 99.8%\n  Source: Weather radar (NEXRAD) 8 km NE\n\nChannel 116 (5580 MHz):\n  Radar pulse detected: Width 5 us, PRI 300 us\n  Pattern: FCC Type 4 (frequency hopping)\n  Confidence: 97.2%\n  Source: Airport terminal radar (ASR-11) 3 km E",
          icon: "alert",
        },
        {
          type: "log",
          content:
            "Building location: 3 km from regional airport, 8 km from NEXRAD\nFCC regulation: DFS channels MUST vacate within 10 seconds of radar\nNon-occupancy period: 30 minutes after radar detection\nNon-DFS 5 GHz channels available: 36, 40, 44, 48, 149, 153, 157, 161",
        },
      ],
      classifications: [
        { id: "cls-radar", label: "Legitimate Radar Interference", description: "Real radar signals from nearby airport/weather station triggering mandatory DFS evacuation" },
        { id: "cls-false-pos", label: "False Radar Detection", description: "AP firmware incorrectly classifying non-radar signals as radar" },
        { id: "cls-ap-defect", label: "AP Hardware Defect", description: "Defective radar detection circuitry on affected APs" },
        { id: "cls-jammer", label: "RF Jammer", description: "Intentional jamming device mimicking radar signatures" },
      ],
      correctClassificationId: "cls-radar",
      remediations: [
        { id: "rem-nondfs", label: "Restrict all APs to non-DFS channels only", description: "Use only UNII-1 (36-48) and UNII-3 (149-161) channels that do not require DFS radar detection" },
        { id: "rem-disable-dfs", label: "Disable DFS detection in firmware", description: "Turn off radar detection to stop channel changes" },
        { id: "rem-shield", label: "Install RF shielding on windows facing airport", description: "Block radar signals from entering the building" },
        { id: "rem-relocate", label: "Relocate the office away from the airport", description: "Move to a location without radar interference" },
      ],
      correctRemediationId: "rem-nondfs",
      rationales: [
        {
          id: "rat-nondfs",
          text: "With 47 radar events daily from a nearby airport and NEXRAD, DFS channels are unusable. The 8 non-DFS channels (36-48, 149-161) provide sufficient capacity for most deployments.",
        },
        {
          id: "rat-cannot-disable",
          text: "Disabling DFS radar detection is illegal. FCC regulations mandate radar detection on DFS channels. Violations carry fines up to $100,000 per occurrence.",
        },
        {
          id: "rat-shield-impractical",
          text: "RF shielding for an entire building floor against radar is prohibitively expensive and impractical. Avoiding DFS channels is the standard solution near airports.",
        },
      ],
      correctRationaleId: "rat-nondfs",
      feedback: {
        perfect:
          "Correct! Near an airport, DFS channels are effectively unusable. Restricting to non-DFS UNII-1 and UNII-3 channels eliminates the radar-triggered channel changes entirely.",
        partial:
          "Right to avoid DFS, but remember that disabling radar detection is illegal. The only compliant option is restricting to non-DFS channels.",
        wrong:
          "The radar is legitimate (airport + NEXRAD). DFS detection cannot be disabled (federal law). The solution is using only non-DFS channels (36-48, 149-161).",
      },
    },
    {
      type: "triage-remediate",
      id: "spectrum-video-sender",
      title: "Mysterious 5 GHz Interference",
      description:
        "An executive boardroom has persistent 5 GHz Wi-Fi issues despite clean 2.4 GHz. The spectrum analyzer shows a continuous wideband signal on channels 149-161 that is not from any detected AP.",
      evidence: [
        {
          type: "log",
          content:
            "Spectrum Analyzer (5 GHz UNII-3):\nChannel 149 (5745 MHz): Continuous signal, -45 dBm\nChannel 153 (5765 MHz): Continuous signal, -42 dBm\nChannel 157 (5785 MHz): Continuous signal, -48 dBm\nChannel 161 (5805 MHz): Continuous signal, -50 dBm\n\nSignal characteristics:\n  Bandwidth: ~80 MHz continuous (5745-5825 MHz)\n  Modulation: Proprietary (non-802.11)\n  Duty cycle: 95%+ (nearly always on)\n  Pattern: Consistent, not bursty",
          icon: "alert",
        },
        {
          type: "log",
          content:
            "AP scan for rogue devices:\n  No rogue APs detected on UNII-3\n  Signal is non-802.11 (no beacon frames)\n\nRoom inventory:\n  1x 85\" display with wireless HDMI transmitter (brand: Barco ClickShare)\n  2x wireless presentation pads\n  Conference speakerphone (Bluetooth)\n  AV control system (Crestron, wired Ethernet)",
        },
        {
          type: "log",
          content:
            "Correlation test:\n  Display powered off: 5 GHz interference STOPS\n  Display powered on, ClickShare idle: Interference PRESENT\n  Display powered on, ClickShare active: Interference PRESENT\n\nConclusion: Wireless HDMI/presentation system transmitter\noperates continuously in the UNII-3 band at high power.",
        },
      ],
      classifications: [
        { id: "cls-wireless-av", label: "Wireless AV Equipment", description: "Wireless HDMI/presentation system using UNII-3 band continuously" },
        { id: "cls-rogue-ap", label: "Hidden Rogue AP", description: "An undiscovered rogue AP broadcasting in UNII-3" },
        { id: "cls-military", label: "External Interference", description: "Military or government radar on UNII-3 frequencies" },
        { id: "cls-ap-radio", label: "AP Radio Failure", description: "AP 5 GHz radio generating self-interference" },
      ],
      correctClassificationId: "cls-wireless-av",
      remediations: [
        { id: "rem-move-channel", label: "Move the boardroom AP to UNII-1 channels (36-48)", description: "Avoid the UNII-3 band occupied by the wireless presentation system" },
        { id: "rem-replace-av", label: "Replace wireless HDMI with a wired HDMI connection", description: "Eliminate the interference source by going wired" },
        { id: "rem-add-ap", label: "Add another AP to overpower the interference", description: "Deploy a high-power AP to compete with the AV signal" },
        { id: "rem-contact-fcc", label: "File FCC interference complaint", description: "Report the non-802.11 device to the FCC" },
      ],
      correctRemediationId: "rem-move-channel",
      rationales: [
        {
          id: "rat-move-unii1",
          text: "Moving to UNII-1 (36-48) avoids the UNII-3 interference entirely. The wireless AV system is a legitimate unlicensed device and can coexist if Wi-Fi uses different frequencies.",
        },
        {
          id: "rat-not-replace",
          text: "Replacing the AV system is expensive and disruptive to the executive workflow. Channel avoidance is the simpler, immediate solution.",
        },
        {
          id: "rat-not-overpower",
          text: "Adding a high-power AP does not improve SNR when the interference is -42 dBm at close range. The noise source must be avoided, not overpowered.",
        },
      ],
      correctRationaleId: "rat-move-unii1",
      feedback: {
        perfect:
          "Correct! The wireless presentation system owns UNII-3. Moving the Wi-Fi AP to UNII-1 channels provides clean spectrum without disrupting the AV equipment.",
        partial:
          "Right identification, but channel relocation to UNII-1 is the least disruptive fix. The AV system is a legitimate device operating in unlicensed spectrum.",
        wrong:
          "The correlation test proves the wireless AV system causes the interference. It operates legitimately in UNII-3. Moving Wi-Fi to UNII-1 channels avoids the conflict.",
      },
    },
    {
      type: "triage-remediate",
      id: "spectrum-zigbee-iot",
      title: "IoT ZigBee Network Colliding with Wi-Fi",
      description:
        "A smart building with ZigBee IoT sensors on 2.4 GHz is experiencing both Wi-Fi and sensor reliability problems. The spectrum shows dense activity across the 2.4 GHz band.",
      evidence: [
        {
          type: "log",
          content:
            "2.4 GHz Spectrum Overview:\n  Ch 1 (2412 MHz): Wi-Fi AP + ZigBee ch 15 (2425 MHz) OVERLAP\n  Ch 6 (2437 MHz): Wi-Fi AP only - clean\n  Ch 11 (2462 MHz): Wi-Fi AP + ZigBee ch 25 (2475 MHz) OVERLAP\n\nZigBee channels in use: 15, 20, 25, 26\n  Ch 15 (2425 MHz): Overlaps Wi-Fi Ch 1\n  Ch 20 (2450 MHz): Overlaps Wi-Fi Ch 6-11 boundary\n  Ch 25 (2475 MHz): Overlaps Wi-Fi Ch 11\n  Ch 26 (2480 MHz): ABOVE all Wi-Fi channels (CLEAN)",
          icon: "alert",
        },
        {
          type: "log",
          content:
            "ZigBee Coordinator Log:\n  Sensor packet loss: 23% on ch 15, 18% on ch 25\n  Sensor packet loss: 4% on ch 20, 1% on ch 26\n  Retransmissions consuming 40% of ZigBee airtime\n\nWi-Fi AP Log (Ch 1):\n  CRC errors correlated with ZigBee ch 15 transmissions\n  2.4 GHz throughput reduced 15% during sensor reporting intervals",
        },
        {
          type: "log",
          content:
            "IoT deployment: 200 ZigBee sensors (HVAC, occupancy, lighting)\nZigBee coordinator: 4 coordinators on channels 15, 20, 25, 26\nWi-Fi APs: 20 APs on channels 1, 6, 11\n\nNote: ZigBee channel 26 (2480 MHz) is above all Wi-Fi channels\nand shows only 1% packet loss - the only interference-free channel.",
        },
      ],
      classifications: [
        { id: "cls-coexist", label: "Wi-Fi/ZigBee Coexistence Conflict", description: "ZigBee and Wi-Fi channels overlap in the 2.4 GHz band causing mutual interference" },
        { id: "cls-zigbee-fail", label: "ZigBee Hardware Failure", description: "ZigBee coordinators have failing radios" },
        { id: "cls-wifi-power", label: "Wi-Fi Overpowering ZigBee", description: "Wi-Fi transmit power is too high, drowning out ZigBee" },
        { id: "cls-density", label: "Sensor Density", description: "Too many ZigBee sensors on too few channels" },
      ],
      correctClassificationId: "cls-coexist",
      remediations: [
        { id: "rem-move-zigbee", label: "Consolidate all ZigBee sensors to channels 25 and 26", description: "Move ZigBee to channels above Wi-Fi (2475-2480 MHz) where they do not overlap with Wi-Fi channels 1, 6, or 11" },
        { id: "rem-move-wifi", label: "Move all Wi-Fi to 5 GHz only", description: "Abandon 2.4 GHz for Wi-Fi, giving the entire band to ZigBee" },
        { id: "rem-power-down", label: "Reduce Wi-Fi TX power on 2.4 GHz", description: "Lower Wi-Fi power to reduce interference with ZigBee" },
        { id: "rem-thread", label: "Replace ZigBee with Thread/Matter on 2.4 GHz", description: "Migrate to a newer IoT protocol" },
      ],
      correctRemediationId: "rem-move-zigbee",
      rationales: [
        {
          id: "rat-ch25-26",
          text: "ZigBee channels 25 (2475 MHz) and 26 (2480 MHz) sit above Wi-Fi channel 11 (2462 MHz center, ~2474 MHz edge). Moving all ZigBee to these channels eliminates overlap with the 1/6/11 Wi-Fi plan.",
        },
        {
          id: "rat-keep-24",
          text: "Abandoning 2.4 GHz Wi-Fi is too drastic. Many clients still need 2.4 GHz connectivity. ZigBee channel reallocation is a targeted fix.",
        },
        {
          id: "rat-data-proof",
          text: "Channel 26 already shows only 1% packet loss vs 23% on channel 15, proving the coexistence strategy works when ZigBee uses the upper channels.",
        },
      ],
      correctRationaleId: "rat-ch25-26",
      feedback: {
        perfect:
          "Excellent! ZigBee channels 25-26 sit above Wi-Fi channel 11, and the existing data on channel 26 (1% loss) proves this eliminates the coexistence conflict.",
        partial:
          "Right to separate the technologies, but moving ZigBee is less disruptive than eliminating 2.4 GHz Wi-Fi entirely.",
        wrong:
          "The spectrum data proves Wi-Fi and ZigBee overlap on channels 15 and 25. ZigBee channels 25-26 are above all Wi-Fi channels and already show minimal loss.",
      },
    },
  ],
  hints: [
    "DFS radar detection is a legal requirement. Near airports and weather stations, restrict APs to non-DFS channels (UNII-1: 36-48, UNII-3: 149-161).",
    "Wireless AV systems (HDMI transmitters, presentation systems) often use the UNII-3 band continuously. Move Wi-Fi to UNII-1 to avoid coexistence conflicts.",
    "ZigBee channel 26 (2480 MHz) sits above all Wi-Fi channels and provides interference-free IoT operation in mixed 2.4 GHz environments.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Spectrum analysis is the most advanced wireless skill. CWAP-certified engineers who can read spectrum captures command premium consulting rates. RF coexistence is increasingly important as IoT deployments grow.",
  toolRelevance: [
    "MetaGeek Chanalyzer + Wi-Spy",
    "Ekahau Sidekick 2",
    "Cisco CleanAir / Aruba Spectrum Analyzer",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
