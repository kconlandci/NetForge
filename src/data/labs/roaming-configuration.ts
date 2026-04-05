import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "roaming-configuration",
  version: 1,
  title: "Configure Seamless Client Roaming",
  tier: "intermediate",
  track: "wireless-networking",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["roaming", "802.11r", "802.11k", "802.11v", "fast-transition"],
  description:
    "Configure 802.11r Fast Transition, 802.11k Radio Resource Management, and 802.11v BSS Transition to enable seamless roaming for voice and video clients across APs.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Configure 802.11r Fast BSS Transition to reduce roaming handoff time below 50ms",
    "Enable 802.11k neighbor reports so clients discover nearby APs efficiently",
    "Apply 802.11v BSS Transition Management to steer clients to optimal APs",
  ],
  sortOrder: 305,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "roam-voip-floor",
      title: "VoIP Roaming on Hospital Floor",
      description:
        "Nurses using Cisco VoIP handsets experience call drops when walking between AP coverage areas. Current roaming takes 300-500ms causing audio gaps. Configure fast roaming protocols.",
      targetSystem: "Cisco WLC 9800 > WLANs > VoiceNet > Advanced",
      items: [
        {
          id: "ft-enable",
          label: "802.11r Fast Transition",
          detail: "Enables pre-authentication with target APs",
          currentState: "Disabled",
          correctState: "Enabled (Over-the-Air)",
          states: ["Disabled", "Enabled (Over-the-Air)", "Enabled (Over-the-DS)"],
          rationaleId: "rat-ft",
        },
        {
          id: "rrm-enable",
          label: "802.11k Neighbor Reports",
          detail: "APs share neighbor lists with clients",
          currentState: "Disabled",
          correctState: "Enabled",
          states: ["Disabled", "Enabled"],
          rationaleId: "rat-rrm",
        },
        {
          id: "bss-transition",
          label: "802.11v BSS Transition",
          detail: "AP-assisted client steering",
          currentState: "Disabled",
          correctState: "Enabled",
          states: ["Disabled", "Enabled"],
          rationaleId: "rat-bss",
        },
        {
          id: "ft-reassoc",
          label: "FT Reassociation Deadline",
          detail: "Max time allowed for FT reassociation (TUs)",
          currentState: "5000",
          correctState: "1000",
          states: ["1000", "3000", "5000", "10000"],
          rationaleId: "rat-deadline",
        },
        {
          id: "rssi-threshold",
          label: "Minimum RSSI for Roaming Trigger",
          detail: "Signal level below which 802.11v suggests roaming",
          currentState: "-80 dBm",
          correctState: "-70 dBm",
          states: ["-65 dBm", "-70 dBm", "-75 dBm", "-80 dBm"],
          rationaleId: "rat-rssi",
        },
      ],
      rationales: [
        {
          id: "rat-ft",
          text: "802.11r Over-the-Air FT pre-distributes PMK-R1 keys to neighbor APs, reducing roaming from 300ms to under 50ms. Over-the-Air mode works without DS backbone dependency.",
        },
        {
          id: "rat-rrm",
          text: "802.11k neighbor reports tell clients which APs are nearby and their channels, eliminating the need for time-consuming full-band scanning during roaming.",
        },
        {
          id: "rat-bss",
          text: "802.11v BSS Transition Management lets the AP suggest a better AP to the client, proactively steering it before signal degrades too far.",
        },
        {
          id: "rat-deadline",
          text: "A 1000 TU (approximately 1 second) deadline ensures failed FT attempts are quickly abandoned, preventing extended connectivity gaps for VoIP handsets.",
        },
        {
          id: "rat-rssi",
          text: "-70 dBm triggers roaming before voice quality degrades. -80 dBm is too late -- packet loss occurs above -75 dBm for real-time applications.",
        },
      ],
      feedback: {
        perfect:
          "Perfect! 802.11r/k/v together with a -70 dBm roaming trigger ensures VoIP handsets roam seamlessly with under 50ms handoff time.",
        partial:
          "Good progress, but all three protocols (802.11r, k, v) work together. Missing one creates gaps in the roaming experience.",
        wrong:
          "VoIP requires sub-50ms roaming. Without 802.11r pre-authentication and 802.11k neighbor reports, clients perform slow full re-authentication at each AP.",
      },
    },
    {
      type: "toggle-config",
      id: "roam-okc-legacy",
      title: "Legacy Device Roaming with OKC",
      description:
        "Older warehouse scanners do not support 802.11r. Configure Opportunistic Key Caching (OKC) as a fallback roaming mechanism while keeping 802.11r for newer devices.",
      targetSystem: "Aruba Central > WLANs > Warehouse-SSID > Roaming",
      items: [
        {
          id: "okc-enable",
          label: "Opportunistic Key Caching (OKC)",
          detail: "Allows PMKSA caching across APs via controller",
          currentState: "Disabled",
          correctState: "Enabled",
          states: ["Disabled", "Enabled"],
          rationaleId: "rat-okc",
        },
        {
          id: "ft-mode",
          label: "802.11r Fast Transition",
          detail: "FT mode selection",
          currentState: "Enabled (Over-the-Air)",
          correctState: "Enabled (Over-the-Air)",
          states: ["Disabled", "Enabled (Over-the-Air)", "Enabled (Over-the-DS)"],
          rationaleId: "rat-ft-keep",
        },
        {
          id: "ft-compat",
          label: "FT Mixed Mode",
          detail: "Allow non-FT clients on same SSID",
          currentState: "Disabled",
          correctState: "Enabled",
          states: ["Disabled", "Enabled"],
          rationaleId: "rat-mixed",
        },
        {
          id: "pmk-lifetime",
          label: "PMK Cache Lifetime",
          detail: "How long cached keys remain valid",
          currentState: "8 hours",
          correctState: "24 hours",
          states: ["1 hour", "8 hours", "24 hours", "72 hours"],
          rationaleId: "rat-pmk",
        },
      ],
      rationales: [
        {
          id: "rat-okc",
          text: "OKC allows the controller to pre-distribute PMK keys to all APs. Legacy devices that lack 802.11r support can roam with reduced authentication by leveraging cached keys.",
        },
        {
          id: "rat-ft-keep",
          text: "Keep 802.11r enabled for newer devices that support it. FT provides faster roaming than OKC when both client and AP support the protocol.",
        },
        {
          id: "rat-mixed",
          text: "FT Mixed Mode allows non-802.11r clients to associate with the same SSID, avoiding the need for separate SSIDs for legacy devices.",
        },
        {
          id: "rat-pmk",
          text: "24-hour PMK cache lifetime covers a full warehouse shift. Shorter lifetimes force re-authentication mid-shift; longer ones waste memory on stale entries.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! OKC with FT Mixed Mode supports both legacy and modern devices on one SSID with optimized roaming for each.",
        partial:
          "Close -- make sure FT Mixed Mode is enabled so legacy devices can associate without 802.11r support on the same SSID.",
        wrong:
          "Legacy devices need OKC as a fallback. Disabling OKC or forcing 802.11r-only blocks scanners that do not support Fast Transition.",
      },
    },
    {
      type: "toggle-config",
      id: "roam-layer3",
      title: "Layer 3 Roaming Across Subnets",
      description:
        "A multi-building campus has different VLANs per building. Clients roaming between buildings lose IP connectivity. Configure Layer 3 roaming to maintain sessions across subnets.",
      targetSystem: "Cisco WLC 9800 > Mobility > Mobility Groups",
      items: [
        {
          id: "mobility-group",
          label: "Mobility Group",
          detail: "Link controllers for inter-controller roaming",
          currentState: "Not Configured",
          correctState: "campus-mobility",
          states: ["Not Configured", "campus-mobility", "building-a-only"],
          rationaleId: "rat-mobility",
        },
        {
          id: "anchor-mode",
          label: "Mobility Anchoring",
          detail: "Tunnel client traffic to original controller",
          currentState: "Disabled",
          correctState: "Enabled",
          states: ["Disabled", "Enabled"],
          rationaleId: "rat-anchor",
        },
        {
          id: "tunnel-type",
          label: "Mobility Tunnel Encapsulation",
          detail: "Encapsulation method for inter-controller tunnels",
          currentState: "None",
          correctState: "EoIP (Ethernet over IP)",
          states: ["None", "EoIP (Ethernet over IP)", "CAPWAP Data"],
          rationaleId: "rat-tunnel",
        },
        {
          id: "keepalive",
          label: "Mobility Keepalive Interval",
          detail: "Interval between mobility tunnel health checks",
          currentState: "60 seconds",
          correctState: "10 seconds",
          states: ["5 seconds", "10 seconds", "30 seconds", "60 seconds"],
          rationaleId: "rat-keepalive",
        },
      ],
      rationales: [
        {
          id: "rat-mobility",
          text: "A shared mobility group enables controllers in different buildings to exchange client context during roaming, maintaining session state across WLCs.",
        },
        {
          id: "rat-anchor",
          text: "Mobility anchoring tunnels roamed client traffic back to the original controller/subnet, preserving the client IP address and avoiding session disruption.",
        },
        {
          id: "rat-tunnel",
          text: "EoIP tunnels encapsulate Layer 2 frames between controllers, allowing the client to keep its original VLAN and IP address regardless of physical location.",
        },
        {
          id: "rat-keepalive",
          text: "10-second keepalives detect tunnel failures quickly. 60 seconds leaves a long detection gap during which roamed clients lose connectivity silently.",
        },
      ],
      feedback: {
        perfect:
          "Perfect Layer 3 roaming setup! Mobility groups with anchoring and EoIP tunnels let clients seamlessly move between buildings without losing their IP address.",
        partial:
          "Good start, but both mobility group membership and anchoring are required. Without anchoring, clients get a new IP in the destination subnet.",
        wrong:
          "Layer 3 roaming requires mobility groups linking controllers and traffic anchoring to tunnel frames back to the original subnet. Without these, clients lose their IP on building transitions.",
      },
    },
  ],
  hints: [
    "802.11r pre-distributes encryption keys to neighbor APs, reducing roaming handoff from 300ms+ to under 50ms.",
    "OKC (Opportunistic Key Caching) is the fallback for devices that do not support 802.11r -- enable both for mixed environments.",
    "Layer 3 roaming requires mobility anchoring to tunnel traffic back to the original controller and preserve the client IP address.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Roaming configuration is critical for healthcare, warehousing, and campus networks. Poor roaming is the #1 complaint in enterprise wireless and a key area of the CWNA/CCNP Wireless certifications.",
  toolRelevance: [
    "Cisco WLC / Aruba Mobility Controller",
    "Ekahau Connect (roaming analysis)",
    "Wireshark (802.11r FT frame capture)",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
