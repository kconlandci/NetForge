// ============================================================
// NetForge — Purchase Hook
// Handles purchasing the Founders Pack via RevenueCat
// ============================================================

import { useState, useCallback } from "react";
import { Purchases } from "@revenuecat/purchases-capacitor";
import { PRODUCT_ID, ENTITLEMENT_ID } from "../config/revenuecat";
import { setPremiumStatus } from "./usePremiumStatus";

export type PurchaseError =
  | "cancelled"
  | "already_owned"
  | "network"
  | "unknown";

interface PurchaseResult {
  success: boolean;
  error?: PurchaseError;
}

interface UsePurchase {
  purchase: () => Promise<PurchaseResult>;
  restore: () => Promise<PurchaseResult>;
  isPurchasing: boolean;
  isRestoring: boolean;
}

export function usePurchase(uid?: string | null): UsePurchase {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const purchase = useCallback(async (): Promise<PurchaseResult> => {
    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchaseStoreProduct({
        product: {
          identifier: PRODUCT_ID,
        } as never,
      });

      const isPremium =
        customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

      if (isPremium) {
        await setPremiumStatus(true, uid);
        return { success: true };
      }

      return { success: false, error: "unknown" };
    } catch (err: unknown) {
      if (err != null && typeof err === "object") {
        const error = err as Record<string, unknown>;
        if (error.userCancelled === true || error.code === "1") {
          return { success: false, error: "cancelled" };
        }
        if (error.code === "7") {
          await setPremiumStatus(true, uid);
          return { success: true, error: "already_owned" };
        }
      }

      console.error("[NetForge] Purchase failed:", err);
      return { success: false, error: "network" };
    } finally {
      setIsPurchasing(false);
    }
  }, [uid]);

  const restore = useCallback(async (): Promise<PurchaseResult> => {
    setIsRestoring(true);
    try {
      const { customerInfo } = await Purchases.restorePurchases();
      const isPremium =
        customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

      if (isPremium) {
        await setPremiumStatus(true, uid);
        return { success: true };
      }

      // No active entitlement — clear local premium cache (handles refunds)
      await setPremiumStatus(false, uid);
      return { success: false, error: "unknown" };
    } catch (err) {
      console.error("[NetForge] Restore failed:", err);
      return { success: false, error: "network" };
    } finally {
      setIsRestoring(false);
    }
  }, [uid]);

  return { purchase, restore, isPurchasing, isRestoring };
}
