import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "cable-testing-diagnosis",
  version: 1,
  title: "Cable Testing and Diagnosis",
  tier: "beginner",
  track: "network-troubleshooting",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["cabling", "cable-tester", "crosstalk", "physical-layer", "copper"],
  description:
    "Diagnose cable faults using cable tester results including crosstalk, opens, shorts, and cable length measurements.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Interpret cable tester output to identify specific fault types",
    "Classify cable faults by severity and recommend appropriate remediation",
    "Understand the relationship between cable defects and network symptoms",
  ],
  sortOrder: 601,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "ctd-001",
      title: "Intermittent Drops on New Patch Cable",
      description:
        "A newly crimped Cat6 patch cable is causing intermittent link drops on a workstation port. You attach a cable tester and get the following results:\n\nFluke DTX-1800 Cable Test Report\n================================\nTest: TIA-568-C.2 Cat 6\nResult: FAIL\n\nWire Map:       PASS\nLength:         4.2m (within limit)\nInsertion Loss: PASS\nNEXT (Near-End Crosstalk):\n  Pair 3-6 to Pair 4-5: FAIL  (-28.2 dB, limit -35.3 dB)\n  Pair 1-2 to Pair 3-6: PASS  (-42.1 dB)\n  Pair 1-2 to Pair 4-5: PASS  (-40.8 dB)\nReturn Loss:    MARGINAL (14.8 dB, limit 15.0 dB)\n\nThe cable was hand-crimped with a standard RJ-45 crimping tool.",
      evidence: [
        {
          type: "log",
          content:
            "NEXT failure on Pair 3-6 to Pair 4-5 at -28.2 dB (limit -35.3 dB). Return loss marginal at 14.8 dB.",
        },
        {
          type: "observation",
          content:
            "Hand-crimped cable with standard RJ-45 connectors. Untwisting at the connector exceeds 13mm.",
        },
      ],
      classifications: [
        {
          id: "c1",
          label: "Near-End Crosstalk (NEXT) Failure",
          description:
            "Excessive signal coupling between adjacent wire pairs at the connector end",
        },
        {
          id: "c2",
          label: "Cable Length Exceeded",
          description:
            "Cable run exceeds TIA maximum distance specification",
        },
        {
          id: "c3",
          label: "Open Circuit",
          description:
            "One or more conductors are broken and not making contact",
        },
      ],
      correctClassificationId: "c1",
      remediations: [
        {
          id: "rm1",
          label: "Re-terminate with less untwist",
          description:
            "Cut off connectors and re-crimp maintaining pair twist within 13mm of the connector to reduce crosstalk",
        },
        {
          id: "rm2",
          label: "Replace with factory-made patch cable",
          description:
            "Use a pre-tested factory-terminated patch cable to guarantee Cat6 performance",
        },
        {
          id: "rm3",
          label: "Reduce cable length",
          description:
            "Shorten the cable run to decrease signal attenuation",
        },
      ],
      correctRemediationId: "rm1",
      rationales: [
        {
          id: "r1",
          text: "The NEXT failure on Pair 3-6 to Pair 4-5 at -28.2 dB (7 dB over the limit) indicates excessive untwisting at the connector. Re-terminating with minimal untwist will restore pair geometry and reduce crosstalk to within spec.",
        },
        {
          id: "r2",
          text: "The cable length at 4.2m is well within the 100m limit, so shortening it would not address the crosstalk issue. The problem is connector termination quality, not cable distance.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! NEXT failures on short cables almost always indicate excessive untwisting at the termination point. Re-crimping with less than 13mm of untwist is the correct fix.",
        partial:
          "You identified part of the issue. The NEXT failure is caused by too much untwisting at the connector, which allows electromagnetic interference between adjacent pairs. Re-termination is the targeted fix.",
        wrong:
          "This is a NEXT (Near-End Crosstalk) failure. The cable is only 4.2m long, so length is not the issue. The hand-crimped connector has excessive untwist, causing signal bleed between Pair 3-6 and Pair 4-5. Re-termination with proper twist maintenance is the fix.",
      },
    },
    {
      type: "triage-remediate",
      id: "ctd-002",
      title: "No Link on Wall Jack After Renovation",
      description:
        "After an office renovation, a wall jack provides no link light when a laptop is connected. The cable tester shows:\n\nFluke DTX-1800 Cable Test Report\n================================\nTest: TIA-568-C.2 Cat 6\nResult: FAIL\n\nWire Map: FAIL\n  Pair 1 (Pin 4-5): OPEN at 22.3m\n  Pair 2 (Pin 1-2): PASS\n  Pair 3 (Pin 3-6): PASS\n  Pair 4 (Pin 7-8): PASS\nLength:\n  Pair 1: 22.3m (fault)\n  Pair 2: 45.1m\n  Pair 3: 45.0m\n  Pair 4: 45.2m\n\nThe cable runs through a wall that had drywall screws installed during renovation.",
      evidence: [
        {
          type: "log",
          content:
            "Wire map FAIL: Open on Pair 1 (Pin 4-5) at 22.3m. Total cable run is approximately 45m.",
        },
        {
          type: "observation",
          content:
            "Drywall screws were installed along the cable pathway during renovation. The open is at 22.3m, midway through the cable run.",
        },
      ],
      classifications: [
        {
          id: "c1",
          label: "Near-End Crosstalk Failure",
          description: "Signal coupling between wire pairs at the connector",
        },
        {
          id: "c2",
          label: "Open Circuit (Cable Damage)",
          description:
            "A conductor is severed, likely due to physical damage from construction",
        },
        {
          id: "c3",
          label: "Short Circuit",
          description:
            "Two conductors are making unintended contact with each other",
        },
      ],
      correctClassificationId: "c2",
      remediations: [
        {
          id: "rm1",
          label: "Re-terminate both ends",
          description:
            "Cut and re-crimp the connectors at the patch panel and wall jack",
        },
        {
          id: "rm2",
          label: "Pull a new cable run",
          description:
            "Replace the damaged cable with a new run through the same or alternate pathway",
        },
        {
          id: "rm3",
          label: "Splice the cable at the break point",
          description:
            "Locate the break at 22.3m and splice the conductors back together",
        },
      ],
      correctRemediationId: "rm2",
      rationales: [
        {
          id: "r1",
          text: "The open at 22.3m on a 45m run places the break in the middle of the cable, likely caused by a drywall screw piercing the conductor. Re-terminating the ends will not fix a mid-span break. A new cable pull is required because splicing is not supported for Cat6 performance certification.",
        },
        {
          id: "r2",
          text: "Splicing copper data cables introduces impedance mismatches that will cause return loss failures during certification. TIA standards do not permit splices in horizontal cabling runs.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The open at 22.3m on a 45m run is a mid-span cable break, almost certainly from a drywall screw. The only proper fix is a new cable pull - splicing violates TIA standards for structured cabling.",
        partial:
          "You identified the fault correctly. The key detail is that the break is at 22.3m on a 45m run, meaning it is mid-span damage. Re-termination only fixes connector issues, and splicing is not TIA-compliant for Cat6.",
        wrong:
          "This is an open circuit at 22.3m caused by construction damage (drywall screw). The break is mid-span, so re-termination will not help. Splicing is not standards-compliant for Cat6. A full cable replacement is the correct remediation.",
      },
    },
    {
      type: "triage-remediate",
      id: "ctd-003",
      title: "Gigabit Link Negotiating at 100 Mbps",
      description:
        "A workstation with a Gigabit NIC is connecting at only 100 Mbps to a Gigabit switch port. The cable tester reports:\n\nFluke DTX-1800 Cable Test Report\n================================\nTest: TIA-568-C.2 Cat 6\nResult: FAIL\n\nWire Map: FAIL\n  Pin 1 -> Pin 1: PASS\n  Pin 2 -> Pin 2: PASS\n  Pin 3 -> Pin 3: PASS\n  Pin 4 -> Pin 4: SHORT to Pin 5 at 0.3m\n  Pin 5 -> Pin 5: SHORT to Pin 4 at 0.3m\n  Pin 6 -> Pin 6: PASS\n  Pin 7 -> Pin 7: PASS\n  Pin 8 -> Pin 8: PASS\nNEXT: N/A (wire map failure)\nLength: 12.8m\n\nThe cable was recently re-terminated at the patch panel after a port relocation.",
      evidence: [
        {
          type: "log",
          content:
            "Wire map FAIL: Short between Pin 4 and Pin 5 at 0.3m from the near end (patch panel termination).",
        },
        {
          type: "observation",
          content:
            "100 Mbps Ethernet uses Pairs 2 and 3 (Pins 1-2 and 3-6). Gigabit Ethernet requires all four pairs. The short is on Pair 1 (Pins 4-5) at the patch panel termination point.",
        },
      ],
      classifications: [
        {
          id: "c1",
          label: "Short Circuit at Termination",
          description:
            "Two conductors are bridged at the patch panel connection point, likely from a termination error",
        },
        {
          id: "c2",
          label: "Cable Attenuation Failure",
          description:
            "Excessive signal loss preventing Gigabit negotiation",
        },
        {
          id: "c3",
          label: "NIC Driver Misconfiguration",
          description:
            "The workstation network adapter is configured for 100 Mbps",
        },
      ],
      correctClassificationId: "c1",
      remediations: [
        {
          id: "rm1",
          label: "Re-terminate the patch panel connection",
          description:
            "Re-punch the cable at the patch panel, ensuring Pins 4 and 5 are properly separated in the IDC contacts",
        },
        {
          id: "rm2",
          label: "Replace the entire cable run",
          description:
            "Pull a new cable to eliminate any potential cable damage",
        },
        {
          id: "rm3",
          label: "Force the switch port to 100 Mbps",
          description:
            "Hard-set both the switch port and NIC to 100 Mbps full-duplex",
        },
      ],
      correctRemediationId: "rm1",
      rationales: [
        {
          id: "r1",
          text: "The short between Pin 4 and Pin 5 at 0.3m places the fault at the patch panel termination. This explains why the link falls back to 100 Mbps: Fast Ethernet only uses Pairs 2 and 3, so it works fine, but Gigabit requires all four pairs including the shorted Pair 1. Re-terminating the patch panel will resolve the short.",
        },
        {
          id: "r2",
          text: "Forcing 100 Mbps would work around the symptom but does not fix the underlying cable fault. The user paid for Gigabit infrastructure and should get Gigabit performance. Fix the termination.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Perfect analysis! The short at 0.3m is right at the patch panel termination. Gigabit needs all four pairs, so the shorted Pair 1 forces a fallback to 100 Mbps. Re-punching the patch panel is the correct targeted fix.",
        partial:
          "You are close. The short on Pins 4-5 at 0.3m is a termination error at the patch panel. Since Gigabit Ethernet requires all four pairs but 100 Mbps only uses two, the shorted pair causes a speed fallback.",
        wrong:
          "This is a short circuit at the patch panel termination (0.3m from near end). Pins 4 and 5 are bridged, disabling Pair 1. Gigabit Ethernet requires all four pairs, so the link falls back to 100 Mbps. Re-terminating the patch panel connection is the correct fix.",
      },
    },
  ],
  hints: [
    "Check the distance-to-fault reading: if it matches the total cable length, the problem is at the far end. If it is very short (under 1m), the problem is at the near connector.",
    "Gigabit Ethernet requires all four pairs (Pins 1-8), while 100 Mbps Ethernet only uses Pairs 2 and 3 (Pins 1-2, 3-6). A fault on Pair 1 or 4 will affect Gigabit but not Fast Ethernet.",
    "TIA standards prohibit splicing structured cabling. Mid-span opens or shorts require a full cable replacement. Termination faults can be fixed by re-punching or re-crimping.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Cable certification is a daily task for network installers and a critical skill for network engineers managing physical infrastructure. Understanding tester output lets you diagnose in minutes what could otherwise take hours of trial and error.",
  toolRelevance: [
    "Fluke DTX CableAnalyzer",
    "cable tester",
    "tone generator",
    "show interface",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
