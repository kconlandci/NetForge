import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ai-firewall-change-review",
  version: 1,
  title: "Sign-Off: Review the AI's Firewall Change",
  tier: "advanced",
  track: "network-security",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["firewall", "acl", "ai-review", "change-management", "least-privilege"],
  description:
    "An AI assistant generated the firewall rule sets for a branch go-live and summarized them as least-privilege and production-ready. Read the actual rules — catch the management-plane exposure, the shadowed deny, and the over-broad permit — and decide what ships under your sign-off.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Verify an AI-generated firewall rule set rule by rule instead of approving its summary",
    "Identify management-plane exposure (SSH/RDP permitted from any source) in generated rules",
    "Detect shadowed rules — an explicit deny placed below a broader permit so it never matches",
    "Apply least privilege to generated outbound rules (DNS, SMTP, IoT) without breaking the business traffic they exist to serve",
    "Distinguish the rules an AI got right from the ones it got wrong, and sign off only on a corrected change",
  ],
  sortOrder: 415,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "ai-fw-branch-inbound",
      title: "Branch Rollout — AI-Generated Inbound Rules",
      description:
        "A new branch office goes live tonight. An AI assistant generated the inbound rule set for the branch edge firewall and summarized it as 'least-privilege, production-ready.' You are the approver on the change ticket. For each rule, decide: keep it as written, fix it, or drop it.",
      targetSystem: "Palo Alto PAN-OS > Policies > Security — BR-EDGE-01 (new branch)",
      items: [
        {
          id: "rule-web-app",
          label: "Rule 1: Branch Web Application",
          detail: "Permit TCP Any -> 10.30.20.15:443 — customer-facing web app hosted at the branch",
          currentState: "Keep as written",
          correctState: "Keep as written",
          states: [
            "Keep as written",
            "Fix: also open port 80 to the same host",
            "Drop the rule",
          ],
          rationaleId: "rat-web-app",
        },
        {
          id: "rule-mgmt-any",
          label: "Rule 2: Device Management Access",
          detail: "Permit TCP Any -> 10.30.0.10:22,3389 — firewall and server management interfaces",
          currentState: "Keep as written",
          correctState: "Fix: restrict source to HQ admin subnet 10.10.5.0/24 via the jump host",
          states: [
            "Keep as written",
            "Fix: restrict source to HQ admin subnet 10.10.5.0/24 via the jump host",
            "Drop the rule",
          ],
          rationaleId: "rat-mgmt-any",
        },
        {
          id: "rule-permit-any",
          label: "Rule 3: Go-Live Safety Net",
          detail: "Permit IP Any -> Any — the AI added this 'to prevent go-live outages and allow troubleshooting'",
          currentState: "Keep as written",
          correctState: "Drop the rule",
          states: [
            "Keep as written",
            "Fix: keep it for 24 hours, then remove it after go-live",
            "Drop the rule",
          ],
          rationaleId: "rat-permit-any",
        },
        {
          id: "rule-dns",
          label: "Rule 4: Branch DNS Resolution",
          detail: "Permit UDP 10.30.0.0/16 -> 10.10.1.53, 10.10.1.54:53 — branch clients to the corporate resolvers",
          currentState: "Keep as written",
          correctState: "Keep as written",
          states: [
            "Keep as written",
            "Fix: allow DNS to any resolver for redundancy",
            "Drop the rule",
          ],
          rationaleId: "rat-dns",
        },
        {
          id: "rule-deny-log",
          label: "Rule 5: Final Deny",
          detail: "Deny IP Any -> Any — the AI disabled logging on this rule 'to reduce log volume'",
          currentState: "Keep as written",
          correctState: "Fix: keep the deny and enable logging",
          states: [
            "Keep as written",
            "Fix: keep the deny and enable logging",
            "Drop the rule",
          ],
          rationaleId: "rat-deny-log",
        },
      ],
      rationales: [
        {
          id: "rat-web-app",
          text: "This rule is correctly scoped: any source, but one destination host on one port, for a service that is public by design. Not every AI-generated rule is wrong — the review skill is telling the difference.",
        },
        {
          id: "rat-mgmt-any",
          text: "This is the management-plane exposure. SSH and RDP reachable from any source address will be found by internet scanners within hours and subjected to continuous brute-force and exploit attempts. Management access must be restricted to the HQ admin subnet through the jump host — but it cannot simply be dropped, or the branch cannot be administered.",
        },
        {
          id: "rat-permit-any",
          text: "A permit-any rule nullifies every other rule in the set. The AI's justification — preventing go-live outages — trades a hypothetical troubleshooting convenience for a total loss of filtering on day one. 'Keep it for 24 hours' fails the same way: temporary broad permits are the ones that get forgotten and become permanent. If a specific flow is blocked at go-live, add the specific rule it needs.",
        },
        {
          id: "rat-dns",
          text: "Correctly written: branch clients may query only the two corporate resolvers. Widening this to any resolver would reopen DNS tunneling and bypass corporate DNS security filtering.",
        },
        {
          id: "rat-deny-log",
          text: "The deny itself is right; disabling its logging is not. The final deny is where you see scanning, misconfigurations, and blocked attack attempts. An unlogged deny is a blind spot exactly where visibility matters most, and 'log volume' is a SIEM tuning problem, not a reason to stop collecting.",
        },
      ],
      feedback: {
        perfect:
          "Correct sign-off. You kept the two rules the AI got right, fixed the management-plane exposure instead of dropping administration entirely, killed the permit-any, and restored logging on the final deny. That is the review a change approver is paid for.",
        partial:
          "You caught some of it. Re-check Rule 2 (management ports reachable from any source is the critical exposure) and Rule 3 (a permit-any makes the rest of the rule set decorative). Also check what the AI quietly turned off on the final deny.",
        wrong:
          "Approving this set as written puts firewall and server management ports on the open internet, adds a permit-any that cancels the rest of the policy, and blinds the final deny by disabling its logging. Read each rule's source, destination, and port — the summary's 'least-privilege' claim does not survive contact with the rules themselves.",
      },
    },
    {
      type: "toggle-config",
      id: "ai-fw-shadowed-deny",
      title: "The Deny Rule That Never Matches",
      description:
        "For a headquarters firewall, the AI 'optimized rule order for performance' and moved frequently-hit rules to the top. The change summary reports all compliance rules intact. A compliance rule (REQ-PCI-04) requires that guest-network traffic can never reach the PCI cardholder VLAN. Review the reordered rulebase before it ships.",
      targetSystem: "Cisco FTD > Access Control Policy — HQ-EDGE (AI-reordered rulebase)",
      items: [
        {
          id: "deny-pci-shadowed",
          label: "Deny IP Guest-VLAN -> PCI-VLAN (REQ-PCI-04)",
          detail: "Explicit compliance deny. Rule hit counter shows 0 matches in 30 days — the AI notes this as proof it is 'no longer needed'",
          currentState: "Position 9 — below the broad permit at position 5",
          correctState: "Move to position 2 — above the broad permit",
          states: [
            "Position 9 — below the broad permit at position 5",
            "Move to position 2 — above the broad permit",
            "Delete it — 0 hits means nothing tries to cross",
          ],
          rationaleId: "rat-pci-shadow",
        },
        {
          id: "permit-broad-web",
          label: "Permit TCP Any-Internal -> Any:80,443",
          detail: "The AI's 'web productivity' rule, moved up to position 5 for performance. It matches guest-VLAN traffic toward PCI-VLAN web ports",
          currentState: "Position 5, destination Any",
          correctState: "Scope the destination to internal web tiers, explicitly excluding the PCI-VLAN",
          states: [
            "Position 5, destination Any",
            "Scope the destination to internal web tiers, explicitly excluding the PCI-VLAN",
            "Drop the rule — web access is not a business need",
          ],
          rationaleId: "rat-broad-web",
        },
        {
          id: "permit-app-db",
          label: "Permit TCP App-Servers -> DB-Tier:1521",
          detail: "Application tier to database tier on the Oracle port only, both zones named, logging on",
          currentState: "Position 3, as written",
          correctState: "Position 3, as written",
          states: [
            "Position 3, as written",
            "Fix: widen to all database ports 1024-65535 for flexibility",
            "Drop the rule",
          ],
          rationaleId: "rat-app-db",
        },
        {
          id: "deny-final-logging",
          label: "Final Deny IP Any -> Any",
          detail: "Catch-all at the bottom of the policy. The AI's reorder left its logging profile detached",
          currentState: "Position 12, logging off",
          correctState: "Position 12, logging on",
          states: [
            "Position 12, logging off",
            "Position 12, logging on",
            "Move to position 1 so it is evaluated first",
          ],
          rationaleId: "rat-final-deny",
        },
      ],
      rationales: [
        {
          id: "rat-pci-shadow",
          text: "This is a shadowed rule: firewalls evaluate top-down and stop at the first match, so the broad permit at position 5 matches guest-to-PCI web traffic before the deny at position 9 is ever evaluated. The 0-hit counter is not proof the rule is unneeded — it is the symptom of the shadowing. The AI read the evidence backwards. The deny must sit above the permit that would otherwise match the same traffic.",
        },
        {
          id: "rat-broad-web",
          text: "The broad permit is the other half of the defect. 'Any' destination includes the PCI-VLAN, which is how it shadows the compliance deny. Scoping the destination to the web tiers that actually need it removes the overlap; dropping it entirely would break ordinary web access for every internal user.",
        },
        {
          id: "rat-app-db",
          text: "Correct as written: named source zone, named destination tier, single application port, logging on. Widening it to a port range 'for flexibility' would convert a least-privilege rule into a lateral-movement path between tiers.",
        },
        {
          id: "rat-final-deny",
          text: "The final deny belongs last — moving it to position 1 would block everything, including the permits below it. What the reorder actually broke is its logging: a catch-all deny with no logs hides every blocked attempt the rest of the policy generates.",
        },
      ],
      feedback: {
        perfect:
          "Exactly right. You recognized that 0 hits on the compliance deny was the signature of shadowing, not obsolescence, restored the deny above the broad permit, scoped the permit so the overlap is gone, and fixed the final deny's logging without moving it.",
        partial:
          "Close. The core defect is rule order: the broad permit at position 5 matches the traffic first, so the PCI deny below it can never fire. Moving the deny above the permit — and narrowing the permit's destination — is what restores the compliance control.",
        wrong:
          "Rule order is the policy. A deny below a broader permit that matches the same traffic is not a control, it is documentation. The AI's reorder silently disabled REQ-PCI-04 while reporting it intact, and its '0 hits' observation was the evidence of the failure, not a reason to delete the rule.",
      },
    },
    {
      type: "toggle-config",
      id: "ai-fw-outbound",
      title: "AI-Generated Outbound Rules — SaaS Day One",
      description:
        "The same AI generated the branch's outbound policy 'so users can reach SaaS applications on day one.' Outbound rules are where exfiltration paths hide. Decide keep, fix, or drop for each rule.",
      targetSystem: "FortiGate > Firewall Policy — Branch LAN -> WAN",
      items: [
        {
          id: "out-dns-any",
          label: "Outbound DNS",
          detail: "Permit UDP/TCP LAN -> Any:53 — the AI allows any resolver 'for reliability'",
          currentState: "Keep as written",
          correctState: "Fix: restrict DNS to the corporate resolvers 10.10.1.53 and 10.10.1.54",
          states: [
            "Keep as written",
            "Fix: restrict DNS to the corporate resolvers 10.10.1.53 and 10.10.1.54",
            "Drop the rule",
          ],
          rationaleId: "rat-out-dns",
        },
        {
          id: "out-smtp-any",
          label: "Outbound Email",
          detail: "Permit TCP Any-Workstation -> Any:25 — the AI enabled direct SMTP 'so email always works'",
          currentState: "Keep as written",
          correctState: "Fix: only the mail gateway may send, on port 587; block workstation port 25",
          states: [
            "Keep as written",
            "Fix: only the mail gateway may send, on port 587; block workstation port 25",
            "Drop the rule",
          ],
          rationaleId: "rat-out-smtp",
        },
        {
          id: "out-web",
          label: "Outbound Web",
          detail: "Permit TCP LAN -> Any:80,443 — standard web and SaaS access for branch users",
          currentState: "Keep as written",
          correctState: "Keep as written",
          states: [
            "Keep as written",
            "Fix: restrict to a list of approved SaaS domains only",
            "Drop the rule",
          ],
          rationaleId: "rat-out-web",
        },
        {
          id: "out-vendor-rdp",
          label: "Vendor Support Access",
          detail: "Permit TCP 198.51.100.0/24 (vendor VPN range) -> 10.30.30.40:3389, business hours 08:00-18:00 Mon-Fri, logging on",
          currentState: "Keep as written",
          correctState: "Keep as written",
          states: [
            "Keep as written",
            "Fix: extend to 24x7 so the vendor can respond faster",
            "Drop the rule — vendor access is too risky",
          ],
          rationaleId: "rat-out-vendor",
        },
        {
          id: "out-iot-any",
          label: "IoT Device Traffic",
          detail: "Permit IP IoT-VLAN -> Any — the AI notes 'IoT devices need flexibility to reach their cloud services'",
          currentState: "Keep as written",
          correctState: "Fix: scope IoT traffic to DNS, NTP, and the vendor update endpoints only",
          states: [
            "Keep as written",
            "Fix: scope IoT traffic to DNS, NTP, and the vendor update endpoints only",
            "Drop the rule",
          ],
          rationaleId: "rat-out-iot",
        },
      ],
      rationales: [
        {
          id: "rat-out-dns",
          text: "DNS to any resolver is a classic exfiltration and policy-bypass channel: DNS tunneling encodes data in query names, and third-party resolvers bypass corporate DNS filtering. Reliability comes from having two corporate resolvers, not from opening DNS to the internet.",
        },
        {
          id: "rat-out-smtp",
          text: "Workstations sending directly on port 25 is how compromised hosts become spam and phishing relays, and it bypasses the mail gateway's scanning and logging. The gateway submits on 587; workstations should have no direct SMTP path at all.",
        },
        {
          id: "rat-out-web",
          text: "Standard web egress on 80/443 is the business requirement itself. Restricting SaaS to an allowlist sounds safer but breaks constantly in practice and is not where this policy's real risks live — the risks are the DNS, SMTP, and IoT rules around it.",
        },
        {
          id: "rat-out-vendor",
          text: "This is the AI's best rule: a named source range, one destination host, one port, a business-hours schedule, and logging. Extending it to 24x7 'for faster response' removes the time control that makes standing vendor access acceptable; dropping it removes a support path the business contracted for.",
        },
        {
          id: "rat-out-iot",
          text: "'Flexibility' for the least trustworthy devices on the network is backwards. IoT devices are rarely patched and frequently compromised; their egress should be the most restricted in the policy — DNS, NTP, and the specific vendor update endpoints they actually need, nothing else.",
        },
      ],
      feedback: {
        perfect:
          "Strong review. You closed the two classic exfiltration paths (open DNS and workstation SMTP), scoped the IoT VLAN to what its devices actually need, and left both legitimate rules — web egress and the tightly-scoped vendor access — intact.",
        partial:
          "Mostly there. Re-check the DNS rule (any-resolver DNS is a tunneling channel, not a reliability feature) and the IoT rule (unrestricted egress for the least patchable devices on the network). The vendor RDP rule, as written, is actually fine — scoped, scheduled, and logged.",
        wrong:
          "As written, this policy lets any host resolve through any DNS server, lets workstations relay mail directly on port 25, and gives the IoT VLAN unrestricted internet access — three standard exfiltration and abuse paths, all described by the AI as conveniences. Outbound rules deserve the same skepticism as inbound ones.",
      },
    },
  ],
  hints: [
    "Read the rules, not the summary. The AI's description of its own rule set is a claim; each rule's source, destination, and port is the fact.",
    "Firewalls match top-down, first match wins. A deny placed below a broader permit that matches the same traffic will never fire — and a zero hit count is the symptom, not proof the rule is unneeded.",
    "Management ports (22, 3389) from 'any' source and DNS to 'any' resolver are the two exposures AI-generated rule sets produce most often. Check them first in every review.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Change review is where AI-generated configuration meets accountability: the assistant can produce a rule set in seconds, but a human signs the change ticket and owns the outage or the breach. The reviewers who stay trusted are the ones who read every rule's source, destination, and order — because the failures are confident ones: a management port described as restricted, a compliance deny described as intact after being shadowed, a permit-any described as a safety net.",
  toolRelevance: [
    "Palo Alto PAN-OS",
    "Cisco FTD / ASA",
    "Fortinet FortiGate",
    "Firewall policy analyzers (Tufin, AlgoSec)",
  ],
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
};

export default lab;
