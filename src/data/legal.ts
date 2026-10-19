// ============================================================
// NetForge — Legal Text
// Privacy Policy, Terms of Service, Disclaimer
// Wiring pass (2026-10-19): privacy text updated for Phase 1
// cloud sync, following CloudForge's post-sync legal text —
// progress now backs up to Firebase under an anonymous ID,
// and purchases run through the shared Forge Labs Pro
// entitlement (the old one-time "Founders Pack" is retired).
// ============================================================

export const privacyPolicy = `NetForge Privacy Policy
Last updated: October 2026

1. Data Storage
NetForge stores progress data (completed labs, scores, streaks, XP) locally on your device and backs it up to Firebase (Google Cloud) so it can be restored if your device's local storage is cleared. Your progress backup is tied only to your anonymous user ID (see Section 2) — it contains your lab progress, scores, streaks, and XP, and no personal identity information.

2. Anonymous Authentication
We use Firebase Anonymous Authentication to generate a random user ID. No personal information (name, email, phone number) is collected or stored. This anonymous ID is not linked to your real-world identity. Because the anonymous ID is specific to your app installation, reinstalling the app creates a new ID and previously backed-up progress cannot be restored after a reinstall.

3. Purchase Data
If you subscribe to Forge Labs Pro (via a monthly subscription or yearly subscription), the transaction is processed by Google Play. RevenueCat, a third-party subscription management service, receives your anonymous user ID and purchase receipt from Google Play to verify your entitlement. RevenueCat does not receive your name, email, or payment details — those are handled directly by Google. We receive only your entitlement status through RevenueCat — never your payment details.

4. Analytics
Usage analytics (labs started, completed, session duration) are stored locally on your device for your personal review in the Usage Stats screen. The same events are also sent to Firebase under your anonymous user ID so we can understand how the app is used. They are not linked to your identity and are never sold.

5. Third-Party Services
- Firebase: Anonymous authentication, cloud progress backup, and usage analytics
- RevenueCat: Subscription management and purchase verification
- Google Play: Payment processing

6. Data Deletion
You can reset all progress from Settings > Reset Progress. This clears the data on your device and overwrites your cloud progress backup with a fresh start. Uninstalling the app removes all locally stored data.

7. Children's Privacy
NetForge is designed for users aged 18 and older. We do not knowingly collect data from children under 18.

8. Contact
Questions about this privacy policy can be directed to: conlan.dci@gmail.com`;

export const termsOfService = `NetForge Terms of Service
Last updated: October 2026

By using NetForge, you agree to the following terms:

1. Educational Purpose Only
NetForge provides simulated networking scenarios for educational and practice purposes only. It is not professional network engineering training, certification preparation, or a substitute for formal education.

2. No Certification Affiliation
NetForge is not affiliated with, endorsed by, or associated with Cisco, CompTIA, Juniper, or any certification body. References to networking concepts that overlap with certification domains are for educational context only.

3. No Guarantees
NetForge does not guarantee job placement, career advancement, salary outcomes, or networking competence. Performance in simulated scenarios does not constitute professional qualification.

4. Purchases
Premium labs are unlocked with a Forge Labs Pro subscription, offered in monthly and yearly plans and processed through Google Play. Current plan prices are shown in the app before you purchase. Your subscription renews automatically unless cancelled before the end of the current billing period. You can manage or cancel your subscription at any time in your Google Play account settings; you keep premium access until the end of the period already paid for. Refund requests should be directed to Google Play support per their refund policy.

5. Ethical Use
You agree not to apply techniques or concepts from NetForge scenarios to real systems, networks, or organizations without explicit authorization. NetForge scenarios are fictional and simplified for educational purposes.

6. Content Accuracy
Scenarios are designed to teach judgment principles and may be simplified from real-world complexity. Content is provided "as is" without warranty of accuracy, completeness, or fitness for any particular purpose.

7. Age Requirement
You must be 18 years of age or older to use NetForge.

8. Modifications
NetForge reserves the right to modify these terms at any time. Continued use after changes constitutes acceptance.

9. Contact
Questions about these terms can be directed to: conlan.dci@gmail.com`;

export const disclaimer = `NetForge Disclaimer

NetForge provides practice scenarios for network engineering judgment. It is not a replacement for formal networking training, certification programs, or professional advice.

Scenarios are simulated and simplified for educational purposes. Real-world networking incidents involve additional complexity, vendor-specific behavior, and organizational context not fully represented in these simulations.

The skills practiced in NetForge are meant to complement — not replace — formal training, hands-on lab experience, and professional mentorship.

Always follow your organization's network policies and change management procedures when making real network changes.`;
