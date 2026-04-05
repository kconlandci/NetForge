import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "controller-based-wifi",
  version: 1,
  title: "Triage Wireless LAN Controller Issues",
  tier: "advanced",
  track: "wireless-networking",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["wlc", "controller", "capwap", "enterprise", "triage"],
  description:
    "Triage and remediate issues on wireless LAN controllers including AP join failures, CAPWAP tunnel problems, license exhaustion, and high availability failover events.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Diagnose CAPWAP tunnel failures between APs and wireless controllers",
    "Triage WLC high availability and AP license exhaustion issues",
    "Remediate controller-based configuration push failures to managed APs",
  ],
  sortOrder: 310,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "wlc-capwap-fail",
      title: "APs Failing to Join Controller",
      description:
        "12 newly installed APs are stuck in 'Discovering' state and cannot join the WLC. Existing APs are functioning normally. Triage the join failure.",
      evidence: [
        {
          type: "log",
          content:
            "WLC# show capwap ap summary\nAP Name          Status       IP            Model\n----------------------------------------------------\nAP-FLOOR1-01     Registered   10.10.1.11    C9120AXI\nAP-FLOOR1-02     Registered   10.10.1.12    C9120AXI\n...(48 registered APs)...\nAP-FLOOR3-01     Discovering  10.10.3.11    C9130AXI\nAP-FLOOR3-02     Discovering  10.10.3.12    C9130AXI\n...(12 APs stuck in Discovering)...",
        },
        {
          type: "log",
          content:
            "WLC# show license summary\nLicense        Usage       Status\n-----------------------------------------\nNetwork-Ess    50/50       IN USE (EXHAUSTED)\nAP-Count       50/50       IN USE (EXHAUSTED)\nDNA-Essentials 50/50       IN USE (EXHAUSTED)\n\n*** WARNING: AP license limit reached. New APs cannot join. ***",
          icon: "alert",
        },
        {
          type: "log",
          content:
            "WLC# debug capwap events enable\n*Mar 27 14:22:15 CAPWAP: Received Discovery Request from 10.10.3.11\n*Mar 27 14:22:15 CAPWAP: Sending Discovery Response to 10.10.3.11\n*Mar 27 14:22:16 CAPWAP: Received Join Request from 10.10.3.11\n*Mar 27 14:22:16 CAPWAP: AP Join DENIED - License count exceeded (50/50)\n*Mar 27 14:22:16 CAPWAP: Sending Join Response (Reject) to 10.10.3.11",
        },
      ],
      classifications: [
        { id: "cls-license", label: "License Exhaustion", description: "AP count license limit has been reached" },
        { id: "cls-network", label: "Network Connectivity", description: "CAPWAP tunnel cannot be established due to routing or firewall" },
        { id: "cls-firmware", label: "Firmware Mismatch", description: "AP firmware incompatible with WLC version" },
        { id: "cls-cert", label: "Certificate Failure", description: "DTLS handshake failing due to certificate issues" },
      ],
      correctClassificationId: "cls-license",
      remediations: [
        { id: "rem-add-license", label: "Purchase and activate additional AP licenses", description: "Add 15+ AP licenses to accommodate the new APs via Cisco Smart Licensing" },
        { id: "rem-reboot", label: "Reboot the WLC", description: "Restart the controller to reset license counters" },
        { id: "rem-deregister", label: "Deregister unused APs", description: "Remove old APs from the controller to free license slots" },
        { id: "rem-ha", label: "Add a second WLC for overflow", description: "Deploy a secondary controller and split the AP load" },
      ],
      correctRemediationId: "rem-add-license",
      rationales: [
        {
          id: "rat-license",
          text: "The debug output explicitly shows 'License count exceeded (50/50)'. Adding 12 APs to a 50-AP license requires purchasing at least 12 additional licenses.",
        },
        {
          id: "rat-not-reboot",
          text: "Rebooting does not increase license counts. The license is enforced in software and persists across restarts.",
        },
        {
          id: "rat-not-deregister",
          text: "Deregistering existing APs would bring down coverage for current users. Purchasing additional licenses is the correct path for a planned expansion.",
        },
      ],
      correctRationaleId: "rat-license",
      feedback: {
        perfect:
          "Correct! The CAPWAP debug clearly shows license exhaustion (50/50). Purchasing additional AP licenses through Smart Licensing resolves the join denial.",
        partial:
          "Right classification, but purchasing new licenses is better than deregistering working APs. Expansion was planned and should be supported with proper licensing.",
        wrong:
          "The debug logs explicitly state 'License count exceeded (50/50)'. This is a licensing problem, not a network, firmware, or certificate issue. Additional AP licenses are needed.",
      },
    },
    {
      type: "triage-remediate",
      id: "wlc-ha-failover",
      title: "WLC High Availability Failover",
      description:
        "The primary WLC failed over to the standby. Some APs reconnected but 15 APs are offline. Users report widespread Wi-Fi outages on Floor 2.",
      evidence: [
        {
          type: "log",
          content:
            "Standby-WLC# show redundancy summary\nRole: ACTIVE (was STANDBY)\nPeer: UNREACHABLE (last seen 14:05:22, 38 min ago)\nFailover reason: Keepalive timeout (3 consecutive misses)\nAPs registered post-failover: 35/50\nAPs missing: 15 (Floor 2 APs)",
        },
        {
          type: "log",
          content:
            "Standby-WLC# show capwap ap summary | include Floor2\nAP-FLOOR2-01  CAPWAP Timeout  10.10.2.11  C9120AXI\nAP-FLOOR2-02  CAPWAP Timeout  10.10.2.12  C9120AXI\n...(15 Floor 2 APs in CAPWAP Timeout state)...\n\nStandby-WLC# show interface summary\nVLAN 10 (Management): UP - 10.10.0.2/24\nVLAN 20 (Floor 2 AP Mgmt): DOWN - Interface not configured\nVLAN 30 (Floor 3 AP Mgmt): UP - 10.10.3.1/24",
          icon: "alert",
        },
        {
          type: "log",
          content:
            "Standby-WLC# show running-config | section interface Vlan20\n% No matching configuration found\n\nPrimary-WLC (offline) had:\n  interface Vlan20\n   ip address 10.10.2.1 255.255.255.0\n   description Floor2-AP-Management\n\nNote: VLAN 20 interface was not synchronized to the standby WLC.",
        },
      ],
      classifications: [
        { id: "cls-sync", label: "Configuration Sync Failure", description: "Standby WLC is missing VLAN 20 interface from config sync" },
        { id: "cls-switch", label: "Switch Port Failure", description: "Floor 2 switch lost uplink connectivity" },
        { id: "cls-ap-hardware", label: "AP Hardware Failure", description: "Floor 2 APs have hardware issues" },
        { id: "cls-dhcp", label: "DHCP Exhaustion", description: "Floor 2 DHCP pool is exhausted" },
      ],
      correctClassificationId: "cls-sync",
      remediations: [
        { id: "rem-add-vlan", label: "Create VLAN 20 interface on the active standby WLC", description: "Manually configure the missing VLAN 20 SVI with IP 10.10.2.1/24 so Floor 2 APs can reach the controller" },
        { id: "rem-reboot-aps", label: "Power cycle all Floor 2 APs", description: "Restart APs to force re-discovery" },
        { id: "rem-restore-primary", label: "Restore the primary WLC immediately", description: "Focus on bringing the original primary back online" },
        { id: "rem-static", label: "Statically configure AP controller IPs", description: "Set each AP to point to the standby WLC IP manually" },
      ],
      correctRemediationId: "rem-add-vlan",
      rationales: [
        {
          id: "rat-vlan-missing",
          text: "The standby WLC is missing the VLAN 20 interface that the primary had. Without this SVI, Floor 2 APs on the 10.10.2.0/24 subnet cannot reach the controller for CAPWAP registration.",
        },
        {
          id: "rat-not-reboot",
          text: "Power cycling APs will not help if the controller has no interface on their subnet. The APs will continue failing to discover the WLC.",
        },
        {
          id: "rat-sync-lesson",
          text: "This highlights the importance of verifying HA configuration sync. VLAN interfaces, WLAN configs, and AP groups must all be synchronized to the standby.",
        },
      ],
      correctRationaleId: "rat-vlan-missing",
      feedback: {
        perfect:
          "Excellent! The missing VLAN 20 interface on the standby WLC is the root cause. Creating it restores Layer 3 reachability for Floor 2 APs to rejoin.",
        partial:
          "Right problem area, but the specific fix is creating the VLAN 20 SVI on the now-active standby WLC. APs cannot join without Layer 3 reachability.",
        wrong:
          "The show running-config confirms VLAN 20 was never synced to the standby. Floor 2 APs need Layer 3 connectivity to the WLC management IP on their subnet.",
      },
    },
    {
      type: "triage-remediate",
      id: "wlc-config-push",
      title: "WLAN Configuration Push Failure",
      description:
        "After adding a new SSID on the WLC, some APs broadcast it but 20 APs show the old SSID list. The new SSID is not appearing on these APs despite being configured on the controller.",
      evidence: [
        {
          type: "log",
          content:
            "WLC# show wlan summary\nWLAN ID  SSID            Status   AP Groups\n1        Corporate       Enabled  default, floor1, floor2, floor3\n2        Guest           Enabled  default, floor1, floor2, floor3\n3        IoT-Sensors     Enabled  default        *** NOT IN floor2, floor3 ***",
        },
        {
          type: "log",
          content:
            "WLC# show ap group-name floor2\nSite: Floor-2\nAP Count: 12\nWLAN IDs: 1, 2\n*** WLAN 3 (IoT-Sensors) not assigned to this AP group ***\n\nWLC# show ap group-name floor3\nSite: Floor-3\nAP Count: 8\nWLAN IDs: 1, 2\n*** WLAN 3 (IoT-Sensors) not assigned to this AP group ***",
          icon: "alert",
        },
        {
          type: "log",
          content:
            "WLC# show ap config wlan AP-FLOOR2-01\nConfigured WLANs:\n  WLAN 1: Corporate (enabled)\n  WLAN 2: Guest (enabled)\n  WLAN 3: Not present\n\nExpected: WLAN 3 should be present on all floor APs for IoT sensor coverage.",
        },
      ],
      classifications: [
        { id: "cls-apgroup", label: "AP Group Assignment", description: "New WLAN not added to the correct AP groups" },
        { id: "cls-radio", label: "Radio Policy", description: "WLAN radio policy preventing broadcast on certain APs" },
        { id: "cls-ap-reboot", label: "AP Needs Reboot", description: "APs need restart to pick up new WLAN config" },
        { id: "cls-wlan-limit", label: "WLAN Limit Reached", description: "Maximum WLAN count per AP has been exceeded" },
      ],
      correctClassificationId: "cls-apgroup",
      remediations: [
        { id: "rem-add-wlan-group", label: "Add WLAN 3 to the floor2 and floor3 AP groups", description: "Assign the IoT-Sensors WLAN to the AP groups serving Floor 2 and Floor 3 APs" },
        { id: "rem-default-group", label: "Move all APs to the default AP group", description: "Use a single AP group so all WLANs apply everywhere" },
        { id: "rem-reboot-aps", label: "Reboot affected APs", description: "Force config refresh by restarting APs" },
        { id: "rem-recreate", label: "Delete and recreate WLAN 3", description: "Remove the WLAN and add it again globally" },
      ],
      correctRemediationId: "rem-add-wlan-group",
      rationales: [
        {
          id: "rat-apgroup",
          text: "WLAN 3 was only added to the 'default' AP group. Floor 2 and Floor 3 APs use their own AP groups (floor2, floor3) which do not include WLAN 3. Adding it to those groups pushes the config immediately.",
        },
        {
          id: "rat-not-default",
          text: "Moving all APs to the default group removes the ability to apply floor-specific configurations. AP groups exist for a reason -- maintain them.",
        },
        {
          id: "rat-no-reboot",
          text: "APs automatically receive WLAN changes when their AP group is updated. No reboot is needed -- the configuration push is immediate.",
        },
      ],
      correctRationaleId: "rat-apgroup",
      feedback: {
        perfect:
          "Perfect! The WLAN was only in the default AP group. Adding it to floor2 and floor3 groups pushes the SSID to all 20 affected APs immediately.",
        partial:
          "Correct issue, but the fix is adding the WLAN to the existing AP groups, not moving APs or rebooting. AP group WLAN membership is the configuration model.",
        wrong:
          "The show output clearly shows WLAN 3 is missing from floor2 and floor3 AP groups. APs only broadcast WLANs assigned to their AP group.",
      },
    },
  ],
  hints: [
    "When APs are stuck in 'Discovering' state, check the CAPWAP debug output for specific rejection reasons like license limits or DTLS failures.",
    "WLC high availability requires all interfaces, WLANs, and AP groups to be synchronized. Missing VLAN interfaces on the standby cause post-failover AP join failures.",
    "APs only broadcast WLANs assigned to their AP group. A new WLAN must be explicitly added to each AP group that should carry it.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "WLC administration is a core skill for enterprise wireless engineers. Cisco, Aruba, and Juniper Mist controllers manage thousands of APs, and troubleshooting join failures and HA events is daily work.",
  toolRelevance: [
    "Cisco WLC 9800 / Catalyst Center",
    "Aruba Mobility Controller / Central",
    "Juniper Mist Dashboard",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
