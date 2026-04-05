import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "wireless-interference-diagnosis",
  version: 1,
  title: "Diagnose Wi-Fi Interference Issues",
  tier: "beginner",
  track: "wireless-networking",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["wifi", "interference", "troubleshooting", "spectrum", "diagnosis"],
  description:
    "Investigate wireless interference complaints by analyzing spectrum data, AP logs, and client diagnostics to identify sources of co-channel, adjacent-channel, and non-Wi-Fi interference.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Distinguish between co-channel, adjacent-channel, and non-Wi-Fi interference",
    "Interpret AP logs and spectrum analyzer output to identify interference sources",
    "Recommend corrective actions based on interference type and severity",
  ],
  sortOrder: 304,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "interference-microwave",
      title: "Break Room Wi-Fi Degradation",
      objective:
        "Users in the break room report Wi-Fi drops every day around 12:00-1:00 PM. Investigate the evidence and determine the interference source.",
      investigationData: [
        {
          id: "src-ap-log",
          label: "AP Event Log (AP-BREAKROOM)",
          content:
            "2026-03-27 12:05:14 [WARN] Channel utilization spike: 2.4GHz Ch6 = 94%\n2026-03-27 12:05:14 [WARN] Noise floor increase: -65 dBm (normal: -90 dBm)\n2026-03-27 12:05:22 [ERR]  CRC errors: 847 in last 60s (normal: <10)\n2026-03-27 12:06:01 [WARN] 14 clients disassociated (reason: excessive retries)\n2026-03-27 12:08:33 [INFO] Noise floor returning to normal: -88 dBm\n2026-03-27 12:15:47 [WARN] Noise floor increase: -62 dBm\n2026-03-27 12:15:52 [ERR]  CRC errors: 1203 in last 60s",
          isCritical: true,
        },
        {
          id: "src-spectrum",
          label: "Spectrum Analyzer Capture (2.4 GHz)",
          content:
            "Frequency sweep 2400-2500 MHz:\n  Ch 1 (2412): Noise floor -90 dBm -- clean\n  Ch 6 (2437): Noise floor -62 dBm -- WIDEBAND INTERFERENCE DETECTED\n    Pattern: Broadband energy 2.420-2.460 GHz\n    Duty cycle: Intermittent (2-4 second bursts)\n    Signature: Frequency-hopping, non-802.11 pattern\n  Ch 11 (2462): Noise floor -85 dBm -- minor bleed from Ch 6 source\n\nSpectral signature matches: MICROWAVE OVEN (2.45 GHz ISM)",
          isCritical: true,
        },
        {
          id: "src-client",
          label: "Client Diagnostic Report",
          content:
            "Device: iPhone 15 Pro\nConnected SSID: CorpWiFi\nBand: 2.4 GHz, Channel 6\nSignal: -52 dBm (strong)\nNoise: -62 dBm (during issue)\nSNR: 10 dB (POOR - minimum 20 dB needed)\nTx Rate: Dropped from 72 Mbps to 6.5 Mbps\nRetries: 67%",
        },
      ],
      actions: [
        { id: "act-microwave", label: "Identify microwave oven as interference source and move AP to channel 1 or 11" },
        { id: "act-rogue", label: "Hunt for a rogue access point on channel 6" },
        { id: "act-replace-ap", label: "Replace the AP -- it has a failing radio" },
        { id: "act-power", label: "Increase AP transmit power to overcome the noise" },
      ],
      correctActionId: "act-microwave",
      rationales: [
        {
          id: "rat-microwave",
          text: "The spectrum analyzer identified a microwave oven signature (2.45 GHz ISM, broadband, intermittent bursts). Moving to channel 1 shifts the AP away from the 2.45 GHz center frequency.",
        },
        {
          id: "rat-not-rogue",
          text: "The interference pattern is non-802.11 (frequency-hopping, wideband). A rogue AP would show as a normal 802.11 signal, not broadband energy.",
        },
        {
          id: "rat-power-bad",
          text: "Increasing transmit power does not reduce the noise floor. The SNR remains poor because the noise source is local and stronger than any AP power increase can overcome.",
        },
      ],
      correctRationaleId: "rat-microwave",
      feedback: {
        perfect:
          "Correct! The broadband 2.45 GHz interference with intermittent bursts during lunch is a classic microwave oven signature. Channel 1 or 11 avoids the worst of it.",
        partial:
          "You identified the right source, but channel change is the immediate fix. Microwave energy centers at 2.45 GHz, so channels 1 and 11 are least affected.",
        wrong:
          "The spectrum data clearly shows non-Wi-Fi broadband interference at 2.45 GHz during lunch hours. This is a textbook microwave oven pattern, not a rogue AP or hardware failure.",
      },
    },
    {
      type: "investigate-decide",
      id: "interference-cochannel",
      title: "Co-Channel Interference in Dense Office",
      objective:
        "Users report slow Wi-Fi despite strong signal strength. Throughput tests show 5-10 Mbps on a 802.11ac network. Investigate the cause of poor performance.",
      investigationData: [
        {
          id: "src-survey",
          label: "Wi-Fi Survey Results",
          content:
            "SSID: OfficeNet\nDetected APs on Channel 36 (5 GHz):\n  AP-FLOOR3-N  BSSID: aa:bb:cc:11:22:33  Signal: -45 dBm\n  AP-FLOOR3-S  BSSID: aa:bb:cc:44:55:66  Signal: -48 dBm\n  AP-FLOOR2-N  BSSID: aa:bb:cc:77:88:99  Signal: -55 dBm\n  AP-FLOOR4-N  BSSID: aa:bb:cc:aa:bb:cc  Signal: -58 dBm\n\nAll 4 APs visible from test location are on channel 36.\nChannel utilization: 87%\nRetry rate: 42%",
          isCritical: true,
        },
        {
          id: "src-controller",
          label: "WLC Channel Configuration",
          content:
            "show advanced 802.11a channel\n  Channel Assignment: STATIC\n  All APs assigned: Channel 36, Width 80 MHz\n  DFS channels: Disabled\n  Auto channel: Disabled\n  Total 5 GHz APs: 24\n  Unique channels in use: 1",
        },
        {
          id: "src-throughput",
          label: "iPerf3 Throughput Test",
          content:
            "$ iperf3 -c 10.1.1.1 -t 30\n[ ID] Interval      Transfer    Bitrate      Retries\n[  5] 0.00-30.00s  22.4 MBytes  6.27 Mbps    1847\n\nExpected for 802.11ac 80MHz: ~400 Mbps\nActual: 6.27 Mbps (1.5% of expected)\nRetries: 1847 (extremely high)",
          isCritical: true,
        },
      ],
      actions: [
        { id: "act-channel-fix", label: "Enable auto-channel assignment and DFS channels to distribute APs across available 5 GHz channels" },
        { id: "act-band-steer", label: "Enable band steering to push clients to 2.4 GHz" },
        { id: "act-upgrade", label: "Upgrade to Wi-Fi 6E APs for 6 GHz band" },
        { id: "act-cable", label: "Recommend wired connections for all users" },
      ],
      correctActionId: "act-channel-fix",
      rationales: [
        {
          id: "rat-cochannel",
          text: "All 24 APs on a single channel creates massive co-channel interference. Enabling auto-channel with DFS spreads APs across 20+ available 5 GHz channels, dramatically reducing contention.",
        },
        {
          id: "rat-band-bad",
          text: "Pushing to 2.4 GHz makes performance worse -- 2.4 GHz has only 3 non-overlapping channels and lower throughput. The problem is channel assignment, not band selection.",
        },
        {
          id: "rat-upgrade-bad",
          text: "Wi-Fi 6E adds channels but the root cause is static channel assignment. Fixing the channel plan on existing hardware will resolve the issue immediately.",
        },
      ],
      correctRationaleId: "rat-cochannel",
      feedback: {
        perfect:
          "Exactly right! 24 APs on one channel is catastrophic co-channel interference. Auto-channel with DFS enables 20+ channels, fixing the root cause.",
        partial:
          "Correct problem identification, but auto-channel with DFS is the most effective fix. Enabling DFS alone adds 15 channels in the 5 GHz band.",
        wrong:
          "The data clearly shows all APs statically assigned to channel 36. This co-channel interference causes 87% utilization and 42% retries. The fix is proper channel distribution.",
      },
    },
    {
      type: "investigate-decide",
      id: "interference-bluetooth",
      title: "Conference Room Bluetooth Interference",
      objective:
        "Video calls in conference rooms experience audio dropouts and screen share freezing. The issue occurs only when the room's Bluetooth peripherals are active.",
      investigationData: [
        {
          id: "src-bt-spectrum",
          label: "2.4 GHz Spectrum During Meeting",
          content:
            "Spectrum Analysis (2400-2483.5 MHz):\n  Bluetooth Classic: 3 active devices detected\n    - Conference speakerphone (BT 4.2)\n    - Wireless presenter remote (BT 4.0)\n    - Wireless keyboard (BT 5.0 LE)\n  Frequency hopping rate: 1600 hops/sec across 79 channels\n  Duty cycle impact on Ch 1: 8% additional utilization\n  Duty cycle impact on Ch 6: 12% additional utilization\n  Duty cycle impact on Ch 11: 7% additional utilization\n  Wi-Fi AP: Channel 6, 20 MHz, 2.4 GHz only",
          isCritical: true,
        },
        {
          id: "src-ap-stats",
          label: "AP Statistics (AP-CONF-ROOM-A)",
          content:
            "Radio: 2.4 GHz, Channel 6\nConnected clients: 12\nAvg RSSI: -55 dBm\nNoise floor: -78 dBm (elevated from -90 dBm baseline)\nChannel utilization: 72% (normal: 30%)\nPhy errors: 234/min (normal: <20)\nAP model: Single-band 2.4 GHz only (legacy)",
        },
        {
          id: "src-client-test",
          label: "Video Call Quality Metrics",
          content:
            "Zoom Quality Dashboard:\n  Avg packet loss: 8.2% (threshold: <1%)\n  Jitter: 45ms (threshold: <30ms)\n  Latency: 125ms (threshold: <150ms)\n  Resolution downgraded: 1080p -> 360p\n  Audio drops: 3 per minute\n  BT speakerphone active: Yes (audio via Bluetooth)",
        },
      ],
      actions: [
        { id: "act-5ghz", label: "Replace legacy AP with a dual-band AP and move clients to 5 GHz" },
        { id: "act-no-bt", label: "Disable all Bluetooth devices in the conference room" },
        { id: "act-ch1", label: "Change the AP from channel 6 to channel 1" },
        { id: "act-qos", label: "Enable WMM QoS prioritization for video traffic" },
      ],
      correctActionId: "act-5ghz",
      rationales: [
        {
          id: "rat-5ghz",
          text: "Moving Wi-Fi to 5 GHz completely eliminates Bluetooth interference since Bluetooth operates exclusively in the 2.4 GHz ISM band. The legacy single-band AP must be replaced.",
        },
        {
          id: "rat-ch-shift",
          text: "Changing channels within 2.4 GHz only reduces Bluetooth impact slightly since BT frequency-hops across the entire 2.4 GHz band (79 channels).",
        },
        {
          id: "rat-no-bt-bad",
          text: "Disabling Bluetooth removes useful conference peripherals. Moving Wi-Fi to 5 GHz allows both technologies to coexist without interference.",
        },
      ],
      correctRationaleId: "rat-5ghz",
      feedback: {
        perfect:
          "Perfect diagnosis! Bluetooth frequency-hops across all of 2.4 GHz. Moving Wi-Fi to 5 GHz with a dual-band AP eliminates the interference entirely.",
        partial:
          "Right direction, but simply changing 2.4 GHz channels does not help since Bluetooth hops across all 79 channels in the 2.4 GHz band.",
        wrong:
          "Bluetooth operates exclusively in 2.4 GHz with frequency hopping across the entire band. No 2.4 GHz channel change can avoid it. Moving Wi-Fi to 5 GHz is the solution.",
      },
    },
  ],
  hints: [
    "Microwave ovens emit broadband interference centered at 2.45 GHz. Channels 1 and 11 are least affected.",
    "Co-channel interference occurs when multiple APs share the same channel. The fix is proper channel distribution, not increased power.",
    "Bluetooth frequency-hops across all 79 channels in the 2.4 GHz band. Moving Wi-Fi to 5 GHz is the only way to fully avoid BT interference.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "RF interference troubleshooting is a daily task for wireless network engineers. Spectrum analyzer proficiency is tested on CWNA/CWAP certifications and valued by employers.",
  toolRelevance: [
    "Spectrum analyzers (MetaGeek Chanalyzer, Ekahau Sidekick)",
    "Wireshark (802.11 frame analysis)",
    "AP management dashboards",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
