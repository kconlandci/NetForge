import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "vpn-tunnel-configuration",
  version: 1,
  title: "Configure Site-to-Site VPN Tunnel",
  tier: "beginner",
  track: "network-security",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["vpn", "ipsec", "site-to-site", "tunnel", "encryption"],
  description:
    "Configure IPSec site-to-site VPN tunnel parameters including IKE phase 1 and phase 2 negotiations, encryption algorithms, authentication methods, and interesting traffic definitions.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Configure IKE Phase 1 (ISAKMP SA) parameters for VPN peer authentication",
    "Configure IKE Phase 2 (IPSec SA) parameters for data encryption",
    "Define interesting traffic with crypto ACLs to specify what traffic traverses the VPN tunnel",
  ],
  sortOrder: 402,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "vpn-ike-phase1",
      title: "IKE Phase 1 Configuration",
      description:
        "Configure IKE Phase 1 (ISAKMP) parameters for a site-to-site VPN between headquarters (203.0.113.1) and a branch office (198.51.100.1). Use strong cryptographic settings.",
      targetSystem: "Cisco IOS Router > crypto isakmp policy",
      items: [
        {
          id: "ike-encrypt",
          label: "Encryption Algorithm",
          detail: "IKE Phase 1 encryption",
          currentState: "DES",
          correctState: "AES-256",
          states: ["DES", "3DES", "AES-128", "AES-256"],
          rationaleId: "rat-aes256",
        },
        {
          id: "ike-hash",
          label: "Hash Algorithm",
          detail: "Integrity verification for IKE messages",
          currentState: "MD5",
          correctState: "SHA-256",
          states: ["MD5", "SHA-1", "SHA-256", "SHA-384"],
          rationaleId: "rat-sha256",
        },
        {
          id: "ike-auth",
          label: "Authentication Method",
          detail: "How peers verify each other's identity",
          currentState: "Pre-Shared Key",
          correctState: "Pre-Shared Key",
          states: ["Pre-Shared Key", "RSA Signatures", "ECDSA Signatures"],
          rationaleId: "rat-psk",
        },
        {
          id: "ike-dh",
          label: "Diffie-Hellman Group",
          detail: "Key exchange group for generating shared secret",
          currentState: "Group 2 (1024-bit)",
          correctState: "Group 14 (2048-bit)",
          states: ["Group 1 (768-bit)", "Group 2 (1024-bit)", "Group 5 (1536-bit)", "Group 14 (2048-bit)"],
          rationaleId: "rat-dh14",
        },
        {
          id: "ike-lifetime",
          label: "SA Lifetime",
          detail: "How long the IKE SA is valid before rekeying",
          currentState: "86400 seconds (24 hours)",
          correctState: "28800 seconds (8 hours)",
          states: ["3600 seconds (1 hour)", "28800 seconds (8 hours)", "86400 seconds (24 hours)", "604800 seconds (7 days)"],
          rationaleId: "rat-lifetime",
        },
      ],
      rationales: [
        {
          id: "rat-aes256",
          text: "AES-256 provides the strongest encryption for IKE Phase 1. DES (56-bit) and 3DES (168-bit) are deprecated. AES-256 is the industry standard.",
        },
        {
          id: "rat-sha256",
          text: "SHA-256 provides strong integrity verification. MD5 has known collision vulnerabilities and SHA-1 is deprecated for cryptographic use.",
        },
        {
          id: "rat-psk",
          text: "Pre-shared keys are appropriate for a single site-to-site VPN. For large deployments, certificate-based (RSA/ECDSA) authentication scales better.",
        },
        {
          id: "rat-dh14",
          text: "DH Group 14 (2048-bit) is the minimum recommended key exchange group. Groups 1-2 (768-1024 bit) are considered broken by modern computing power.",
        },
        {
          id: "rat-lifetime",
          text: "8-hour lifetime balances security (regular rekeying) with stability (not too frequent). 24 hours increases exposure time if a key is compromised.",
        },
      ],
      feedback: {
        perfect:
          "Perfect Phase 1 configuration! AES-256, SHA-256, DH Group 14, and 8-hour lifetime meet current security best practices.",
        partial:
          "Good choices, but ensure both DH group (minimum Group 14) and hash algorithm (SHA-256+) meet modern cryptographic standards.",
        wrong:
          "DES, MD5, and DH Group 1-2 are all deprecated. Modern VPN Phase 1 requires AES-256, SHA-256+, and DH Group 14+ minimum.",
      },
    },
    {
      type: "toggle-config",
      id: "vpn-ike-phase2",
      title: "IKE Phase 2 (IPSec Transform Set)",
      description:
        "Configure the IPSec transform set and crypto map that defines how actual data traffic is encrypted through the VPN tunnel.",
      targetSystem: "Cisco IOS Router > crypto ipsec transform-set",
      items: [
        {
          id: "ipsec-encrypt",
          label: "IPSec Encryption",
          detail: "Data encryption algorithm for tunnel traffic",
          currentState: "esp-des",
          correctState: "esp-aes 256",
          states: ["esp-des", "esp-3des", "esp-aes 128", "esp-aes 256"],
          rationaleId: "rat-esp-aes",
        },
        {
          id: "ipsec-auth",
          label: "IPSec Authentication",
          detail: "Data integrity/authentication algorithm",
          currentState: "esp-md5-hmac",
          correctState: "esp-sha256-hmac",
          states: ["esp-md5-hmac", "esp-sha-hmac", "esp-sha256-hmac"],
          rationaleId: "rat-esp-sha",
        },
        {
          id: "ipsec-mode",
          label: "IPSec Mode",
          detail: "Tunnel mode vs Transport mode",
          currentState: "Transport",
          correctState: "Tunnel",
          states: ["Transport", "Tunnel"],
          rationaleId: "rat-tunnel",
        },
        {
          id: "ipsec-pfs",
          label: "Perfect Forward Secrecy",
          detail: "Generate new DH keys for each Phase 2 SA",
          currentState: "Disabled",
          correctState: "Group 14",
          states: ["Disabled", "Group 2", "Group 5", "Group 14"],
          rationaleId: "rat-pfs",
        },
      ],
      rationales: [
        {
          id: "rat-esp-aes",
          text: "ESP with AES-256 provides strong encryption for the actual data flowing through the VPN tunnel. DES and 3DES are deprecated and vulnerable.",
        },
        {
          id: "rat-esp-sha",
          text: "SHA-256 HMAC ensures data integrity and authenticity for every packet in the tunnel. MD5-HMAC has known weaknesses.",
        },
        {
          id: "rat-tunnel",
          text: "Tunnel mode encapsulates the entire original IP packet, hiding the internal source/destination IPs. This is required for site-to-site VPNs where internal subnets must be protected.",
        },
        {
          id: "rat-pfs",
          text: "PFS generates a new DH key for each Phase 2 SA. If one session key is compromised, past and future sessions remain protected. Group 14 matches Phase 1 strength.",
        },
      ],
      feedback: {
        perfect:
          "Excellent Phase 2 configuration! AES-256, SHA-256 HMAC, tunnel mode, and PFS Group 14 provide robust data protection.",
        partial:
          "Good encryption choice, but verify tunnel mode (not transport) is selected and PFS is enabled for forward secrecy.",
        wrong:
          "Site-to-site VPNs require tunnel mode (not transport) with strong encryption (AES-256) and PFS enabled. DES and MD5 are deprecated.",
      },
    },
    {
      type: "toggle-config",
      id: "vpn-crypto-acl",
      title: "Interesting Traffic (Crypto ACL)",
      description:
        "Define which traffic should be encrypted and sent through the VPN tunnel using a crypto ACL. HQ LAN (10.1.0.0/16) must communicate securely with Branch LAN (10.2.0.0/16).",
      targetSystem: "Cisco IOS Router > access-list (crypto map)",
      items: [
        {
          id: "crypto-acl",
          label: "Crypto ACL Definition",
          detail: "ACL defining interesting traffic for VPN",
          currentState: "permit ip any any",
          correctState: "permit ip 10.1.0.0/16 10.2.0.0/16",
          states: ["permit ip any any", "permit ip 10.1.0.0/16 10.2.0.0/16", "permit ip 10.1.0.0/16 any", "deny ip 10.1.0.0/16 10.2.0.0/16"],
          rationaleId: "rat-crypto-acl",
        },
        {
          id: "crypto-peer",
          label: "Crypto Map Peer",
          detail: "Remote VPN peer IP address",
          currentState: "Not Set",
          correctState: "198.51.100.1",
          states: ["Not Set", "10.2.0.1", "198.51.100.1", "203.0.113.1"],
          rationaleId: "rat-peer",
        },
        {
          id: "crypto-interface",
          label: "Crypto Map Applied To",
          detail: "Interface where crypto map is applied",
          currentState: "Gi0/1 (LAN)",
          correctState: "Gi0/0 (WAN)",
          states: ["Gi0/0 (WAN)", "Gi0/1 (LAN)", "Loopback0"],
          rationaleId: "rat-interface",
        },
      ],
      rationales: [
        {
          id: "rat-crypto-acl",
          text: "The crypto ACL must specify exact source and destination subnets. 'permit ip any any' encrypts ALL traffic (including internet), while the specific subnets only encrypt inter-site traffic.",
        },
        {
          id: "rat-peer",
          text: "The peer address is the remote site's PUBLIC IP (198.51.100.1). Using the private LAN IP (10.2.0.1) would fail since IKE negotiation occurs over the public internet.",
        },
        {
          id: "rat-interface",
          text: "The crypto map must be applied to the WAN-facing interface (Gi0/0) where encrypted traffic exits toward the VPN peer. Applying it to the LAN interface would not intercept the traffic correctly.",
        },
      ],
      feedback: {
        perfect:
          "Perfect! The crypto ACL correctly matches only inter-site traffic, the peer uses the public IP, and the crypto map is on the WAN interface.",
        partial:
          "Close, but verify the crypto ACL matches specific subnets (not 'any any') and the peer address is the remote public IP.",
        wrong:
          "Crypto ACLs define which traffic enters the VPN tunnel. Use specific subnets (not 'any any'), the remote public IP as peer, and apply the crypto map to the WAN interface.",
      },
    },
  ],
  hints: [
    "IKE Phase 1 establishes the secure channel between peers. Use AES-256, SHA-256, and DH Group 14 minimum for modern security.",
    "Site-to-site VPNs require tunnel mode to encapsulate and hide internal IP addresses. Transport mode is for host-to-host communication only.",
    "Crypto ACLs define 'interesting traffic' that triggers VPN encryption. Be specific with source and destination subnets to avoid encrypting all traffic.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Site-to-site VPN configuration is a core skill for network engineers. IPSec is the dominant VPN technology for enterprise WAN connectivity and is heavily tested on CCNA Security and CompTIA Security+.",
  toolRelevance: [
    "Cisco IOS CLI / ASA",
    "strongSwan / OpenSwan (Linux IPSec)",
    "Wireshark (IKE/ESP dissectors)",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
