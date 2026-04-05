import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "wireless-site-survey",
  version: 1,
  title: "Analyze Wireless Site Survey Results",
  tier: "intermediate",
  track: "wireless-networking",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["site-survey", "heatmap", "coverage", "design", "ekahau"],
  description:
    "Interpret site survey heatmaps and measurement data to identify coverage gaps, excessive overlap, and channel interference requiring design adjustments.",
  estimatedMinutes: 14,
  learningObjectives: [
    "Interpret signal strength heatmaps to identify coverage gaps and excessive overlap",
    "Analyze SNR and channel utilization data to diagnose performance issues",
    "Recommend AP adjustments based on survey findings",
  ],
  sortOrder: 306,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "survey-coverage-gap",
      title: "Coverage Gap in East Wing",
      objective:
        "Post-deployment survey reveals a dead zone in the east wing stairwell and adjacent hallway. Determine the cause and corrective action.",
      investigationData: [
        {
          id: "src-heatmap",
          label: "Signal Strength Heatmap Data",
          content:
            "East Wing Measurements (5 GHz):\n  Hallway E1: -58 dBm (good)\n  Hallway E2: -72 dBm (marginal)\n  Stairwell E: -85 dBm (DEAD ZONE)\n  Conference E3: -63 dBm (good)\n  Office E4: -80 dBm (poor)\n\nNearest AP: AP-EAST-1 (mounted in hallway E1)\nDistance to stairwell: 90 feet through 2 concrete walls\nConcrete wall attenuation: ~12 dB per wall",
          isCritical: true,
        },
        {
          id: "src-design",
          label: "Original Design vs. As-Built",
          content:
            "Design Document:\n  AP-EAST-2 planned for hallway E2 (never installed)\n  Reason: Ethernet drop not available at planned location\n  Workaround: None applied\n\nAs-Built AP count: 11 (design called for 12)\nMissing: AP-EAST-2",
        },
        {
          id: "src-client-reports",
          label: "Help Desk Tickets (Last 30 Days)",
          content:
            "Ticket #4421: \"No Wi-Fi in east stairwell\" - Nurse, 3/15\nTicket #4455: \"Calls drop near room E4\" - Doctor, 3/18\nTicket #4489: \"Cannot connect in east hallway\" - Admin, 3/22\nTicket #4501: \"Badge reader offline in stairwell\" - Security, 3/25\n\nAll tickets map to the east wing dead zone area.",
        },
      ],
      actions: [
        { id: "act-install", label: "Install the missing AP-EAST-2 at an alternative location near hallway E2 with a new Ethernet run" },
        { id: "act-power", label: "Increase AP-EAST-1 transmit power to maximum to cover the gap" },
        { id: "act-repeater", label: "Deploy a wireless repeater in the stairwell" },
        { id: "act-relocate", label: "Relocate AP-EAST-1 to the stairwell to center coverage" },
      ],
      correctActionId: "act-install",
      rationales: [
        {
          id: "rat-install",
          text: "The missing AP-EAST-2 was designed to cover this area. Installing it at an alternative location with a new cable run restores the intended coverage pattern without disrupting existing cells.",
        },
        {
          id: "rat-power-bad",
          text: "Increasing power cannot overcome 24+ dB of concrete wall attenuation. It also creates asymmetric links and increases interference with neighboring APs.",
        },
        {
          id: "rat-repeater-bad",
          text: "Wireless repeaters halve throughput and add latency. In an enterprise environment, a wired AP is always preferred over a repeater.",
        },
      ],
      correctRationaleId: "rat-install",
      feedback: {
        perfect:
          "Correct! The missing AP from the original design is the root cause. Installing it with a new cable run restores designed coverage without side effects.",
        partial:
          "Right idea to add coverage, but a wired AP installation (not a repeater) is the enterprise-grade solution for this dead zone.",
        wrong:
          "The survey shows a missing AP from the design. Power increases cannot overcome concrete walls, and repeaters halve throughput. Install the planned AP with a new cable run.",
      },
    },
    {
      type: "investigate-decide",
      id: "survey-excessive-overlap",
      title: "Excessive AP Overlap Causing Sticky Clients",
      objective:
        "Survey shows many areas where 4-5 APs are visible at similar signal strengths. Clients are not roaming properly and throughput is degraded.",
      investigationData: [
        {
          id: "src-overlap-data",
          label: "AP Overlap Analysis",
          content:
            "Test Point: Center of Floor 2 Open Office\n  APs visible (RSSI > -67 dBm):\n    AP-F2-N:  -42 dBm (channel 36)\n    AP-F2-NE: -48 dBm (channel 40)\n    AP-F2-E:  -51 dBm (channel 44)\n    AP-F2-SE: -55 dBm (channel 48)\n    AP-F2-S:  -58 dBm (channel 36)\n  \nDesign target: Max 2-3 APs above -67 dBm at any point\nActual: 5 APs above -67 dBm\nAP spacing: 30 feet (design called for 50 feet)",
          isCritical: true,
        },
        {
          id: "src-roaming-issue",
          label: "Client Roaming Behavior",
          content:
            "Roaming analysis (100 clients, 1 hour):\n  Clients that roamed: 12%\n  Clients stuck to distant AP: 43%\n  Avg connected AP signal: -62 dBm\n  Avg best-available AP signal: -45 dBm\n  Sticky client delta: 17 dB average\n\nClients hold onto the originally associated AP even when closer APs provide 17 dB better signal.",
          isCritical: true,
        },
        {
          id: "src-throughput",
          label: "Throughput Survey",
          content:
            "iPerf3 throughput at test points:\n  Near AP-F2-N: 285 Mbps\n  Center (5 APs overlap): 62 Mbps\n  Expected at center: 200+ Mbps\n  CCI overhead from 5 overlapping cells: ~55% airtime waste",
        },
      ],
      actions: [
        { id: "act-reduce-power", label: "Reduce all AP transmit power by 6 dB to shrink cell sizes and reduce overlap" },
        { id: "act-remove-aps", label: "Remove 2 APs from the floor to match the original 50-foot spacing" },
        { id: "act-band-steer", label: "Enable aggressive band steering to 5 GHz" },
        { id: "act-min-rssi", label: "Set a minimum RSSI threshold of -65 dBm to deauthenticate distant clients" },
      ],
      correctActionId: "act-reduce-power",
      rationales: [
        {
          id: "rat-power-down",
          text: "Reducing transmit power by 6 dB (halving the coverage radius) brings overlap back to the 15-20% design target. This is less disruptive than removing APs and maintains redundancy.",
        },
        {
          id: "rat-remove-risk",
          text: "Removing APs risks creating coverage gaps. Power reduction achieves the same overlap reduction while keeping hardware in place for future capacity needs.",
        },
        {
          id: "rat-rssi-harsh",
          text: "Minimum RSSI deauthentication is aggressive and causes client disconnections. It treats the symptom (sticky clients) not the cause (excessive overlap).",
        },
      ],
      correctRationaleId: "rat-power-down",
      feedback: {
        perfect:
          "Excellent! Reducing TX power by 6 dB shrinks cell radius by ~50%, bringing overlap to design targets without removing hardware or disrupting clients.",
        partial:
          "Right approach, but power reduction is preferred over AP removal. It maintains hardware redundancy while achieving proper cell sizing.",
        wrong:
          "With 5 APs overlapping instead of 2-3, the cells are too large. Reducing transmit power is the standard fix for over-provisioned coverage, not removing APs or forcing client behavior.",
      },
    },
    {
      type: "investigate-decide",
      id: "survey-snr-problem",
      title: "Good Signal, Poor Performance",
      objective:
        "Users report slow Wi-Fi in the manufacturing floor despite strong signal. Survey shows good RSSI but investigate why performance is still poor.",
      investigationData: [
        {
          id: "src-rssi-data",
          label: "RSSI Heatmap",
          content:
            "Manufacturing Floor Signal Measurements:\n  All test points: -45 to -55 dBm (STRONG)\n  Coverage: 100% above -65 dBm threshold\n  APs: 6 units, ceiling-mounted at 20 ft\n  Band: 2.4 GHz Channel 1 (all APs)",
        },
        {
          id: "src-noise-data",
          label: "Noise Floor Measurements",
          content:
            "Noise Floor Heatmap:\n  Near welding stations: -55 dBm (EXTREME noise)\n  Near CNC machines: -65 dBm (high noise)\n  Near assembly line: -72 dBm (moderate noise)\n  Office area adjacent: -88 dBm (normal)\n\nSNR Calculation:\n  Near welders: RSSI -48 dBm, Noise -55 dBm = SNR 7 dB (UNUSABLE)\n  Near CNC: RSSI -50 dBm, Noise -65 dBm = SNR 15 dB (POOR)\n  Assembly: RSSI -52 dBm, Noise -72 dBm = SNR 20 dB (MARGINAL)",
          isCritical: true,
        },
        {
          id: "src-equipment",
          label: "Manufacturing Equipment RF Survey",
          content:
            "Industrial EMI Sources Detected:\n  Arc welders (3 stations): Broadband 2.4 GHz emissions, -55 dBm at 20 ft\n  CNC motor drives: Variable frequency drives emit at harmonics of switching freq\n  Conveyor motors: Minimal RF emission\n\nNote: All emissions are in the 2.4 GHz ISM band\n5 GHz spectrum: Clean (-90 dBm noise floor throughout)",
          isCritical: true,
        },
      ],
      actions: [
        { id: "act-5ghz", label: "Move all manufacturing floor APs to 5 GHz only to escape the 2.4 GHz industrial noise" },
        { id: "act-more-aps", label: "Add more 2.4 GHz APs closer to client devices" },
        { id: "act-shield", label: "Install RF shielding around welding stations" },
        { id: "act-power-up", label: "Increase AP power to improve SNR" },
      ],
      correctActionId: "act-5ghz",
      rationales: [
        {
          id: "rat-5ghz-clean",
          text: "The 5 GHz band has a clean noise floor (-90 dBm) throughout the facility. Moving to 5 GHz immediately improves SNR from 7-15 dB to 35-45 dB, solving the performance problem.",
        },
        {
          id: "rat-more-aps-bad",
          text: "Adding APs does not reduce the noise floor. More 2.4 GHz radios in a noisy environment just increases co-channel interference alongside the industrial EMI.",
        },
        {
          id: "rat-power-snr",
          text: "Increasing AP power raises signal and noise together (noise is local). SNR does not improve. Only moving to a clean frequency band fixes the SNR problem.",
        },
      ],
      correctRationaleId: "rat-5ghz-clean",
      feedback: {
        perfect:
          "Perfect analysis! The 5 GHz band is clean while 2.4 GHz is flooded with industrial EMI. Migrating to 5 GHz transforms SNR from unusable (7 dB) to excellent (35+ dB).",
        partial:
          "Right to move off 2.4 GHz, but the key insight is that SNR -- not RSSI -- determines usable throughput. Strong signal means nothing when noise is equally strong.",
        wrong:
          "RSSI is meaningless without considering noise. The SNR of 7-15 dB on 2.4 GHz is unusable regardless of signal strength. The 5 GHz band is clean and solves the problem immediately.",
      },
    },
  ],
  hints: [
    "A coverage gap in a survey usually indicates a missing AP from the original design or unexpected building material attenuation.",
    "When more than 3 APs are visible above -67 dBm at a single point, reduce transmit power rather than remove APs.",
    "SNR (signal minus noise) determines actual throughput. Strong RSSI with high noise results in poor performance -- always check both.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Site surveys are a billable professional service. Wireless engineers who can interpret survey data and make design adjustments command premium rates. This skill is central to CWDP certification.",
  toolRelevance: [
    "Ekahau Pro / AI Pro",
    "NetSpot / VisiWave",
    "Fluke AirCheck G3",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
