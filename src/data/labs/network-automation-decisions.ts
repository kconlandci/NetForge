import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "network-automation-decisions",
  version: 1,
  title: "Network Automation Approach Selection",
  tier: "advanced",
  track: "network-services",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["automation", "ansible", "python", "netconf", "restconf", "api"],
  description:
    "Choose the appropriate network automation approach by triaging operational requirements and selecting the right tools and protocols.",
  estimatedMinutes: 14,
  learningObjectives: [
    "Evaluate automation tools (Ansible, Python, NETCONF) for specific use cases",
    "Classify automation requirements by complexity and scale",
    "Design automation workflows with appropriate error handling and rollback",
  ],
  sortOrder: 512,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "auto-001",
      title: "Bulk VLAN Deployment Automation",
      description:
        "The network team needs to deploy 15 new VLANs across 200 access switches in multiple buildings. Manual configuration would take 2 weeks and is error-prone.",
      evidence: [
        {
          type: "metrics",
          content:
            "Scope: 200 Cisco IOS switches, 15 VLANs each\nSwitch models: C2960, C3650, C9300 (mixed)\nManagement: SSH access via jump host\nCurrent automation: None (all manual CLI)\nChange window: 4-hour maintenance window per building\nRollback requirement: Must be able to revert within 30 minutes",
        },
        {
          type: "cli-output",
          content:
            "Sample manual config per switch:\nvlan 100\n name Sales\nvlan 101\n name Marketing\nvlan 102\n name Engineering\n...(12 more VLANs)...\ninterface range GigabitEthernet0/1-24\n switchport mode access\n switchport access vlan 100\n\nEstimated 45 CLI commands per switch x 200 switches = 9,000 commands",
        },
        {
          type: "log",
          content:
            "Team skills: 2 engineers with basic Python, 1 engineer with Ansible experience\nExisting infrastructure: No automation server, no Git repository\nNetwork: All switches reachable via SSH from management VLAN\nRequirements: Idempotent execution, dry-run capability, logging of all changes",
        },
      ],
      classifications: [
        { id: "c1", label: "Configuration Management Task", description: "Declarative state-driven deployment best suited for configuration management tools" },
        { id: "c2", label: "Custom Script Automation", description: "Unique requirements needing custom Python scripts with Netmiko/NAPALM" },
        { id: "c3", label: "NETCONF/YANG Automation", description: "Model-driven programmatic interface for structured configuration" },
        { id: "c4", label: "Manual with Templates", description: "Generate configs from templates but apply manually per switch" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem-1", label: "Deploy Ansible with ios_vlans and ios_l2_interfaces modules", description: "Use Ansible playbooks with inventory groups per building for idempotent VLAN deployment with dry-run and rollback support" },
        { id: "rem-2", label: "Write custom Python scripts with Netmiko for SSH automation", description: "Build a custom tool to push configurations via SSH using Python" },
        { id: "rem-3", label: "Deploy NETCONF agents on all switches and use ncclient", description: "Enable NETCONF on all devices and push YANG-modeled configurations" },
        { id: "rem-4", label: "Use Cisco DNA Center for template-based deployment", description: "Deploy a network controller for centralized template management" },
      ],
      correctRemediationId: "rem-1",
      rationales: [
        {
          id: "r1",
          text: "This is a classic configuration management task: deploying a known desired state (VLANs) across many devices. Ansible provides built-in ios_vlans and ios_l2_interfaces modules with idempotency, check mode (dry-run), and backup capabilities. The team has Ansible experience, switches support SSH, and no additional infrastructure is needed beyond an Ansible control node.",
        },
        {
          id: "r2",
          text: "Custom Python scripts with Netmiko would work but require more development effort for idempotency, dry-run, error handling, and rollback that Ansible provides out of the box. Given the team's existing Ansible experience, this is unnecessary.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! Ansible is ideal for this bulk configuration management task: it provides idempotent modules, check mode, backup/rollback, and works over SSH without agents. The team's existing Ansible experience reduces ramp-up time.",
        partial:
          "This is a configuration management task where the desired state is well-defined. Ansible's built-in IOS modules provide idempotency and dry-run capability without custom code development.",
        wrong:
          "Bulk VLAN deployment across 200 switches is a configuration management problem. Ansible with ios_vlans modules provides idempotent, declarative deployment with dry-run, backup, and rollback - exactly matching the requirements.",
      },
    },
    {
      type: "triage-remediate",
      id: "auto-002",
      title: "Real-Time Network Event Response",
      description:
        "The NOC needs an automated system that detects interface flaps and automatically collects diagnostic data within seconds for rapid troubleshooting.",
      evidence: [
        {
          type: "metrics",
          content:
            "Requirement: When a core interface flaps, automatically:\n1. Capture 'show interface' output within 5 seconds\n2. Collect 'show log' for the last 60 seconds\n3. Run 'show cdp neighbors' on affected device\n4. Store results in a ticket system via API\n5. Send Slack notification to the NOC channel\n\nResponse time requirement: < 10 seconds from event detection to data collection",
        },
        {
          type: "network",
          content:
            "Event source: SNMP traps (linkDown/linkUp) or syslog messages\nDevices: 50 core routers and switches\nExisting: Syslog server (rsyslog), SNMP trap receiver (snmptrapd)\nTicket system: ServiceNow REST API\nSlack: Webhook integration available",
          icon: "automation",
        },
        {
          type: "log",
          content:
            "Current process (manual):\n1. NOC sees syslog alert (1-5 min delay to notice)\n2. Engineer SSH to device manually (2-3 min)\n3. Runs show commands and copies output (5 min)\n4. Creates ticket manually (5 min)\nTotal: 13-18 minutes from event to documented diagnostics\n\nDesired: < 10 seconds automated response",
        },
      ],
      classifications: [
        { id: "c1", label: "Event-Driven Automation", description: "Real-time triggered automation requiring fast response to network events" },
        { id: "c2", label: "Scheduled Polling Automation", description: "Periodic data collection on a fixed schedule" },
        { id: "c3", label: "Configuration Management", description: "Maintaining desired device configuration state" },
        { id: "c4", label: "Orchestration Workflow", description: "Multi-step provisioning of new services" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem-1", label: "Build a Python event-driven script with syslog parsing and Netmiko for data collection", description: "Custom Python daemon that monitors syslog, triggers SSH data collection, and posts to ServiceNow and Slack APIs" },
        { id: "rem-2", label: "Configure Ansible AWX to run playbooks on syslog triggers", description: "Use Ansible AWX webhook triggers to launch diagnostic playbooks on events" },
        { id: "rem-3", label: "Deploy StackStorm for event-driven automation", description: "Use StackStorm's event-driven architecture with sensors, rules, and action chains for real-time network response" },
        { id: "rem-4", label: "Write cron-based scripts to check for interface changes every minute", description: "Poll devices every 60 seconds and compare interface states" },
      ],
      correctRemediationId: "rem-1",
      rationales: [
        {
          id: "r1",
          text: "A custom Python daemon provides the fastest response time for event-driven automation. It monitors the syslog stream directly, triggers SSH-based data collection via Netmiko within seconds, and integrates with ServiceNow and Slack APIs. While StackStorm is more scalable, the 50-device scope does not justify its deployment complexity. Ansible AWX adds startup latency that may exceed the 10-second requirement.",
        },
        {
          id: "r2",
          text: "Cron-based polling cannot meet the sub-10-second requirement and would miss events between polling intervals. StackStorm is architecturally ideal for event-driven automation at scale but adds significant infrastructure overhead for a 50-device environment.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! A Python event-driven script offers the lowest latency for this 50-device scope: direct syslog monitoring, immediate Netmiko data collection, and API integration for ticketing and notifications.",
        partial:
          "This is event-driven automation requiring sub-10-second response. Consider the tradeoff between dedicated platforms (StackStorm) and lightweight Python scripts for the 50-device scope.",
        wrong:
          "Real-time event response with a 10-second SLA on 50 devices is best served by a lightweight Python daemon. It monitors syslog directly, collects data via SSH immediately, and integrates with external APIs.",
      },
    },
    {
      type: "triage-remediate",
      id: "auto-003",
      title: "Multi-Vendor Configuration Compliance",
      description:
        "The security team requires weekly compliance checks across a multi-vendor network to verify that all devices match security baseline configurations.",
      evidence: [
        {
          type: "metrics",
          content:
            "Device inventory:\n  120 Cisco IOS routers and switches\n  40 Juniper SRX firewalls\n  20 Arista EOS switches\n  15 Palo Alto firewalls\n\nCompliance checks needed:\n  - SSH enabled, Telnet disabled\n  - NTP configured to approved servers\n  - SNMP community strings match policy\n  - Banner messages present\n  - Password encryption enabled\n  - Unused interfaces shut down",
        },
        {
          type: "log",
          content:
            "Current process: Manual spot-checks on ~10% of devices quarterly\nRequired: 100% coverage weekly with compliance reports\nTeam skills: Strong Ansible, basic Python, no vendor-specific automation tools\nExisting: Ansible Tower deployed for Cisco devices only",
        },
        {
          type: "network",
          content:
            "All devices support SSH and have management IP addresses in the CMDB.\nCisco devices: ios_command and ios_config modules available in Ansible\nJuniper: junos_command and junos_config modules available\nArista: eos_command and eos_config modules available\nPalo Alto: panos collection available for Ansible\n\nAnsible Tower has scheduling, reporting, and RBAC capabilities.",
          icon: "automation",
        },
      ],
      classifications: [
        { id: "c1", label: "Multi-Vendor Compliance Auditing", description: "Scheduled configuration validation across heterogeneous network devices" },
        { id: "c2", label: "Configuration Drift Remediation", description: "Automatically correcting configuration deviations" },
        { id: "c3", label: "Inventory Discovery", description: "Discovering and cataloging network devices" },
        { id: "c4", label: "Real-Time Change Monitoring", description: "Detecting configuration changes as they happen" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem-1", label: "Extend Ansible Tower with multi-vendor playbooks and scheduled compliance jobs", description: "Create role-based playbooks per vendor using existing modules, schedule weekly runs in Tower with compliance reporting" },
        { id: "rem-2", label: "Deploy Batfish for offline configuration analysis", description: "Use Batfish to analyze device configurations against compliance policies without connecting to devices" },
        { id: "rem-3", label: "Build custom Python scripts per vendor platform", description: "Write separate compliance checking scripts for each vendor using their respective libraries" },
        { id: "rem-4", label: "Deploy Cisco DNA Center and Juniper Junos Space for vendor-specific compliance", description: "Use each vendor's management platform for compliance checks" },
      ],
      correctRemediationId: "rem-1",
      rationales: [
        {
          id: "r1",
          text: "Ansible Tower is already deployed and the team has strong Ansible skills. Extending it with vendor-specific roles for Juniper, Arista, and Palo Alto leverages existing infrastructure and skills. Tower provides scheduling for weekly runs, built-in reporting dashboards, and RBAC for separating compliance checking from remediation permissions.",
        },
        {
          id: "r2",
          text: "Multiple vendor-specific platforms would fragment management, require separate training, and create inconsistent compliance reporting. A single Ansible-based approach provides unified multi-vendor compliance with consistent reporting across all device types.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! Extending the existing Ansible Tower with multi-vendor playbooks is the optimal approach: it leverages existing skills, infrastructure, and provides unified compliance reporting across all four vendor platforms.",
        partial:
          "Ansible Tower already exists and supports all four vendors through collections. Extending it is simpler than deploying new tools or writing custom scripts for each vendor.",
        wrong:
          "With Ansible Tower already deployed and strong team skills, extending it with multi-vendor playbooks (Cisco, Juniper, Arista, Palo Alto) provides unified weekly compliance checks with built-in scheduling and reporting.",
      },
    },
  ],
  hints: [
    "For bulk configuration deployment across many similar devices, configuration management tools like Ansible provide idempotency and dry-run capabilities out of the box.",
    "Event-driven automation with sub-10-second response times favors lightweight custom scripts for small environments, while platforms like StackStorm suit larger scales.",
    "When choosing automation tools, consider existing team skills and deployed infrastructure. Extending what exists is often better than deploying something new.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Network automation is the most in-demand skill in modern networking. Engineers who can evaluate tools, design workflows, and implement automation across multi-vendor environments command premium salaries and drive operational transformation.",
  toolRelevance: [
    "Ansible/AWX",
    "Python/Netmiko",
    "NETCONF/YANG",
    "RESTCONF",
    "Terraform",
    "StackStorm",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
