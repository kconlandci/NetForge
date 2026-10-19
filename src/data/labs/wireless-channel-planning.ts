import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "wireless-channel-planning",
  version: 2,
  title: "The AI's Channel Plan",
  tier: "beginner",
  track: "wireless-networking",
  difficulty: "easy",
  accessLevel: "premium",
  tags: ["wifi", "channels", "interference", "2.4ghz", "5ghz", "ai-review", "planning"],
  description:
    "An AI planning tool generated the channel plan for a high-density conference venue and declared it optimized for maximum throughput. Check its assignments against RF reality — overlapping channels, one 5 GHz channel at 160 MHz, and an illegal DFS setting — and correct the plan.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Verify an AI-generated channel plan against the non-overlapping channel rules for 2.4 GHz and 5 GHz",
    "Recognize why maximum channel width (40 MHz in 2.4 GHz, 160 MHz in 5 GHz) destroys channel reuse in dense deployments",
    "Apply correct channel reuse patterns across adjacent and vertically stacked APs",
    "Identify regulatory requirements (DFS radar detection) that a generated plan may casually disable",
  ],
  sortOrder: 301,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "ai-channel-24ghz",
      title: "The AI's 2.4 GHz Plan — Three APs, Zero Separation",
      description:
        "The AI planned 2.4 GHz for three APs covering the venue's main hall in a triangular layout. Its cover note says the channels are 'evenly spaced for balanced coverage.' Check the spacing yourself and fix the assignments.",
      targetSystem: "Cisco WLC 9800 > Wireless > 2.4 GHz Radio Configuration — Main Hall",
      items: [
        {
          id: "ap1-channel",
          label: "AP-HALL-A (Channel)",
          detail: "West end of the hall, nearest to AP-HALL-B. AI assignment: channel 1",
          currentState: "1",
          correctState: "1",
          states: ["Auto", "1", "6", "11"],
          rationaleId: "rat-ch1",
        },
        {
          id: "ap2-channel",
          label: "AP-HALL-B (Channel)",
          detail: "Center of the hall, between the other two APs. AI assignment: channel 4 — which overlaps channels 1 and 6 on both sides",
          currentState: "4",
          correctState: "6",
          states: ["4", "1", "6", "11"],
          rationaleId: "rat-ch6",
        },
        {
          id: "ap3-channel",
          label: "AP-HALL-C (Channel)",
          detail: "East end of the hall, nearest to AP-HALL-B. AI assignment: channel 9 — overlapping the upper half of the band",
          currentState: "9",
          correctState: "11",
          states: ["9", "1", "6", "11"],
          rationaleId: "rat-ch11",
        },
        {
          id: "ap1-width",
          label: "AP-HALL-A (Channel Width)",
          detail: "AI set 40 MHz 'for higher throughput' in a three-AP hall",
          currentState: "40 MHz",
          correctState: "20 MHz",
          states: ["20 MHz", "40 MHz"],
          rationaleId: "rat-width",
        },
        {
          id: "ap2-width",
          label: "AP-HALL-B (Channel Width)",
          detail: "AI set 40 MHz to match its plan-wide 'performance mode'",
          currentState: "40 MHz",
          correctState: "20 MHz",
          states: ["20 MHz", "40 MHz"],
          rationaleId: "rat-width",
        },
      ],
      rationales: [
        {
          id: "rat-ch1",
          text: "Channel 1 (2.412 GHz) is a correct assignment — one of the three non-overlapping 2.4 GHz channels. Even a flawed plan gets individual values right; the review has to check each one.",
        },
        {
          id: "rat-ch6",
          text: "Channel 4 is the classic generated-plan error: it LOOKS evenly spaced between 1 and 9, but 2.4 GHz channels are only 5 MHz apart while each signal is ~20 MHz wide, so channel 4 overlaps both neighbors. Only channels separated by 25 MHz — the 1, 6, 11 set — are truly non-overlapping. Channel 6 is the correct middle assignment.",
        },
        {
          id: "rat-ch11",
          text: "Channel 9 overlaps channel 6 (and would sit on top of the corrected plan). Channel 11 completes the non-overlapping trio.",
        },
        {
          id: "rat-width",
          text: "A 40 MHz channel in 2.4 GHz consumes two of the three usable channel positions, guaranteeing overlap in any multi-AP hall. 'Throughput mode' settings from a generator ignore that the band only has room for one 40 MHz channel. 20 MHz is the standard for multi-AP 2.4 GHz.",
        },
      ],
      feedback: {
        perfect:
          "Correct — you caught the arithmetic the AI's 'evenly spaced' claim was hiding. Channels 1/4/9 look balanced and overlap badly; 1/6/11 at 20 MHz is the plan that works. Generated RF plans fail on physics, not intentions.",
        partial:
          "Some assignments are right, but verify the whole set: only 1, 6, and 11 are non-overlapping in 2.4 GHz, and 40 MHz width cannot coexist with a three-AP channel reuse plan in this band.",
        wrong:
          "Even spacing is not non-overlapping. Channels are 5 MHz apart and signals are ~20 MHz wide, so 1/4/9 interfere with each other continuously — and at 40 MHz width there is effectively one usable channel in the whole band. The AI optimized for a phrase ('balanced, high-throughput'), not for the spectrum.",
      },
    },
    {
      type: "toggle-config",
      id: "ai-channel-5ghz",
      title: "The AI's 5 GHz Plan — One Channel, Maximum Width",
      description:
        "For the venue's four 5 GHz APs (two floors, stacked pairs), the AI assigned every AP channel 36 at 160 MHz width, explaining that 'a single high-performance channel simplifies roaming and maximizes speed.' Correct the plan.",
      targetSystem: "Aruba Central > WLAN > Radio Configuration > 5 GHz — Venue Floors 1-2",
      items: [
        {
          id: "ap-floor1a",
          label: "AP-F1-NORTH (5 GHz Channel)",
          detail: "First floor north. AI assignment: 36",
          currentState: "36",
          correctState: "36",
          states: ["36", "40", "44", "149", "153", "157"],
          rationaleId: "rat-unii1",
        },
        {
          id: "ap-floor1b",
          label: "AP-F1-SOUTH (5 GHz Channel)",
          detail: "First floor south, same floor as AP-F1-NORTH. AI assignment: 36 — the same channel as its neighbor",
          currentState: "36",
          correctState: "149",
          states: ["36", "40", "44", "149", "153", "157"],
          rationaleId: "rat-unii3",
        },
        {
          id: "ap-floor2a",
          label: "AP-F2-NORTH (5 GHz Channel)",
          detail: "Second floor north, directly above AP-F1-NORTH. AI assignment: 36 — through the floor slab from the AP below",
          currentState: "36",
          correctState: "153",
          states: ["36", "40", "44", "149", "153", "157"],
          rationaleId: "rat-vertical",
        },
        {
          id: "ap-floor2b",
          label: "AP-F2-SOUTH (5 GHz Channel)",
          detail: "Second floor south, above AP-F1-SOUTH. AI assignment: 36",
          currentState: "36",
          correctState: "44",
          states: ["36", "40", "44", "149", "153", "157"],
          rationaleId: "rat-diagonal",
        },
        {
          id: "channel-width-all",
          label: "Global Channel Width (5 GHz)",
          detail: "AI set 160 MHz plan-wide 'for maximum per-client speed' in a venue that needs channel reuse",
          currentState: "160 MHz",
          correctState: "40 MHz",
          states: ["20 MHz", "40 MHz", "80 MHz", "160 MHz"],
          rationaleId: "rat-5width",
        },
      ],
      rationales: [
        {
          id: "rat-unii1",
          text: "Channel 36 in UNII-1 is a valid anchor assignment with no DFS requirements.",
        },
        {
          id: "rat-unii3",
          text: "Channel 149 (UNII-3) puts the same-floor neighbor as far from channel 36 as the band allows. Four APs blasting one channel means four cells' worth of clients contending on a single collision domain — the opposite of the capacity a venue deploys multiple APs to create.",
        },
        {
          id: "rat-vertical",
          text: "RF passes through floor slabs. A stacked AP on the same channel interferes with the AP below it almost as if they were in the same room. Channel 153 separates it from both the AP below (36) and the one beside it (149).",
        },
        {
          id: "rat-diagonal",
          text: "Channel 44 completes a four-channel reuse pattern (36/149/153/44) where no adjacent or stacked pair shares a channel.",
        },
        {
          id: "rat-5width",
          text: "At 160 MHz there are only two channels in the entire 5 GHz band — a four-AP reuse plan is arithmetically impossible, and high-density venues trade per-client peak speed for many simultaneous clients. 40 MHz gives this layout 4+ usable channels with strong per-client throughput. The AI optimized one client's speedtest at the cost of the venue's capacity.",
        },
      ],
      feedback: {
        perfect:
          "Excellent. You replaced a one-channel, max-width fantasy with a real reuse pattern — 36/149/153/44 at 40 MHz — where every adjacent and stacked pair is separated. Roaming is a controller feature, not a reason to collapse four cells into one collision domain.",
        partial:
          "Better, but check the stacked pairs as well as the floor plans — RF ignores ceilings — and do the width arithmetic: 160 MHz leaves only two channels in the band, so no four-AP plan can reuse it.",
        wrong:
          "One channel at 160 MHz for four APs means every client in the venue shares a single contention domain, and the width choice makes separation impossible even if you wanted it. Dense venues win on reuse: more channels, moderate widths, no adjacent or vertical pair sharing.",
      },
    },
    {
      type: "toggle-config",
      id: "ai-channel-dfs",
      title: "The AI Disabled Radar Detection 'to Avoid Interruptions'",
      description:
        "To add capacity, the AI's plan enables DFS channels (UNII-2 / UNII-2 Extended). Buried in its settings, it also disables radar detection and channel evacuation, noting that 'radar events during venue hours would disrupt service.' Review the DFS configuration.",
      targetSystem: "Meraki Dashboard > Wireless > Radio Settings — Venue DFS Profile",
      items: [
        {
          id: "dfs-enable",
          label: "DFS Channel Usage",
          detail: "Allow use of UNII-2 / UNII-2 Extended channels for extra capacity",
          currentState: "Enabled",
          correctState: "Enabled",
          states: ["Disabled", "Enabled"],
          rationaleId: "rat-dfs-on",
        },
        {
          id: "radar-detect",
          label: "Radar Detection",
          detail: "802.11h radar detection and channel evacuation. The AI disabled it: 'avoids service-disrupting channel changes during events'",
          currentState: "Disabled",
          correctState: "Enabled",
          states: ["Disabled", "Enabled"],
          rationaleId: "rat-radar",
        },
        {
          id: "dfs-recovery",
          label: "DFS Recovery Time",
          detail: "Time before returning to a DFS channel after a radar event. The AI set 'Never' — abandoning DFS capacity after any event",
          currentState: "Never",
          correctState: "30 minutes",
          states: ["Never", "10 minutes", "30 minutes", "60 minutes"],
          rationaleId: "rat-recovery",
        },
        {
          id: "backup-channel",
          label: "DFS Fallback Channel",
          detail: "Non-DFS channel APs move clients to during a radar event. The AI left it unset: 'not needed once radar handling is off'",
          currentState: "None",
          correctState: "36",
          states: ["None", "36", "149", "Auto"],
          rationaleId: "rat-fallback",
        },
      ],
      rationales: [
        {
          id: "rat-dfs-on",
          text: "Enabling DFS channels is the right call — it adds up to 15 non-overlapping 5 GHz channels, which a high-density venue genuinely needs.",
        },
        {
          id: "rat-radar",
          text: "Radar detection on DFS channels is not a feature preference; it is the legal condition of using the band. APs must detect radar and vacate within seconds (FCC/ETSI rules) because these frequencies are shared with weather and military radar. A generated plan that disables it 'to avoid interruptions' is proposing a regulatory violation as an optimization — and no availability argument survives that.",
        },
        {
          id: "rat-recovery",
          text: "Regulation sets the non-occupancy period: 30 minutes before an AP may return to a channel where radar was detected. 'Never' is compliant but throws away the capacity the plan enabled DFS to get; the standard value is 30 minutes.",
        },
        {
          id: "rat-fallback",
          text: "A designated non-DFS fallback channel is what makes radar evacuation a brief channel change instead of a venue-wide outage. The AI removed the fallback precisely because it had disabled the mechanism that needs it — errors in generated plans travel in packs like this.",
        },
      ],
      feedback: {
        perfect:
          "Correct. DFS capacity: yes. Radar detection off: never — it is the legal price of the band, and a smoother event is not a defense the regulator accepts. With detection on, the 30-minute recovery and a named fallback channel turn evacuations into minor events.",
        partial:
          "Mostly right — the decisive item is radar detection. It must be Enabled: operating on DFS channels without it violates FCC/ETSI rules, full stop. With detection restored, set the 30-minute regulatory recovery and give APs a fallback channel.",
        wrong:
          "The AI treated a legal requirement as an optional convenience. DFS spectrum is borrowed from radar services; detection and evacuation are the terms of the loan. Any generated plan that disables a compliance control 'for performance' must be rejected on that item alone, however good the rest looks.",
      },
    },
  ],
  hints: [
    "In the 2.4 GHz band, only channels 1, 6, and 11 are non-overlapping in North America (25 MHz separation). 'Evenly spaced' assignments like 1/4/9 are the tell of a plan nobody checked against the physics.",
    "Channel width is a reuse budget: 160 MHz leaves two channels in 5 GHz, 40 MHz leaves many. Dense venues need reuse more than any single client needs a wider channel.",
    "DFS channels (52-144) require radar detection and a 30-minute non-occupancy period per FCC regulations. A plan that disables radar detection is not an optimization — it is a violation.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Wireless design is where AI planning tools meet physics and regulation, and both are unforgiving of confident approximations. The engineers who can audit a generated plan — channel arithmetic, width budgets, vertical separation, DFS law — will be the ones whose venues work on the night 5,000 attendees all open their phones at once.",
  toolRelevance: [
    "Ekahau Pro / Sidekick",
    "Cisco WLC / Aruba Central / Meraki Dashboard",
    "Wi-Fi scanner (inSSIDer, WiFi Analyzer)",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-10-18",
};

export default lab;
