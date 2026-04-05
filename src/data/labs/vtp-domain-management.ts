import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "vtp-domain-management",
  version: 1,
  title: "Triage VTP Domain Issues",

  tier: "advanced",
  track: "routing-switching",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["vtp", "vlan", "domain", "trunking", "triage"],

  description:
    "Classify and remediate VTP domain issues including revision number conflicts, mode mismatches, password failures, and VLAN database corruption across a switched network.",
  estimatedMinutes: 16,
  learningObjectives: [
    "Identify VTP revision number conflicts that wipe VLAN databases",
    "Classify VTP mode configuration issues across a domain",
    "Remediate VTP password mismatches and version incompatibilities",
  ],
  sortOrder: 215,

  status: "published",
  prerequisites: [],

  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "vtp-revision-bomb",
      title: "VTP Revision Number Conflict",
      description:
        "After connecting a repurposed switch to the production network, all user VLANs disappeared across the campus. The new switch had a higher VTP revision number and was in server mode with an empty VLAN database.",
      evidence: [
        {
          type: "cli-output",
          content:
            "Switch1# show vtp status\nVTP Version                     : 2\nConfiguration Revision          : 45\nMaximum VLANs supported locally : 255\nNumber of existing VLANs        : 5\nVTP Operating Mode              : Server\nVTP Domain Name                 : PRODUCTION\nVTP Pruning Mode                : Disabled",
        },
        {
          type: "cli-output",
          content:
            "NewSwitch# show vtp status\nVTP Version                     : 2\nConfiguration Revision          : 89\nMaximum VLANs supported locally : 255\nNumber of existing VLANs        : 1\nVTP Operating Mode              : Server\nVTP Domain Name                 : PRODUCTION\nVTP Pruning Mode                : Disabled",
        },
        {
          type: "log-entry",
          content:
            "%SW_VLAN-6-VTP_REV_ERR: VTP revision 89 received from NewSwitch, overwriting local revision 45.\n%SYS-5-CONFIG_I: Multiple VLANs removed from database",
        },
      ],
      classifications: [
        {
          id: "revision-overwrite",
          label: "VTP Revision Number Overwrite",
          description: "A switch with a higher revision number overwrote the VLAN database across the domain.",
        },
        {
          id: "domain-mismatch",
          label: "VTP Domain Name Mismatch",
          description: "Switches are in different VTP domains and cannot synchronize.",
        },
        {
          id: "password-failure",
          label: "VTP Password Authentication Failure",
          description: "VTP password mismatch preventing VLAN synchronization.",
        },
      ],
      correctClassificationId: "revision-overwrite",
      remediations: [
        {
          id: "restore-vlans-reset-rev",
          label: "Restore VLANs on server switch, reset revision on rogue switch by changing to transparent then back to client",
          description: "Recreate the VLANs on the VTP server and reset the rogue switch's revision number.",
        },
        {
          id: "change-domain",
          label: "Change the VTP domain name on the new switch",
          description: "Move the new switch to a different VTP domain to isolate it.",
        },
        {
          id: "reboot-all",
          label: "Reboot all switches to restore VLANs from startup config",
          description: "Power cycle all switches hoping the VLAN database recovers.",
        },
      ],
      correctRemediationId: "restore-vlans-reset-rev",
      rationales: [
        {
          id: "r1",
          text: "The new switch had revision 89 > 45, so all VTP server/client switches adopted its empty database. Restore VLANs on the server and reset the rogue switch's revision by toggling to transparent mode.",
        },
        {
          id: "r2",
          text: "Changing the domain only prevents future issues. The VLANs are already gone and must be recreated on the VTP server.",
        },
        {
          id: "r3",
          text: "Rebooting does not restore VLANs because VTP updates are written to vlan.dat (not startup-config). The VLAN database is already overwritten on all switches.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The higher revision number overwrote the production VLAN database. Restore VLANs on the server and reset the rogue switch's revision number to prevent recurrence.",
        partial:
          "You identified the issue type but the remediation needs both VLAN restoration and revision number reset. One without the other leaves the network vulnerable.",
        wrong:
          "VTP revision number attacks/accidents are one of the most dangerous Layer 2 events. A switch with a higher revision overwrites the entire domain's VLAN database.",
      },
    },
    {
      type: "triage-remediate",
      id: "vtp-transparent-leak",
      title: "VTP Transparent Mode Blocking Updates",
      description:
        "A new VLAN (VLAN 50) was created on the VTP server but is not appearing on client switches behind a switch that was set to VTP transparent mode for testing and never changed back.",
      evidence: [
        {
          type: "cli-output",
          content:
            "ServerSwitch# show vtp status\nVTP Operating Mode: Server\nVTP Domain: CAMPUS\nConfiguration Revision: 67\nNumber of existing VLANs: 12",
        },
        {
          type: "cli-output",
          content:
            "MidSwitch# show vtp status\nVTP Operating Mode: Transparent\nVTP Domain: CAMPUS\nConfiguration Revision: 0\nNumber of existing VLANs: 8",
        },
        {
          type: "cli-output",
          content:
            "ClientSwitch# show vtp status\nVTP Operating Mode: Client\nVTP Domain: CAMPUS\nConfiguration Revision: 52\nNumber of existing VLANs: 8",
        },
      ],
      classifications: [
        {
          id: "transparent-blocking",
          label: "VTP Transparent Mode Blocking Propagation",
          description: "A transparent mode switch is forwarding VTP advertisements in VTPv2 but not applying them, and downstream clients are not receiving updates due to topology.",
        },
        {
          id: "version-mismatch",
          label: "VTP Version Mismatch",
          description: "Different VTP versions preventing communication between switches.",
        },
        {
          id: "trunk-down",
          label: "Trunk Link Failure",
          description: "The trunk between switches is down, preventing VTP advertisements.",
        },
      ],
      correctClassificationId: "transparent-blocking",
      remediations: [
        {
          id: "change-to-client",
          label: "Change MidSwitch from transparent to client mode",
          description: "Set MidSwitch to VTP client so it participates in VTP synchronization and passes updates to downstream switches.",
        },
        {
          id: "recreate-vlans",
          label: "Manually create VLAN 50 on MidSwitch and ClientSwitch",
          description: "Bypass VTP and manually configure the missing VLAN on each switch.",
        },
        {
          id: "change-vtp-version",
          label: "Upgrade all switches to VTP version 3",
          description: "VTPv3 handles transparent mode differently and may fix the issue.",
        },
      ],
      correctRemediationId: "change-to-client",
      rationales: [
        {
          id: "r1",
          text: "In VTPv2, transparent switches forward VTP ads but do not apply them. However, the client's revision (52) is lower than the server's (67), indicating it is not receiving updates. Changing MidSwitch to client mode restores normal VTP participation.",
        },
        {
          id: "r2",
          text: "Manually creating VLANs works as a workaround but does not fix the underlying VTP topology issue. Future VLANs will have the same problem.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The transparent mode switch was left from testing. Changing it to client mode restores VTP propagation to downstream switches.",
        partial:
          "You classified the issue correctly but the remediation should fix VTP propagation, not work around it. Restore proper VTP mode.",
        wrong:
          "VTP transparent mode means the switch manages its own VLAN database independently. Downstream clients may not receive updates if the topology routes through it.",
      },
    },
    {
      type: "triage-remediate",
      id: "vtp-password-mismatch",
      title: "VTP Password Preventing Synchronization",
      description:
        "A newly deployed switch is in client mode but is not receiving the VLAN database from the VTP server. The domain name matches. Investigation reveals a VTP password was recently enforced across the domain.",
      evidence: [
        {
          type: "cli-output",
          content:
            "NewClient# show vtp status\nVTP Version                     : 2\nConfiguration Revision          : 0\nNumber of existing VLANs        : 5\nVTP Operating Mode              : Client\nVTP Domain Name                 : ENTERPRISE\nVTP Password                    : (not configured)",
        },
        {
          type: "cli-output",
          content:
            "VTPServer# show vtp password\nVTP Password: ********\nVTP Password is configured.",
        },
        {
          type: "log-entry",
          content:
            "%SW_VLAN-4-VTP_USER_NOTIFICATION: VTP advertisements from ENTERPRISE domain rejected - MD5 digest mismatch on Gi0/1",
        },
      ],
      classifications: [
        {
          id: "password-mismatch",
          label: "VTP Password Mismatch",
          description: "The new client switch does not have the VTP password configured, causing MD5 digest failures.",
        },
        {
          id: "revision-conflict",
          label: "VTP Revision Number Issue",
          description: "The client has revision 0 and cannot sync because of a revision conflict.",
        },
        {
          id: "domain-mismatch",
          label: "VTP Domain Mismatch",
          description: "The switches are in different VTP domains.",
        },
      ],
      correctClassificationId: "password-mismatch",
      remediations: [
        {
          id: "set-password",
          label: "Configure the matching VTP password on the new client switch",
          description: "Set 'vtp password <password>' on the new switch to match the domain-wide VTP password.",
        },
        {
          id: "remove-password",
          label: "Remove the VTP password from all switches",
          description: "Clear the VTP password domain-wide to eliminate authentication.",
        },
        {
          id: "manual-vlans",
          label: "Manually configure VLANs and switch to transparent mode",
          description: "Bypass VTP by managing VLANs manually on the new switch.",
        },
      ],
      correctRemediationId: "set-password",
      rationales: [
        {
          id: "r1",
          text: "The log clearly shows MD5 digest mismatch. The new client has no VTP password while the server does. Setting the matching password allows VTP synchronization.",
        },
        {
          id: "r2",
          text: "Removing the password from all switches removes a security layer. VTP passwords prevent rogue switches from injecting VLAN changes. Add the password to the new switch instead.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The MD5 digest mismatch log confirms a VTP password issue. Configure the correct password on the new client to enable synchronization.",
        partial:
          "You identified VTP authentication as the issue. The fix should add the password to the new switch, not remove security from the domain.",
        wrong:
          "The log message about MD5 digest mismatch is the key evidence. VTP passwords must match on all switches in the domain for synchronization.",
      },
    },
  ],
  hints: [
    "VTP revision numbers determine which switch has the 'newest' VLAN database. A higher revision overwrites lower ones across the domain.",
    "VTP transparent mode switches manage their own VLANs independently. In VTPv2 they forward ads but may not fully relay to downstream clients.",
    "VTP passwords create an MD5 digest of each advertisement. If the password does not match, the switch rejects the VTP update entirely.",
  ],

  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },

  careerInsight:
    "VTP revision number incidents have brought down production networks at major enterprises. Understanding VTP behavior and its risks is critical for any network engineer working with Cisco switches.",
  toolRelevance: [
    "Cisco IOS CLI",
    "VLAN database management",
    "Change management procedures",
    "Network documentation",
  ],

  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
