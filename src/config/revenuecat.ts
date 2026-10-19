// ============================================================
// NetForge — RevenueCat Configuration
// Wiring pass (2026-10-19): re-pointed from the one-time
// "Founders Pack" model to the shared Forge Labs Pro
// entitlement + subscription, following CloudForge's config.
//
// The API key below is NetForge's own Google Play public key,
// from the NetForge app created in the existing Forge Labs
// RevenueCat project on 2026-10-18 (app id app2c2160fe88). It is
// app-specific — not a sibling's key. Still outstanding for
// launch (not needed for this config to be correct): create the
// Play Console subscription "netforge_pro" (RevenueCat will
// register it as "netforge_pro:<base-plan-id>"), attach it to
// Forge Labs Pro, and upload the Play service-account credentials
// to the RevenueCat app — all launch-time steps.
// ============================================================

/** Google Play public API key from RevenueCat dashboard (NetForge app) */
export const REVENUECAT_API_KEY = "goog_VUrYQRGTKFlZLemeGokeJacXceG";

/** RevenueCat entitlement identifier — shared across the Forge family.
 *  Exact string as configured in ThreatForge/TechForge/CloudForge and
 *  in the RevenueCat dashboard: "Forge Labs Pro" (case- and
 *  space-sensitive). */
export const ENTITLEMENT_ID = "Forge Labs Pro";

/** Google Play subscription product identifier (must match Play Console
 *  and the product attached to Forge Labs Pro in RevenueCat).
 *  Naming follows the family pattern: "<app>_pro"
 *  (CloudForge uses "cloudforge_pro"). Monthly/yearly are base
 *  plans on this one Play subscription product.
 *  VERIFY IN DASHBOARD: create/confirm this exact ID before launch. */
export const SUBSCRIPTION_ID = "netforge_pro";

/** Optional one-time lifetime product identifier, following the family
 *  pattern "<app>_lifetime" (CloudForge: "cloudforge_lifetime").
 *  NOT required for the subscription pivot and NOT used by NetForge's
 *  current purchase flow — create and attach it to Forge Labs Pro
 *  only if Kevin wants a lifetime SKU. */
export const LIFETIME_PRODUCT_ID = "netforge_lifetime";

/** Backwards-compatible alias: NetForge's existing usePurchase.ts
 *  imports PRODUCT_ID. It now points at the subscription product so
 *  this config is a true drop-in with no hook changes. (ThreatForge's
 *  hook instead takes a productId argument; mirror that refactor
 *  later if multiple products get separate buy buttons.) */
export const PRODUCT_ID = SUBSCRIPTION_ID;
