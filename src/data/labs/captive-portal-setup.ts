import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "captive-portal-setup",
  version: 1,
  title: "Design Guest Network with Captive Portal",
  tier: "intermediate",
  track: "wireless-networking",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["captive-portal", "guest-network", "isolation", "hotspot", "walled-garden"],
  description:
    "Design and configure a guest wireless network with captive portal authentication, client isolation, bandwidth limits, and proper network segmentation from corporate resources.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Configure captive portal redirect with a walled garden for pre-authentication access",
    "Implement client isolation and bandwidth throttling on guest networks",
    "Design proper VLAN segmentation between guest and corporate wireless traffic",
  ],
  sortOrder: 307,
  status: "published",
  prerequisites: [],
  rendererType: "action-rationale",
  scenarios: [
    {
      type: "action-rationale",
      id: "captive-guest-auth",
      title: "Guest Authentication Method",
      context:
        "A hotel needs a guest Wi-Fi network. Guests should see a branded splash page, accept terms of service, and optionally enter a room number. No corporate credentials should be used.",
      displayFields: [
        { label: "Environment", value: "250-room hotel" },
        { label: "Expected Guests", value: "400+ concurrent devices" },
        { label: "Compliance", value: "Must log MAC address and acceptance time" },
        { label: "Duration", value: "24-hour access per acceptance" },
      ],
      logEntry:
        "Current state: Open network with no authentication\nGuest complaints: None about connectivity\nLegal requirement: Acceptable use policy acknowledgment\nBrand requirement: Splash page with hotel logo",
      actions: [
        { id: "act-splash", label: "Click-through captive portal with terms acceptance and optional room number" },
        { id: "act-psk", label: "WPA2-PSK with room-specific passwords printed on key cards" },
        { id: "act-voucher", label: "Voucher-based system requiring front desk interaction" },
        { id: "act-social", label: "Social media login (Facebook/Google) for authentication" },
      ],
      correctActionId: "act-splash",
      rationales: [
        {
          id: "rat-splash",
          text: "A click-through portal meets the legal logging requirement, displays the branded splash page, and minimizes friction for guests. Room number entry is optional for tracking without blocking access.",
        },
        {
          id: "rat-psk-bad",
          text: "Room-specific PSKs create management overhead for 250 rooms and do not display terms of service or log acceptance, failing the compliance requirement.",
        },
        {
          id: "rat-voucher-bad",
          text: "Voucher systems add front desk burden and guest friction for what should be a quick self-service connection experience.",
        },
      ],
      correctRationaleId: "rat-splash",
      feedback: {
        perfect:
          "Correct! A click-through captive portal balances guest convenience, legal compliance, and branding requirements perfectly for a hotel environment.",
        partial:
          "Good thinking, but the hotel scenario prioritizes low friction. Click-through portals log acceptance while keeping the guest experience seamless.",
        wrong:
          "Hotels need minimal friction for guests. Click-through portals with terms acceptance satisfy legal requirements while keeping access easy and self-service.",
      },
    },
    {
      type: "action-rationale",
      id: "captive-isolation",
      title: "Guest Network Isolation Design",
      context:
        "The guest SSID shares the same physical APs as the corporate SSID. You need to ensure guest traffic cannot reach corporate resources while allowing internet access.",
      displayFields: [
        { label: "Corporate VLAN", value: "VLAN 10 (10.1.0.0/16)" },
        { label: "Guest VLAN", value: "VLAN 50 (10.50.0.0/24)" },
        { label: "AP Management", value: "VLAN 99 (10.99.0.0/24)" },
        { label: "Internet Gateway", value: "10.1.0.1 (on VLAN 10)" },
      ],
      logEntry:
        "Firewall rules needed:\n  Guest -> Internet: ALLOW\n  Guest -> Corporate: DENY\n  Guest -> AP Management: DENY\n  Guest -> Guest (peer): DENY (client isolation)\n  Guest -> DNS: ALLOW (public DNS only)\n  Guest -> DHCP: ALLOW",
      actions: [
        { id: "act-vlan-fw", label: "Separate guest VLAN with firewall rules blocking RFC1918 and enabling client isolation" },
        { id: "act-same-vlan", label: "Keep guest on same VLAN with MAC-based ACLs" },
        { id: "act-separate-ap", label: "Deploy separate physical APs for guest network" },
        { id: "act-nat-only", label: "NAT guest traffic at the AP level without VLAN separation" },
      ],
      correctActionId: "act-vlan-fw",
      rationales: [
        {
          id: "rat-vlan-fw",
          text: "VLAN segmentation at Layer 2 combined with firewall rules blocking all RFC1918 ranges ensures guests cannot reach any internal network. Client isolation prevents guest-to-guest attacks.",
        },
        {
          id: "rat-mac-weak",
          text: "MAC-based ACLs on the same VLAN are easily bypassed with MAC spoofing and do not provide true network segmentation.",
        },
        {
          id: "rat-separate-waste",
          text: "Separate physical APs waste hardware and spectrum. Modern APs support multiple SSIDs on different VLANs on the same radio.",
        },
      ],
      correctRationaleId: "rat-vlan-fw",
      feedback: {
        perfect:
          "Perfect! VLAN segmentation with firewall rules and client isolation provides defense-in-depth for guest network security.",
        partial:
          "VLAN separation is correct, but don't forget client isolation (peer-to-peer blocking) and firewall rules blocking all private IP ranges.",
        wrong:
          "Guest traffic must be on a separate VLAN with firewall rules blocking RFC1918 ranges. Same-VLAN approaches and MAC ACLs are insufficient for proper isolation.",
      },
    },
    {
      type: "action-rationale",
      id: "captive-walled-garden",
      title: "Walled Garden Configuration",
      context:
        "Before authentication, guests must reach the captive portal page. Currently, HTTPS sites show certificate errors because the portal redirect breaks TLS. You need to configure a proper walled garden.",
      displayFields: [
        { label: "Portal URL", value: "https://guest.hotel.com/welcome" },
        { label: "DNS Server", value: "10.50.0.1 (local resolver)" },
        { label: "Problem", value: "HTTPS redirect causes certificate mismatch errors" },
        { label: "Affected", value: "All pre-auth clients trying to browse HTTPS sites" },
      ],
      logEntry:
        "Client connection flow:\n  1. Client associates to Guest-WiFi\n  2. DHCP assigns 10.50.x.x with DNS 10.50.0.1\n  3. Client opens https://google.com\n  4. Redirect to https://guest.hotel.com/welcome\n  5. Browser shows NET::ERR_CERT_AUTHORITY_INVALID\n  6. Guest confused, calls front desk\n\nExpected flow with walled garden:\n  1-2. Same\n  3. DNS resolves to portal IP for all domains\n  4. HTTP redirect to portal (or HTTPS with valid cert)\n  5. Guest sees splash page without certificate errors",
      actions: [
        { id: "act-dns-redirect", label: "Use DNS-based captive portal with walled garden allowing portal domain and Apple/Google captive portal detection URLs" },
        { id: "act-http-intercept", label: "Intercept all HTTP/HTTPS traffic and redirect with a self-signed certificate" },
        { id: "act-disable-https", label: "Block all HTTPS traffic pre-auth, only allow HTTP" },
        { id: "act-proxy", label: "Deploy a transparent HTTPS proxy to handle the redirect" },
      ],
      correctActionId: "act-dns-redirect",
      rationales: [
        {
          id: "rat-dns",
          text: "DNS-based captive portals resolve all queries to the portal IP before auth. Allowing Apple (captive.apple.com) and Google (connectivitycheck.gstatic.com) detection URLs triggers the native captive portal popup on devices, avoiding TLS errors entirely.",
        },
        {
          id: "rat-selfsigned-bad",
          text: "Self-signed certificates trigger browser warnings that alarm guests and train users to ignore certificate errors -- a serious security anti-pattern.",
        },
        {
          id: "rat-proxy-bad",
          text: "HTTPS proxies require trusted certificates on every client device, which is impossible for guest BYODs.",
        },
      ],
      correctRationaleId: "rat-dns",
      feedback: {
        perfect:
          "Excellent! DNS-based captive portal with walled garden and CNA detection URLs provides a seamless guest experience without certificate errors.",
        partial:
          "DNS redirect is correct, but remember to whitelist Apple/Google captive portal detection URLs so mobile devices automatically display the login popup.",
        wrong:
          "HTTPS interception causes certificate errors. DNS-based portals with walled gardens and CNA detection URLs are the modern standard for captive portal deployment.",
      },
    },
  ],
  hints: [
    "Click-through captive portals with terms acceptance provide the lowest friction for guest environments while meeting legal logging requirements.",
    "Guest isolation requires VLAN segmentation, firewall rules blocking RFC1918, and peer-to-peer client isolation enabled on the SSID.",
    "DNS-based captive portals with CNA (Captive Network Assistant) detection URL whitelisting trigger native device popups and avoid TLS certificate errors.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Guest network design is a common project for network engineers in hospitality, healthcare, and retail. Understanding captive portal flows and VLAN isolation is practical knowledge used daily.",
  toolRelevance: [
    "Cisco ISE / Aruba ClearPass (captive portal)",
    "pfSense / OPNsense (walled garden)",
    "UniFi Guest Portal",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
