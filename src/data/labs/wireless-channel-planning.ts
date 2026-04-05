import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "wireless-channel-planning",
  version: 1,
  title: "Configure Non-Overlapping Wireless Channels",
  tier: "beginner",
  track: "wireless-networking",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["wifi", "channels", "interference", "2.4ghz", "5ghz", "planning"],
  description:
    "Plan and configure non-overlapping channel assignments for access points to minimize co-channel interference across 2.4 GHz and 5 GHz bands.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Identify the three non-overlapping channels in the 2.4 GHz band",
    "Configure channel width and assignment to avoid co-channel interference",
    "Apply correct channel plans for multi-AP deployments",
  ],
  sortOrder: 301,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "channel-24ghz-floor",
      title: "2.4 GHz Floor Plan Channel Assignment",
      description:
        "Three APs are deployed on the same office floor in a triangular layout. All are currently set to Auto channel on 2.4 GHz, resulting in co-channel interference. Assign non-overlapping channels.",
      targetSystem: "Cisco WLC 9800 > Wireless > 2.4 GHz Radio Configuration",
      items: [
        {
          id: "ap1-channel",
          label: "AP-LOBBY (Channel)",
          detail: "Lobby area AP, nearest to AP-CONF",
          currentState: "Auto",
          correctState: "1",
          states: ["Auto", "1", "6", "11"],
          rationaleId: "rat-ch1",
        },
        {
          id: "ap2-channel",
          label: "AP-CONF (Channel)",
          detail: "Conference room AP, between AP-LOBBY and AP-OFFICE",
          currentState: "Auto",
          correctState: "6",
          states: ["Auto", "1", "6", "11"],
          rationaleId: "rat-ch6",
        },
        {
          id: "ap3-channel",
          label: "AP-OFFICE (Channel)",
          detail: "Open office AP, nearest to AP-CONF",
          currentState: "Auto",
          correctState: "11",
          states: ["Auto", "1", "6", "11"],
          rationaleId: "rat-ch11",
        },
        {
          id: "ap1-width",
          label: "AP-LOBBY (Channel Width)",
          detail: "2.4 GHz channel width setting",
          currentState: "40 MHz",
          correctState: "20 MHz",
          states: ["20 MHz", "40 MHz"],
          rationaleId: "rat-width",
        },
        {
          id: "ap2-width",
          label: "AP-CONF (Channel Width)",
          detail: "2.4 GHz channel width setting",
          currentState: "40 MHz",
          correctState: "20 MHz",
          states: ["20 MHz", "40 MHz"],
          rationaleId: "rat-width",
        },
      ],
      rationales: [
        {
          id: "rat-ch1",
          text: "Channel 1 (2.412 GHz) is one of the three non-overlapping 2.4 GHz channels, assigned to the first AP in the plan.",
        },
        {
          id: "rat-ch6",
          text: "Channel 6 (2.437 GHz) is separated by 25 MHz from channel 1, providing a non-overlapping assignment for the adjacent AP.",
        },
        {
          id: "rat-ch11",
          text: "Channel 11 (2.462 GHz) completes the non-overlapping trio (1, 6, 11), ensuring no co-channel interference among the three APs.",
        },
        {
          id: "rat-width",
          text: "In 2.4 GHz, 40 MHz channels overlap with adjacent channels and should only be used in isolated environments. 20 MHz is the standard for multi-AP deployments.",
        },
      ],
      feedback: {
        perfect:
          "Perfect! You correctly assigned channels 1, 6, and 11 with 20 MHz width -- the textbook non-overlapping plan for 2.4 GHz multi-AP deployments.",
        partial:
          "Some settings are correct but check that all three APs use different non-overlapping channels (1, 6, 11) and that channel width is set to 20 MHz.",
        wrong:
          "In the 2.4 GHz band, only channels 1, 6, and 11 are non-overlapping. Using Auto or 40 MHz width in a multi-AP environment causes significant co-channel interference.",
      },
    },
    {
      type: "toggle-config",
      id: "channel-5ghz-enterprise",
      title: "5 GHz Enterprise Channel Plan",
      description:
        "Four APs cover a two-story building. Configure 5 GHz channels using UNII-1 and UNII-3 bands with appropriate channel widths for enterprise throughput.",
      targetSystem: "Aruba Central > WLAN > Radio Configuration > 5 GHz",
      items: [
        {
          id: "ap-floor1a",
          label: "AP-F1-NORTH (5 GHz Channel)",
          detail: "First floor north wing",
          currentState: "36",
          correctState: "36",
          states: ["36", "40", "44", "149", "153", "157"],
          rationaleId: "rat-unii1",
        },
        {
          id: "ap-floor1b",
          label: "AP-F1-SOUTH (5 GHz Channel)",
          detail: "First floor south wing",
          currentState: "36",
          correctState: "149",
          states: ["36", "40", "44", "149", "153", "157"],
          rationaleId: "rat-unii3",
        },
        {
          id: "ap-floor2a",
          label: "AP-F2-NORTH (5 GHz Channel)",
          detail: "Second floor north wing, directly above AP-F1-NORTH",
          currentState: "36",
          correctState: "153",
          states: ["36", "40", "44", "149", "153", "157"],
          rationaleId: "rat-vertical",
        },
        {
          id: "ap-floor2b",
          label: "AP-F2-SOUTH (5 GHz Channel)",
          detail: "Second floor south wing, directly above AP-F1-SOUTH",
          currentState: "36",
          correctState: "44",
          states: ["36", "40", "44", "149", "153", "157"],
          rationaleId: "rat-diagonal",
        },
        {
          id: "channel-width-all",
          label: "Global Channel Width (5 GHz)",
          detail: "Applied to all 5 GHz radios",
          currentState: "20 MHz",
          correctState: "40 MHz",
          states: ["20 MHz", "40 MHz", "80 MHz", "160 MHz"],
          rationaleId: "rat-5width",
        },
      ],
      rationales: [
        {
          id: "rat-unii1",
          text: "Channel 36 in UNII-1 band provides reliable indoor coverage without DFS requirements.",
        },
        {
          id: "rat-unii3",
          text: "Channel 149 in UNII-3 is far from channel 36, eliminating any co-channel interference between horizontal neighbors.",
        },
        {
          id: "rat-vertical",
          text: "APs stacked vertically must use different channels. Channel 153 avoids overlap with both ch 36 (below) and ch 149 (adjacent).",
        },
        {
          id: "rat-diagonal",
          text: "Channel 44 provides separation from the AP below (ch 149) and the AP beside it (ch 153), completing the 4-channel reuse pattern.",
        },
        {
          id: "rat-5width",
          text: "40 MHz channels in 5 GHz balance throughput and channel reuse. 80 MHz or 160 MHz would limit the number of non-overlapping channels available for this 4-AP deployment.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! Your channel plan provides maximum separation between all adjacent and vertically stacked APs while using 40 MHz width for good throughput.",
        partial:
          "Your plan has some channel separation but ensure vertically stacked APs also use different channels -- RF leaks between floors.",
        wrong:
          "All APs on the same channel causes severe co-channel interference. Use a reuse pattern spreading across UNII-1 and UNII-3 bands.",
      },
    },
    {
      type: "toggle-config",
      id: "channel-dfs-config",
      title: "DFS Channel Configuration",
      description:
        "The network needs more 5 GHz channels due to high AP density. Configure DFS (Dynamic Frequency Selection) channels while ensuring radar detection is properly enabled for regulatory compliance.",
      targetSystem: "Meraki Dashboard > Wireless > Radio Settings",
      items: [
        {
          id: "dfs-enable",
          label: "DFS Channel Usage",
          detail: "Allow use of UNII-2 / UNII-2 Extended channels",
          currentState: "Disabled",
          correctState: "Enabled",
          states: ["Disabled", "Enabled"],
          rationaleId: "rat-dfs-on",
        },
        {
          id: "radar-detect",
          label: "Radar Detection",
          detail: "802.11h radar detection and channel evacuation",
          currentState: "Enabled",
          correctState: "Enabled",
          states: ["Disabled", "Enabled"],
          rationaleId: "rat-radar",
        },
        {
          id: "dfs-recovery",
          label: "DFS Recovery Time",
          detail: "Time before returning to DFS channel after radar event",
          currentState: "Never",
          correctState: "30 minutes",
          states: ["Never", "10 minutes", "30 minutes", "60 minutes"],
          rationaleId: "rat-recovery",
        },
        {
          id: "backup-channel",
          label: "DFS Fallback Channel",
          detail: "Non-DFS channel to use during radar events",
          currentState: "None",
          correctState: "36",
          states: ["None", "36", "149", "Auto"],
          rationaleId: "rat-fallback",
        },
      ],
      rationales: [
        {
          id: "rat-dfs-on",
          text: "Enabling DFS channels (52-144) adds up to 15 additional non-overlapping channels in 5 GHz, critical for high-density deployments.",
        },
        {
          id: "rat-radar",
          text: "Radar detection is mandatory per FCC/ETSI regulations. APs must vacate DFS channels within 10 seconds of detecting radar signals.",
        },
        {
          id: "rat-recovery",
          text: "30 minutes is the standard non-occupancy period required by regulation before an AP can return to a DFS channel after a radar event.",
        },
        {
          id: "rat-fallback",
          text: "A designated non-DFS fallback channel ensures clients maintain connectivity during radar-triggered channel changes.",
        },
      ],
      feedback: {
        perfect:
          "Perfect configuration! DFS channels are enabled with proper radar detection, regulatory recovery time, and a non-DFS fallback channel.",
        partial:
          "DFS is partially configured. Ensure radar detection stays enabled (it is legally required) and set the 30-minute regulatory recovery timer.",
        wrong:
          "DFS channels require radar detection to be enabled by law. Without proper fallback and recovery settings, clients will lose connectivity during radar events.",
      },
    },
  ],
  hints: [
    "In the 2.4 GHz band, only channels 1, 6, and 11 are non-overlapping in North America (25 MHz separation).",
    "When planning multi-floor deployments, ensure vertically adjacent APs also use different channels -- RF passes through ceilings and floors.",
    "DFS channels (52-144) require radar detection and a 30-minute non-occupancy period per FCC regulations.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Channel planning is a daily task for wireless engineers. Misconfigured channels are the #1 cause of poor Wi-Fi performance in enterprise deployments, making this a core CompTIA Network+ and CWNA skill.",
  toolRelevance: [
    "Ekahau Pro / Sidekick",
    "Cisco WLC / Aruba Central / Meraki Dashboard",
    "Wi-Fi scanner (inSSIDer, WiFi Analyzer)",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
