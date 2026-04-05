// ============================================================
// NetForge — In-App Review Hook
// Triggers native Android review dialog after 3rd lab completion.
// ============================================================

import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { InAppReview } from "@capacitor-community/in-app-review";

const REVIEW_PROMPTED_KEY = "netforge_review_prompted";
const LABS_BEFORE_REVIEW = 3;

export function useAppReview() {
  const maybeRequestReview = useCallback(async (totalCompleted: number) => {
    if (totalCompleted < LABS_BEFORE_REVIEW) return;
    if (localStorage.getItem(REVIEW_PROMPTED_KEY)) return;

    localStorage.setItem(REVIEW_PROMPTED_KEY, "1");

    if (!Capacitor.isNativePlatform()) return;

    try {
      await InAppReview.requestReview();
    } catch (e) {
      console.warn("[NetForge] In-app review request failed:", e);
    }
  }, []);

  return { maybeRequestReview };
}
