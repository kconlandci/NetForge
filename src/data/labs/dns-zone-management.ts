import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "dns-zone-management",
  version: 1,
  title: "DNS Zone Management",
  tier: "beginner",
  track: "network-services",
  difficulty: "easy",
  accessLevel: "free",
  tags: ["dns", "zones", "forward-lookup", "reverse-lookup", "records"],
  description:
    "Manage DNS forward and reverse lookup zones, including SOA records, A records, PTR records, and zone transfer settings.",
  estimatedMinutes: 10,
  learningObjectives: [
    "Configure forward and reverse DNS zones with correct SOA parameters",
    "Create and manage A, AAAA, CNAME, and PTR records",
    "Set up zone transfers between primary and secondary DNS servers",
  ],
  sortOrder: 501,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "dns-001",
      title: "Forward Zone Record Configuration",
      description:
        "The company has registered corp.example.com and needs DNS records configured on the BIND server. The web server is at 203.0.113.10, the mail server is at 203.0.113.20, and a new CNAME is needed for 'www' pointing to the web server.\n\n$ cat /etc/bind/zones/db.corp.example.com\n$TTL 86400\n@   IN  SOA  ns1.corp.example.com. admin.corp.example.com. (\n        2024010101  ; Serial\n        3600        ; Refresh\n        900         ; Retry\n        604800      ; Expire\n        86400       ; Minimum TTL\n)\n@       IN  NS   ns1.corp.example.com.\nns1     IN  A    203.0.113.2\nweb     IN  A    203.0.113.10\nmail    IN  A    203.0.113.20\nwww     IN  A    203.0.113.10",
      targetSystem: "BIND DNS Server (named)",
      items: [
        {
          id: "item-1",
          label: "WWW Record Type",
          detail: "DNS record for www.corp.example.com",
          currentState: "A record (203.0.113.10)",
          correctState: "CNAME record (web.corp.example.com)",
          states: [
            "A record (203.0.113.10)",
            "CNAME record (web.corp.example.com)",
            "AAAA record (::1)",
            "MX record (mail.corp.example.com)",
          ],
          rationaleId: "rat-1",
        },
        {
          id: "item-2",
          label: "MX Record",
          detail: "Mail exchanger record for incoming email",
          currentState: "Not configured",
          correctState: "MX 10 mail.corp.example.com",
          states: [
            "Not configured",
            "MX 10 mail.corp.example.com",
            "MX 10 203.0.113.20",
            "CNAME mail.corp.example.com",
          ],
          rationaleId: "rat-2",
        },
        {
          id: "item-3",
          label: "SOA Serial Number",
          detail: "Zone serial number after making record changes",
          currentState: "2024010101",
          correctState: "2024010102 (incremented)",
          states: [
            "2024010101",
            "2024010102 (incremented)",
            "1 (reset)",
            "2024010101 (unchanged)",
          ],
          rationaleId: "rat-3",
        },
      ],
      rationales: [
        {
          id: "rat-1",
          text: "The www record should be a CNAME pointing to web.corp.example.com rather than a duplicate A record. If the web server IP changes, only the A record for 'web' needs updating, and the CNAME follows automatically.",
        },
        {
          id: "rat-2",
          text: "An MX record must point to a hostname (not an IP address) per RFC 2181. The priority value (10) establishes the preference order when multiple mail servers exist. Without an MX record, email delivery to the domain will fail.",
        },
        {
          id: "rat-3",
          text: "The SOA serial must be incremented after any zone change so secondary DNS servers detect the update during zone transfers. An unchanged serial means secondaries will not pull the new records.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! You correctly used a CNAME for www, added a proper MX record with a hostname target, and incremented the SOA serial to trigger zone transfers.",
        partial:
          "Some records need correction. Remember: www should be a CNAME for maintainability, MX records must point to hostnames (not IPs), and the serial must increment for changes to propagate.",
        wrong:
          "Review DNS record best practices: use CNAMEs for aliases, MX records must reference hostnames per RFC 2181, and always increment the SOA serial after zone modifications.",
      },
    },
    {
      type: "toggle-config",
      id: "dns-002",
      title: "Reverse DNS Zone Setup",
      description:
        "The ISP requires properly configured reverse DNS (PTR records) for the mail server to pass SPF/DKIM checks. The subnet 203.0.113.0/24 needs a reverse zone. Currently, reverse lookups for the mail server fail:\n\n$ nslookup 203.0.113.20\nServer:  ns1.corp.example.com\nAddress: 203.0.113.2\n\n*** ns1.corp.example.com can't find 20.113.0.203.in-addr.arpa: Non-existent domain\n\n$ cat /etc/bind/named.conf.local\nzone \"corp.example.com\" {\n    type master;\n    file \"/etc/bind/zones/db.corp.example.com\";\n};",
      targetSystem: "BIND DNS Server (named.conf)",
      items: [
        {
          id: "item-1",
          label: "Reverse Zone Declaration",
          detail: "Reverse lookup zone in named.conf.local",
          currentState: "Not configured",
          correctState: "zone 113.0.203.in-addr.arpa configured",
          states: [
            "Not configured",
            "zone 113.0.203.in-addr.arpa configured",
            "zone 203.0.113.in-addr.arpa configured",
            "zone 0.113.203.in-addr.arpa configured",
          ],
          rationaleId: "rat-1",
        },
        {
          id: "item-2",
          label: "Mail Server PTR Record",
          detail: "PTR record mapping 203.0.113.20 to hostname",
          currentState: "Not configured",
          correctState: "20 IN PTR mail.corp.example.com.",
          states: [
            "Not configured",
            "20 IN PTR mail.corp.example.com.",
            "20 IN A mail.corp.example.com.",
            "203.0.113.20 IN PTR mail",
          ],
          rationaleId: "rat-2",
        },
        {
          id: "item-3",
          label: "PTR Record FQDN Trailing Dot",
          detail: "Fully qualified domain name format in PTR record",
          currentState: "No trailing dot",
          correctState: "Trailing dot present (mail.corp.example.com.)",
          states: [
            "No trailing dot",
            "Trailing dot present (mail.corp.example.com.)",
          ],
          rationaleId: "rat-3",
        },
      ],
      rationales: [
        {
          id: "rat-1",
          text: "Reverse DNS zones use the in-addr.arpa domain with octets reversed. For subnet 203.0.113.0/24, the zone name is 113.0.203.in-addr.arpa (the network octets in reverse order, excluding the host octet).",
        },
        {
          id: "rat-2",
          text: "The PTR record maps the host portion of the IP address (20) to the fully qualified hostname. This reverse mapping is checked by mail servers performing anti-spam validation to verify the sending server's identity.",
        },
        {
          id: "rat-3",
          text: "In BIND zone files, hostnames in PTR records must end with a trailing dot to indicate an absolute FQDN. Without the dot, BIND appends the zone origin, resulting in mail.corp.example.com.113.0.203.in-addr.arpa.",
        },
      ],
      feedback: {
        perfect:
          "Perfect! You configured the reverse zone with the correct in-addr.arpa name, added the PTR record for the mail server, and included the trailing dot for the FQDN.",
        partial:
          "Close, but review the reverse zone name format (octets reversed) and ensure PTR records use the trailing dot to prevent BIND from appending the zone origin.",
        wrong:
          "Reverse DNS requires: the zone named 113.0.203.in-addr.arpa (octets reversed), a PTR record for host 20 pointing to the FQDN with a trailing dot, and proper zone file syntax.",
      },
    },
    {
      type: "toggle-config",
      id: "dns-003",
      title: "Zone Transfer Security",
      description:
        "A security audit found that the primary DNS server allows zone transfers to any host. This exposes the entire DNS zone contents to potential attackers. Zone transfers should be restricted to the secondary DNS server at 203.0.113.3 only.\n\n$ dig @ns1.corp.example.com corp.example.com AXFR\n; <<>> DiG AXFR corp.example.com @ns1.corp.example.com\ncorp.example.com.  86400  IN  SOA  ns1.corp.example.com. ...\ncorp.example.com.  86400  IN  NS   ns1.corp.example.com.\ncorp.example.com.  86400  IN  NS   ns2.corp.example.com.\n;; XFR size: 12 records\n\n$ cat /etc/bind/named.conf.local | grep -A5 'zone \"corp'\nzone \"corp.example.com\" {\n    type master;\n    file \"/etc/bind/zones/db.corp.example.com\";\n    allow-transfer { any; };\n};",
      targetSystem: "BIND DNS Server (named.conf)",
      items: [
        {
          id: "item-1",
          label: "allow-transfer ACL",
          detail: "Hosts permitted to perform zone transfers",
          currentState: "any (unrestricted)",
          correctState: "203.0.113.3 only (secondary NS)",
          states: [
            "any (unrestricted)",
            "203.0.113.3 only (secondary NS)",
            "none (disabled)",
            "localhost only",
          ],
          rationaleId: "rat-1",
        },
        {
          id: "item-2",
          label: "also-notify Directive",
          detail: "Push notifications to secondary on zone changes",
          currentState: "Not configured",
          correctState: "also-notify { 203.0.113.3; }",
          states: [
            "Not configured",
            "also-notify { 203.0.113.3; }",
            "also-notify { any; }",
            "notify no",
          ],
          rationaleId: "rat-2",
        },
        {
          id: "item-3",
          label: "TSIG Authentication",
          detail: "Transaction signature for zone transfer authentication",
          currentState: "Not configured",
          correctState: "TSIG key configured for transfers",
          states: [
            "Not configured",
            "TSIG key configured for transfers",
            "IP-based only",
            "SSL/TLS encryption",
          ],
          rationaleId: "rat-3",
        },
      ],
      rationales: [
        {
          id: "rat-1",
          text: "Restricting allow-transfer to only the secondary DNS server (203.0.113.3) prevents unauthorized zone transfers. Unrestricted AXFR allows attackers to enumerate all hostnames and IP addresses in the zone for reconnaissance.",
        },
        {
          id: "rat-2",
          text: "The also-notify directive sends a DNS NOTIFY message to the secondary whenever the zone changes, triggering an immediate zone transfer instead of waiting for the SOA refresh interval. This keeps secondaries up to date.",
        },
        {
          id: "rat-3",
          text: "TSIG (Transaction Signature) adds cryptographic authentication to zone transfers. Even if an attacker spoofs the secondary's IP address, they cannot complete the transfer without the shared TSIG key.",
        },
      ],
      feedback: {
        perfect:
          "Excellent! You locked down zone transfers to the secondary only, configured NOTIFY for fast propagation, and added TSIG authentication for defense in depth.",
        partial:
          "Some improvements are correct, but full zone transfer security requires all three: IP-based ACL restriction, NOTIFY for timely updates, and TSIG for cryptographic authentication.",
        wrong:
          "Zone transfer security needs: allow-transfer restricted to 203.0.113.3, also-notify for push updates, and TSIG keys for authenticated transfers. Leaving 'any' exposes your entire DNS infrastructure.",
      },
    },
  ],
  hints: [
    "DNS zone files require the SOA serial to be incremented after any record change for secondary servers to detect updates.",
    "Reverse DNS zones use in-addr.arpa with octets in reverse order. PTR records must include the trailing dot on FQDNs.",
    "Zone transfers should be restricted by IP with allow-transfer and authenticated with TSIG keys to prevent DNS reconnaissance.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "DNS is often called the backbone of the internet. Misconfigured zones cause widespread outages, and unsecured zone transfers are a top finding in penetration tests. DNS expertise is highly valued in both operations and security roles.",
  toolRelevance: [
    "BIND named",
    "nslookup",
    "dig",
    "named-checkzone",
    "named-checkconf",
    "rndc reload",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
