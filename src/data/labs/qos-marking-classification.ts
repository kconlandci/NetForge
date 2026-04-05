import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "qos-marking-classification",
  version: 1,
  title: "QoS Marking and Classification",
  tier: "intermediate",
  track: "network-fundamentals",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["qos", "dscp", "traffic-classification", "priority"],
  description:
    "Prioritize network traffic with QoS markings by classifying traffic types and assigning appropriate DSCP values.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Map common traffic types to appropriate DSCP marking values",
    "Classify network traffic into priority queues based on business requirements",
    "Diagnose QoS misclassification causing application performance issues",
  ],
  sortOrder: 117,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "qos-001",
      title: "Voice Quality Degradation During Business Hours",
      description:
        "IP phone calls experience choppy audio and dropped packets during peak hours. QoS is configured but voice traffic appears to be treated the same as bulk data.",
      evidence: [
        {
          type: "log",
          content:
            "Switch# show mls qos interface GigabitEthernet0/1\nQoS Trust: untrusted\nDefault COS: 0\n\nAll traffic arriving on Gi0/1 (IP phone + PC port) is being marked DSCP 0 (Best Effort) regardless of the phone's markings.\n\nIP Phone sends: DSCP 46 (EF - Expedited Forwarding)\nAfter switch: DSCP 0 (Best Effort)",
        },
        {
          type: "log",
          content:
            "Router WAN interface QoS policy:\nClass VOICE (DSCP EF/46): Priority queue - 30% bandwidth guarantee\nClass SIGNALING (DSCP CS3/24): 5% bandwidth guarantee\nClass DATA (DSCP 0): Best effort - remaining bandwidth\n\nSince voice arrives marked DSCP 0, it falls into the DATA class and competes with bulk downloads.",
        },
      ],
      classifications: [
        { id: "c1", label: "Switch Port Trust Not Configured", description: "The switch port is not trusting DSCP markings from the IP phone, resetting all traffic to DSCP 0" },
        { id: "c2", label: "QoS Policy Missing on Router", description: "The WAN router has no QoS policy applied" },
        { id: "c3", label: "IP Phone Not Marking Traffic", description: "The IP phone is not setting DSCP values" },
        { id: "c4", label: "Bandwidth Insufficient for Voice", description: "The WAN link does not have enough bandwidth" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Configure the switch port to trust DSCP from the phone", description: "Set 'mls qos trust dscp' on the phone port so the phone's DSCP 46 marking is preserved through the switch" },
        { id: "rem2", label: "Increase the voice priority queue bandwidth to 50%", description: "Allocate more bandwidth to the voice queue on the WAN router" },
        { id: "rem3", label: "Configure the IP phones to mark DSCP 46", description: "Reconfigure phone DSCP settings" },
        { id: "rem4", label: "Deploy a dedicated voice VLAN with separate physical infrastructure", description: "Build a separate network for voice traffic" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "The switch port is set to 'untrusted', which resets all incoming DSCP markings to 0. The phone correctly marks traffic as DSCP 46 (EF), but the switch strips the marking. Configuring 'mls qos trust dscp' preserves the phone's marking through the network." },
        { id: "rat2", text: "The router QoS policy is correctly configured with a voice priority queue. The problem is upstream at the switch - voice traffic arrives at the router already marked DSCP 0 because the switch stripped the marking." },
        { id: "rat3", text: "The evidence shows the phone IS marking DSCP 46. The switch is overwriting the marking to DSCP 0 because the port trust is not configured." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! The switch port must trust DSCP markings from the IP phone. Without trust, the phone's DSCP 46 is reset to 0, causing voice to be treated as best-effort data.",
        partial: "You identified part of the issue. The switch port's untrusted state is overwriting the phone's DSCP 46 marking to DSCP 0, causing voice to miss the priority queue.",
        wrong: "The switch port is not configured to trust DSCP. The phone marks voice as DSCP 46, but the switch resets it to 0. Enabling DSCP trust on the port preserves the marking for the downstream QoS policy.",
      },
    },
    {
      type: "triage-remediate",
      id: "qos-002",
      title: "Video Conferencing Competing With Backups",
      description:
        "Video conferences degrade every night at 8 PM when backup jobs start. The QoS policy treats video and backup traffic with the same priority.",
      evidence: [
        {
          type: "log",
          content:
            "Router# show policy-map interface GigabitEthernet0/0\nClass-map: class-default (match-any)\n  Match: any\n  Queue: Best Effort\n  Bandwidth: remaining\n\nNo traffic classification configured.\nAll traffic (video, backups, web, email) shares the same queue.\n\nWAN utilization at 8 PM: 95%\nVideo conference DSCP: AF41 (34)\nBackup traffic DSCP: CS1 (8)\nBoth treated identically despite different markings.",
        },
        {
          type: "log",
          content:
            "Traffic analysis during backup window:\nBackup traffic: 75% of WAN bandwidth\nVideo conferences: 15% of WAN bandwidth\nOther: 10%\n\nVideo packet loss jumps from 0.1% to 5% when backups start.\nMOS score drops from 4.2 to 2.8 (unacceptable).",
        },
      ],
      classifications: [
        { id: "c1", label: "No QoS Policy Configured - All Traffic Best Effort", description: "The router has no traffic classification, so all traffic competes equally regardless of DSCP markings" },
        { id: "c2", label: "Backup Schedule Conflict", description: "The backup jobs should be rescheduled to a different time" },
        { id: "c3", label: "WAN Link Too Small", description: "The WAN bandwidth needs to be upgraded" },
        { id: "c4", label: "Video Codec Too Bandwidth-Intensive", description: "The video conferencing codec should be changed to use less bandwidth" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Create a QoS policy with separate classes for video, backup, and default traffic", description: "Configure class maps matching DSCP AF41 for video (bandwidth guarantee), CS1 for backup (rate-limited), and default for everything else" },
        { id: "rem2", label: "Block backup traffic during business hours", description: "Create an ACL to deny backup traffic from 6 AM to 10 PM" },
        { id: "rem3", label: "Increase WAN bandwidth to handle both simultaneously", description: "Upgrade the WAN link to a higher speed" },
        { id: "rem4", label: "Reschedule backups to 2 AM", description: "Move the backup window to avoid video conference hours" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "A proper QoS policy with traffic classification ensures video (DSCP AF41) gets guaranteed bandwidth even when backups saturate the link. Rate-limiting backup traffic (DSCP CS1) to a scavenger class prevents it from starving interactive applications." },
        { id: "rat2", text: "Blocking or rescheduling backups is a workaround that does not address the fundamental issue. QoS classification properly prioritizes traffic so both can coexist with appropriate service levels." },
        { id: "rat3", text: "Upgrading bandwidth without QoS just delays the problem. When backups grow to fill the new link, video will degrade again. QoS ensures proportional allocation regardless of total bandwidth." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! A QoS policy with proper classification gives video guaranteed bandwidth while limiting backup traffic to a scavenger class. Both can coexist without video degradation.",
        partial: "You identified the lack of QoS. The fix is creating class maps that match DSCP values and assign appropriate queue treatments to each traffic type.",
        wrong: "Without QoS classification, all traffic competes equally. A proper policy should guarantee bandwidth for video (AF41), rate-limit backups (CS1), and allow remaining bandwidth for other traffic.",
      },
    },
    {
      type: "triage-remediate",
      id: "qos-003",
      title: "Incorrect DSCP Marking Breaking SaaS Application",
      description:
        "A critical SaaS application has become very slow after a network team deployed a new QoS policy. The policy appears to be misclassifying the SaaS traffic.",
      evidence: [
        {
          type: "log",
          content:
            "New QoS policy class-map:\nclass-map match-any SCAVENGER\n  match dscp cs1\n  match protocol bittorrent\n  match access-group name BULK-DATA\n\naccess-list BULK-DATA:\n  permit tcp any any range 8000 9000\n\nSaaS Application: Uses HTTPS on port 8443\nResult: SaaS traffic matches the BULK-DATA ACL (port 8000-9000) and is classified as SCAVENGER, receiving the lowest priority.",
        },
        {
          type: "log",
          content:
            "Policy-map SCAVENGER action:\n  police rate 1Mbps burst 256000\n  exceed-action drop\n\nSaaS application normally uses 15Mbps.\nWith 1Mbps policing: 93% packet loss on SaaS traffic.\nUser experience: Application unusable.",
        },
      ],
      classifications: [
        { id: "c1", label: "Overly Broad ACL Matching Legitimate Traffic as Scavenger", description: "The port range 8000-9000 in the scavenger ACL accidentally captures SaaS HTTPS traffic on port 8443" },
        { id: "c2", label: "SaaS Application Using Wrong Port", description: "The SaaS application should not be using port 8443" },
        { id: "c3", label: "Police Rate Too Low for All Scavenger Traffic", description: "The 1Mbps rate limit needs to be increased" },
        { id: "c4", label: "DSCP Remarking by ISP", description: "The ISP is changing DSCP values in transit" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Narrow the scavenger ACL to exclude port 8443 and add a specific class for SaaS traffic", description: "Remove port 8443 from the bulk-data range and create a dedicated class matching the SaaS application with appropriate priority" },
        { id: "rem2", label: "Increase the scavenger police rate to 20Mbps", description: "Raise the rate limit to accommodate the SaaS traffic" },
        { id: "rem3", label: "Remove the QoS policy entirely", description: "Delete the policy to restore default best-effort behavior" },
        { id: "rem4", label: "Change the SaaS application to use a port outside 8000-9000", description: "Reconfigure the application to avoid the scavenger ACL" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "The ACL range 8000-9000 is too broad and catches the SaaS application on port 8443. Narrowing the ACL to exclude 8443 and creating a dedicated class for SaaS traffic ensures it receives appropriate QoS treatment instead of being rate-limited to 1Mbps." },
        { id: "rat2", text: "Increasing the scavenger rate to accommodate SaaS traffic would also increase bandwidth for actual scavenger traffic like BitTorrent, defeating the purpose of the scavenger class." },
        { id: "rat3", text: "Removing the entire QoS policy would bring back the original problems it was meant to solve. The policy needs refinement, not removal." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! The overly broad ACL caused misclassification. Narrowing it and creating a dedicated SaaS class ensures proper treatment for all traffic types without collateral damage.",
        partial: "You identified the misclassification. The fix is to exclude port 8443 from the scavenger ACL and create a proper class for the SaaS application.",
        wrong: "The ACL port range 8000-9000 accidentally matches the SaaS application on port 8443. Fixing the ACL and creating a dedicated class for SaaS traffic resolves the misclassification.",
      },
    },
  ],
  hints: [
    "Common DSCP values: EF (46) for voice, AF41 (34) for video, CS3 (24) for signaling, AF21 (18) for transactional data, CS1 (8) for scavenger/bulk, 0 for best effort.",
    "QoS trust must be configured on switch ports for DSCP markings to be preserved. Untrusted ports reset all markings to DSCP 0 (Best Effort).",
    "Overly broad ACLs in QoS policies can misclassify legitimate traffic. Always verify that classification rules do not accidentally match business-critical applications.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "QoS design and troubleshooting is essential for unified communications engineers and network architects. Proper QoS implementation directly impacts user experience for voice, video, and critical applications.",
  toolRelevance: ["show policy-map interface", "show mls qos", "Wireshark DSCP filters", "show class-map"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
