import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "radius-authentication-debug",
  version: 1,
  title: "Debug RADIUS Authentication Failures",
  tier: "intermediate",
  track: "network-security",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["radius", "authentication", "aaa", "nas", "freeradius", "802.1x", "eap"],
  description:
    "Diagnose and remediate RADIUS authentication failures between network access servers and RADIUS servers by analyzing debug logs, shared secret mismatches, and EAP configuration errors.",
  estimatedMinutes: 14,
  learningObjectives: [
    "Interpret RADIUS debug logs to identify the root cause of authentication failures",
    "Diagnose shared secret mismatches between NAS devices and RADIUS servers",
    "Identify EAP method configuration mismatches that prevent successful authentication",
    "Determine the correct remediation for RADIUS timeout and connectivity issues",
  ],
  sortOrder: 409,
  status: "published",
  prerequisites: [],
  rendererType: "triage-remediate",
  scenarios: [
    {
      type: "triage-remediate",
      id: "rad-001",
      title: "Shared Secret Mismatch on New Switch",
      description:
        "A newly deployed access switch was added to the network with 802.1X authentication. All users connecting to this switch receive authentication failures. Other switches on the network authenticate successfully. The RADIUS server logs show incoming requests but immediate rejections.",
      evidence: [
        {
          type: "log",
          content:
            "FreeRADIUS debug log (radiusd -X):\nReady to process requests\nrad_recv: Access-Request packet from host 10.0.1.55:1645, id=127, length=220\n  WARNING: Received packet from 10.0.1.55 with invalid Message-Authenticator!  (Shared secret is incorrect.)\n  Dropping packet without response.\n\nrad_recv: Access-Request packet from host 10.0.1.55:1645, id=128, length=220\n  WARNING: Received packet from 10.0.1.55 with invalid Message-Authenticator!  (Shared secret is incorrect.)\n  Dropping packet without response.\n\n# Packets from other switches (working):\nrad_recv: Access-Request packet from host 10.0.1.50:1645, id=45, length=198\n  User-Name = \"jdoe\"\n  NAS-IP-Address = 10.0.1.50\n  Sending Access-Accept of id 45 to 10.0.1.50",
        },
        {
          type: "log",
          content:
            "Switch 10.0.1.55 (new) configuration:\n# show running-config | section radius\nradius server CORP-RADIUS\n  address ipv4 10.0.5.10 auth-port 1812 acct-port 1813\n  key 7 06070D3249150B1E1D\n\naaa authentication dot1x default group radius\naaa authorization network default group radius\n\n# Note: Key '7' indicates a Type-7 encrypted password.\n# Decrypted value: Radius2024!\n\nRADIUS Server (clients.conf) entry for 10.0.1.55:\nclient new-switch {\n  ipaddr = 10.0.1.55\n  secret = Radius2025!\n  shortname = SW-FLOOR3\n}",
        },
      ],
      classifications: [
        { id: "c1", label: "Shared Secret Mismatch", description: "The RADIUS shared secret configured on the switch does not match the secret configured on the RADIUS server" },
        { id: "c2", label: "Network Connectivity Issue", description: "The switch cannot reach the RADIUS server due to routing or firewall problems" },
        { id: "c3", label: "Certificate Validation Failure", description: "The RADIUS server certificate is expired or untrusted by the switch" },
        { id: "c4", label: "NAS IP Address Mismatch", description: "The RADIUS server does not recognize the source IP of the switch" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Update the RADIUS server client entry to match the switch shared secret (Radius2024!)", description: "Change the secret in clients.conf for 10.0.1.55 from Radius2025! to Radius2024! and restart FreeRADIUS" },
        { id: "rem2", label: "Update the switch RADIUS key to match the server (Radius2025!)", description: "Change the switch radius server key to Radius2025! to match the server configuration" },
        { id: "rem3", label: "Regenerate certificates on the RADIUS server", description: "Create new server certificates and redeploy to all NAS devices" },
        { id: "rem4", label: "Add a firewall rule to allow RADIUS traffic from the new switch", description: "Open UDP 1812/1813 from 10.0.1.55 to 10.0.5.10" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "The FreeRADIUS log explicitly states 'invalid Message-Authenticator! (Shared secret is incorrect.)' for packets from 10.0.1.55. The switch has 'Radius2024!' while the server has 'Radius2025!' configured. Updating the server to match the switch avoids reconfiguring the switch (which may require physical access or a maintenance window)." },
        { id: "rat2", text: "Updating the switch key is also valid but typically the RADIUS server configuration is easier to change centrally. Either side can be updated, but the server-side change is less disruptive since it does not require switch access." },
        { id: "rat3", text: "This is not a certificate issue. The error message clearly identifies a shared secret mismatch, not a TLS or certificate validation problem." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! The FreeRADIUS log clearly identifies a shared secret mismatch. The switch sends 'Radius2024!' but the server expects 'Radius2025!'. Updating the server-side secret is the least disruptive fix.",
        partial: "You identified the shared secret issue correctly. Either side can be updated, but changing the server configuration is typically preferred as it can be done centrally without a switch maintenance window.",
        wrong: "The FreeRADIUS debug log explicitly states 'Shared secret is incorrect' for packets from the new switch. Compare the secrets: the switch has Radius2024! while the server has Radius2025!. This is a shared secret mismatch.",
      },
    },
    {
      type: "triage-remediate",
      id: "rad-002",
      title: "EAP-TLS Authentication Failing for All Wireless Clients",
      description:
        "The wireless network was recently migrated from PEAP-MSCHAPv2 to EAP-TLS for stronger authentication. Since the migration, all wireless clients fail to connect. The RADIUS server shows EAP negotiation failures.",
      evidence: [
        {
          type: "log",
          content:
            "FreeRADIUS debug log:\nrad_recv: Access-Request packet from host 10.0.1.100:1645, id=201, length=289\n  User-Name = \"alice@corp.local\"\n  NAS-IP-Address = 10.0.1.100\n  EAP-Message = 0x0201001501616c69636540636f72702e6c6f63616c\n\nServer is handling inner EAP:\n  eap: Peer sent EAP-Response/Identity\n  eap: Calling submodule eap_tls to process data\n  eap_tls: ERROR: Failed to open DH file '/etc/freeradius/3.0/certs/dh'\n  eap_tls: ERROR: TLS Alert write: fatal:internal error\n  eap_tls: ERROR: Failed in __FUNCTION__ (SSL_read): error:0A000126:SSL routines::unexpected eof while reading\n  rlm_eap: ERROR: Failed continuing EAP TLS (13) session.\n  Sending Access-Reject of id 201 to 10.0.1.100",
        },
        {
          type: "log",
          content:
            "RADIUS server EAP configuration (/etc/freeradius/3.0/mods-enabled/eap):\neap {\n  default_eap_type = tls\n  tls-config tls-common {\n    private_key_file = /etc/freeradius/3.0/certs/server.key\n    certificate_file = /etc/freeradius/3.0/certs/server.pem\n    ca_file = /etc/freeradius/3.0/certs/ca.pem\n    dh_file = /etc/freeradius/3.0/certs/dh\n    ca_path = /etc/freeradius/3.0/certs\n    check_crl = yes\n    crl_path = /etc/freeradius/3.0/certs/crl\n  }\n}\n\n$ ls -la /etc/freeradius/3.0/certs/\n-rw-r----- freerad freerad  1.7K  server.key\n-rw-r--r-- freerad freerad  4.2K  server.pem\n-rw-r--r-- freerad freerad  1.9K  ca.pem\n                                   dh  <-- FILE MISSING\n-rw-r--r-- freerad freerad  512   crl/\n\n$ openssl verify -CAfile /etc/freeradius/3.0/certs/ca.pem /etc/freeradius/3.0/certs/server.pem\nserver.pem: OK",
        },
      ],
      classifications: [
        { id: "c1", label: "Missing DH Parameters File", description: "The Diffie-Hellman parameters file required for EAP-TLS key exchange is missing from the RADIUS server" },
        { id: "c2", label: "Expired Server Certificate", description: "The RADIUS server TLS certificate has expired, causing clients to reject the connection" },
        { id: "c3", label: "Client Certificate Not Trusted", description: "Client certificates are not signed by the CA configured on the RADIUS server" },
        { id: "c4", label: "EAP Method Mismatch", description: "Clients are still configured for PEAP but the server now requires EAP-TLS" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Generate the DH parameters file and restart FreeRADIUS", description: "Run 'openssl dhparam -out /etc/freeradius/3.0/certs/dh 2048' and restart the RADIUS service" },
        { id: "rem2", label: "Renew the server certificate with the internal CA", description: "Generate a new server certificate and update the EAP configuration" },
        { id: "rem3", label: "Revert the EAP configuration back to PEAP-MSCHAPv2", description: "Change default_eap_type back to peap to restore connectivity" },
        { id: "rem4", label: "Disable CRL checking in the EAP configuration", description: "Set check_crl = no to bypass certificate revocation list validation" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "The FreeRADIUS log explicitly states 'Failed to open DH file'. The file listing confirms the dh file is missing from /etc/freeradius/3.0/certs/. Generating DH parameters with openssl dhparam creates the required file for the TLS key exchange, resolving the 'fatal:internal error' that causes all EAP-TLS sessions to fail." },
        { id: "rat2", text: "The server certificate verifies successfully (openssl verify shows OK) and the error is specifically about the DH file, not certificate validation. Renewing the certificate would not resolve this issue." },
        { id: "rat3", text: "Reverting to PEAP-MSCHAPv2 works around the problem but abandons the security improvement that EAP-TLS provides. The root cause is a missing file, not a fundamental configuration problem." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! The DH parameters file is missing, causing all EAP-TLS sessions to fail. Generating the file with openssl dhparam and restarting FreeRADIUS resolves the issue without reverting the security upgrade.",
        partial: "You identified the certificate infrastructure area correctly, but the specific issue is the missing DH parameters file, not the server certificate itself. The error log points directly to this file.",
        wrong: "The FreeRADIUS log states 'Failed to open DH file' and the directory listing confirms the dh file is missing. This is the root cause. Generate it with 'openssl dhparam -out /etc/freeradius/3.0/certs/dh 2048' and restart the service.",
      },
    },
    {
      type: "triage-remediate",
      id: "rad-003",
      title: "RADIUS Timeout on Wireless Controller",
      description:
        "Users report intermittent wireless authentication failures during peak hours (8:30-9:00 AM). The wireless controller shows RADIUS timeout errors, but the RADIUS server appears to be online. Off-peak authentication works normally.",
      evidence: [
        {
          type: "log",
          content:
            "Cisco WLC RADIUS Server Status:\n(Cisco Controller) > show radius summary\nRADIUS Server   Index  Address       Port  State     Tout\n--------------  -----  -----------  -----  --------  ----\nPrimary           1    10.0.5.10    1812   Enabled    2\nSecondary         2    10.0.5.11    1812   Enabled    2\n\n(Cisco Controller) > show radius statistics\n                       Server 1      Server 2\nRequest Count          12,847        0\nTimeout Count          4,201         0\nRetransmit Count       4,201         0\nAccess Accepts         8,100         0\nAccess Rejects         546           0\nAvg Response Time      1,850ms       N/A\n\nNote: Timeout threshold is 2 seconds. Average response is 1,850ms (nearly at timeout).\nSecondary server has zero requests -- failover is not working.",
        },
        {
          type: "log",
          content:
            "RADIUS server resource utilization during peak:\n$ top -bn1 | head -5\ntop - 08:45:00 up 45 days\nTasks: 210 total, 3 running\n%Cpu(s): 92.3 us, 4.2 sy, 0.0 ni, 2.1 id\nMiB Mem: 4096.0 total, 287.4 free, 3412.6 used, 396.0 buff/cache\n\n$ radiusd -X 2>&1 | grep -c 'Processing request'\n847 requests in queue (backlog)\n\nWLC Failover Config:\n(Cisco Controller) > show radius auth statistics\nServer Timeout: 2 seconds\nMax Retransmissions: 3\nFallback Mode: Passive (waits for primary to fail completely)\nServer Dead Time: 0 minutes  <<<< No dead time configured\n\nNetwork test:\n$ ping 10.0.5.10 -c 5\nrtt min/avg/max = 0.5/0.8/1.2 ms (network latency is fine)",
        },
      ],
      classifications: [
        { id: "c1", label: "RADIUS Server Overloaded During Peak Hours", description: "The primary RADIUS server CPU is saturated at 92% with 847 queued requests, causing response times to exceed the WLC timeout threshold" },
        { id: "c2", label: "Network Latency Between WLC and RADIUS", description: "Network congestion during peak hours causes packets to be delayed" },
        { id: "c3", label: "RADIUS Server Disk Full", description: "Logging has filled the server disk, causing the RADIUS process to hang" },
        { id: "c4", label: "WLC RADIUS Configuration Error", description: "The WLC has incorrect RADIUS server settings preventing proper communication" },
      ],
      correctClassificationId: "c1",
      remediations: [
        { id: "rem1", label: "Enable active failover to the secondary server and increase the timeout to 5 seconds", description: "Configure the WLC to load-balance between both RADIUS servers (active/active), set server dead time, and increase the timeout to accommodate peak load" },
        { id: "rem2", label: "Increase the WLC timeout to 10 seconds", description: "Give the overloaded server more time to respond by raising the timeout threshold" },
        { id: "rem3", label: "Restart the RADIUS server process to clear the queue", description: "Restart radiusd to flush pending requests and restore performance" },
        { id: "rem4", label: "Upgrade the RADIUS server hardware", description: "Replace the server with a higher-spec machine to handle peak load" },
      ],
      correctRemediationId: "rem1",
      rationales: [
        { id: "rat1", text: "The secondary RADIUS server has zero requests, meaning the WLC is not load-balancing or failing over. With the primary at 92% CPU and 847 queued requests, distributing load across both servers immediately halves the burden. Setting a server dead time enables proper failover, and increasing the timeout to 5 seconds accommodates occasional peak delays." },
        { id: "rat2", text: "Increasing the timeout alone does not address the root cause: the primary server is overloaded while the secondary sits idle. Even with a higher timeout, a single server at 92% CPU will continue to degrade as user count grows." },
        { id: "rat3", text: "Restarting the RADIUS service drops all in-progress authentications and only provides temporary relief. The queue will rebuild within minutes during peak hours without load distribution." },
      ],
      correctRationaleId: "rat1",
      feedback: {
        perfect: "Correct! The secondary RADIUS server is completely idle while the primary is overloaded at 92% CPU. Enabling active failover/load-balancing distributes the authentication load and the increased timeout handles remaining peak spikes.",
        partial: "You identified the overload issue, but the key insight is that the secondary server has zero requests. The WLC must be configured to distribute load across both servers, not just increase the timeout.",
        wrong: "The primary RADIUS server is at 92% CPU with 847 queued requests while the secondary has zero requests. The WLC failover is passive with no dead time configured. Enabling active load-balancing across both servers is the correct fix.",
      },
    },
  ],
  hints: [
    "When RADIUS authentication fails, always check the FreeRADIUS debug log (radiusd -X) for explicit error messages. The log often identifies the exact issue.",
    "Shared secret mismatches produce a specific error: 'invalid Message-Authenticator'. Compare the secret on both the NAS device and the RADIUS server clients.conf entry.",
    "If a secondary RADIUS server shows zero requests while the primary is overloaded, check the WLC failover mode and server dead time configuration.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "RADIUS authentication troubleshooting is a daily task for network and security engineers managing enterprise wireless, VPN, and 802.1X environments. Proficiency with FreeRADIUS debug logs and NAS device RADIUS configuration is highly valued.",
  toolRelevance: ["FreeRADIUS", "Cisco ISE", "Cisco WLC", "Wireshark", "tcpdump"],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
