import type { LabManifest } from "../../types/manifest";

const lab: LabManifest = {
  schemaVersion: "1.1",
  id: "waf-rule-tuning",
  version: 1,
  title: "Tune Web Application Firewall Rules",
  tier: "advanced",
  track: "network-security",
  difficulty: "challenging",
  accessLevel: "premium",
  tags: ["waf", "web-security", "false-positive", "owasp", "modsecurity", "rule-tuning"],
  description:
    "Fine-tune WAF rules to reduce false positives while maintaining protection against OWASP Top 10 threats, balancing security posture with application availability.",
  estimatedMinutes: 20,
  learningObjectives: [
    "Analyze WAF alert logs to distinguish true positives from false positives",
    "Configure rule exceptions and threshold adjustments without weakening security coverage",
    "Tune detection sensitivity for SQL injection, XSS, and path traversal rules",
    "Balance anomaly scoring thresholds to minimize legitimate traffic blocking",
  ],
  sortOrder: 411,
  status: "published",
  prerequisites: [],
  rendererType: "toggle-config",
  scenarios: [
    {
      type: "toggle-config",
      id: "sqli-false-positives",
      title: "SQL Injection Rule False Positives on Search API",
      description:
        "The application team reports that the /api/search endpoint is returning 403 errors for legitimate queries containing technical terms like 'SELECT', 'DROP', and 'UNION'. The WAF is blocking these as SQL injection attempts. ModSecurity CRS Rule 942100 (SQL Injection Attack Detected via libinjection) is triggering on URL-encoded search parameters.",
      targetSystem: "ModSecurity CRS v3.3 - Production WAF",
      items: [
        {
          id: "rule-942100-action",
          label: "Rule 942100 (SQLi via libinjection)",
          detail: "Controls detection of SQL injection patterns via libinjection analysis. Currently blocking all matches globally.",
          currentState: "block",
          correctState: "detect-only",
          states: ["block", "detect-only", "disabled"],
          rationaleId: "rat-942100",
        },
        {
          id: "rule-942100-exclusion",
          label: "Path Exclusion for /api/search",
          detail: "Add URI-specific exclusion for Rule 942100 on the search endpoint while keeping it enforced on all other paths.",
          currentState: "disabled",
          correctState: "enabled",
          states: ["enabled", "disabled"],
          rationaleId: "rat-exclusion",
        },
        {
          id: "anomaly-sqli-threshold",
          label: "SQLi Anomaly Score Threshold",
          detail: "Inbound anomaly score threshold for SQL injection category. Lower values are more aggressive (block sooner).",
          currentState: "5",
          correctState: "10",
          states: ["5", "10", "15", "25"],
          rationaleId: "rat-threshold",
        },
        {
          id: "rule-942200-action",
          label: "Rule 942200 (SQLi Comment/Space Obfuscation)",
          detail: "Detects SQL injection using comment sequences and space obfuscation techniques.",
          currentState: "block",
          correctState: "block",
          states: ["block", "detect-only", "disabled"],
          rationaleId: "rat-942200",
        },
      ],
      rationales: [
        {
          id: "rat-942100",
          text: "Rule 942100 should be set to detect-only globally while the path exclusion handles the search endpoint. This provides a safety net during tuning - you can monitor global detections without blocking legitimate traffic, then re-enable blocking after confirming no other endpoints are affected.",
        },
        {
          id: "rat-exclusion",
          text: "A path-specific exclusion for /api/search is the surgical approach: it allows the search API to accept technical terms while keeping SQLi protection active on all login forms, admin panels, and other endpoints where SQL injection is a real risk.",
        },
        {
          id: "rat-threshold",
          text: "Raising the anomaly threshold from 5 to 10 requires multiple rule matches before blocking, which reduces single-rule false positives while still catching actual attack patterns that trigger multiple rules. A threshold of 15 or 25 would be too permissive.",
        },
        {
          id: "rat-942200",
          text: "Rule 942200 detects comment and space obfuscation techniques (e.g., /**/UNION/**/SELECT) that are strong indicators of actual attacks, not legitimate usage. This rule has a very low false positive rate and should remain in blocking mode.",
        },
      ],
      feedback: {
        perfect:
          "Excellent tuning. You created a targeted exclusion for the search endpoint, adjusted the anomaly threshold to require multiple signals, and preserved blocking on high-confidence rules like 942200.",
        partial:
          "Some rules are correctly configured, but the overall tuning still either blocks legitimate search traffic or leaves gaps in SQLi protection on critical endpoints.",
        wrong:
          "The goal is surgical precision: exclude the search path from the false-positive-prone rule, raise the anomaly threshold moderately, but keep high-confidence detection rules like comment obfuscation in blocking mode.",
      },
    },
    {
      type: "toggle-config",
      id: "xss-api-tuning",
      title: "XSS Rule Tuning for Rich Text Editor",
      description:
        "A CMS application uses a rich text editor that submits HTML content via POST to /api/content/save. The WAF is blocking legitimate content submissions containing HTML tags, inline styles, and JavaScript event handlers used by the editor. ModSecurity CRS XSS rules (941xxx series) are triggering on the request body.",
      targetSystem: "ModSecurity CRS v3.3 - Production WAF",
      items: [
        {
          id: "rule-941100-body",
          label: "Rule 941100 (XSS via libinjection) - Request Body",
          detail: "XSS detection on POST body content. Currently blocking all HTML-like content in request bodies.",
          currentState: "block",
          correctState: "block",
          states: ["block", "detect-only", "disabled"],
          rationaleId: "rat-941100-keep",
        },
        {
          id: "rule-941-arg-exclusion",
          label: "Argument Exclusion: 'content' param on /api/content/save",
          detail: "Exclude the 'content' POST parameter on the CMS save endpoint from XSS body rules (941xxx series only).",
          currentState: "disabled",
          correctState: "enabled",
          states: ["enabled", "disabled"],
          rationaleId: "rat-arg-exclude",
        },
        {
          id: "rule-941160-action",
          label: "Rule 941160 (NoScript XSS InjectionChecker)",
          detail: "Advanced XSS detection using the NoScript InjectionChecker engine. Has higher false positive rate with rich text content.",
          currentState: "block",
          correctState: "detect-only",
          states: ["block", "detect-only", "disabled"],
          rationaleId: "rat-941160",
        },
        {
          id: "response-body-scan",
          label: "Response Body XSS Scanning",
          detail: "Scan outbound response bodies for reflected XSS patterns. Detects XSS that bypasses input filters.",
          currentState: "disabled",
          correctState: "enabled",
          states: ["enabled", "disabled"],
          rationaleId: "rat-response-scan",
        },
      ],
      rationales: [
        {
          id: "rat-941100-keep",
          text: "Rule 941100 should remain in blocking mode globally. The argument exclusion for the 'content' parameter handles the CMS use case without disabling XSS protection across the entire application.",
        },
        {
          id: "rat-arg-exclude",
          text: "An argument-level exclusion is more precise than a path exclusion. Only the 'content' parameter on the specific CMS endpoint is excluded, so other parameters (e.g., title, author, metadata) remain protected against XSS.",
        },
        {
          id: "rat-941160",
          text: "Rule 941160's NoScript InjectionChecker produces high false positive rates on rich text with inline styles and event handler attributes. Setting it to detect-only allows monitoring without blocking while the argument exclusion handles the primary issue.",
        },
        {
          id: "rat-response-scan",
          text: "Enabling response body scanning adds a defense-in-depth layer. If a stored XSS payload bypasses input filtering and the argument exclusion, the WAF will detect it when the content is reflected back to users.",
        },
      ],
      feedback: {
        perfect:
          "Perfect configuration. You applied surgical argument-level exclusions, kept global XSS rules active, reduced the noisy NoScript rule to detect-only, and enabled response body scanning as defense-in-depth.",
        partial:
          "Some rules are correctly adjusted, but the configuration either over-excludes (disabling global rules) or misses the defense-in-depth opportunity of response body scanning.",
        wrong:
          "The approach should be: keep global XSS rules active, create a specific argument exclusion for the CMS content parameter, reduce the high-FP NoScript rule to detect-only, and enable response body scanning as a safety net.",
      },
    },
    {
      type: "toggle-config",
      id: "rate-limiting-tuning",
      title: "Rate Limiting and Bot Detection Thresholds",
      description:
        "The WAF is either allowing credential stuffing attacks through or blocking legitimate users during high-traffic events. Current rate limiting is too permissive for login endpoints and too aggressive for API endpoints. The security team needs you to tune the rate limiting and bot detection settings based on the following traffic analysis:\n\nLogin endpoint: Normal users ~3 req/min, attack patterns ~60+ req/min\nAPI endpoint: Normal apps ~120 req/min, peak legitimate ~200 req/min\nBot score threshold: Legitimate browsers 80-100, known bots 0-20, sophisticated bots 30-50",
      targetSystem: "ModSecurity CRS v3.3 + Custom Rate Limiting",
      items: [
        {
          id: "login-rate-limit",
          label: "Login Endpoint Rate Limit (/auth/login)",
          detail: "Maximum requests per minute per source IP to the login endpoint before triggering a block.",
          currentState: "30/min",
          correctState: "10/min",
          states: ["5/min", "10/min", "30/min", "60/min", "unlimited"],
          rationaleId: "rat-login-rate",
        },
        {
          id: "api-rate-limit",
          label: "API Endpoint Rate Limit (/api/*)",
          detail: "Maximum requests per minute per API key to general API endpoints.",
          currentState: "100/min",
          correctState: "250/min",
          states: ["50/min", "100/min", "250/min", "500/min", "unlimited"],
          rationaleId: "rat-api-rate",
        },
        {
          id: "bot-score-threshold",
          label: "Bot Detection Score Block Threshold",
          detail: "Requests with a bot score below this threshold are blocked. Scale: 0 (definitely bot) to 100 (definitely human).",
          currentState: "70",
          correctState: "40",
          states: ["20", "40", "50", "70", "90"],
          rationaleId: "rat-bot-score",
        },
        {
          id: "rate-limit-action",
          label: "Rate Limit Exceeded Action",
          detail: "Action taken when a client exceeds the rate limit. Challenge presents a CAPTCHA; block returns 429.",
          currentState: "block",
          correctState: "challenge",
          states: ["block", "challenge", "log-only"],
          rationaleId: "rat-challenge",
        },
      ],
      rationales: [
        {
          id: "rat-login-rate",
          text: "Normal users make ~3 requests/min to login. A limit of 10/min gives a 3x buffer for users who mistype passwords while being well below the 60+ req/min attack threshold. The current 30/min allows attackers to make 30 attempts before being rate-limited.",
        },
        {
          id: "rat-api-rate",
          text: "Legitimate API clients peak at 200 req/min. Setting the limit to 250/min provides headroom above peak legitimate usage without being wide open. The current 100/min is blocking legitimate applications during peak traffic.",
        },
        {
          id: "rat-bot-score",
          text: "With legitimate browsers scoring 80-100 and sophisticated bots scoring 30-50, a threshold of 40 blocks most bots while avoiding false positives on legitimate users. The current threshold of 70 is too aggressive and blocks some legitimate traffic with lower scores.",
        },
        {
          id: "rat-challenge",
          text: "Responding with a CAPTCHA challenge rather than a hard block allows legitimate users who hit the rate limit to prove they are human, reducing false positive lockouts while still stopping automated attacks.",
        },
      ],
      feedback: {
        perfect:
          "Outstanding. You tightened the login rate limit to catch credential stuffing, relaxed the API limit to accommodate peak traffic, calibrated the bot threshold between legitimate and bot score ranges, and used challenges instead of hard blocks.",
        partial:
          "Some thresholds are well-calibrated, but others still either allow attacks through or block legitimate traffic. Review the traffic analysis data for each endpoint carefully.",
        wrong:
          "Use the traffic analysis data to set each threshold: login rate should be between normal (3/min) and attack (60/min) traffic, API rate should exceed peak legitimate usage (200/min), and bot threshold should fall between bot (30-50) and human (80-100) score ranges.",
      },
    },
  ],
  hints: [
    "When tuning WAF rules, always prefer surgical exclusions (specific paths, arguments, or parameters) over disabling rules globally. A disabled rule protects no one.",
    "Anomaly scoring thresholds should require multiple rule hits before blocking. A single rule match on a legitimate request is common; multiple matches on the same request strongly suggest an actual attack.",
    "Rate limits should be set between the observed legitimate peak and the observed attack baseline, with a buffer above legitimate traffic to avoid false positives during usage spikes.",
  ],
  scoring: {
    maxScore: 100,
    hintPenalty: 5,
    penalties: { perfect: 0, partial: 10, wrong: 20 },
    passingThresholds: { pass: 80, partial: 50 },
  },
  careerInsight:
    "WAF tuning is one of the most in-demand skills for application security engineers. Organizations frequently deploy WAFs in detect-only mode because they lack engineers who can tune rules without breaking applications. Mastering this skill makes you invaluable during web application security assessments.",
  toolRelevance: [
    "ModSecurity",
    "AWS WAF",
    "Cloudflare WAF",
    "F5 Advanced WAF",
    "Imperva SecureSphere",
  ],
  createdAt: "2026-03-28",
  updatedAt: "2026-03-28",
};

export default lab;
