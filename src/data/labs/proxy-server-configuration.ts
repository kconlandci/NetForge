import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "proxy-server-configuration",
  version: 1,
  title: "Proxy Server Configuration Analysis",
  tier: "intermediate",
  track: "network-services",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["proxy", "squid", "web-filtering", "pac-file", "forward-proxy"],
  description:
    "Analyze proxy configuration issues including PAC file errors, authentication failures, and content filtering bypass problems.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Diagnose proxy authentication and connectivity failures",
    "Interpret PAC file logic and troubleshoot auto-configuration",
    "Identify proxy bypass and content filtering issues",
  ],
  sortOrder: 509,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "proxy-001",
      title: "Proxy Authentication Loop",
      objective:
        "Determine why users in the finance department are stuck in an authentication loop when accessing external websites through the corporate proxy.",
      investigationData: [
        {
          id: "source-1",
          label: "Squid Access Log",
          content:
            "1711612523.456  0 10.1.3.50 TCP_DENIED/407 3921 GET http://www.example.com/ - HIER_NONE/- text/html\n1711612524.789  0 10.1.3.50 TCP_DENIED/407 3921 GET http://www.example.com/ - HIER_NONE/- text/html\n1711612525.123  0 10.1.3.50 TCP_DENIED/407 3921 GET http://www.example.com/ - HIER_NONE/- text/html\n\nNote: Finance VLAN (10.1.3.0/24) was recently migrated to LDAP auth.\nSales VLAN (10.1.2.0/24) works normally with LDAP auth.",
          isCritical: true,
        },
        {
          id: "source-2",
          label: "Squid Configuration Excerpt",
          content:
            "auth_param basic program /usr/lib/squid/basic_ldap_auth -b \"dc=corp,dc=local\" -f \"uid=%s\" -h ldap.corp.local\nauth_param basic children 5\nauth_param basic realm Corporate Proxy\n\nacl finance_net src 10.1.3.0/24\nacl authenticated proxy_auth REQUIRED\nacl sales_net src 10.1.2.0/24\n\nhttp_access allow sales_net authenticated\nhttp_access allow finance_net\nhttp_access deny all",
          isCritical: true,
        },
        {
          id: "source-3",
          label: "LDAP Connectivity Test",
          content:
            "$ /usr/lib/squid/basic_ldap_auth -b \"dc=corp,dc=local\" -f \"uid=%s\" -h ldap.corp.local\njsmith password123\nERR Success\n\n$ ldapsearch -x -h ldap.corp.local -b \"ou=Finance,dc=corp,dc=local\" -D \"cn=admin,dc=corp,dc=local\" -W \"(uid=jsmith)\"\n# 0 results\n\n$ ldapsearch -x -h ldap.corp.local -b \"ou=Sales,dc=corp,dc=local\" -D \"cn=admin,dc=corp,dc=local\" -W \"(uid=testuser)\"\n# 1 result: testuser in Sales OU",
        },
      ],
      actions: [
        { id: "a1", label: "Update the LDAP search base to include the Finance OU", color: "green" },
        { id: "a2", label: "Add the 'authenticated' ACL requirement to the finance_net rule", color: "blue" },
        { id: "a3", label: "Increase the basic_ldap_auth children count", color: "yellow" },
        { id: "a4", label: "Switch Finance users to IP-based authentication", color: "orange" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The LDAP search base 'dc=corp,dc=local' should find users across all OUs, but the LDAP auth helper returns 'ERR Success' (authentication failed) for jsmith. The ldapsearch shows Finance OU users are not found, suggesting the LDAP search filter or base DN does not cover the Finance OU correctly. The base DN needs to be broadened or the search filter updated.",
        },
        {
          id: "r2",
          text: "The finance_net ACL rule does not require authentication ('http_access allow finance_net' without the 'authenticated' ACL), so Squid should actually be allowing finance users without auth. However, the 407 responses indicate Squid is still demanding authentication, which means the ACL order matters and the configuration may be misinterpreted.",
        },
        {
          id: "r3",
          text: "Increasing the children count would help with concurrent authentication requests but would not fix the fundamental issue that Finance users cannot authenticate against LDAP because their OU is not being searched correctly.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The LDAP search is not finding Finance OU users. The search base or filter needs to be updated to include the Finance organizational unit so LDAP authentication succeeds for finance department users.",
        partial:
          "The LDAP authentication is failing for Finance users specifically. Compare the ldapsearch results: Sales users are found but Finance users are not, indicating an LDAP search scope issue.",
        wrong:
          "The 407 loop occurs because LDAP cannot find Finance OU users. The ldapsearch returning 0 results for Finance users while Sales users are found confirms the LDAP search base or filter needs updating.",
      },
    },
    {
      type: "investigate-decide",
      id: "proxy-002",
      title: "PAC File Auto-Configuration Failure",
      objective:
        "Determine why some workstations are bypassing the proxy entirely despite WPAD/PAC file auto-configuration being deployed.",
      investigationData: [
        {
          id: "source-1",
          label: "PAC File Content (wpad.dat)",
          content:
            "function FindProxyForURL(url, host) {\n  if (isPlainHostName(host)) return \"DIRECT\";\n  if (dnsDomainIs(host, \".corp.local\")) return \"DIRECT\";\n  if (isInNet(host, \"10.0.0.0\", \"255.0.0.0\")) return \"DIRECT\";\n  if (isInNet(host, \"172.16.0.0\", \"255.240.0.0\")) return \"DIRECT\";\n  return \"PROXY proxy.corp.local:3128\";\n}",
        },
        {
          id: "source-2",
          label: "WPAD Discovery Diagnostics",
          content:
            "Working workstation (10.1.1.50):\n$ nslookup wpad.corp.local\nName: wpad.corp.local\nAddress: 10.0.5.40\n\n$ curl http://wpad.corp.local/wpad.dat\n(returns PAC file successfully)\n\nFailing workstation (10.1.4.75):\n$ nslookup wpad.corp.local\n*** Can't find wpad.corp.local: Non-existent domain\n\nDHCP options on failing workstation's VLAN:\nOption 252 (WPAD URL): not configured",
          isCritical: true,
        },
        {
          id: "source-3",
          label: "Browser Proxy Settings (Failing Workstation)",
          content:
            "Proxy Settings: \"Auto-detect settings\" is enabled\nSpecific PAC URL: not configured\n\nThe workstation's browser is using \"Auto-detect\" which relies on WPAD via DNS or DHCP to discover the PAC file URL.",
          isCritical: true,
        },
      ],
      actions: [
        { id: "a1", label: "Add a DNS record for wpad.corp.local on the VLAN's DNS or configure DHCP option 252", color: "green" },
        { id: "a2", label: "Manually configure the PAC URL on each workstation browser", color: "blue" },
        { id: "a3", label: "Deploy a GPO to set the proxy server address directly", color: "yellow" },
        { id: "a4", label: "Disable the DIRECT return for internal networks in the PAC file", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The failing workstation cannot resolve wpad.corp.local via DNS and DHCP option 252 is not configured on its VLAN. WPAD auto-detection requires either DNS resolution of 'wpad' in the local domain or DHCP option 252 providing the PAC URL. Adding the DNS record or DHCP option on the affected VLAN enables automatic proxy discovery.",
        },
        {
          id: "r2",
          text: "Manually configuring PAC URLs on each workstation works but does not scale and defeats the purpose of automatic proxy configuration. WPAD/DHCP-based auto-detection is the enterprise-standard approach.",
        },
        {
          id: "r3",
          text: "Setting the proxy server directly via GPO bypasses the PAC file entirely, losing the conditional routing logic (direct access for internal networks). The PAC file provides more flexible proxy decisions.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! WPAD auto-detection failed because the VLAN has neither DNS resolution for wpad.corp.local nor DHCP option 252. Adding either one enables automatic PAC file discovery.",
        partial:
          "The WPAD discovery mechanism needs either DNS or DHCP to work. The failing VLAN has neither configured, causing workstations to go direct instead of through the proxy.",
        wrong:
          "WPAD requires DNS resolution of wpad.corp.local or DHCP option 252 to discover the PAC file. The failing VLAN has neither, so workstations cannot find the proxy configuration automatically.",
      },
    },
    {
      type: "investigate-decide",
      id: "proxy-003",
      title: "HTTPS Inspection Certificate Error",
      objective:
        "Determine why users are receiving certificate warnings when accessing HTTPS websites through the proxy after a recent security upgrade enabled SSL inspection.",
      investigationData: [
        {
          id: "source-1",
          label: "User Browser Error",
          content:
            "NET::ERR_CERT_AUTHORITY_INVALID\nThe certificate for www.example.com was issued by:\n  CN=CorpProxy-CA, O=Corp Inc\n\nBrowser says: This certificate is not trusted because the issuer is unknown.\n\nThis error appears on ALL HTTPS sites, not just one specific site.",
          isCritical: true,
        },
        {
          id: "source-2",
          label: "Squid SSL Bump Configuration",
          content:
            "http_port 3128 ssl-bump cert=/etc/squid/ssl_cert/corpproxy-ca.pem key=/etc/squid/ssl_cert/corpproxy-ca.key\n\nssl_bump splice localhost\nssl_bump peek all\nssl_bump bump all\n\nacl step1 at_step SslBump1\nssl_bump peek step1\nssl_bump bump all",
          isCritical: true,
        },
        {
          id: "source-3",
          label: "Certificate Distribution Status",
          content:
            "$ certutil -d sql:/etc/pki/nssdb -L\nCertificate Nickname    Trust Attributes\n(no CorpProxy-CA certificate found)\n\nGPO deployment status for CorpProxy-CA root certificate:\n  Domain computers: deployed to 450/500 workstations\n  New workstations added this week: 50 (pending GPO refresh)\n\nThe 50 new workstations have not received the GPO-deployed root CA yet.",
        },
      ],
      actions: [
        { id: "a1", label: "Force GPO refresh on the new workstations to deploy the root CA", color: "green" },
        { id: "a2", label: "Disable SSL bump on the proxy for the affected users", color: "yellow" },
        { id: "a3", label: "Replace the self-signed proxy CA with a public CA certificate", color: "blue" },
        { id: "a4", label: "Add browser exceptions for all HTTPS sites", color: "red" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "SSL inspection (SSL bump) re-signs HTTPS certificates with the proxy's own CA (CorpProxy-CA). This CA must be trusted by all clients. The 50 new workstations have not received the GPO-deployed root CA certificate yet. Forcing a GPO refresh (gpupdate /force) deploys the certificate, resolving the trust error.",
        },
        {
          id: "r2",
          text: "Disabling SSL bump removes the security inspection capability that was intentionally deployed. The issue is not with the proxy configuration but with incomplete certificate distribution to new workstations.",
        },
        {
          id: "r3",
          text: "Public CAs will not issue certificates that allow proxy re-signing of arbitrary domains. SSL inspection requires a private CA whose root certificate is trusted by all managed endpoints.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The 50 new workstations do not trust CorpProxy-CA because the GPO has not applied yet. Running 'gpupdate /force' on these machines deploys the root CA and resolves all certificate warnings.",
        partial:
          "SSL inspection requires the proxy CA to be trusted by all endpoints. The new workstations are missing the root CA certificate. Pushing the GPO resolves the trust issue.",
        wrong:
          "SSL bump re-signs all HTTPS certificates with CorpProxy-CA. The 50 new workstations have not received this CA via GPO yet. Force a GPO refresh to deploy the certificate to these machines.",
      },
    },
  ],
  hints: [
    "HTTP 407 means proxy authentication required. If users are in an auth loop, the authentication backend (LDAP) may not be finding their accounts.",
    "WPAD auto-detection requires either DNS resolution of 'wpad' in the local domain or DHCP option 252 providing the PAC file URL.",
    "SSL inspection proxies re-sign HTTPS certificates with their own CA. All client workstations must trust this CA or they will see certificate warnings.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Web proxy infrastructure is central to enterprise security. Understanding PAC files, SSL inspection, and proxy authentication is critical for security engineers and network architects managing corporate internet access.",
  toolRelevance: [
    "Squid proxy",
    "curl",
    "openssl s_client",
    "PAC file debugging",
    "browser developer tools",
    "WPAD/DHCP",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
