import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "smtp-relay-troubleshooting",
  version: 1,
  title: "SMTP Relay Troubleshooting",
  tier: "intermediate",
  track: "network-services",
  difficulty: "moderate",
  accessLevel: "free",
  tags: ["smtp", "email", "relay", "mx-records", "tls"],
  description:
    "Debug email relay problems including SMTP authentication failures, relay restrictions, DNS MX record issues, and TLS configuration.",
  estimatedMinutes: 12,
  learningObjectives: [
    "Diagnose SMTP relay rejection errors and open relay misconfiguration",
    "Verify DNS MX records and mail routing for email delivery",
    "Troubleshoot SMTP TLS negotiation and certificate issues",
  ],
  sortOrder: 508,
  status: "published",
  prerequisites: [],
  rendererType: "investigate-decide",
  scenarios: [
    {
      type: "investigate-decide",
      id: "smtp-001",
      title: "Outbound Email Relay Denied",
      objective:
        "Determine why the application server cannot send outbound emails through the corporate SMTP relay.",
      investigationData: [
        {
          id: "source-1",
          label: "Application SMTP Error Log",
          content:
            "2026-03-28 10:15:23 SMTP SEND FAILED\nServer: mail-relay.corp.local:25\nFrom: alerts@corp.example.com\nTo: admin@corp.example.com\nResponse: 550 5.7.1 Relaying denied. IP 10.1.5.80 is not authorized.\n\n2026-03-28 10:15:23 EHLO Response:\n250-mail-relay.corp.local\n250-AUTH LOGIN PLAIN\n250-STARTTLS\n250 OK",
          isCritical: true,
        },
        {
          id: "source-2",
          label: "SMTP Relay Configuration (Postfix)",
          content:
            "$ postconf | grep mynetworks\nmynetworks = 127.0.0.0/8, 10.1.1.0/24, 10.1.2.0/24\n\n$ postconf | grep relay\nsmtpd_relay_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination\n\nApplication server IP: 10.1.5.80\nApplication server subnet: 10.1.5.0/24",
          isCritical: true,
        },
        {
          id: "source-3",
          label: "Network Connectivity Test",
          content:
            "$ telnet mail-relay.corp.local 25\nConnected to mail-relay.corp.local.\n220 mail-relay.corp.local ESMTP Postfix\n\nEHLO appserver\n250-mail-relay.corp.local\n250-AUTH LOGIN PLAIN\n250-STARTTLS\n250 OK",
        },
      ],
      actions: [
        { id: "a1", label: "Add 10.1.5.0/24 to the mynetworks list on the relay", color: "green" },
        { id: "a2", label: "Configure SMTP authentication on the application server", color: "blue" },
        { id: "a3", label: "Disable relay restrictions on the mail server", color: "red" },
        { id: "a4", label: "Change the application to use port 587 instead of 25", color: "yellow" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The relay allows traffic from mynetworks (10.1.1.0/24 and 10.1.2.0/24) or SASL-authenticated clients. The application server at 10.1.5.80 is not in mynetworks and is not authenticating. Adding 10.1.5.0/24 to mynetworks is the simplest fix for an internal application server on a trusted network.",
        },
        {
          id: "r2",
          text: "Configuring SMTP authentication (SASL) on the application would also work, but for internal servers on trusted networks, mynetworks-based authorization is simpler and avoids credential management. Authentication is preferred for external or untrusted clients.",
        },
        {
          id: "r3",
          text: "Disabling relay restrictions would create an open relay, allowing anyone to send email through the server. This leads to the server being blacklisted for spam within hours.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The 550 5.7.1 error confirms the relay is rejecting the connection because 10.1.5.0/24 is not in mynetworks. Adding it to the trusted networks list authorizes the application server to relay.",
        partial:
          "The relay denies the connection because the app server IP is not authorized. Either adding it to mynetworks or configuring SASL authentication would work, but mynetworks is simpler for internal servers.",
        wrong:
          "The 550 5.7.1 error means the relay is rejecting traffic from 10.1.5.80 because it is not in the mynetworks list and is not authenticating. Add 10.1.5.0/24 to mynetworks to authorize it.",
      },
    },
    {
      type: "investigate-decide",
      id: "smtp-002",
      title: "Email Delivery to External Domain Failing",
      objective:
        "Determine why emails sent to partner@partner-company.com are bouncing while emails to all other external domains work correctly.",
      investigationData: [
        {
          id: "source-1",
          label: "Bounce Message",
          content:
            "From: MAILER-DAEMON@corp.example.com\nSubject: Returned mail: Host unknown\n\nThe following message could not be delivered:\nHost or domain name not found. Name service error for\nname=partner-company.com type=MX: Host not found, try again\n\nDiagnostic-Code: smtp; 450 4.1.2 partner-company.com: Recipient address rejected: Domain not found",
          isCritical: true,
        },
        {
          id: "source-2",
          label: "DNS Resolution Tests",
          content:
            "$ dig MX partner-company.com @10.0.1.10\n;; ANSWER SECTION:\n(empty - no MX records returned)\n\n$ dig MX partner-company.com @8.8.8.8\n;; ANSWER SECTION:\npartner-company.com.  300  IN  MX  10  mail.partner-company.com.\n\n$ dig A mail.partner-company.com @8.8.8.8\nmail.partner-company.com.  300  IN  A  198.51.100.25",
          isCritical: true,
        },
        {
          id: "source-3",
          label: "Mail Server DNS Configuration",
          content:
            "$ postconf | grep relayhost\nrelayhost =\n\n$ cat /etc/resolv.conf\nnameserver 10.0.1.10\nnameserver 10.0.1.11\n\nThe internal DNS server at 10.0.1.10 does not forward queries for partner-company.com correctly.",
        },
      ],
      actions: [
        { id: "a1", label: "Fix the internal DNS forwarder configuration for external domains", color: "green" },
        { id: "a2", label: "Add a static MX record for partner-company.com on the internal DNS", color: "blue" },
        { id: "a3", label: "Configure the mail server to use public DNS directly", color: "yellow" },
        { id: "a4", label: "Set up a smart host relay to the partner's mail server", color: "orange" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The internal DNS server (10.0.1.10) cannot resolve the MX record for partner-company.com, but Google's public DNS (8.8.8.8) resolves it correctly. This indicates the internal DNS forwarder is not properly forwarding or caching external queries for this domain. Fixing the DNS forwarder resolves the issue for all affected domains.",
        },
        {
          id: "r2",
          text: "Adding a static MX record on the internal DNS is a workaround that does not address the root cause. If other external domains are affected by the forwarder issue, each would need a manual static record, which does not scale.",
        },
        {
          id: "r3",
          text: "Pointing the mail server directly at public DNS bypasses internal DNS policies, split-horizon DNS, and may break resolution of internal hostnames that the mail server needs.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Excellent! The key evidence is that the internal DNS fails to resolve the MX record while public DNS succeeds. Fixing the DNS forwarder configuration is the root-cause solution.",
        partial:
          "The DNS resolution difference between internal and public DNS is the critical clue. The internal forwarder needs to be fixed so it correctly resolves external MX records.",
        wrong:
          "Compare the two dig queries: internal DNS returns no MX records while public DNS returns the correct record. The internal DNS forwarder is the root cause and needs to be fixed.",
      },
    },
    {
      type: "investigate-decide",
      id: "smtp-003",
      title: "SMTP TLS Negotiation Failure",
      objective:
        "Determine why the mail server cannot establish TLS connections with a specific recipient domain, causing emails to be queued indefinitely.",
      investigationData: [
        {
          id: "source-1",
          label: "Mail Queue Entry",
          content:
            "$ postqueue -p\n-Queue ID-  --Size-- ----Arrival Time---- -Sender/Recipient---\nAB12CD3456   4521 Sat Mar 28 08:00:00  sender@corp.example.com\n(TLS connection failed: certificate verify failed)\n                                        recipient@secure-bank.com\n\n$ postconf | grep smtp_tls\nsmtp_tls_security_level = verify\nsmtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt\nsmtp_tls_mandatory_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1",
          isCritical: true,
        },
        {
          id: "source-2",
          label: "TLS Connection Test",
          content:
            "$ openssl s_client -connect mail.secure-bank.com:25 -starttls smtp\nVerify return code: 10 (certificate has expired)\n---\nCertificate chain:\n  0 s:CN = mail.secure-bank.com\n    i:CN = DigiCert SHA2 Extended Validation Server CA\n    Not After : Mar 15 00:00:00 2026 GMT\n---\nSSL-Session:\n    Protocol  : TLSv1.2\n    Cipher    : ECDHE-RSA-AES256-GCM-SHA384",
          isCritical: true,
        },
        {
          id: "source-3",
          label: "Mail Log Detail",
          content:
            "Mar 28 08:00:01 mailsrv postfix/smtp[12345]: AB12CD3456: to=<recipient@secure-bank.com>, relay=mail.secure-bank.com[198.51.100.50]:25, status=deferred (TLS certificate verification failed for mail.secure-bank.com: certificate has expired)",
        },
      ],
      actions: [
        { id: "a1", label: "Downgrade TLS security level to 'may' (opportunistic) temporarily", color: "green" },
        { id: "a2", label: "Update the CA certificate bundle on the mail server", color: "yellow" },
        { id: "a3", label: "Disable TLS entirely to deliver the queued emails", color: "red" },
        { id: "a4", label: "Contact secure-bank.com to renew their expired certificate", color: "blue" },
      ],
      correctActionId: "a1",
      rationales: [
        {
          id: "r1",
          text: "The recipient's mail server has an expired certificate (expired March 15, 2026). The local mail server is set to 'verify' mode, which enforces certificate validation. Temporarily downgrading to 'may' (opportunistic TLS) allows the email to be delivered with encryption but without strict certificate verification, while the recipient fixes their certificate.",
        },
        {
          id: "r2",
          text: "Updating the local CA bundle would not help because the issue is not a missing CA - it is an expired certificate on the remote server. The certificate was valid but expired on March 15, 2026.",
        },
        {
          id: "r3",
          text: "Contacting the recipient domain to renew their certificate is the long-term fix but does not resolve the immediate delivery issue. Emails will remain queued until the certificate is renewed.",
        },
      ],
      correctRationaleId: "r1",
      feedback: {
        perfect:
          "Correct! The remote server's certificate expired March 15. Temporarily setting smtp_tls_security_level=may allows delivery with opportunistic encryption while the recipient renews their certificate.",
        partial:
          "The expired certificate on the remote server causes the verification failure. The immediate fix is to relax TLS verification from 'verify' to 'may' for delivery, then contact the recipient about renewal.",
        wrong:
          "The certificate expired on March 15, 2026 (verify code 10). Since this is the remote server's issue, temporarily set smtp_tls_security_level=may to deliver with opportunistic TLS while the recipient renews.",
      },
    },
  ],
  hints: [
    "The SMTP 550 5.7.1 error means the relay is denying the connection. Check mynetworks and authentication settings in Postfix configuration.",
    "When email bounces with 'Host not found' for MX records, compare DNS resolution between internal and public DNS servers to isolate the failure.",
    "TLS certificate verification failures can be caused by expired certificates on the remote server. Check the 'Not After' date in the certificate chain.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "Email is still a critical business service and SMTP troubleshooting is a core skill for system and network administrators. Understanding relay configuration, DNS MX records, and TLS is essential for maintaining mail flow.",
  toolRelevance: [
    "postconf",
    "postqueue",
    "dig MX",
    "openssl s_client",
    "telnet port 25",
    "mail server logs",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
