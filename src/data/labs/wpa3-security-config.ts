import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "wpa3-security-config",
  version: 1,
  title: "Configure WPA3 Wireless Security",
  tier: "beginner",
  track: "wireless-networking",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["wpa3", "security", "wireless", "encryption", "sae"],
  description:
    "Configure WPA3-Personal and WPA3-Enterprise security settings on wireless access points, including SAE authentication, PMF, and transition mode for mixed environments.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Configure WPA3-Personal with SAE (Simultaneous Authentication of Equals)",
    "Enable Protected Management Frames (PMF) as required by WPA3",
    "Set up WPA3 transition mode for backward compatibility with WPA2 clients",
  ],
  sortOrder: 303,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "wpa3-personal-setup",
      title: "WPA3-Personal Configuration",
      description:
        "A small business is upgrading from WPA2-Personal to WPA3-Personal. All current client devices support WPA3. Configure the SSID security settings for maximum protection.",
      targetSystem: "UniFi Network > WiFi > Security Settings",
      items: [
        {
          id: "security-proto",
          label: "Security Protocol",
          detail: "Wireless security protocol selection",
          currentState: "WPA2 Personal",
          correctState: "WPA3 Personal",
          states: ["Open", "WPA2 Personal", "WPA3 Personal", "WPA2/WPA3 Personal"],
          rationaleId: "rat-wpa3",
        },
        {
          id: "pmf-mode",
          label: "Protected Management Frames (802.11w)",
          detail: "Protects deauth and disassociation frames",
          currentState: "Disabled",
          correctState: "Required",
          states: ["Disabled", "Optional", "Required"],
          rationaleId: "rat-pmf",
        },
        {
          id: "sae-group",
          label: "SAE Group",
          detail: "Elliptic curve group for SAE key exchange",
          currentState: "Group 19 (256-bit)",
          correctState: "Group 19 (256-bit)",
          states: ["Group 19 (256-bit)", "Group 20 (384-bit)", "Group 21 (521-bit)"],
          rationaleId: "rat-sae",
        },
        {
          id: "sae-anti-clog",
          label: "SAE Anti-Clogging Threshold",
          detail: "Max simultaneous SAE exchanges before requiring token",
          currentState: "Disabled",
          correctState: "5",
          states: ["Disabled", "5", "10", "25"],
          rationaleId: "rat-anticlog",
        },
      ],
      rationales: [
        {
          id: "rat-wpa3",
          text: "WPA3-Personal replaces the 4-way handshake PSK with SAE (Dragonfly), providing forward secrecy and protection against offline dictionary attacks.",
        },
        {
          id: "rat-pmf",
          text: "WPA3 mandates Protected Management Frames (PMF/802.11w). PMF prevents deauthentication attacks used in evil twin and handshake capture exploits.",
        },
        {
          id: "rat-sae",
          text: "Group 19 (P-256) is the mandatory default for WPA3 SAE, providing strong security with broad device compatibility.",
        },
        {
          id: "rat-anticlog",
          text: "Anti-clogging tokens prevent DoS attacks on the SAE handshake. A threshold of 5 triggers token-based protection under load.",
        },
      ],
      feedback: {
        perfect:
          "Perfect WPA3-Personal configuration! SAE with required PMF and anti-clogging protection provides robust wireless security.",
        partial:
          "Close, but WPA3 requires PMF to be set to Required (not Optional). Without mandatory PMF, deauth attacks remain possible.",
        wrong:
          "WPA3-Personal requires SAE authentication and mandatory PMF (802.11w). These are non-negotiable components of the WPA3 specification.",
      },
    },
    {
      type: "toggle-config",
      id: "wpa3-transition-mode",
      title: "WPA3 Transition Mode",
      description:
        "The office has a mix of older WPA2-only laptops and newer WPA3-capable phones. Configure transition mode to support both while encouraging WPA3 adoption.",
      targetSystem: "Cisco WLC 9800 > WLANs > Security > Layer 2",
      items: [
        {
          id: "trans-security",
          label: "Security Protocol",
          detail: "WLAN security mode for mixed clients",
          currentState: "WPA2 Personal",
          correctState: "WPA2/WPA3 Personal",
          states: ["WPA2 Personal", "WPA3 Personal", "WPA2/WPA3 Personal"],
          rationaleId: "rat-trans",
        },
        {
          id: "trans-pmf",
          label: "Protected Management Frames",
          detail: "PMF setting for transition mode",
          currentState: "Disabled",
          correctState: "Optional",
          states: ["Disabled", "Optional", "Required"],
          rationaleId: "rat-pmf-opt",
        },
        {
          id: "trans-cipher",
          label: "Pairwise Cipher",
          detail: "Encryption cipher suite",
          currentState: "TKIP+AES",
          correctState: "AES (CCMP-128)",
          states: ["TKIP+AES", "AES (CCMP-128)", "AES (GCMP-256)"],
          rationaleId: "rat-cipher",
        },
      ],
      rationales: [
        {
          id: "rat-trans",
          text: "WPA2/WPA3 transition mode allows WPA2 clients to connect with PSK while WPA3 clients use SAE. This enables gradual migration.",
        },
        {
          id: "rat-pmf-opt",
          text: "In transition mode, PMF must be Optional -- WPA3 clients will negotiate PMF, while WPA2 clients that do not support it can still connect.",
        },
        {
          id: "rat-cipher",
          text: "AES-CCMP is required for both WPA2 and WPA3. TKIP is deprecated and must be removed; GCMP-256 is only for WPA3-Enterprise 192-bit.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! Transition mode with optional PMF and AES-CCMP allows both WPA2 and WPA3 clients to coexist securely.",
        partial:
          "Close -- in transition mode, PMF must be Optional (not Required or Disabled) to support both WPA2 and WPA3 clients.",
        wrong:
          "Transition mode (WPA2/WPA3) with Optional PMF is needed for mixed environments. Required PMF blocks WPA2 clients; Disabled PMF violates WPA3 requirements.",
      },
    },
    {
      type: "toggle-config",
      id: "wpa3-enterprise-config",
      title: "WPA3-Enterprise Setup",
      description:
        "A corporate network requires WPA3-Enterprise with 802.1X authentication. Configure the WLAN for RADIUS-based authentication with AES-GCMP encryption.",
      targetSystem: "Aruba Central > WLANs > Corporate-Secure > Security",
      items: [
        {
          id: "ent-security",
          label: "Security Protocol",
          detail: "Enterprise security mode selection",
          currentState: "WPA2 Enterprise",
          correctState: "WPA3 Enterprise",
          states: ["WPA2 Enterprise", "WPA3 Enterprise", "WPA3 Enterprise 192-bit"],
          rationaleId: "rat-ent-wpa3",
        },
        {
          id: "ent-pmf",
          label: "Protected Management Frames",
          detail: "Management frame protection",
          currentState: "Disabled",
          correctState: "Required",
          states: ["Disabled", "Optional", "Required"],
          rationaleId: "rat-ent-pmf",
        },
        {
          id: "ent-eap",
          label: "EAP Method",
          detail: "Outer EAP tunnel method",
          currentState: "EAP-TTLS",
          correctState: "EAP-TLS",
          states: ["EAP-TTLS", "EAP-TLS", "PEAP", "EAP-FAST"],
          rationaleId: "rat-eap-tls",
        },
        {
          id: "ent-okc",
          label: "Fast Roaming (OKC/FT)",
          detail: "Opportunistic Key Caching or 802.11r",
          currentState: "Disabled",
          correctState: "802.11r (FT)",
          states: ["Disabled", "OKC", "802.11r (FT)", "Both OKC+FT"],
          rationaleId: "rat-roam",
        },
      ],
      rationales: [
        {
          id: "rat-ent-wpa3",
          text: "WPA3-Enterprise strengthens security with consistent 128-bit minimum cryptographic strength and mandatory PMF for all enterprise connections.",
        },
        {
          id: "rat-ent-pmf",
          text: "WPA3-Enterprise requires PMF to be set to Required, protecting management frames from spoofing and deauthentication attacks.",
        },
        {
          id: "rat-eap-tls",
          text: "EAP-TLS provides mutual certificate-based authentication (both server and client), offering the strongest enterprise authentication without password vulnerabilities.",
        },
        {
          id: "rat-roam",
          text: "802.11r Fast Transition reduces roaming latency to under 50ms by pre-authenticating with target APs, essential for voice and real-time applications.",
        },
      ],
      feedback: {
        perfect:
          "Perfect enterprise configuration! WPA3-Enterprise with EAP-TLS, required PMF, and 802.11r provides top-tier security with fast roaming.",
        partial:
          "Good start, but verify that PMF is Required (mandatory for WPA3-Enterprise) and consider EAP-TLS for the strongest authentication.",
        wrong:
          "WPA3-Enterprise mandates PMF Required and benefits greatly from certificate-based EAP-TLS. Password-based EAP methods are weaker against credential attacks.",
      },
    },
  ],
  hints: [
    "WPA3 replaces PSK with SAE (Simultaneous Authentication of Equals), which provides forward secrecy and offline attack protection.",
    "Protected Management Frames (PMF/802.11w) is mandatory for WPA3 but must be set to Optional in transition mode for WPA2 compatibility.",
    "EAP-TLS uses certificates on both client and server, eliminating password-based vulnerabilities in enterprise wireless.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "WPA3 adoption is accelerating across enterprises. Understanding SAE, PMF, and transition mode is increasingly tested on CompTIA Security+ and CWSP certifications.",
  toolRelevance: [
    "Cisco WLC / Aruba Central / UniFi Controller",
    "RADIUS server (FreeRADIUS, NPS)",
    "Wireshark (EAPOL frame analysis)",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
