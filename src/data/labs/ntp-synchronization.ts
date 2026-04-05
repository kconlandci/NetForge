import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ntp-synchronization",
  version: 1,
  title: "NTP Time Synchronization",
  tier: "beginner",
  track: "network-services",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["ntp", "time-sync", "stratum", "authentication"],
  description:
    "Configure network time synchronization using NTP to ensure accurate timestamps across all network devices for logging and authentication.",
  estimatedMinutes: 8,
  learningObjectives: [
    "Configure NTP client and server relationships with proper stratum hierarchy",
    "Verify NTP synchronization status using show commands",
    "Implement NTP authentication to prevent rogue time sources",
  ],
  sortOrder: 502,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "ntp-001",
      title: "NTP Stratum Hierarchy Issue",
      context:
        "After a network redesign, the core switch is showing incorrect time. Kerberos authentication is failing because of clock skew. You investigate:\n\nSwitch# show ntp status\nClock is unsynchronized, stratum 16, no reference clock\nnominal freq is 250.0000 Hz, actual freq is 250.0000 Hz\n\nSwitch# show ntp associations\n  address       ref clock    st  when  poll  reach  delay  offset  disp\n~10.0.1.1      .INIT.       16  -     64    0      0.00   0.00    15937\n* sys.peer, # selected\n\nThe NTP server 10.0.1.1 is a Stratum 1 server on the management VLAN. An ACL was recently applied to the management interface.",
      displayFields: [
        { label: "Stratum", value: "16 (unsynchronized)", emphasis: "critical" },
        { label: "Reach", value: "0 (no responses received)", emphasis: "warn" },
        { label: "Reference", value: ".INIT. (initializing)", emphasis: "warn" },
      ],
      actions: [
        { id: "a1", label: "Change the NTP server to a public pool", color: "blue" },
        { id: "a2", label: "Check and fix the management ACL blocking NTP (UDP 123)", color: "green" },
        { id: "a3", label: "Restart the NTP process on the switch", color: "yellow" },
        { id: "a4", label: "Manually set the clock and disable NTP", color: "red" },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "The reach value of 0 means the switch has not received any NTP responses from the server. Combined with the .INIT. reference and stratum 16, this indicates a connectivity problem. The recently applied ACL on the management interface is likely blocking UDP port 123 (NTP).",
        },
        {
          id: "r2",
          text: "Stratum 16 means the clock is completely unsynchronized, which is the maximum (invalid) stratum value. Restarting the NTP process would not help if the underlying connectivity issue prevents NTP packets from reaching the server.",
        },
        {
          id: "r3",
          text: "Manually setting the clock and disabling NTP would be a temporary workaround but would cause increasing clock drift over time, eventually breaking Kerberos authentication again.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The reach counter of 0 and .INIT. reference clearly indicate NTP packets are not getting through. The management ACL must permit UDP 123 for NTP synchronization.",
        partial:
          "You identified part of the issue. The key diagnostic clue is reach = 0 with .INIT. reference, meaning no NTP packets are being received. The recently applied ACL is the most likely cause.",
        wrong:
          "The reach value of 0 is the critical clue - it means zero NTP responses have been received. The new management ACL is blocking UDP 123 traffic. Fix the ACL to permit NTP.",
      },
    },
    {
      type: "action-rationale",
      id: "ntp-002",
      title: "Clock Drift on Remote Site Routers",
      context:
        "Multiple remote site routers are showing time offsets of 30-45 seconds from the core NTP server. Syslog timestamps are inconsistent across sites, making incident correlation difficult.\n\nRemoteRouter# show ntp associations detail\n10.0.1.1 configured, selected, sane, valid, stratum 1\nref ID 127.127.1.0, time DBAB07E2.8B929A00\nour mode client, peer mode server, our poll intvl 1024\noffset 32451.23 msec, delay 245.12 msec, dispersion 892.45\nreachability 377, flags 0x4\n\nRemoteRouter# show clock\n*14:23:15.234 UTC Sat Mar 28 2026\n\nCore NTP Server# show clock\n*14:23:47.891 UTC Sat Mar 28 2026",
      displayFields: [
        { label: "Offset", value: "32451 ms (~32 seconds)", emphasis: "critical" },
        { label: "Poll Interval", value: "1024 seconds", emphasis: "warn" },
        { label: "Dispersion", value: "892.45 (high)", emphasis: "warn" },
      ],
      actions: [
        { id: "a1", label: "Lower the poll interval and wait for gradual correction", color: "blue" },
        { id: "a2", label: "Set the clock manually then let NTP maintain it", color: "green" },
        { id: "a3", label: "Remove and re-add the NTP server configuration", color: "yellow" },
        { id: "a4", label: "Increase the poll interval to reduce network load", color: "red" },
      ],
      correctActionId: "a2",
      rationales: [
        {
          id: "r1",
          text: "NTP's slew rate correction can only adjust the clock by about 0.5 ms per second. A 32-second offset would take over 17 hours to correct through slewing alone. Setting the clock manually to within a few seconds, then allowing NTP to fine-tune it, is the recommended approach for large offsets.",
        },
        {
          id: "r2",
          text: "The high poll interval of 1024 seconds means the router checks time infrequently, slowing convergence. However, simply lowering the poll interval would still take a very long time to correct a 32-second offset through NTP's gradual adjustment mechanism.",
        },
        {
          id: "r3",
          text: "Removing and re-adding the NTP configuration would reset the association, but NTP would still encounter the same large offset and take a long time to converge because it slews the clock gradually rather than stepping it for offsets this large.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Exactly right! For large offsets (over ~128ms), NTP's gradual slewing is too slow. Manually setting the clock close to the correct time, then letting NTP maintain precision, is the standard approach.",
        partial:
          "The offset is too large for NTP to correct in a reasonable time through slewing. A manual clock set followed by NTP maintenance is the recommended fix for offsets of this magnitude.",
        wrong:
          "With a 32-second offset, NTP slewing would take over 17 hours. The correct approach is to manually set the clock close to the correct time (using 'clock set'), then let NTP take over for fine adjustments.",
      },
    },
    {
      type: "action-rationale",
      id: "ntp-003",
      title: "Rogue NTP Source Detection",
      context:
        "A security monitoring alert flags that several switches suddenly changed their time source. Investigation reveals a new device on the network is advertising itself as a Stratum 1 NTP server.\n\nSwitch# show ntp associations\n  address       ref clock    st  when  poll  reach  delay  offset  disp\n*192.168.50.99  .GPS.        1   12    64    377    1.23   -0.45   0.12\n~10.0.1.1      .PPS.        1   48    64    377    5.67   0.23    0.34\n\nThe device at 192.168.50.99 is an unknown device that appeared on the user VLAN. It was not authorized by the network team. The legitimate NTP server is 10.0.1.1.",
      displayFields: [
        { label: "Selected Peer", value: "192.168.50.99 (unauthorized)", emphasis: "critical" },
        { label: "Legitimate Server", value: "10.0.1.1 (not selected)", emphasis: "warn" },
      ],
      actions: [
        { id: "a1", label: "Block the rogue device and configure NTP authentication", color: "green" },
        { id: "a2", label: "Configure the switch to prefer 10.0.1.1 using the prefer keyword", color: "blue" },
        { id: "a3", label: "Shut down the port connected to the rogue device", color: "yellow" },
        { id: "a4", label: "Add an ACL to block NTP from the user VLAN", color: "orange" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "NTP authentication using MD5 or SHA keys ensures switches only synchronize with authorized servers. Blocking the rogue device addresses the immediate threat, while NTP authentication prevents future rogue NTP sources from being accepted as valid peers.",
        },
        {
          id: "r2",
          text: "Using the 'prefer' keyword would make the switch favor 10.0.1.1 under normal conditions, but it does not prevent a rogue server from being selected if the preferred server becomes unreachable. Authentication is the proper security control.",
        },
        {
          id: "r3",
          text: "Shutting down the port stops this particular rogue device but does not prevent a future rogue NTP source on a different port. NTP authentication provides a systematic defense against any unauthorized time source.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Perfect! Blocking the rogue device handles the immediate threat, and NTP authentication (ntp authenticate, ntp authentication-key, ntp trusted-key) provides lasting protection against unauthorized time sources.",
        partial:
          "You addressed part of the issue, but the complete solution requires both removing the rogue device and implementing NTP authentication to prevent future rogue time sources.",
        wrong:
          "A rogue NTP server can cause authentication failures, log timestamp manipulation, and certificate validation errors. The solution requires blocking the device AND implementing NTP authentication keys.",
      },
    },
  ],
  hints: [
    "In NTP associations output, reach = 0 means no packets received. Check firewalls and ACLs for UDP port 123 blocking.",
    "NTP slew correction is very slow for large offsets. For offsets over 128ms, manually setting the clock first is recommended.",
    "NTP authentication uses trusted keys to prevent switches from synchronizing with unauthorized time sources on the network.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Accurate time synchronization is critical for log correlation during security incidents, Kerberos authentication, and regulatory compliance. NTP misconfiguration is a common finding in audits.",
  toolRelevance: [
    "show ntp status",
    "show ntp associations",
    "ntpq -p",
    "ntpdate",
    "clock set",
    "ntp authenticate",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
