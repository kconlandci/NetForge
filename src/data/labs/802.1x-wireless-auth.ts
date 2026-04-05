import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "802.1x-wireless-auth",
  version: 1,
  title: "Debug 802.1X Wireless Authentication Failures",
  tier: "advanced",
  track: "wireless-networking",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["802.1x", "radius", "eap", "authentication", "certificates"],
  description:
    "Investigate and resolve 802.1X wireless authentication failures including EAP negotiation errors, RADIUS server issues, certificate validation failures, and dynamic VLAN assignment problems.",
  estimatedMinutes: 15,
  learningObjectives: [
    "Trace the 802.1X/EAP authentication flow from client supplicant through authenticator to RADIUS server",
    "Diagnose certificate-based authentication failures in EAP-TLS and PEAP deployments",
    "Resolve dynamic VLAN assignment failures caused by RADIUS attribute mismatches",
  ],
  sortOrder: 313,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "dot1x-cert-expired",
      title: "Certificate Validation Failure",
      objective:
        "All wireless users are suddenly unable to authenticate. 802.1X rejects every connection attempt. The issue started this morning and affects all SSIDs using EAP-TLS.",
      investigationData: [
        {
          id: "src-radius-log",
          label: "FreeRADIUS Server Log",
          content:
            "rad_recv: Access-Request from 10.10.0.5:32768\n  User-Name = \"jsmith@corp.local\"\n  EAP-Message = 0x020100...\n  NAS-IP-Address = 10.10.0.5\n\nTLS: Certificate verification FAILED\n  Error: certificate has expired\n  Subject: CN=radius.corp.local, O=Corp Inc\n  Issuer: CN=Corp-Root-CA\n  Not After: Mar 27 00:00:00 2026 GMT  *** EXPIRED YESTERDAY ***\n\nAuth: (0) Login incorrect: [jsmith@corp.local] (TLS handshake failed)\nSending Access-Reject for user [jsmith@corp.local]",
          isCritical: true,
        },
        {
          id: "src-client-log",
          label: "Windows Supplicant Event Log",
          content:
            "Event ID: 11001 - Network Diagnostics\nSource: EAP-TLS\nDescription: The certificate received from the remote server\nhas expired. Server: radius.corp.local\nCert expiry: 2026-03-27T00:00:00Z\nAction taken: Connection terminated (server cert validation failed)\n\nUser impact: Cannot connect to CorpNet-Secure SSID\nFallback: No open or guest SSIDs available",
        },
        {
          id: "src-cert-detail",
          label: "RADIUS Server Certificate Status",
          content:
            "$ openssl x509 -in /etc/raddb/certs/server.pem -noout -dates\nnotBefore=Mar 27 00:00:00 2025 GMT\nnotAfter=Mar 27 00:00:00 2026 GMT   *** EXPIRED ***\n\n$ date\nFri Mar 28 09:15:00 UTC 2026\n\nCertificate expired 33 hours ago.\nCA certificate (Corp-Root-CA): Valid until 2030\nClient certificates: Valid until 2027",
          isCritical: true,
        },
      ],
      actions: [
        { id: "act-renew-cert", label: "Renew the RADIUS server certificate from the corporate CA and restart the RADIUS service" },
        { id: "act-disable-validation", label: "Disable server certificate validation on all clients" },
        { id: "act-fallback-peap", label: "Switch to PEAP-MSCHAPv2 to bypass certificate issues" },
        { id: "act-extend-date", label: "Set the RADIUS server clock back to extend certificate validity" },
      ],
      correctActionId: "act-renew-cert",
      rationales: [
        {
          id: "rat-renew",
          text: "The RADIUS server certificate expired yesterday. Renewing it from the corporate CA and restarting the RADIUS service immediately restores EAP-TLS authentication for all clients.",
        },
        {
          id: "rat-no-disable",
          text: "Disabling server certificate validation removes protection against rogue RADIUS servers. This creates a major security vulnerability and should never be done.",
        },
        {
          id: "rat-no-clock",
          text: "Setting the server clock back breaks logs, Kerberos authentication, and other time-sensitive services. It is never an acceptable workaround.",
        },
      ],
      correctRationaleId: "rat-renew",
      feedback: {
        perfect:
          "Correct! The expired RADIUS server certificate is the root cause. Renewing it from the CA and restarting FreeRADIUS restores authentication immediately.",
        partial:
          "Right to fix the certificate, but disabling validation or changing clocks introduce severe security risks. Always renew from the CA.",
        wrong:
          "The RADIUS log clearly shows 'certificate has expired' with a date of March 27. Renewing the server certificate is the only correct fix.",
      },
    },
    {
      type: "investigate-decide",
      id: "dot1x-vlan-assignment",
      title: "Dynamic VLAN Assignment Failure",
      objective:
        "Users authenticate successfully to 802.1X but land on the wrong VLAN. Employees end up on the guest VLAN instead of their department VLAN. Investigate the RADIUS attribute configuration.",
      investigationData: [
        {
          id: "src-radius-attrs",
          label: "RADIUS Access-Accept Attributes",
          content:
            "rad_recv: Access-Accept for jsmith@corp.local\n  Tunnel-Type = VLAN\n  Tunnel-Medium-Type = IEEE-802\n  Tunnel-Private-Group-Id = \"10\"\n\nExpected VLAN for Engineering group: VLAN 20\nActual VLAN assigned: VLAN 10 (Guest)\n\nNote: Tunnel-Private-Group-Id = \"10\" maps to VLAN 10 on the WLC.\nThe RADIUS policy should return VLAN 20 for Engineering users.",
          isCritical: true,
        },
        {
          id: "src-radius-policy",
          label: "FreeRADIUS users File",
          content:
            "# /etc/raddb/users\nDEFAULT Ldap-Group == \"CN=Engineering,OU=Groups,DC=corp,DC=local\"\n  Tunnel-Type = VLAN,\n  Tunnel-Medium-Type = IEEE-802,\n  Tunnel-Private-Group-Id = \"20\"\n\nDEFAULT Ldap-Group == \"CN=Sales,OU=Groups,DC=corp,DC=local\"\n  Tunnel-Type = VLAN,\n  Tunnel-Medium-Type = IEEE-802,\n  Tunnel-Private-Group-Id = \"30\"\n\nDEFAULT   *** CATCH-ALL RULE ***\n  Tunnel-Type = VLAN,\n  Tunnel-Medium-Type = IEEE-802,\n  Tunnel-Private-Group-Id = \"10\"",
          isCritical: true,
        },
        {
          id: "src-ldap-query",
          label: "LDAP Group Membership Check",
          content:
            "$ ldapsearch -b \"DC=corp,DC=local\" \"(sAMAccountName=jsmith)\" memberOf\ndn: CN=John Smith,OU=Users,DC=corp,DC=local\nmemberOf: CN=Engineering,OU=Dept Groups,DC=corp,DC=local\n\nRADIUS LDAP query uses: OU=Groups\nActual OU in AD: OU=Dept Groups\n\nThe LDAP group DN in the RADIUS policy does not match the\nactual Active Directory OU structure. The Engineering rule\nnever matches, so the catch-all DEFAULT returns VLAN 10.",
        },
      ],
      actions: [
        { id: "act-fix-dn", label: "Update the RADIUS policy to use the correct LDAP group DN (OU=Dept Groups instead of OU=Groups)" },
        { id: "act-static-vlan", label: "Configure static VLAN assignment on the WLC instead of dynamic" },
        { id: "act-wlc-override", label: "Set VLAN override on the WLC to force VLAN 20 for all users" },
        { id: "act-move-group", label: "Move the AD group to OU=Groups to match the RADIUS config" },
      ],
      correctActionId: "act-fix-dn",
      rationales: [
        {
          id: "rat-dn-fix",
          text: "The RADIUS policy references 'OU=Groups' but AD uses 'OU=Dept Groups'. This DN mismatch causes the group match to fail, hitting the catch-all VLAN 10 rule. Correcting the DN restores dynamic VLAN assignment.",
        },
        {
          id: "rat-not-static",
          text: "Static VLAN assignment eliminates role-based access control. Dynamic assignment based on group membership is the correct enterprise approach.",
        },
        {
          id: "rat-not-move-ad",
          text: "Moving AD OUs to match RADIUS config is backwards. The RADIUS policy should reflect the existing AD structure, not the other way around.",
        },
      ],
      correctRationaleId: "rat-dn-fix",
      feedback: {
        perfect:
          "Correct! The LDAP DN mismatch (OU=Groups vs OU=Dept Groups) causes group matching to fail, sending everyone to the catch-all guest VLAN. Fixing the DN resolves it.",
        partial:
          "Right approach, but specifically the OU name in the DN is wrong. RADIUS checks 'OU=Groups' but AD has 'OU=Dept Groups'. Update the RADIUS policy.",
        wrong:
          "The LDAP search proves the group DN is wrong in the RADIUS policy. Users match the catch-all rule instead of their department rule, getting VLAN 10 instead of 20.",
      },
    },
    {
      type: "investigate-decide",
      id: "dot1x-eap-mismatch",
      title: "EAP Method Negotiation Failure",
      objective:
        "New MacBooks cannot connect to the corporate SSID while Windows laptops work fine. The Mac supplicant shows an authentication error. Investigate the EAP negotiation.",
      investigationData: [
        {
          id: "src-wireshark",
          label: "Wireshark EAPOL Capture (MacBook)",
          content:
            "Frame 1: EAP-Request/Identity (AP -> Client)\nFrame 2: EAP-Response/Identity (Client -> AP) user=jane@corp.local\nFrame 3: EAP-Request/PEAP (AP -> Client, Start)\nFrame 4: EAP-Response/NAK (Client -> AP)\n  Desired Auth Type: EAP-TLS (13)\n  *** Client REJECTED PEAP, wants EAP-TLS ***\nFrame 5: EAP-Failure (AP -> Client)\n\nThe Mac supplicant is configured for EAP-TLS only.\nThe RADIUS server only offers PEAP-MSCHAPv2.",
          isCritical: true,
        },
        {
          id: "src-radius-eap",
          label: "RADIUS EAP Configuration",
          content:
            "# /etc/raddb/mods-enabled/eap\neap {\n  default_eap_type = peap\n  \n  peap {\n    default_eap_type = mschapv2\n  }\n  \n  tls {\n    # TLS module is DISABLED\n    # private_key_file = /etc/raddb/certs/server.key\n    # certificate_file = /etc/raddb/certs/server.pem\n  }\n}\n\nNote: EAP-TLS is commented out / disabled on the RADIUS server.\nOnly PEAP-MSCHAPv2 is available.",
          isCritical: true,
        },
        {
          id: "src-mac-profile",
          label: "macOS Wi-Fi Profile",
          content:
            "MDM-deployed Wi-Fi profile:\n  SSID: CorpNet-Secure\n  Security: WPA2 Enterprise\n  EAP Type: EAP-TLS\n  Identity Certificate: CN=jane@corp.local (client cert installed)\n  Trusted Server Certificate: CN=Corp-Root-CA\n\nWindows GPO Wi-Fi profile:\n  SSID: CorpNet-Secure\n  Security: WPA2 Enterprise\n  EAP Type: PEAP\n  Inner method: MSCHAPv2\n  Credentials: Domain username/password",
        },
      ],
      actions: [
        { id: "act-enable-tls", label: "Enable EAP-TLS on the RADIUS server alongside PEAP to support both Mac and Windows clients" },
        { id: "act-change-mac", label: "Reconfigure Mac profiles to use PEAP-MSCHAPv2 instead of EAP-TLS" },
        { id: "act-separate-ssid", label: "Create a separate SSID for Macs with EAP-TLS support" },
        { id: "act-radius-proxy", label: "Deploy a separate RADIUS server for Mac clients" },
      ],
      correctActionId: "act-enable-tls",
      rationales: [
        {
          id: "rat-enable-tls",
          text: "Enabling EAP-TLS on the RADIUS server supports both authentication methods. Macs use certificate-based EAP-TLS while Windows uses PEAP-MSCHAPv2. Both methods can coexist on the same RADIUS server.",
        },
        {
          id: "rat-not-downgrade",
          text: "Downgrading Macs to PEAP-MSCHAPv2 weakens security. EAP-TLS with certificates is stronger than password-based PEAP. The server should support the stronger method.",
        },
        {
          id: "rat-not-separate",
          text: "Separate SSIDs for different OS types adds unnecessary complexity. A single SSID with multiple EAP methods on the RADIUS server is the standard approach.",
        },
      ],
      correctRationaleId: "rat-enable-tls",
      feedback: {
        perfect:
          "Correct! Enabling EAP-TLS on the RADIUS server alongside PEAP allows both Mac (certificate) and Windows (password) clients to authenticate to the same SSID.",
        partial:
          "Right direction, but enabling EAP-TLS on the existing RADIUS server is simpler than deploying separate infrastructure. Both methods coexist naturally.",
        wrong:
          "The Wireshark capture shows the Mac sending EAP-NAK rejecting PEAP and requesting EAP-TLS, which the server does not support. Enabling EAP-TLS on the RADIUS server is the fix.",
      },
    },
  ],
  hints: [
    "When all 802.1X authentication fails simultaneously, check the RADIUS server certificate expiration date. Expired certificates cause immediate TLS handshake failures.",
    "Dynamic VLAN assignment uses RADIUS Tunnel-Private-Group-Id attribute. If users land on the wrong VLAN, verify the LDAP group DN matches the actual AD structure.",
    "EAP-NAK in a Wireshark capture means the client rejected the offered EAP method. The RADIUS server must support all EAP types used by client devices.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "802.1X troubleshooting is one of the most challenging wireless skills. Engineers who can trace EAP conversations through RADIUS logs and Wireshark captures are highly sought after in enterprise networking.",
  toolRelevance: [
    "Wireshark (EAPOL/RADIUS dissectors)",
    "FreeRADIUS / Cisco ISE / Aruba ClearPass",
    "Active Directory / LDAP",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
