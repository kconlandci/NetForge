// ============================================================
// NetForge — Premium Status Hook
// RevenueCat as source of truth, Preferences cache fallback
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { Preferences } from "@capacitor/preferences";
import { Purchases } from "@revenuecat/purchases-capacitor";
import { ENTITLEMENT_ID } from "../config/revenuecat";
import { useRevenueCatReady } from "../App";

const PREMIUM_KEY_PREFIX = "netforge_is_premium";
const PREMIUM_CACHE_TIME_PREFIX = "netforge_premium_cache_time";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7-day offline grace period

function prefixedKey(base: string, uid: string | null): string {
  return uid ? `${base}_${uid}` : base;
}

interface PremiumStatus {
  isPremium: boolean;
  isLoading: boolean;
  refreshPremiumStatus: () => Promise<void>;
}

async function checkRevenueCat(): Promise<boolean | null> {
  try {
    const { isConfigured } = await Purchases.isConfigured();
    if (!isConfigured) return null;
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return null;
  }
}

async function readCache(uid: string | null): Promise<boolean> {
  try {
    const premiumKey = prefixedKey(PREMIUM_KEY_PREFIX, uid);
    const cacheTimeKey = prefixedKey(PREMIUM_CACHE_TIME_PREFIX, uid);
    const { value: premiumValue } = await Preferences.get({ key: premiumKey });
    const { value: cacheTimeValue } = await Preferences.get({ key: cacheTimeKey });

    if (premiumValue !== "true") return false;

    const cacheTime = cacheTimeValue ? parseInt(cacheTimeValue, 10) : 0;
    const isExpired = Date.now() - cacheTime > CACHE_TTL_MS;

    if (isExpired) {
      console.warn("[NetForge] Premium cache expired — treating as non-premium until verified.");
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function usePremiumStatus(uid?: string | null): PremiumStatus {
  const isRevenueCatReady = useRevenueCatReady();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkPremiumStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const rcResult = await checkRevenueCat();

      if (rcResult !== null) {
        setIsPremium(rcResult);
        await setPremiumStatus(rcResult, uid ?? null);
        return;
      }

      console.warn("[NetForge] RevenueCat unreachable, falling back to cache.");
      const cached = await readCache(uid ?? null);
      setIsPremium(cached);
    } catch (error) {
      console.error("[NetForge] Failed to check premium status:", error);
      const cached = await readCache(uid ?? null);
      setIsPremium(cached);
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (!isRevenueCatReady) return;
    checkPremiumStatus();
  }, [isRevenueCatReady, checkPremiumStatus]);

  return { isPremium, isLoading: isLoading || !isRevenueCatReady, refreshPremiumStatus: checkPremiumStatus };
}

export async function setPremiumStatus(isPremium: boolean, uid?: string | null): Promise<void> {
  const premiumKey = prefixedKey(PREMIUM_KEY_PREFIX, uid ?? null);
  const cacheTimeKey = prefixedKey(PREMIUM_CACHE_TIME_PREFIX, uid ?? null);
  await Preferences.set({ key: premiumKey, value: isPremium ? "true" : "false" });
  await Preferences.set({ key: cacheTimeKey, value: Date.now().toString() });
}
