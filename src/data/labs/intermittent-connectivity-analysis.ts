import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "intermittent-connectivity-analysis",
  version: 1,
  title: "Root-Cause Intermittent Network Failures",

  tier: "advanced",
  track: "network-troubleshooting",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: [
    "intermittent",
    "snmp",
    "interface-counters",
    "logs",
    "troubleshooting",
    "flapping",
  ],

  description:
    "Root-cause intermittent network failures by correlating SNMP traps, interface counters, and syslog entries across multiple devices over time.",
  estimatedMinutes: 25,
  learningObjectives: [
    "Correlate SNMP traps with syslog timestamps to identify failure patterns",
    "Interpret interface error counters to distinguish hardware from configuration issues",
    "Use time-series data to identify intermittent failure root causes",
    "Differentiate between duplex mismatch, bad cabling, and STP reconvergence symptoms",
  ],
  sortOrder: 611,

  status: "published",
  prerequisites: [],

  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "duplex-mismatch-detection",
      title: "Users Report Slow Transfers and Periodic Timeouts on VLAN 20",
      objective:
        "Multiple users on VLAN 20 report slow file transfers and occasional SSH session freezes that last 10-30 seconds before recovering. The issue has been occurring for 3 days since a switch replacement. Investigate the interface counters and logs.",
      investigationData: [
        {
          id: "interface-counters",
          label: "show interfaces GigabitEthernet0/1 on access-sw3 (uplink to dist-sw1)",
          content:
            "GigabitEthernet0/1 is up, line protocol is up (connected)\n  Hardware is Gigabit Ethernet, address is aabb.cc00.0301\n  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec,\n     reliability 255/255, txload 1/255, rxload 1/255\n  Full-duplex, 1000Mb/s, media type is 10/100/1000BaseTX\n  Input queue: 0/75/0/0 (size/max/drops/flushes)\n  5 minute input rate 42351000 bits/sec, 5120 packets/sec\n  5 minute output rate 38200000 bits/sec, 4830 packets/sec\n     2847523 input packets, 1923847523 bytes\n     0 input errors, 0 CRC, 0 frame, 0 overrun\n     4523891 output packets, 2847561234 bytes\n     0 output errors, 0 collisions, 0 late collisions",
        },
        {
          id: "interface-counters-dist",
          label: "show interfaces GigabitEthernet1/0/24 on dist-sw1 (downlink to access-sw3)",
          content:
            "GigabitEthernet1/0/24 is up, line protocol is up (connected)\n  Hardware is Gigabit Ethernet, address is ddee.ff00.1824\n  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,\n     reliability 255/255, txload 12/255, rxload 8/255\n  Half-duplex, 100Mb/s, media type is 10/100/1000BaseTX\n  Input queue: 0/75/23/0 (size/max/drops/flushes)\n  5 minute input rate 38200000 bits/sec, 4830 packets/sec\n  5 minute output rate 42351000 bits/sec, 5120 packets/sec\n     4523891 input packets, 2847561234 bytes\n     0 input errors, 0 CRC, 0 frame, 0 overrun\n     2847523 output packets, 1923847523 bytes\n     38472 output errors, 28341 collisions, 15230 late collisions",
          isCritical: true,
        },
        {
          id: "snmp-traps",
          label: "SNMP trap log (last 24 hours, filtered for dist-sw1 Gi1/0/24)",
          content:
            "2026-03-27 09:14:22 dist-sw1 IF-MIB::linkDown Gi1/0/24\n2026-03-27 09:14:25 dist-sw1 IF-MIB::linkUp Gi1/0/24\n2026-03-27 11:45:01 dist-sw1 IF-MIB::linkDown Gi1/0/24\n2026-03-27 11:45:04 dist-sw1 IF-MIB::linkUp Gi1/0/24\n2026-03-27 14:22:18 dist-sw1 IF-MIB::linkDown Gi1/0/24\n2026-03-27 14:22:21 dist-sw1 IF-MIB::linkUp Gi1/0/24\n... (12 flap events in last 24 hours, each lasting ~3 seconds)",
        },
      ],
      actions: [
        {
          id: "fix-duplex-speed",
          label: "Hard-code both sides to 1000Mbps full-duplex and verify autonegotiation settings",
          color: "green",
        },
        {
          id: "replace-cable",
          label: "Replace the cable between access-sw3 and dist-sw1",
          color: "yellow",
        },
        {
          id: "enable-errdisable-recovery",
          label: "Enable errdisable recovery on dist-sw1 Gi1/0/24",
          color: "red",
        },
        {
          id: "increase-queue-size",
          label: "Increase the input queue size on dist-sw1 Gi1/0/24",
          color: "orange",
        },
      ],
      correctActionId: "fix-duplex-speed",
      rationales: [
        {
          id: "r1",
          text: "access-sw3 negotiated to 1000Mbps/full-duplex but dist-sw1 is at 100Mbps/half-duplex. This classic duplex mismatch causes late collisions, output errors, and periodic link flaps. Hard-coding both sides to matching speed/duplex resolves the issue.",
        },
        {
          id: "r2",
          text: "While a bad cable could cause link flaps, the key evidence is the speed/duplex mismatch: one side is 1000/full while the other is 100/half. Late collisions and high output errors are hallmarks of duplex mismatch, not cabling.",
        },
        {
          id: "r3",
          text: "Errdisable recovery is irrelevant because the port is not in errdisable state. Increasing queue size treats a symptom, not the root cause of the speed/duplex mismatch.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The interface outputs show a classic duplex mismatch: access-sw3 at 1000/full and dist-sw1 at 100/half. Late collisions and output errors confirm the diagnosis. Hard-coding matching settings on both sides resolves it.",
        partial:
          "You're investigating the right area but missed the critical clue: compare the speed and duplex settings on both sides of the link. One is 1000/full and the other is 100/half.",
        wrong:
          "Compare the interface status on both sides: access-sw3 shows 1000Mbps/full-duplex while dist-sw1 shows 100Mbps/half-duplex. The 15,230 late collisions confirm a duplex mismatch.",
      },
    },
    {
      type: "investigate-decide",
      id: "stp-reconvergence-loop",
      title: "Periodic 30-Second Network Outages Every Few Hours",
      objective:
        "The helpdesk reports that all users in Building B experience exactly 30-second network outages every 2-4 hours. Connectivity then fully recovers until the next event. Investigate spanning tree and interface logs to find the root cause.",
      investigationData: [
        {
          id: "stp-logs",
          label: "syslog entries from bldg-b-sw1 (filtered for STP events)",
          content:
            "2026-03-27 08:12:01 %SPANTREE-2-ROOTGUARD_BLOCK: Root guard blocking port Gi1/0/1 on VLAN 10.\n2026-03-27 08:12:01 %SPANTREE-2-ROOTGUARD_BLOCK: Root guard blocking port Gi1/0/1 on VLAN 20.\n2026-03-27 08:12:01 %SPANTREE-2-ROOTGUARD_BLOCK: Root guard blocking port Gi1/0/1 on VLAN 30.\n2026-03-27 08:12:31 %SPANTREE-2-ROOTGUARD_UNBLOCK: Root guard unblocking port Gi1/0/1 on VLAN 10.\n2026-03-27 08:12:31 %SPANTREE-2-ROOTGUARD_UNBLOCK: Root guard unblocking port Gi1/0/1 on VLAN 20.\n2026-03-27 08:12:31 %SPANTREE-2-ROOTGUARD_UNBLOCK: Root guard unblocking port Gi1/0/1 on VLAN 30.\n2026-03-27 11:34:15 %SPANTREE-2-ROOTGUARD_BLOCK: Root guard blocking port Gi1/0/1 on VLAN 10.\n... (pattern repeats every 2-4 hours)",
          isCritical: true,
        },
        {
          id: "stp-detail",
          label: "show spanning-tree interface Gi1/0/1 detail on bldg-b-sw1",
          content:
            "Port 1 (GigabitEthernet1/0/1) of VLAN0010 is root inconsistent\n   Port path cost 4, Port priority 128, Port Identifier 128.1\n   Designated root has priority 4096, address aabb.cc00.ff01\n   Designated bridge has priority 4096, address aabb.cc00.ff01\n   Number of transitions to root inconsistent state: 47\n   Link type is point-to-point\n   Root guard is enabled on the port\n\nNote: Gi1/0/1 connects to a conference room where a user periodically\nconnects an unmanaged switch with a lower bridge priority.",
          isCritical: true,
        },
        {
          id: "topology",
          label: "show cdp neighbors Gi1/0/1 on bldg-b-sw1",
          content:
            "Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge\n                  S - Switch, H - Host, I - IGMP, r - Repeater\n\nDevice ID    Local Intrfce   Holdtme  Capability  Platform   Port ID\n(no CDP neighbors detected on this port)\n\nNote: No CDP neighbor — device on Gi1/0/1 is likely an unmanaged switch\nor consumer-grade device.",
        },
      ],
      actions: [
        {
          id: "replace-rootguard-with-bpduguard",
          label: "Replace root guard with BPDU guard on Gi1/0/1 to err-disable the port when rogue BPDUs arrive",
          color: "green",
        },
        {
          id: "increase-stp-priority",
          label: "Lower the STP priority on bldg-b-sw1 to become root bridge",
          color: "orange",
        },
        {
          id: "disable-stp-port",
          label: "Disable STP on Gi1/0/1 entirely",
          color: "red",
        },
        {
          id: "add-portfast",
          label: "Enable portfast on Gi1/0/1",
          color: "yellow",
        },
      ],
      correctActionId: "replace-rootguard-with-bpduguard",
      rationales: [
        {
          id: "r1",
          text: "Root guard blocks the port for 30 seconds when a superior BPDU is received, then unblocks it, causing the repeating outage cycle. BPDU guard with err-disable will shut the port permanently when the rogue device sends BPDUs, preventing the recurring disruption while alerting the admin.",
        },
        {
          id: "r2",
          text: "Lowering the STP priority on bldg-b-sw1 would not help because the rogue device has priority 4096 (very low). Even if bldg-b-sw1 became root, the rogue device's BPDUs would still trigger root guard on that port.",
        },
        {
          id: "r3",
          text: "Disabling STP creates loop risk. Portfast alone does not prevent rogue BPDU issues — the rogue device's superior BPDUs would still cause topology changes.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! Root guard causes a 30-second block/unblock cycle each time the rogue device sends superior BPDUs. BPDU guard err-disables the port permanently, stopping the recurring outage and alerting the admin to investigate the unauthorized device.",
        partial:
          "You identified an STP-related fix, but the specific issue is root guard's block/unblock cycle. BPDU guard is the correct feature for access ports where no switch should be connected.",
        wrong:
          "The logs show root guard repeatedly blocking Gi1/0/1 for 30 seconds when it receives superior BPDUs from an unmanaged switch. BPDU guard would err-disable the port instead of cycling.",
      },
    },
    {
      type: "investigate-decide",
      id: "crc-errors-fiber-degradation",
      title: "Increasing CRC Errors on Data Center Uplink",
      objective:
        "The monitoring system shows a steadily increasing CRC error rate on the 10GbE fiber uplink between the core and aggregation switches. Packet loss is at 0.3% and climbing. Investigate the interface diagnostics to determine the root cause.",
      investigationData: [
        {
          id: "interface-errors",
          label: "show interfaces TenGigabitEthernet1/1 on core-sw1",
          content:
            "TenGigabitEthernet1/1 is up, line protocol is up\n  Hardware is Ten Gigabit Ethernet, address is 0011.2233.4455\n  MTU 9216 bytes, BW 10000000 Kbit/sec, DLY 10 usec\n  Full-duplex, 10Gb/s, link type is 10GBase-SR\n  Input queue: 0/2000/0/0 (size/max/drops/flushes)\n  5 minute input rate 4.2 Gbps, 420000 pps\n  5 minute output rate 3.8 Gbps, 385000 pps\n     284752389123 input packets, 192384752312345 bytes\n     87432 input errors, 87431 CRC, 0 frame, 0 overrun, 0 ignored\n     0 output errors, 0 collisions",
          isCritical: true,
        },
        {
          id: "transceiver-diag",
          label: "show interfaces TenGigabitEthernet1/1 transceiver detail on core-sw1",
          content:
            "                                   Optical         Optical\n              Temperature  Voltage  Tx Power   Rx Power\nPort          (Celsius)    (Volts)  (dBm)      (dBm)\n-----------   -----------  -------  ---------  ---------\nTe1/1         42.5         3.28     -2.1       -14.8\n\n                                   High Alarm  High Warn  Low Warn   Low Alarm\n              Threshold             (dBm)       (dBm)      (dBm)      (dBm)\n-----------   -------------------  ----------  ---------  ---------  ---------\nTe1/1 Rx      Receive Power        +0.5        -1.0       -11.8      -14.0\n\n  ** Rx Power -14.8 dBm is BELOW Low Alarm threshold (-14.0 dBm) **",
          isCritical: true,
        },
        {
          id: "error-trend",
          label: "SNMP CRC error counter trend (last 7 days, polled hourly)",
          content:
            "Day 1: ~500 CRC errors/hour\nDay 2: ~800 CRC errors/hour\nDay 3: ~1,200 CRC errors/hour\nDay 4: ~2,100 CRC errors/hour\nDay 5: ~3,500 CRC errors/hour\nDay 6: ~5,800 CRC errors/hour\nDay 7: ~8,200 CRC errors/hour\n\nTrend: Exponential increase in CRC errors over 7 days.",
        },
      ],
      actions: [
        {
          id: "clean-inspect-fiber",
          label: "Clean fiber connectors and inspect patch cable; replace SFP+ if Rx power does not improve",
          color: "green",
        },
        {
          id: "replace-switch-linecard",
          label: "Replace the line card on core-sw1",
          color: "red",
        },
        {
          id: "reduce-traffic",
          label: "Reduce traffic on the link to below 5 Gbps to lower error rate",
          color: "orange",
        },
        {
          id: "enable-fec",
          label: "Enable Forward Error Correction (FEC) on both ends",
          color: "yellow",
        },
      ],
      correctActionId: "clean-inspect-fiber",
      rationales: [
        {
          id: "r1",
          text: "The Rx power of -14.8 dBm is below the low alarm threshold of -14.0 dBm, indicating severe signal degradation. Combined with the exponentially increasing CRC errors, this points to a dirty or damaged fiber connector, a failing SFP+, or a bent fiber patch cable. Cleaning and inspection is the correct first step.",
        },
        {
          id: "r2",
          text: "Replacing the line card is premature and expensive. The transceiver diagnostics clearly show an optical power issue, which is almost always caused by the fiber path or the SFP+ module, not the line card.",
        },
        {
          id: "r3",
          text: "Reducing traffic would lower the absolute number of errors but the CRC rate would remain the same. FEC could mask the errors temporarily but does not fix the underlying optical signal degradation.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The Rx power at -14.8 dBm (below the -14.0 dBm alarm threshold) combined with exponentially increasing CRC errors indicates fiber path degradation. Cleaning connectors and inspecting the fiber is the correct first response before considering SFP+ replacement.",
        partial:
          "You identified an approach that could help, but the transceiver diagnostics clearly show Rx power below the alarm threshold. Start with the physical layer: clean and inspect the fiber path.",
        wrong:
          "The transceiver diagnostics show Rx power at -14.8 dBm, which is below the low alarm threshold of -14.0 dBm. This causes CRC errors. The fix starts with cleaning fiber connectors and inspecting the patch cable.",
      },
    },
  ],
  hints: [
    "Always compare speed and duplex settings on BOTH sides of a link. Autonegotiation failures cause one side to fall back to half-duplex, producing late collisions.",
    "When outages follow a precise, repeating pattern (like exactly 30 seconds), look for STP timers or protocol guard features cycling between block and unblock states.",
    "For fiber links, check transceiver Rx power levels against alarm thresholds. CRC errors that increase over time often indicate physical layer degradation in the optical path.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "Intermittent failures are the hardest category of network issues to troubleshoot. The ability to correlate timestamps across SNMP, syslog, and interface counters is what separates senior engineers from junior ones in real-world outage scenarios.",
  toolRelevance: [
    "SNMP monitoring (PRTG, LibreNMS, Zabbix)",
    "Cisco IOS / NX-OS CLI",
    "Syslog aggregation (Splunk, Graylog)",
    "Optical power meters",
    "Cable testers",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
