import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "encapsulation-troubleshooting",
  version: 1,
  title: "Encapsulation Troubleshooting",
  tier: "intermediate",
  track: "network-fundamentals",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["encapsulation", "802.1q", "ppp", "gre", "trunk"],
  description:
    "Identify and resolve encapsulation mismatches between network devices including VLAN trunking, WAN encapsulation, and tunnel protocols.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Identify encapsulation mismatch symptoms in network device output",
    "Distinguish between different encapsulation types and their use cases",
    "Resolve encapsulation conflicts between connected interfaces",
  ],
  sortOrder: 118,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "enc-001",
      title: "VLAN Trunk Encapsulation Mismatch",
      description:
        "Two switches connected via a trunk link are not passing inter-VLAN traffic. The link is up but VLAN traffic is not crossing between the switches.",
      evidence: [
        {
          type: "log",
          content:
            "Switch-A# show interfaces trunk\nPort      Mode     Encapsulation  Status      Native VLAN\nGi0/1     on       802.1q         trunking    1\n\nSwitch-B# show interfaces trunk\nPort      Mode     Encapsulation  Status      Native VLAN\nGi0/1     on       isl            trunking    1",
        },
        {
          type: "log",
          content:
            "Switch-A# show interfaces GigabitEthernet0/1\nGigabitEthernet0/1 is up, line protocol is up\n  Input errors: 15847\n  CRC: 15840\n  Frame: 7\n\nThe high CRC count indicates frame format incompatibility between the two ends.\n802.1Q adds a 4-byte tag inside the Ethernet frame.\nISL wraps the entire frame in a new 26-byte header + 4-byte FCS.",
        },
      ],
      classifications: [
        { id: "c1", label: "Trunk Encapsulation Mismatch (802.1Q vs ISL)", description: "Switch-A uses 802.1Q trunking while Switch-B uses ISL. Frames tagged by one method are unreadable by the other, causing CRC errors." },
        { id: "c2", label: "Native VLAN Mismatch", description: "The native VLANs are different on each side of the trunk" },
        { id: "c3", label: "Physical Cable Fault", description: "The cable between switches has damage causing CRC errors" },
        { id: "c4", label: "Speed/Duplex Mismatch", description: "The interfaces are running at different speeds or duplex settings" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Change Switch-B trunk encapsulation to 802.1Q to match Switch-A", description: "Configure 'switchport trunk encapsulation dot1q' on Switch-B Gi0/1 so both ends use the same trunking protocol" },
        { id: "rem2", label: "Change Switch-A to ISL to match Switch-B", description: "Configure ISL encapsulation on Switch-A" },
        { id: "rem3", label: "Enable DTP to auto-negotiate the encapsulation", description: "Let Dynamic Trunking Protocol choose the encapsulation" },
        { id: "rem4", label: "Replace the cable between switches", description: "Install a new cable to eliminate CRC errors" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "802.1Q is the industry standard (IEEE 802.1Q). ISL is Cisco-proprietary and deprecated. Standardizing on 802.1Q ensures interoperability and is the recommended practice. Switch-B should be changed to match the standard." },
        { id: "rat2", text: "Changing to ISL would technically work but moves in the wrong direction. ISL is deprecated by Cisco in favor of 802.1Q. All modern switches support 802.1Q." },
        { id: "rat3", text: "DTP auto-negotiation can resolve some trunk mismatches, but explicitly configuring both sides to 802.1Q is more reliable and follows best practices for trunk management." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! The encapsulation mismatch (802.1Q vs ISL) causes CRC errors because each side wraps frames differently. Standardizing both on 802.1Q resolves the issue and follows industry standards.",
        partial: "You identified the encapsulation mismatch. The fix is to align both switches on 802.1Q, which is the IEEE standard and recommended over the deprecated Cisco ISL.",
        wrong: "Switch-A uses 802.1Q and Switch-B uses ISL - a trunk encapsulation mismatch. Frames tagged by one method cannot be read by the other. Change Switch-B to 802.1Q.",
      },
    },
    {
      type: "triage-remediate",
      id: "enc-002",
      title: "WAN Link Down After Router Replacement",
      description:
        "A WAN link went down after replacing a router at the remote site. The physical link is up but the line protocol is down.",
      evidence: [
        {
          type: "log",
          content:
            "HQ-Router# show interfaces Serial0/0\nSerial0/0 is up, line protocol is down\n  Encapsulation HDLC\n  Keepalive set (10 sec)\n  Last keepalive received: never\n\nRemote-Router# show interfaces Serial0/0\nSerial0/0 is up, line protocol is down\n  Encapsulation PPP\n  LCP: Not Open\n  Keepalive set (10 sec)",
        },
        {
          type: "log",
          content:
            "Pre-replacement config notes:\n  Previous remote router: Encapsulation PPP with CHAP authentication\n  HQ router: Encapsulation HDLC (Cisco default)\n\nWait - the original config notes show:\n  HQ router should have been PPP with CHAP\n  Someone previously changed HQ to HDLC during troubleshooting and forgot to revert\n\nBoth routers should use PPP with CHAP authentication.",
        },
      ],
      classifications: [
        { id: "c1", label: "WAN Encapsulation Mismatch (HDLC vs PPP)", description: "The HQ router uses HDLC while the new remote router uses PPP. The encapsulation must match on both ends for the line protocol to come up." },
        { id: "c2", label: "Serial Clock Rate Missing", description: "The DCE side needs a clock rate configured" },
        { id: "c3", label: "Authentication Failure", description: "CHAP authentication is rejecting the new router" },
        { id: "c4", label: "Cable Type Mismatch (DTE/DCE)", description: "The serial cable is the wrong type for the new router" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Change HQ router to PPP with CHAP to match the standard config", description: "Configure 'encapsulation ppp' and CHAP authentication on HQ Serial0/0 to match the remote router and the original design" },
        { id: "rem2", label: "Change remote router to HDLC to match HQ", description: "Configure HDLC encapsulation on the remote router" },
        { id: "rem3", label: "Reset both interfaces to defaults", description: "Clear all interface configuration and start over" },
        { id: "rem4", label: "Replace the serial cable", description: "Install a new cable to resolve the line protocol issue" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "The config notes reveal that both routers should use PPP with CHAP. The HQ router was incorrectly changed to HDLC during previous troubleshooting. Restoring HQ to PPP with CHAP matches the design and provides authentication for the WAN link." },
        { id: "rat2", text: "Changing the remote router to HDLC would bring the link up but loses CHAP authentication, which the design requires. PPP with CHAP is the correct standard for this link." },
        { id: "rat3", text: "The physical link is up (interface up), confirming the cable and clock rate are fine. The line protocol is down because the encapsulation types do not match." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! The encapsulation mismatch (HDLC vs PPP) keeps the line protocol down. Restoring PPP with CHAP on the HQ router matches the design and brings the link up with authentication.",
        partial: "You identified the encapsulation mismatch. Both routers should use PPP with CHAP per the original design. The HQ router needs to be changed back from HDLC.",
        wrong: "HDLC on HQ vs PPP on remote causes the line protocol to stay down. The original design calls for PPP with CHAP on both ends. Fix the HQ router's encapsulation.",
      },
    },
    {
      type: "triage-remediate",
      id: "enc-003",
      title: "GRE Tunnel MTU Causing Application Failures",
      description:
        "A GRE tunnel between two sites is operational but large file transfers and certain applications fail while ping works fine.",
      evidence: [
        {
          type: "log",
          content:
            "HQ# show interfaces Tunnel0\nTunnel0 is up, line protocol is up\n  Encapsulation: GRE/IP\n  MTU: 1500 bytes (should account for GRE overhead)\n  Tunnel source: 203.0.113.1\n  Tunnel destination: 198.51.100.1\n  Tunnel transport MTU: 1476 bytes\n\nGRE adds 24 bytes of overhead (20-byte IP + 4-byte GRE header)\nPhysical interface MTU: 1500\nEffective payload MTU: 1500 - 24 = 1476",
        },
        {
          type: "log",
          content:
            "Test results:\n$ ping -f -s 1400 10.2.2.100  (through tunnel) -> SUCCESS\n$ ping -f -s 1476 10.2.2.100  (through tunnel) -> SUCCESS  \n$ ping -f -s 1477 10.2.2.100  (through tunnel) -> FAIL (need to frag)\n\nDF bit is set on application traffic.\nFragmentation needed but DF set - packets dropped.\nPath MTU Discovery is failing because ICMP 'need to fragment' messages are being blocked by an intermediate firewall.",
        },
      ],
      classifications: [
        { id: "c1", label: "GRE Tunnel MTU Not Adjusted for Encapsulation Overhead", description: "The tunnel interface MTU is set to 1500 but GRE encapsulation adds 24 bytes, causing packets larger than 1476 bytes to require fragmentation that is blocked by DF bit" },
        { id: "c2", label: "Tunnel Keepalive Failure", description: "The GRE tunnel keepalives are failing causing intermittent drops" },
        { id: "c3", label: "Encryption Overhead From IPsec", description: "IPsec encryption is adding additional overhead beyond GRE" },
        { id: "c4", label: "Routing Loop Through Tunnel", description: "A recursive routing issue is causing tunnel flapping" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Set tunnel interface MTU to 1476 and enable TCP MSS clamping at 1436", description: "Reduce the tunnel MTU to account for GRE overhead and clamp TCP MSS to prevent oversized segments" },
        { id: "rem2", label: "Disable the DF bit on all tunnel traffic", description: "Clear the Don't Fragment bit to allow fragmentation" },
        { id: "rem3", label: "Increase the physical interface MTU to 1524", description: "Make the physical MTU large enough to accommodate GRE overhead" },
        { id: "rem4", label: "Enable GRE tunnel path MTU discovery", description: "Let the tunnel automatically discover the correct MTU" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "Setting the tunnel MTU to 1476 ensures packets entering the tunnel are already sized for the GRE overhead. TCP MSS clamping at 1436 (1476 - 40 bytes TCP/IP headers) prevents TCP segments from exceeding the tunnel MTU, avoiding fragmentation issues entirely." },
        { id: "rat2", text: "Disabling DF bit allows fragmentation but degrades performance and can cause reassembly failures. Proper MTU configuration avoids fragmentation altogether." },
        { id: "rat3", text: "Increasing physical MTU requires jumbo frame support on all intermediate devices, which may not be possible across ISP networks. Adjusting the tunnel MTU is simpler and works everywhere." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! Reducing tunnel MTU to 1476 and clamping TCP MSS to 1436 prevents oversized packets from entering the tunnel, eliminating fragmentation issues. This is the standard GRE tunnel best practice.",
        partial: "You identified the MTU issue. The complete fix requires both tunnel MTU reduction (1476) and TCP MSS clamping (1436) to handle both TCP and non-TCP traffic through the tunnel.",
        wrong: "GRE adds 24 bytes of overhead, making the effective MTU 1476. Setting the tunnel MTU to 1476 and clamping TCP MSS to 1436 prevents packets from exceeding the tunnel capacity.",
      },
    },
  ],
  hints: [
    "When 'interface is up, line protocol is down' on a serial link, the most common cause is an encapsulation mismatch. Both ends must use the same protocol (PPP, HDLC, etc.).",
    "GRE tunnels add 24 bytes of overhead (20-byte IP header + 4-byte GRE header). If IPsec is added, overhead increases further. Always adjust tunnel MTU accordingly.",
    "802.1Q trunk encapsulation mismatches cause CRC errors because the frame format differs between 802.1Q (internal tag) and ISL (external encapsulation).",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Encapsulation troubleshooting spans multiple areas: LAN trunking, WAN protocols, and overlay tunnels. This breadth makes it a frequent topic in CCNA/CCNP exams and real-world escalation tickets.",
  toolRelevance: ["show interfaces", "show interfaces trunk", "show interfaces tunnel", "Wireshark", "ping with DF bit"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
