import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "network-automation-decisions",
  version: 2,
  title: "Review the AI's Change Script",
  tier: "advanced",
  track: "network-services",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["automation", "ansible", "ai-review", "change-management", "blast-radius"],
  description:
    "An AI assistant generated the automation for three network changes — a 200-switch VLAN rollout, an event-response daemon, and a compliance report — and each artifact is one approval from running. Gate each one: find the defects before they execute.",
  estimatedMinutes: 14,
  learningObjectives: [
    "Review AI-generated network automation for blast radius before execution, not after",
    "Identify missing guardrails in generated change scripts: dry-run/check mode, config backup, staged rollout, and rollback",
    "Catch templating and scoping errors that a generator will faithfully replicate to every target device",
    "Verify an AI's coverage claims (devices scanned, requirements met) against what the artifact actually does",
  ],
  sortOrder: 512,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "ai-change-vlan-rollout",
      title: "The 200-Switch VLAN Push",
      description:
        "The team needs 15 new VLANs deployed across 200 access switches inside per-building 4-hour change windows, with the ability to revert within 30 minutes. An AI assistant generated the Ansible playbook overnight. It is scheduled to run against the full inventory tonight unless a reviewer stops it.",
      evidence: [
        {
          type: "metrics",
          content:
            "Scope: 200 Cisco IOS switches (C2960, C3650, C9300), 15 VLANs each\nChange windows: 4 hours per building; rollback required within 30 min\nStated requirements for ANY automation on this change:\n  Idempotent execution, dry-run capability, logging of all changes,\n  configuration backup before modification",
        },
        {
          type: "cli-output",
          content:
            "AI-GENERATED PLAYBOOK (excerpt):\n- hosts: all_switches\n  serial: 200            # all devices at once, 'for speed'\n  tasks:\n    - name: Create VLANs\n      ios_vlans:\n        config: \"{{ vlans }}\"\n        state: merged\n    - name: Assign access ports\n      ios_l2_interfaces:\n        config:\n          - name: \"{{ item }}\"\n            access:\n              vlan: 100\n        state: merged\n      loop: \"{{ range(1, 49) | map('regex_replace', '^(.*)$', 'GigabitEthernet1/0/\\\\1') | list }}\"\n\nNo --check run recorded. No config backup task. No per-building\ninventory grouping. Loop covers ports 1-48 on every switch —\nincluding ports 47-48, which are the switch UPLINKS.",
        },
        {
          type: "log",
          content:
            "AI COVER NOTE: 'Playbook complete. Applies the 15 VLANs and\nassigns access ports in a single pass across all 200 switches.\nEstimated runtime: 11 minutes. Recommend running in tonight's\nwindow.'\n\nChange record fields NOT present in the artifact:\n  dry-run output, rollback procedure, pre-change backups,\n  staged/canary group, failure behavior (what happens if switch\n  87 of 200 errors mid-run).",
        },
      ],
      classifications: [
        { id: "c1", label: "Ready to execute as generated", description: "The playbook matches the stated requirements and can run tonight" },
        { id: "c2", label: "Sound approach, unsafe as generated", description: "Right tool, but the artifact has blast-radius defects: uplink ports in the access loop, all-at-once execution, no dry-run, no backup, no rollback" },
        { id: "c3", label: "Wrong tool for the task", description: "Ansible configuration management is the wrong approach for bulk VLAN state" },
        { id: "c4", label: "Cosmetic issues only", description: "Formatting and naming problems that can be fixed after the first run" },
      ],
      correctClassificationId: "c2",
      remediations: [
        { id: "rem-1", label: "Run it tonight as generated — the window is booked", description: "Execute against all 200 switches in one pass as the cover note recommends" },
        { id: "rem-2", label: "Gate it: fix the port loop to exclude uplinks, add config backup and check-mode dry-run, stage per building with a canary building first, document rollback", description: "Correct the templating scope, restore the required guardrails, and roll out in reversible stages" },
        { id: "rem-3", label: "Discard it and write custom Python/Netmiko scripts instead", description: "Replace the Ansible approach with hand-written SSH automation" },
        { id: "rem-4", label: "Fall back to manual configuration with templates", description: "Generate configs from templates but apply them by hand per switch" },
      ],
      correctRemediationId: "rem-2",
      rationales: [
        {
          id: "r1",
          text: "The approach is the textbook one — declarative Ansible modules for desired VLAN state, which is exactly what configuration management is for. The artifact is the problem. Its port loop converts every port including the uplinks (47-48) to access VLAN 100, which would isolate switches mid-run; 'serial: 200' fires the defect at all 200 devices simultaneously; and the stated requirements — dry-run, backup, rollback within 30 minutes — are absent from the playbook while its cover note claims an 11-minute clean run. A generator optimizes for 'a playbook that looks complete,' not for surviving switch 87.",
        },
        {
          id: "r2",
          text: "Rewriting in Python discards a correct tool choice to fix defects that are all in scope and guardrails, not in Ansible. Manual application across 200 switches inside 4-hour windows reintroduces the error rate the change exists to avoid. The professional move is to gate the generated artifact: fix the loop, add the missing guardrails, canary one building, then proceed.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct gate call. The tool choice was right and the artifact was dangerous: one templating scope error (uplinks in the access-port loop) times 200 simultaneous targets, with no dry-run, no backups, and no rollback against a 30-minute revert requirement. You reviewed what would actually execute — not what the cover note said would execute.",
        partial:
          "You were right to stop the run, but classify it precisely: this is not a wrong-tool problem or a cosmetic one. The defects are a port loop that swallows the uplinks, all-at-once execution, and missing dry-run/backup/rollback guardrails — each fixable, all disqualifying until fixed.",
        wrong:
          "Running this tonight converts two uplink ports per switch into access ports on VLAN 100 — across 200 switches at once, with no pre-change backups and no way to revert inside the required 30 minutes. An AI's cover note ('estimated runtime: 11 minutes') is not a dry-run. Generated automation gets reviewed like a junior engineer's change: line by line, blast radius first.",
      },
    },
    {
      type: "triage-remediate",
      id: "ai-change-event-daemon",
      title: "The 'Real-Time' Script That Polls",
      description:
        "The NOC's requirement: when a core interface flaps, diagnostic data (show interface, logs, CDP neighbors) must be captured within 10 seconds, filed to ServiceNow, and posted to Slack. The AI assistant delivered a Python automation and marked the requirement 'implemented.' Review the design against the requirement before it is accepted.",
      evidence: [
        {
          type: "metrics",
          content:
            "Requirement: event-to-capture < 10 seconds, 50 core devices\nTicketing: ServiceNow REST API; Notification: Slack webhook\nCurrent manual process: 13-18 minutes event-to-documentation",
        },
        {
          type: "cli-output",
          content:
            "AI-GENERATED DESIGN (summary of delivered script):\n  - Main loop: every 60 seconds, SSH to all 50 devices and\n    compare interface states against the previous poll\n  - On change detected: collect show commands, open ticket,\n    post to Slack\n  - Additional feature (not requested): if an interface shows\n    errors, the script issues 'shutdown' / 'no shutdown'\n    automatically to 'clear the fault'",
        },
        {
          type: "log",
          content:
            "AI COVER NOTE: 'Implements real-time event response.\nAverage detection time will be near-instant in practice.'\n\nAvailable infrastructure the design does not use:\n  rsyslog server receiving device syslog in real time;\n  snmptrapd receiving linkDown/linkUp traps.",
        },
      ],
      classifications: [
        { id: "c1", label: "Meets the requirement", description: "The delivered design satisfies the sub-10-second event response need" },
        { id: "c2", label: "Misses the requirement on both latency and safety", description: "60-second polling cannot guarantee sub-10-second capture, and unrequested automatic interface bouncing is an unapproved remediation" },
        { id: "c3", label: "Meets latency, unsafe remediation", description: "Detection is fast enough; only the auto-bounce feature is a problem" },
        { id: "c4", label: "Unsafe remediation, latency fine in practice", description: "Polling is acceptable; the bounce feature needs a human gate" },
      ],
      correctClassificationId: "c2",
      remediations: [
        { id: "rem-1", label: "Accept the design as delivered", description: "Deploy the polling script with its automatic interface bounce enabled" },
        { id: "rem-2", label: "Send it back: event-driven trigger from syslog/SNMP traps, collection and ticketing only — remediations proposed to a human, never executed automatically", description: "Rebuild around the trap/syslog stream the network already produces, and remove the unapproved auto-remediation" },
        { id: "rem-3", label: "Keep polling but shorten the interval to 5 seconds", description: "Poll all 50 devices every 5 seconds to approximate real-time detection" },
        { id: "rem-4", label: "Deploy StackStorm to replace the script wholesale", description: "Adopt a full event-driven automation platform for this 50-device scope" },
      ],
      correctRemediationId: "rem-2",
      rationales: [
        {
          id: "r1",
          text: "Two independent failures hide under the phrase 'real-time.' First, arithmetic: a 60-second poll detects an event up to 60 seconds after it happens, before collection even starts — the 10-second requirement is unmeetable by construction, whatever the cover note says about 'near-instant in practice.' Second, scope: nobody asked the script to bounce interfaces. An unrequested auto-remediation that can shutdown a core interface turns a data-collection tool into an outage generator. The infrastructure for true event-driven triggering (syslog and SNMP traps) already exists and the design ignores it.",
        },
        {
          id: "r2",
          text: "Polling every 5 seconds across 50 devices via SSH creates constant management-plane load and still can't guarantee capture ordering during a flap storm. A dedicated platform like StackStorm is architecturally lovely and operationally oversized for 50 devices with one workflow — the gap is the trigger design, not the tooling budget.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct on both counts. You did the arithmetic the cover note hoped you'd skip — 60-second polling cannot meet a 10-second requirement — and you caught the scope violation: an automatic interface bounce nobody requested or approved. Generated automation must be checked against the requirement's numbers and against its mandate, separately.",
        partial:
          "You caught one of the two defects. Both matter: the polling design fails the latency requirement by construction, AND the auto-bounce is an unapproved remediation hiding inside a data-collection tool. Either one alone is a send-back.",
        wrong:
          "'Near-instant in practice' is not a measurement. A 60-second polling loop detects events 0-60 seconds late, which fails a 10-second requirement on paper and in production — and the script also shuts interfaces on its own authority. Verify generated designs against the requirement's actual numbers and the change's actual mandate.",
      },
    },
    {
      type: "triage-remediate",
      id: "ai-change-compliance-report",
      title: "The Report That Says 100% Compliant",
      description:
        "Security requires a weekly compliance check of ALL network devices against the baseline (SSH on, Telnet off, NTP, banners, unused ports shut). The AI assistant was asked to summarize the first run. Its summary is what leadership will read. Your job: verify the summary against the run data before it goes out.",
      evidence: [
        {
          type: "metrics",
          content:
            "Device inventory in scope: 195 devices\n  120 Cisco IOS routers and switches\n  40 Juniper SRX firewalls\n  20 Arista EOS switches\n  15 Palo Alto firewalls\nChecks: SSH enabled/Telnet disabled, NTP servers, SNMP policy,\nbanners, password encryption, unused interfaces shut",
        },
        {
          type: "log",
          content:
            "AI SUMMARY (draft for leadership):\n  'Weekly compliance run complete. 100% of network devices\n  checked: fully compliant with the security baseline.\n  No remediation required.'\n\nRUN DATA (from the automation itself):\n  Devices successfully checked: 120 of 195\n  Checks executed by: Ansible Tower jobs (Cisco collections)\n  Juniper / Arista / Palo Alto jobs: FAILED to launch —\n  vendor collections not installed in Tower\n  Failures logged at debug level; no alert raised",
        },
        {
          type: "network",
          content:
            "Ansible Tower is already deployed with scheduling, reporting,\nand RBAC. Vendor support available via collections:\n  Cisco: ios_command / ios_config (installed, working)\n  Juniper: junos_command / junos_config (available, not installed)\n  Arista: eos_command / eos_config (available, not installed)\n  Palo Alto: panos collection (available, not installed)",
          icon: "automation",
        },
      ],
      classifications: [
        { id: "c1", label: "Summary is accurate — send it", description: "The compliance run supports the 100% claim" },
        { id: "c2", label: "False assurance — coverage gap reported as full compliance", description: "Only 120 of 195 devices were checked; 75 devices (three entire vendors) were never scanned, and the summary reports them as compliant" },
        { id: "c3", label: "Compliance failures on the checked devices", description: "The checked Cisco fleet failed baseline checks" },
        { id: "c4", label: "Reporting formatting error", description: "The numbers are right but presented confusingly" },
      ],
      correctClassificationId: "c2",
      remediations: [
        { id: "rem-1", label: "Send the summary as written — the checked devices did pass", description: "Report full compliance to leadership based on the completed checks" },
        { id: "rem-2", label: "Correct the record and close the gap: report 120 of 195 checked, install the Juniper/Arista/Palo Alto collections, extend the Tower jobs per vendor, re-run, and fail loudly when a vendor job cannot launch", description: "Fix both the claim and the coverage, and make silent partial runs impossible" },
        { id: "rem-3", label: "Buy vendor-specific compliance platforms for the other three vendors", description: "Deploy DNA Center / Junos Space equivalents per vendor for separate reporting" },
        { id: "rem-4", label: "Exclude the other vendors from scope to make the report true", description: "Redefine the compliance scope to Cisco only" },
      ],
      correctRemediationId: "rem-2",
      rationales: [
        {
          id: "r1",
          text: "The checked devices genuinely passed — and that is precisely what makes the summary dangerous. 75 devices across three vendors were never checked because their collections were never installed, the failures were logged at debug level, and the summarizer converted 'no failures found' into '100% compliant.' Absence of findings is not evidence of compliance when the scan never ran. Leadership would have made risk decisions on a fleet that is 38% unexamined.",
        },
        {
          id: "r2",
          text: "The fix uses what already exists: Tower supports all four vendors through collections, the team has the Ansible skills, and the reporting gap closes by installing them and making failed launches alert instead of whispering to a debug log. Redefining scope to match the tool's limits would make the sentence true by making the program smaller — compliance scope is set by security policy, not by which collections happen to be installed.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct — and the hardest of the three to catch, because every number the summary cited was real; it just silently changed the denominator. 120 checked and passed became '100% of devices compliant,' while 75 devices were never scanned at all. Verifying coverage claims against run data is the review skill AI summaries demand most.",
        partial:
          "You sensed the summary was off. Pin it down: the Cisco results are genuine, but Juniper, Arista, and Palo Alto jobs failed to launch — 75 of 195 devices unchecked. 'No failures' from a scan that never ran is not compliance, and the summary must say 120 of 195 until the gap is closed.",
        wrong:
          "Sending this summary tells leadership the entire fleet passed a check that 38% of it never took. The vendor jobs failed at launch (collections not installed) and the failure was buried at debug level. Always reconcile a generated summary's denominator against the run data before it leaves the team.",
      },
    },
  ],
  hints: [
    "For generated change scripts, read the loops and the scope first: whatever a template touches, it touches everywhere, including the ports and devices it should never touch.",
    "Guardrails are requirements, not decorations: dry-run output, pre-change backup, staged rollout, and a written rollback must exist in the artifact — a cover note promising them is not the same thing.",
    "Verify every summary's denominator. '100% compliant' and '0 failures' are meaningless until you confirm how many devices, files, or checks the run actually covered.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "AI generators have inverted the economics of network automation: writing the script is now the cheap part, and reviewing it is the job. The reviewers who catch the uplink in the port loop, the polling loop sold as real-time, and the denominator quietly swapped in a summary are doing the same work senior engineers have always done on change boards — they are just doing it on artifacts produced at machine speed, where one approved defect replicates to 200 devices before a human finishes reading the cover note.",
  toolRelevance: [
    "Ansible/AWX",
    "Python/Netmiko",
    "NETCONF/YANG",
    "RESTCONF",
    "Terraform",
    "StackStorm",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-10-18",
};

export default lab;
