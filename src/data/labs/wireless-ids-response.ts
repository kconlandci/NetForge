import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "wireless-ids-response",
  version: 1,
  title: "Respond to Wireless IDS Alerts",
  tier: "advanced",
  track: "wireless-networking",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["wids", "wips", "rogue-ap", "evil-twin", "deauth-attack"],
  description:
    "Respond to wireless intrusion detection system alerts including rogue APs, evil twin attacks, deauthentication floods, and unauthorized client associations.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Classify WIDS alerts to distinguish between rogue APs, evil twins, and legitimate neighboring networks",
    "Determine appropriate containment actions for different wireless threat types",
    "Apply graduated response procedures based on threat severity and impact",
  ],
  sortOrder: 312,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "wids-evil-twin",
      title: "Evil Twin AP Detected",
      description:
        "The WIDS reports an AP broadcasting your corporate SSID but with a different BSSID. Several clients have connected to it. Classify and respond to the threat.",
      evidence: [
        {
          type: "log",
          content:
            "WIDS Alert: ROGUE_AP_SSID_MATCH [CRITICAL]\nTime: 2026-03-27 10:15:33\nRogue BSSID: de:ad:be:ef:ca:fe\nSSID: CorpNet-Secure (MATCHES CORPORATE SSID)\nChannel: 6 (2.4 GHz)\nSignal: -38 dBm (VERY STRONG - likely nearby)\nSecurity: WPA2-Personal (Corporate uses WPA3-Enterprise)\nVendor OUI: Generic (not in approved vendor list)",
          icon: "alert",
        },
        {
          type: "log",
          content:
            "Clients connected to rogue AP:\n  Client MAC          Last Known User     Previous AP\n  aa:11:22:33:44:55   jsmith@corp.com     AP-FLOOR2-03\n  bb:22:33:44:55:66   mjones@corp.com     AP-FLOOR2-01\n  cc:33:44:55:66:77   admin@corp.com      AP-FLOOR2-05\n\n3 corporate clients have associated with the rogue AP.\nDHCP logs show rogue is assigning 192.168.1.x addresses (NOT corporate range).",
        },
        {
          type: "log",
          content:
            "Additional investigation:\n  Deauth frames detected targeting CorpNet-Secure clients\n  Source: de:ad:be:ef:ca:fe (rogue AP BSSID)\n  Deauth reason code: 7 (Class 3 frame from non-associated STA)\n  Rate: 50 deauth frames/sec\n\nAttack pattern: Deauthentication flood forcing clients off\nlegitimate APs, then evil twin captures reconnections.",
        },
      ],
      classifications: [
        { id: "cls-evil-twin", label: "Evil Twin Attack", description: "Active attack using spoofed SSID with deauth flood to capture corporate clients" },
        { id: "cls-neighbor", label: "Neighboring Network", description: "A neighbor coincidentally using the same SSID name" },
        { id: "cls-misconfig", label: "Misconfigured AP", description: "An employee set up a personal AP with the corporate SSID" },
        { id: "cls-test", label: "Authorized Test", description: "Penetration testing team conducting authorized wireless assessment" },
      ],
      correctClassificationId: "cls-evil-twin",
      remediations: [
        { id: "rem-contain", label: "Enable AP containment and locate the physical device", description: "Use WIPS containment (deauth targeting rogue clients) to disconnect victims while physically locating and removing the rogue AP" },
        { id: "rem-block-mac", label: "Block the rogue MAC in the switch port ACL", description: "Add the rogue BSSID to a deny list on all switch ports" },
        { id: "rem-alert-only", label: "Continue monitoring without action", description: "Log the event and watch for escalation" },
        { id: "rem-channel", label: "Change corporate AP channels to avoid the rogue", description: "Move legitimate APs to different channels" },
      ],
      correctRemediationId: "rem-contain",
      rationales: [
        {
          id: "rat-contain",
          text: "AP containment sends targeted deauth frames to clients connected to the rogue, forcing them back to legitimate APs. Physical location and removal of the device stops the attack permanently.",
        },
        {
          id: "rat-not-monitor",
          text: "Three corporate clients are already connected to the rogue AP, potentially exposing credentials. Passive monitoring allows continued data interception.",
        },
        {
          id: "rat-not-channel",
          text: "Changing channels does not stop an evil twin. The attacker follows the SSID, not the channel. Only containment and physical removal are effective.",
        },
      ],
      correctRationaleId: "rat-contain",
      feedback: {
        perfect:
          "Correct! This is an active evil twin with deauth flood. WIPS containment protects clients immediately while the physical device is located and removed.",
        partial:
          "Right to take action, but containment specifically targets clients on the rogue AP. MAC blocking on switches does not help since the rogue is not on your wired network.",
        wrong:
          "With 3 clients already compromised and active deauth flooding, immediate containment is required. Monitoring allows continued credential theft; channel changes are ineffective against evil twins.",
      },
    },
    {
      type: "triage-remediate",
      id: "wids-rogue-wired",
      title: "Rogue AP on Corporate Network",
      description:
        "WIDS detects an unknown AP whose traffic is appearing on the corporate wired network. It is not an evil twin (different SSID) but it is bridging wireless clients onto your LAN.",
      evidence: [
        {
          type: "log",
          content:
            "WIDS Alert: ROGUE_ON_WIRE [HIGH]\nRogue BSSID: 11:22:33:aa:bb:cc\nSSID: 'TP-Link_Guest'\nChannel: 11 (2.4 GHz)\nSecurity: WPA2-Personal\nVendor: TP-Link (consumer grade)\n\nWired detection: MAC 11:22:33:aa:bb:cc seen on switch port Gi1/0/24\nSwitch: SW-FLOOR3-ACCESS\nPort Gi1/0/24: VLAN 10 (corporate data)",
          icon: "alert",
        },
        {
          type: "log",
          content:
            "Switch port investigation:\nSW-FLOOR3# show mac address-table interface gi1/0/24\nMAC Address      VLAN  Type\n11:22:33:aa:bb:cc  10   Dynamic\ndd:ee:ff:00:11:22  10   Dynamic  (wireless client behind rogue)\nee:ff:00:11:22:33  10   Dynamic  (wireless client behind rogue)\n\nPort Gi1/0/24 location: Cube 3-42 (employee workspace)\n802.1X status: Bypassed (port in access mode, no NAC)",
        },
        {
          type: "log",
          content:
            "Risk assessment:\n  - Rogue AP bridges unauthorized devices onto corporate VLAN 10\n  - No 802.1X on the port means any device can connect\n  - Consumer AP has no enterprise security (WPA2-Personal)\n  - Two unknown wireless clients are now on the corporate network\n  - Potential data exfiltration path and policy violation",
        },
      ],
      classifications: [
        { id: "cls-rogue-wired", label: "Wired Rogue AP", description: "Unauthorized AP connected to the corporate network creating an uncontrolled wireless access point" },
        { id: "cls-shadow-it", label: "Shadow IT AP", description: "Employee-installed AP for convenience, no malicious intent but a security risk" },
        { id: "cls-neighbor-bleed", label: "Neighbor Signal Bleed", description: "A nearby office's AP signal detected but not on our network" },
        { id: "cls-sanctioned", label: "Sanctioned Device", description: "An authorized but miscategorized AP" },
      ],
      correctClassificationId: "cls-rogue-wired",
      remediations: [
        { id: "rem-shutdown-nac", label: "Shut down the switch port and enable 802.1X on the floor", description: "Immediately disable port Gi1/0/24 to isolate the rogue, then deploy 802.1X to prevent future unauthorized devices" },
        { id: "rem-notify", label: "Send email to the employee at cube 3-42", description: "Ask the employee to remove the device voluntarily" },
        { id: "rem-vlan-isolate", label: "Move the port to a quarantine VLAN", description: "Isolate the rogue traffic without shutting down the port" },
        { id: "rem-whitelist", label: "Add the rogue to the approved AP list", description: "Approve the consumer AP as a sanctioned device" },
      ],
      correctRemediationId: "rem-shutdown-nac",
      rationales: [
        {
          id: "rat-shutdown",
          text: "Immediate port shutdown stops the unauthorized bridge. Deploying 802.1X prevents future rogue APs by requiring authentication before any device can access the network.",
        },
        {
          id: "rat-not-email",
          text: "Emailing the employee is too slow. Unknown clients are already on the corporate VLAN with potential access to sensitive resources. Immediate isolation is required.",
        },
        {
          id: "rat-not-approve",
          text: "Approving a consumer-grade AP on the corporate network violates security policy. WPA2-Personal lacks enterprise authentication and audit capabilities.",
        },
      ],
      correctRationaleId: "rat-shutdown",
      feedback: {
        perfect:
          "Correct! Immediate port shutdown isolates the threat, and 802.1X deployment prevents future rogue APs. This is the textbook response for a wired rogue AP.",
        partial:
          "Good to isolate, but 802.1X is the preventive control. Without it, another employee can plug in a rogue AP on any port.",
        wrong:
          "A rogue AP bridging onto the corporate VLAN is an immediate security threat. Two unknown clients have network access. Port shutdown and 802.1X are the required response.",
      },
    },
    {
      type: "triage-remediate",
      id: "wids-deauth-flood",
      title: "Deauthentication Flood Attack",
      description:
        "All wireless clients on Floor 1 are experiencing constant disconnections. WIDS shows a massive deauthentication flood targeting all BSSIDs.",
      evidence: [
        {
          type: "log",
          content:
            "WIDS Alert: DEAUTH_FLOOD [CRITICAL]\nTarget BSSIDs: ALL Floor 1 APs (8 BSSIDs)\nDeauth frame rate: 500+ frames/sec per BSSID\nSource MAC: Randomized (changes every 10 frames)\nReason code: 7 (Class 3 frame)\nDuration: Ongoing for 22 minutes\n\nClient impact: 95% of Floor 1 clients disconnected\nAP-FLOOR1-01 through AP-FLOOR1-08 all affected",
          icon: "alert",
        },
        {
          type: "log",
          content:
            "Deauth frame analysis (Wireshark capture):\nFrame 1: Deauth, SA=aa:bb:cc:dd:ee:01, DA=ff:ff:ff:ff:ff:ff, Reason=7\nFrame 2: Deauth, SA=aa:bb:cc:dd:ee:02, DA=ff:ff:ff:ff:ff:ff, Reason=7\nFrame 3: Deauth, SA=aa:bb:cc:dd:ee:03, DA=ff:ff:ff:ff:ff:ff, Reason=7\n...(500 frames/sec with rotating source MACs)...\n\nBroadcast destination = targets ALL clients on the BSSID\nRandomized source MACs = attacker evading MAC filtering\nTool signature: Consistent with aireplay-ng or MDK3/MDK4",
        },
        {
          type: "log",
          content:
            "PMF (802.11w) status on affected SSIDs:\n  CorpNet-Secure: PMF = Disabled\n  Guest: PMF = Disabled\n  IoT: PMF = Disabled\n\nNote: With PMF disabled, deauth frames are unprotected and\nany device can forge them. PMF Required would authenticate\nmanagement frames, making forged deauths detectable and ignorable.",
        },
      ],
      classifications: [
        { id: "cls-deauth-attack", label: "Deauthentication Flood Attack", description: "Deliberate DoS attack using forged deauth frames to disconnect all wireless clients" },
        { id: "cls-ap-failure", label: "AP Radio Failure", description: "Multiple APs experiencing simultaneous radio failures" },
        { id: "cls-firmware-bug", label: "Firmware Bug", description: "AP firmware sending erroneous deauth frames to clients" },
        { id: "cls-wlc-issue", label: "WLC Sending Deauths", description: "Controller sending deauths due to a policy misconfiguration" },
      ],
      correctClassificationId: "cls-deauth-attack",
      remediations: [
        { id: "rem-pmf", label: "Enable PMF (802.11w) Required on all SSIDs", description: "Protected Management Frames authenticate deauth/disassociate frames, making forged frames rejected by clients" },
        { id: "rem-wips-contain", label: "Enable WIPS to contain the attacker", description: "Use WIPS to send counter-deauths targeting the attacker's MAC addresses" },
        { id: "rem-new-channel", label: "Change all AP channels to escape the attack", description: "Move APs to different channels to avoid the deauth frames" },
        { id: "rem-wired", label: "Switch all users to wired connections", description: "Bypass wireless entirely during the attack" },
      ],
      correctRemediationId: "rem-pmf",
      rationales: [
        {
          id: "rat-pmf",
          text: "PMF (802.11w) Required makes deauth frames part of the encrypted session. Forged deauths without the session key are rejected by clients, completely neutralizing this attack vector.",
        },
        {
          id: "rat-wips-limited",
          text: "WIPS counter-deauths are ineffective against randomized source MACs. The attacker rotates MACs faster than WIPS can target them.",
        },
        {
          id: "rat-channel-futile",
          text: "The attacker is targeting all 8 BSSIDs and can scan for the new channels. Channel changes provide only momentary relief.",
        },
      ],
      correctRationaleId: "rat-pmf",
      feedback: {
        perfect:
          "Correct! PMF Required is the definitive defense against deauthentication floods. It cryptographically protects management frames, making forged deauths completely ineffective.",
        partial:
          "Good to identify the attack, but PMF is the permanent architectural fix. WIPS containment is a temporary measure that fails against MAC randomization.",
        wrong:
          "This is a classic deauth flood with randomized MACs. The permanent solution is PMF (802.11w) Required, which cryptographically authenticates management frames.",
      },
    },
  ],
  hints: [
    "Evil twin attacks combine SSID spoofing with deauth floods. WIPS containment targets affected clients while you physically locate the rogue device.",
    "Rogue APs on the wired network are detected by correlating wireless BSSID MACs with switch MAC address tables. Port shutdown and 802.1X are the response.",
    "Protected Management Frames (802.11w/PMF) is the permanent defense against deauthentication attacks, as it cryptographically authenticates management frames.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Wireless security incident response is a critical skill for SOC analysts and wireless security engineers. CWSP certification specifically tests WIDS/WIPS response procedures.",
  toolRelevance: [
    "Cisco wIPS / Aruba RFProtect",
    "Wireshark (802.11 management frame analysis)",
    "Kismet / Aircrack-ng suite (for testing)",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
