import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "ipsec-tunnel-troubleshooting",
  version: 1,
  title: "Troubleshoot IPSec VPN Tunnel Failures",
  tier: "advanced",
  track: "network-security",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["ipsec", "vpn", "tunnel", "phase1", "phase2", "crypto-map", "ikev2"],
  description:
    "Diagnose and remediate IPSec VPN tunnel failures including IKE Phase 1/Phase 2 mismatches, crypto map misconfigurations, and SA lifetime negotiation issues between site-to-site peers.",
  estimatedMinutes: 25,
  learningObjectives: [
    "Identify IKE Phase 1 negotiation failures from debug output and classify root causes",
    "Diagnose Phase 2 quick-mode mismatches involving transform sets and proxy identities",
    "Remediate crypto map and ISAKMP policy misconfigurations to restore tunnel connectivity",
    "Interpret IPSec SA counters to distinguish between encryption, authentication, and lifetime mismatches",
  ],
  sortOrder: 410,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "phase1-mismatch",
      title: "IKE Phase 1 Negotiation Failure",
      description:
        "The NOC reports a site-to-site VPN tunnel between HQ (10.1.1.1) and Branch (10.2.2.1) is down. Users at the branch office cannot reach corporate resources. You have been asked to investigate the tunnel failure.",
      evidence: [
        {
          type: "log",
          content:
            "router-hq# debug crypto isakmp\n*Mar 28 08:14:22.331: ISAKMP:(0): SA request profile is (NULL)\n*Mar 28 08:14:22.331: ISAKMP:(0): Found matching IKE policy 10\n*Mar 28 08:14:22.335: ISAKMP:(0): Checking ISAKMP transform 1 against priority 10 policy\n*Mar 28 08:14:22.335: ISAKMP:      life type in seconds\n*Mar 28 08:14:22.335: ISAKMP:      life duration (VPI) of 0x0 0x1 0x51 0x80 (86400)\n*Mar 28 08:14:22.335: ISAKMP:      encryption AES-CBC-256\n*Mar 28 08:14:22.335: ISAKMP:      hash SHA256\n*Mar 28 08:14:22.335: ISAKMP:      auth pre-share\n*Mar 28 08:14:22.335: ISAKMP:      default group 14\n*Mar 28 08:14:22.339: ISAKMP:(0): atts are not acceptable. Next payload is 3\n*Mar 28 08:14:22.339: ISAKMP:(0): no offers accepted!\n*Mar 28 08:14:22.339: ISAKMP:(0): SA negotiation failed - NO_PROPOSAL_CHOSEN\n*Mar 28 08:14:22.339: %CRYPTO-6-IKMP_MODE_FAILURE: Processing of Main Mode failed with peer 10.2.2.1",
          icon: "terminal",
        },
        {
          type: "config",
          content:
            "! HQ Router Configuration\ncrypto isakmp policy 10\n encryption aes 256\n hash sha256\n authentication pre-share\n group 14\n lifetime 86400\n\n! Branch Router Configuration (received from Branch admin)\ncrypto isakmp policy 10\n encryption aes 256\n hash sha\n authentication pre-share\n group 5\n lifetime 86400",
          icon: "settings",
        },
        {
          type: "log",
          content:
            "router-hq# show crypto isakmp sa\nIPv4 Crypto ISAKMP SA\ndst             src             state          conn-id status\n10.1.1.1        10.2.2.1        MM_NO_STATE         0  ACTIVE (deleted)",
          icon: "terminal",
        },
      ],
      classifications: [
        {
          id: "class-hash-dh-mismatch",
          label: "Phase 1 Hash and DH Group Mismatch",
          description:
            "The ISAKMP policies differ in hash algorithm (SHA-256 vs SHA-1) and Diffie-Hellman group (14 vs 5), causing proposal rejection.",
        },
        {
          id: "class-psk-mismatch",
          label: "Pre-Shared Key Mismatch",
          description:
            "The pre-shared keys on both peers do not match, causing authentication failure.",
        },
        {
          id: "class-encryption-mismatch",
          label: "Encryption Algorithm Mismatch",
          description:
            "The encryption algorithms do not match between the two peers.",
        },
        {
          id: "class-lifetime-mismatch",
          label: "SA Lifetime Mismatch",
          description:
            "The ISAKMP SA lifetime values are different between peers.",
        },
      ],
      correctClassificationId: "class-hash-dh-mismatch",
      remediations: [
        {
          id: "rem-align-branch",
          label: "Update Branch to SHA-256 and Group 14",
          description:
            "Modify the Branch ISAKMP policy to use 'hash sha256' and 'group 14' to match HQ's stronger configuration.",
        },
        {
          id: "rem-align-hq",
          label: "Downgrade HQ to SHA-1 and Group 5",
          description:
            "Modify HQ's ISAKMP policy to use 'hash sha' and 'group 5' to match the Branch's weaker configuration.",
        },
        {
          id: "rem-new-psk",
          label: "Re-enter Pre-Shared Keys on Both Peers",
          description:
            "Remove and re-configure the pre-shared key on both routers to ensure they match.",
        },
        {
          id: "rem-add-second-policy",
          label: "Add a Second ISAKMP Policy on HQ",
          description:
            "Add an additional ISAKMP policy on HQ with SHA-1 and Group 5 as a fallback.",
        },
      ],
      correctRemediationId: "rem-align-branch",
      rationales: [
        {
          id: "rat-upgrade-branch",
          text: "The Branch should be upgraded to SHA-256 and DH Group 14 to match HQ. Upgrading the weaker side maintains the stronger security posture. Group 5 (1536-bit) is considered deprecated, and SHA-1 is vulnerable to collision attacks.",
        },
        {
          id: "rat-downgrade-bad",
          text: "Downgrading HQ to match Branch would weaken security organization-wide. DH Group 5 and SHA-1 are both below current security recommendations.",
        },
        {
          id: "rat-psk-not-issue",
          text: "The debug output shows NO_PROPOSAL_CHOSEN, which indicates a policy parameter mismatch during Main Mode, not an authentication failure. PSK issues would appear later in the negotiation.",
        },
      ],
      correctRationaleId: "rat-upgrade-branch",
      feedback: {
        perfect:
          "Excellent. You correctly identified the dual Phase 1 mismatch (SHA-1 vs SHA-256 and DH Group 5 vs 14) from the debug output and chose to upgrade the Branch to match HQ's stronger configuration.",
        partial:
          "You identified part of the issue but missed that both the hash algorithm AND the DH group are mismatched. The NO_PROPOSAL_CHOSEN error results from the combined parameter mismatch.",
        wrong:
          "The debug output clearly shows NO_PROPOSAL_CHOSEN during Main Mode, indicating ISAKMP policy parameters do not match. Compare the hash (sha vs sha256) and group (5 vs 14) between the two configurations.",
      },
    },
    {
      type: "triage-remediate",
      id: "phase2-proxy-mismatch",
      title: "Phase 2 Quick Mode Proxy Identity Failure",
      description:
        "The IKE Phase 1 tunnel is now established, but Phase 2 negotiation fails repeatedly. Traffic between the 172.16.0.0/16 HQ network and the 192.168.10.0/24 Branch network is not being encrypted.",
      evidence: [
        {
          type: "log",
          content:
            "router-hq# debug crypto ipsec\n*Mar 28 09:31:44.102: IPSEC(sa_request): ,\n  (key eng. msg.) OUTBOUND local= 10.1.1.1:500, remote= 10.2.2.1:500,\n    local_proxy= 172.16.0.0/255.255.0.0/0/0 (type=4),\n    remote_proxy= 192.168.10.0/255.255.255.0/0/0 (type=4)\n*Mar 28 09:31:44.208: ISAKMP:(1003):QM_IDLE\n*Mar 28 09:31:44.312: ISAKMP:(1003): processing NOTIFY PROPOSAL_NOT_CHOSEN protocol 3\n*Mar 28 09:31:44.312: %CRYPTO-6-IKMP_QM_FAILED: QM FSM error (P2 struct &0x7F2A3B10, mess id 0x4A2C0E91)\n*Mar 28 09:31:44.312: ISAKMP:(1003): deleting node 4A2C0E91 error TRUE reason \"QM rejected\"",
          icon: "terminal",
        },
        {
          type: "config",
          content:
            "! HQ Crypto ACL\naccess-list 101 permit ip 172.16.0.0 0.0.255.255 192.168.10.0 0.0.0.255\n\ncrypto map VPN-MAP 10 ipsec-isakmp\n set peer 10.2.2.1\n set transform-set AES256-SHA256\n match address 101\n\n! Branch Crypto ACL (received from Branch admin)\naccess-list 101 permit ip 192.168.10.0 0.0.0.255 172.16.0.0 0.0.0.255\n\ncrypto map VPN-MAP 10 ipsec-isakmp\n set peer 10.1.1.1\n set transform-set AES256-SHA256\n match address 101",
          icon: "settings",
        },
        {
          type: "log",
          content:
            "router-hq# show crypto ipsec sa\ninterface: GigabitEthernet0/0\n    Crypto map tag: VPN-MAP, local addr 10.1.1.1\n\n   local  ident (addr/mask/prot/port): (172.16.0.0/255.255.0.0/0/0)\n   remote ident (addr/mask/prot/port): (192.168.10.0/255.255.255.0/0/0)\n   current_peer 10.2.2.1 port 500\n    #pkts encaps: 0, #pkts encrypt: 0, #pkts digest: 0\n    #pkts decaps: 0, #pkts decrypt: 0, #pkts verify: 0\n    #send errors 0, #recv errors 0\n\n     inbound esp sas:\n     outbound esp sas:",
          icon: "terminal",
        },
      ],
      classifications: [
        {
          id: "class-proxy-id",
          label: "Proxy Identity (Interesting Traffic) Mismatch",
          description:
            "The Branch crypto ACL uses /24 (0.0.0.255) for HQ's network instead of /16 (0.0.255.255), causing a proxy identity mismatch during Quick Mode.",
        },
        {
          id: "class-transform-set",
          label: "Transform Set Mismatch",
          description:
            "The Phase 2 transform sets do not match between peers, causing encryption negotiation failure.",
        },
        {
          id: "class-crypto-map-seq",
          label: "Crypto Map Sequence Number Conflict",
          description:
            "The crypto map sequence numbers are conflicting, preventing proper matching.",
        },
      ],
      correctClassificationId: "class-proxy-id",
      remediations: [
        {
          id: "rem-fix-branch-acl",
          label: "Correct the Branch Crypto ACL Subnet Mask",
          description:
            "Change the Branch ACL from '172.16.0.0 0.0.0.255' to '172.16.0.0 0.0.255.255' so the proxy identities mirror each other exactly.",
        },
        {
          id: "rem-fix-hq-acl",
          label: "Narrow HQ's ACL to /24",
          description:
            "Change HQ's ACL from '172.16.0.0 0.0.255.255' to '172.16.0.0 0.0.0.255' to match Branch.",
        },
        {
          id: "rem-rebuild-transform",
          label: "Recreate Transform Sets on Both Peers",
          description:
            "Delete and recreate the transform sets on both routers to ensure matching algorithms.",
        },
      ],
      correctRemediationId: "rem-fix-branch-acl",
      rationales: [
        {
          id: "rat-mirror-acl",
          text: "Crypto ACLs must be exact mirrors. HQ defines remote as 192.168.10.0/24 and local as 172.16.0.0/16. Branch must mirror this: local 192.168.10.0/24, remote 172.16.0.0/16. The Branch incorrectly uses /24 (0.0.0.255) for HQ's network, which should be /16 (0.0.255.255).",
        },
        {
          id: "rat-narrowing-bad",
          text: "Narrowing HQ's ACL to /24 would break connectivity for all subnets beyond 172.16.0.0/24. The entire 172.16.0.0/16 network needs VPN access to the Branch.",
        },
      ],
      correctRationaleId: "rat-mirror-acl",
      feedback: {
        perfect:
          "Correct. The Branch crypto ACL uses a /24 wildcard (0.0.0.255) for HQ's network, but HQ defines it as /16 (0.0.255.255). Proxy identities must be exact mirrors for Phase 2 to succeed.",
        partial:
          "You identified a configuration issue but missed the specific subnet mask discrepancy. Look carefully at the wildcard masks in both crypto ACLs - they must mirror each other exactly.",
        wrong:
          "The PROPOSAL_NOT_CHOSEN error in Quick Mode points to a proxy identity mismatch. Compare the wildcard masks in the crypto ACLs: HQ uses 0.0.255.255 (/16) for its local network, but Branch references HQ's network as 0.0.0.255 (/24).",
      },
    },
    {
      type: "triage-remediate",
      id: "anti-replay-drops",
      title: "IPSec Anti-Replay Window Drops Under Load",
      description:
        "The VPN tunnel is established and passing traffic, but users at the Branch report intermittent packet loss and application timeouts during peak hours. The NOC has confirmed the tunnel stays up but performance degrades.",
      evidence: [
        {
          type: "log",
          content:
            "router-hq# show crypto ipsec sa | include pkts|replay|errors\n    #pkts encaps: 4821903, #pkts encrypt: 4821903, #pkts digest: 4821903\n    #pkts decaps: 4310221, #pkts decrypt: 4310221, #pkts verify: 4310221\n    #pkts compressed: 0, #pkts decompressed: 0\n    #pkts not compressed: 0, #pkts comp. failed: 0\n    #pkts not decompressed: 0, #pkts decompress failed: 0\n    #send errors 0, #recv errors 0\n    #pkts replay rollover: 0, #pkts replay failed: 511682\n    #pkts internal err: 0",
          icon: "terminal",
        },
        {
          type: "log",
          content:
            "router-hq# show processes cpu | include Crypto\n  42     8831204    2840221    3108   3.20%  2.94%  2.71%   Crypto IKMP\n  43    62401832   11223041    5561  12.60% 11.85% 10.22%   Crypto Engine\n\nrouter-hq# show platform hardware qfp active feature ipsec data-path\n  Anti-replay failures:    511682\n  Window size:             64\n  Packets out-of-order:    892041",
          icon: "terminal",
        },
        {
          type: "config",
          content:
            "! Current IPSec configuration\ncrypto ipsec security-association replay window-size 64\n\n! Interface counters\nGigabitEthernet0/0 - line protocol is up\n  Input rate: 847 Mbps, Output rate: 612 Mbps\n  5 minute input rate 847321000 bits/sec, 98214 packets/sec\n  Overruns: 0, Frame errors: 0, CRC errors: 0",
          icon: "settings",
        },
      ],
      classifications: [
        {
          id: "class-anti-replay",
          label: "Anti-Replay Window Too Small for Traffic Volume",
          description:
            "At ~100k pps, out-of-order packets exceed the 64-packet replay window, causing legitimate packets to be dropped by the anti-replay check.",
        },
        {
          id: "class-sa-lifetime",
          label: "SA Lifetime Causing Frequent Rekeying",
          description:
            "The IPSec SA is expiring too frequently, causing packet loss during rekeying events.",
        },
        {
          id: "class-bandwidth",
          label: "WAN Link Saturation",
          description:
            "The WAN link is at maximum capacity, causing packet drops unrelated to IPSec.",
        },
      ],
      correctClassificationId: "class-anti-replay",
      remediations: [
        {
          id: "rem-increase-window",
          label: "Increase Anti-Replay Window to 1024",
          description:
            "Set 'crypto ipsec security-association replay window-size 1024' to accommodate high-throughput traffic with out-of-order delivery.",
        },
        {
          id: "rem-disable-replay",
          label: "Disable Anti-Replay Protection Entirely",
          description:
            "Disable the anti-replay check with 'no crypto ipsec security-association replay' to eliminate all replay drops.",
        },
        {
          id: "rem-qos-shaping",
          label: "Apply QoS Traffic Shaping to Reduce Rate",
          description:
            "Shape traffic below the current rate to reduce the number of out-of-order packets hitting the replay window.",
        },
      ],
      correctRemediationId: "rem-increase-window",
      rationales: [
        {
          id: "rat-window-size",
          text: "With ~100k packets/sec and 892k out-of-order packets, the default 64-packet window is far too small. Increasing to 1024 accommodates multipath routing and QoS reordering while preserving replay protection. The 511k replay failures directly account for the intermittent packet loss.",
        },
        {
          id: "rat-no-disable",
          text: "Disabling anti-replay protection eliminates the drops but exposes the tunnel to replay attacks, which is an unacceptable security trade-off. Increasing the window is the correct balance.",
        },
        {
          id: "rat-not-bandwidth",
          text: "While bandwidth is high, the interface shows no overruns or CRC errors. The packet loss correlates exactly with the replay failure counter (511k), confirming this is an anti-replay issue, not link saturation.",
        },
      ],
      correctRationaleId: "rat-window-size",
      feedback: {
        perfect:
          "Excellent analysis. The 511,682 replay failures with a 64-packet window at ~100k pps clearly indicates the anti-replay window is undersized. Increasing to 1024 preserves security while accommodating packet reordering at high throughput.",
        partial:
          "You recognized the performance issue but the root cause is specifically the anti-replay window size. Note the massive replay failure count (511k) compared to zero send/recv errors.",
        wrong:
          "Look at the counters: 511,682 replay failures with a window of only 64 packets at ~100k pps throughput. Out-of-order packets (892k) far exceed the window, causing legitimate traffic to be silently dropped.",
      },
    },
  ],
  hints: [
    "When IKE Phase 1 fails with NO_PROPOSAL_CHOSEN, compare every ISAKMP policy parameter: encryption, hash, authentication method, DH group, and lifetime between both peers.",
    "Phase 2 proxy identity mismatches require crypto ACLs to be exact mirrors - check that subnet masks and wildcard bits match precisely on both sides.",
    "High anti-replay failure counts with zero send/recv errors indicate the replay window is too small for the traffic volume, not a link or encryption issue.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "IPSec VPN troubleshooting is a daily task for network security engineers. Understanding IKE negotiation phases, proxy identity matching, and performance tuning separates senior engineers from junior staff during outage response.",
  toolRelevance: [
    "Cisco IOS/IOS-XE",
    "Palo Alto GlobalProtect",
    "strongSwan",
    "Wireshark IKE dissector",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
