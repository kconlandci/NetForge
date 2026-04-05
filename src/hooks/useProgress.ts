// ============================================================
// NetForge — Progress Persistence Hook
// Reads/writes progress to localStorage + Capacitor Preferences backup.
// ============================================================

import { useState, useCallback, useEffect, useRef } from "react";
import { App as CapApp } from "@capacitor/app";
import { Preferences } from "@capacitor/preferences";
import { z } from "zod/v4";
import { getLocalDateString } from "../utils/localDate";

const ScenarioResultSchema = z.object({
  scenarioIndex: z.number().int().min(0),
  grade: z.enum(["perfect", "partial", "wrong"]),
});

const LabProgressSchema = z.object({
  labId: z.string(),
  completed: z.boolean(),
  bestScore: z.number().min(0).default(0),
  attempts: z.number().int().min(0).default(1),
  lastAttemptDate: z.string(),
  completedAt: z.number().default(0),
  scenarioResults: z.array(ScenarioResultSchema).default([]),
});

const XpHistoryEntrySchema = z.object({
  date: z.string(),
  amount: z.number(),
  labId: z.string(),
});

const NetForgeProgressSchema = z.object({
  schemaVersion: z.number().int().min(0),
  userId: z.string().nullable().default(null),
  labs: z.record(z.string(), LabProgressSchema).default({}),
  xp: z.number().min(0).default(0),
  xpHistory: z.array(XpHistoryEntrySchema).default([]),
  streakDays: z.number().int().min(0).default(0),
  longestStreak: z.number().int().min(0).default(0),
  lastLabDate: z.string().nullable().default(null),
  judgmentTags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type ScenarioResult = z.infer<typeof ScenarioResultSchema>;
type LabProgress = z.infer<typeof LabProgressSchema>;
type NetForgeProgress = z.infer<typeof NetForgeProgressSchema>;

const STORAGE_KEY = "netforge_progress";
const PREFS_KEY = "netforge_progress";
const CURRENT_SCHEMA_VERSION = 2;

function getToday(): string {
  return getLocalDateString();
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

function createDefaultProgress(): NetForgeProgress {
  const now = new Date().toISOString();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    userId: null,
    labs: {},
    xp: 0,
    xpHistory: [],
    streakDays: 0,
    longestStreak: 0,
    lastLabDate: null,
    judgmentTags: [],
    createdAt: now,
    updatedAt: now,
  };
}

function validateProgressShape(data: unknown): NetForgeProgress | null {
  const result = NetForgeProgressSchema.safeParse(data);
  if (result.success) return result.data;
  console.warn("[NetForge] Progress validation failed:", result.error.message);
  return null;
}

function migrateProgress(data: NetForgeProgress): NetForgeProgress {
  const version = data.schemaVersion || 0;

  if (version < 1) {
    for (const labId of Object.keys(data.labs)) {
      if (data.labs[labId] && typeof data.labs[labId].completedAt !== "number") {
        data.labs[labId].completedAt = 0;
      }
    }
    data.schemaVersion = 1;
  }

  if (version < 2) {
    if (!data.userId) {
      data.userId = null;
    }
    data.schemaVersion = 2;
  }

  return data;
}

function loadProgress(): NetForgeProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = validateProgressShape(parsed);
      if (!validated) {
        console.warn("[NetForge] Progress data failed validation — resetting.");
        return createDefaultProgress();
      }
      const migrated = migrateProgress(validated);
      if ((validated.schemaVersion || 0) < CURRENT_SCHEMA_VERSION) {
        saveProgress(migrated);
      }
      return migrated;
    }
  } catch {
    // corrupted data — reset
  }
  return createDefaultProgress();
}

function saveProgress(progress: NetForgeProgress) {
  progress.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("[NetForge] Failed to save progress:", error);
    try {
      const minimal = {
        ...progress,
        xpHistory: progress.xpHistory.slice(-50),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
    } catch {
      console.error("[NetForge] Even minimal save failed. Progress may be lost.");
    }
  }
}

function mirrorToPreferences(progress: NetForgeProgress) {
  Preferences.set({
    key: PREFS_KEY,
    value: JSON.stringify(progress),
  }).catch((err) => {
    console.warn("[NetForge] Failed to mirror progress to Preferences:", err);
  });
}

async function recoverFromPreferences(): Promise<NetForgeProgress | null> {
  try {
    const { value } = await Preferences.get({ key: PREFS_KEY });
    if (value) {
      const parsed = JSON.parse(value);
      const validated = validateProgressShape(parsed);
      if (validated) {
        const migrated = migrateProgress(validated);
        console.info("[NetForge] Recovered progress from Preferences backup.");
        return migrated;
      }
    }
  } catch {
    // Preferences unavailable or corrupted
  }
  return null;
}

export function useProgress(userId?: string | null) {
  const [progress, setProgress] = useState<NetForgeProgress>(loadProgress);
  const hasAttemptedRecovery = useRef(false);

  useEffect(() => {
    if (hasAttemptedRecovery.current) return;
    hasAttemptedRecovery.current = true;

    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) {
      recoverFromPreferences().then((recovered) => {
        if (recovered) {
          saveProgress(recovered);
          setProgress(recovered);
        }
      });
    }
  }, []);

  useEffect(() => {
    const listener = CapApp.addListener("pause", () => {
      const current = loadProgress();
      saveProgress(current);
      mirrorToPreferences(current);
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

  const recordLabCompletion = useCallback(
    (labId: string, score: number, scenarioResults: ScenarioResult[]) => {
      setProgress((prev) => {
        const next = { ...prev, labs: { ...prev.labs } };
        const today = getToday();

        if (userId && !next.userId) {
          next.userId = userId;
        }

        const existing = next.labs[labId];
        next.labs[labId] = {
          labId,
          completed: true,
          bestScore: existing ? Math.max(existing.bestScore, score) : score,
          attempts: existing ? existing.attempts + 1 : 1,
          lastAttemptDate: today,
          completedAt: Date.now(),
          scenarioResults,
        };

        const xpGain = 100 + Math.min(Math.round(score / 2), 50);
        next.xp = (next.xp || 0) + xpGain;
        next.xpHistory = [
          ...(next.xpHistory || []),
          { date: today, amount: xpGain, labId },
        ];

        if (next.lastLabDate === today) {
          // Already counted today
        } else if (next.lastLabDate === getYesterday()) {
          next.streakDays = (next.streakDays || 0) + 1;
        } else {
          next.streakDays = 1;
        }
        next.lastLabDate = today;
        next.longestStreak = Math.max(
          next.longestStreak || 0,
          next.streakDays || 0
        );

        saveProgress(next);
        mirrorToPreferences(next);
        return next;
      });
    },
    [userId]
  );

  const getLabProgress = useCallback(
    (labId: string): LabProgress | undefined => {
      return progress.labs[labId];
    },
    [progress]
  );

  const isLabCompleted = useCallback(
    (labId: string): boolean => {
      return progress.labs[labId]?.completed ?? false;
    },
    [progress]
  );

  const getTotalCompleted = useCallback((): number => {
    return Object.values(progress.labs).filter((l) => l.completed).length;
  }, [progress]);

  const resetProgress = useCallback(() => {
    const fresh = createDefaultProgress();
    saveProgress(fresh);
    mirrorToPreferences(fresh);
    setProgress(fresh);
  }, []);

  return {
    progress,
    recordLabCompletion,
    getLabProgress,
    isLabCompleted,
    getTotalCompleted,
    resetProgress,
  };
}

export type { NetForgeProgress, LabProgress, ScenarioResult };
