import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "high-density-wifi-design",
  version: 1,
  title: "Design High-Density Wi-Fi for Large Venues",
  tier: "advanced",
  track: "wireless-networking",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["high-density", "stadium", "venue", "capacity", "design"],
  description:
    "Design and triage high-density Wi-Fi deployments for stadiums, convention centers, and auditoriums where thousands of devices compete for wireless resources simultaneously.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Calculate AP density and channel plans for venues with 1000+ simultaneous clients",
    "Triage capacity-related issues in high-density Wi-Fi deployments",
    "Apply advanced techniques like cell sizing, band steering, and airtime fairness for venue environments",
  ],
  sortOrder: 314,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "hd-stadium-capacity",
      title: "Stadium Wi-Fi Capacity Crisis",
      description:
        "A 20,000-seat stadium deployed 50 APs but users report unusable Wi-Fi during events. Each AP serves 400 clients -- far beyond recommended density. Triage the capacity failure.",
      evidence: [
        {
          type: "log",
          content:
            "WLC Dashboard Summary (Game Day):\n  Total connected clients: 12,847\n  Total APs: 50\n  Avg clients per AP: 257\n  Peak clients per AP: 412\n  Recommended max per AP: 50-75 for high-density\n\nThroughput metrics:\n  Avg per-client throughput: 0.8 Mbps\n  Target per-client throughput: 5 Mbps\n  Channel utilization (avg): 96%\n  Retry rate (avg): 58%",
          icon: "alert",
        },
        {
          type: "log",
          content:
            "AP Placement Analysis:\n  Current: 50 APs in ceiling, omnidirectional antennas\n  Coverage cell: ~100 ft radius per AP\n  Overlap: Minimal (large cells, few APs)\n\nRequired for high-density:\n  Target: 25-50 clients per AP\n  APs needed: 12,847 / 50 = ~257 APs minimum\n  Antenna: Directional, under-seat or under-chair mounting\n  Cell size: 15-20 ft radius (small cells)",
        },
        {
          type: "log",
          content:
            "Channel plan assessment:\n  2.4 GHz: 3 non-overlapping channels (1, 6, 11)\n  5 GHz: 25 channels (with DFS)\n  5 GHz non-DFS: 8 channels\n  6 GHz (Wi-Fi 6E): 59 channels (if upgraded)\n\nCurrent plan: All APs on 5 GHz channels 36, 40, 44, 48\nOnly 4 channels used with 50 APs = ~12 APs per channel\nCo-channel interference: SEVERE",
        },
      ],
      classifications: [
        { id: "cls-underdeploy", label: "Severe Under-Deployment", description: "50 APs for 12,800 clients is 5x under-provisioned for high-density requirements" },
        { id: "cls-interference", label: "Co-Channel Interference", description: "Too many APs sharing too few channels" },
        { id: "cls-bandwidth", label: "Bandwidth Bottleneck", description: "Insufficient internet backhaul for user demand" },
        { id: "cls-ap-failure", label: "AP Overload Failure", description: "APs crashing due to client count exceeding hardware limits" },
      ],
      correctClassificationId: "cls-underdeploy",
      remediations: [
        { id: "rem-redesign", label: "Deploy 250+ small-cell APs with directional antennas at reduced power", description: "Redesign with under-seat AP mounting, directional antennas creating 15-ft cells, and a complete channel plan across all available 5 GHz + 6 GHz channels" },
        { id: "rem-limit-clients", label: "Limit connections to 50 per AP", description: "Set max client association limits on each AP" },
        { id: "rem-add-50", label: "Add 50 more ceiling-mounted APs", description: "Double the AP count to 100 with the same mounting approach" },
        { id: "rem-upgrade-ax", label: "Upgrade to Wi-Fi 6E APs only", description: "Replace all APs with 6 GHz-capable models" },
      ],
      correctRemediationId: "rem-redesign",
      rationales: [
        {
          id: "rat-redesign",
          text: "High-density venues require 250+ small-cell APs with directional antennas at low power (5-10 dBm). This creates cells serving 25-50 clients each, matching the venue's 12,800+ concurrent user demand.",
        },
        {
          id: "rat-not-limit",
          text: "Limiting to 50 clients per AP with only 50 APs means only 2,500 of 12,800 users get service. The venue is fundamentally under-provisioned.",
        },
        {
          id: "rat-not-double",
          text: "100 ceiling-mounted APs with omni antennas still creates oversized cells. High-density design requires small cells with directional antennas at low power, not more large-cell APs.",
        },
      ],
      correctRationaleId: "rat-redesign",
      feedback: {
        perfect:
          "Excellent! Stadium Wi-Fi requires 250+ small-cell APs with directional antennas. The under-seat mounting approach at low power creates tiny cells serving 25-50 clients each.",
        partial:
          "Right that more APs are needed, but the mounting approach must change. Under-seat directional antennas at low power are essential for stadium-scale density.",
        wrong:
          "50 APs for 12,800 clients is a fundamentally flawed design. High-density venues need 250+ small-cell APs with directional antennas creating 15-ft coverage cells.",
      },
    },
    {
      type: "triage-remediate",
      id: "hd-airtime-fairness",
      title: "Slow Clients Degrading Performance",
      description:
        "In a convention center Wi-Fi deployment, a few legacy 802.11n clients are consuming excessive airtime, dragging down throughput for all 802.11ax clients on the same AP.",
      evidence: [
        {
          type: "log",
          content:
            "AP-CONV-12 Client Mix:\n  802.11ax clients: 38 (92% of clients)\n  802.11n clients: 3 (8% of clients)\n\nAirtime Usage:\n  802.11ax clients: 35% of total airtime (avg 0.9% each)\n  802.11n clients: 55% of total airtime (avg 18.3% each)\n  Management overhead: 10%\n\n3 legacy clients consume 55% of airtime while 38 modern\nclients share only 35%. This is the airtime fairness problem.",
          icon: "alert",
        },
        {
          type: "log",
          content:
            "Throughput impact:\n  802.11ax client avg: 12 Mbps (expected: 50+ Mbps)\n  802.11n client avg: 8 Mbps\n  AP aggregate: ~500 Mbps capacity\n\n802.11n transmits at lower MCS rates (MCS 0-7), taking 8-10x\nlonger per frame than 802.11ax (MCS 0-11, wider channels).\nEach legacy frame blocks the medium for all other clients.",
        },
        {
          type: "log",
          content:
            "Band steering status: Disabled\nMinimum RSSI: Not configured\nData rate configuration:\n  2.4 GHz: All rates enabled (1-54 Mbps)\n  5 GHz: All rates enabled (6-1200 Mbps)\n  Minimum data rate: 1 Mbps (NOT set)\n\nBand steering would push 802.11n clients to 2.4 GHz.\nDisabling low data rates forces minimum MCS levels.",
        },
      ],
      classifications: [
        { id: "cls-airtime", label: "Airtime Fairness Imbalance", description: "Legacy clients consume disproportionate airtime due to lower data rates" },
        { id: "cls-capacity", label: "AP Capacity Exceeded", description: "Too many clients on this AP regardless of type" },
        { id: "cls-interference", label: "RF Interference", description: "External interference causing retransmissions" },
        { id: "cls-config", label: "AP Misconfiguration", description: "AP radio settings not optimized" },
      ],
      correctClassificationId: "cls-airtime",
      remediations: [
        { id: "rem-airtime-fix", label: "Disable low data rates (below 12 Mbps) and enable band steering", description: "Set minimum data rate to 12 Mbps on 5 GHz and enable band steering to push capable clients to 5 GHz, reducing legacy airtime consumption" },
        { id: "rem-ban-legacy", label: "Block all 802.11n clients from the 5 GHz SSID", description: "Prevent legacy clients from associating on 5 GHz" },
        { id: "rem-separate-ssid", label: "Create a dedicated legacy SSID on 2.4 GHz", description: "Move all legacy clients to their own SSID" },
        { id: "rem-qos", label: "Enable WMM QoS to prioritize 802.11ax traffic", description: "Use QoS to give priority to modern clients" },
      ],
      correctRemediationId: "rem-airtime-fix",
      rationales: [
        {
          id: "rat-rates-steering",
          text: "Disabling rates below 12 Mbps prevents the slowest transmissions that consume the most airtime. Band steering moves dual-band clients to 5 GHz. Together, these reduce legacy airtime impact from 55% to under 15%.",
        },
        {
          id: "rat-not-ban",
          text: "Completely blocking 802.11n clients may disconnect legitimate users. Raising the minimum data rate achieves the same airtime efficiency without refusing connections.",
        },
        {
          id: "rat-not-qos",
          text: "WMM QoS prioritizes traffic types (voice, video) not client capabilities. It does not solve the airtime consumption disparity between legacy and modern clients.",
        },
      ],
      correctRationaleId: "rat-rates-steering",
      feedback: {
        perfect:
          "Perfect! Disabling low data rates and enabling band steering are the standard high-density optimizations. They reduce legacy airtime impact without refusing connections.",
        partial:
          "Right direction, but both changes are needed together. Minimum data rates alone help, but band steering further separates client types by capability.",
        wrong:
          "The data shows 3 legacy clients consuming 55% of airtime. Disabling low data rates (below 12 Mbps) and band steering are the proven solutions for this high-density problem.",
      },
    },
    {
      type: "triage-remediate",
      id: "hd-dhcp-exhaustion",
      title: "DHCP Pool Exhaustion at Conference",
      description:
        "During a 5,000-person technology conference, Wi-Fi stops working for new clients. Connected clients retain access but no new devices can obtain an IP address.",
      evidence: [
        {
          type: "log",
          content:
            "DHCP Server Log:\n2026-03-27 10:45:22 DHCPDISCOVER from aa:bb:cc:11:22:33 via 10.50.0.1\n2026-03-27 10:45:22 DHCPNAK: pool 10.50.0.0/22 exhausted (0 available)\n2026-03-27 10:45:23 DHCPDISCOVER from dd:ee:ff:44:55:66 via 10.50.0.1\n2026-03-27 10:45:23 DHCPNAK: pool 10.50.0.0/22 exhausted (0 available)\n\nPool: 10.50.0.0/22 = 1,022 usable addresses\nLeased: 1,022 / 1,022 (100% EXHAUSTED)\nLease time: 8 hours (default)\nActive devices: ~3,200 (many have multiple devices)",
          icon: "alert",
        },
        {
          type: "log",
          content:
            "Lease analysis:\n  Active leases with traffic in last 5 min: 847\n  Stale leases (no traffic for 2+ hours): 175\n  Total leased: 1,022\n\n  Problem: 8-hour lease time means devices that left hours ago\n  still hold IP addresses. With 5,000 attendees averaging\n  2 devices each, the /22 pool (1,022 IPs) is far too small.\n\n  Required pool size: 5,000 users x 2 devices = 10,000 IPs\n  Recommended: /18 subnet (16,382 usable) or multiple /22 pools",
        },
        {
          type: "log",
          content:
            "Conference schedule:\n  8:00 AM - Registration opens (rapid influx)\n  9:00 AM - Keynote (peak density in main hall)\n  12:00 PM - Lunch (shift to food court Wi-Fi)\n  5:00 PM - Sessions end (devices leave but hold leases)\n\nDevice churn is HIGH - attendees move between areas,\ndevices sleep/wake, and many leave mid-day but leases persist.",
        },
      ],
      classifications: [
        { id: "cls-dhcp", label: "DHCP Pool Exhaustion", description: "IP address pool too small for the number of devices with lease times too long" },
        { id: "cls-rogue-dhcp", label: "Rogue DHCP Server", description: "An unauthorized DHCP server is handing out conflicting addresses" },
        { id: "cls-dns", label: "DNS Failure", description: "DNS resolution failing, making it appear like no connectivity" },
        { id: "cls-auth", label: "Authentication Overload", description: "Captive portal server overwhelmed by concurrent auth requests" },
      ],
      correctClassificationId: "cls-dhcp",
      remediations: [
        { id: "rem-expand-short", label: "Expand the DHCP pool to /18 and reduce lease time to 30 minutes", description: "Increase pool to 16,382 addresses and set 30-minute leases so departed devices release IPs quickly for new clients" },
        { id: "rem-expand-only", label: "Expand pool to /18 with default 8-hour leases", description: "Add more IP addresses but keep the current lease time" },
        { id: "rem-static", label: "Assign static IPs to all registered attendees", description: "Pre-assign IPs based on MAC registration" },
        { id: "rem-reboot-dhcp", label: "Restart the DHCP server to clear stale leases", description: "Reboot the DHCP service to reclaim all addresses" },
      ],
      correctRemediationId: "rem-expand-short",
      rationales: [
        {
          id: "rat-pool-lease",
          text: "Both changes are needed: a larger pool (/18 = 16,382 IPs) accommodates peak demand, and 30-minute leases ensure departed devices release addresses quickly for the high-churn conference environment.",
        },
        {
          id: "rat-lease-critical",
          text: "Expanding the pool alone with 8-hour leases still accumulates stale addresses throughout the day. Short leases (15-30 minutes) are standard for high-density event Wi-Fi.",
        },
        {
          id: "rat-no-reboot",
          text: "Restarting DHCP releases all leases, causing every connected client to briefly lose connectivity during renewal. Pool expansion with shorter leases is the non-disruptive fix.",
        },
      ],
      correctRationaleId: "rat-pool-lease",
      feedback: {
        perfect:
          "Correct! High-density events need large DHCP pools AND short lease times. A /18 with 30-minute leases handles 10,000+ devices with rapid turnover.",
        partial:
          "Pool expansion is right, but lease time reduction is equally critical. 8-hour leases in a high-churn environment waste hundreds of addresses on departed devices.",
        wrong:
          "1,022 IPs for 10,000 devices is the core problem. Both a larger pool (/18) and shorter leases (30 minutes) are needed for conference-scale Wi-Fi deployments.",
      },
    },
  ],
  hints: [
    "High-density Wi-Fi design targets 25-50 clients per AP with directional antennas at low power. Stadiums may need 250+ APs for 10,000+ users.",
    "Legacy clients consume disproportionate airtime. Disable data rates below 12 Mbps and enable band steering to mitigate the airtime fairness problem.",
    "Conference Wi-Fi needs large DHCP pools (/18 or larger) with short lease times (15-30 minutes) to handle rapid device turnover.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "High-density Wi-Fi design for venues, stadiums, and conferences is a specialized niche commanding premium consulting fees. It requires advanced knowledge of cell sizing, capacity planning, and RF engineering.",
  toolRelevance: [
    "Ekahau AI Pro (capacity planning)",
    "Cisco DNA Center / Aruba Central",
    "DHCP server monitoring tools",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
