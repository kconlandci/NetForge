import { useMemo } from "react";
import { labCatalog } from "../data/catalog";
import { learningPaths } from "../data/paths";
import type { LabManifest } from "../types/manifest";

interface Recommendation {
  lab: LabManifest;
  reason: string;
  pathId?: string;
}

export function useRecommendedLab(
  completedLabId: string,
  completedLabIds: string[]
): Recommendation | null {
  return useMemo(() => {
    const containingPaths = learningPaths.filter((p) =>
      p.labIds.includes(completedLabId)
    );

    for (const path of containingPaths) {
      const nextLabId = path.labIds.find(
        (id) => !completedLabIds.includes(id)
      );
      if (nextLabId) {
        const lab = labCatalog.find((l) => l.id === nextLabId);
        if (lab) {
          return {
            lab,
            reason: `Next in ${path.name}`,
            pathId: path.id,
          };
        }
      }
    }

    const completedLab = labCatalog.find((l) => l.id === completedLabId);
    if (completedLab) {
      const sameDifficulty = labCatalog.find(
        (l) =>
          l.difficulty === completedLab.difficulty &&
          !completedLabIds.includes(l.id) &&
          l.status === "published"
      );
      if (sameDifficulty) {
        return {
          lab: sameDifficulty,
          reason: `Another ${sameDifficulty.difficulty} lab`,
        };
      }
    }

    const difficultyOrder = ["easy", "moderate", "challenging"];
    const currentIdx = completedLab
      ? difficultyOrder.indexOf(completedLab.difficulty)
      : 0;
    for (let i = currentIdx + 1; i < difficultyOrder.length; i++) {
      const nextUp = labCatalog.find(
        (l) =>
          l.difficulty === difficultyOrder[i] &&
          !completedLabIds.includes(l.id) &&
          l.status === "published"
      );
      if (nextUp) {
        return { lab: nextUp, reason: "Ready to level up?" };
      }
    }

    return null;
  }, [completedLabId, completedLabIds]);
}

/** Find the active path and next uncompleted lab for "Continue Your Path" */
export function useActivePath(
  completedLabs: Record<string, { completedAt: number }>
): {
  path: (typeof learningPaths)[number];
  nextLabId: string;
  completedCount: number;
} | null {
  return useMemo(() => {
    const completedIds = Object.keys(completedLabs);
    if (completedIds.length === 0) return null;

    const startedPaths = learningPaths.filter((p) =>
      p.labIds.some((id) => completedIds.includes(id))
    );
    if (startedPaths.length === 0) return null;

    let bestPath = startedPaths[0];
    let bestTime = 0;
    for (const path of startedPaths) {
      for (const labId of path.labIds) {
        const lp = completedLabs[labId];
        if (lp && (lp.completedAt || 0) > bestTime) {
          bestTime = lp.completedAt || 0;
          bestPath = path;
        }
      }
    }

    const nextLabId = bestPath.labIds.find(
      (id) => !completedIds.includes(id)
    );
    if (!nextLabId) return null;

    const completedCount = bestPath.labIds.filter((id) =>
      completedIds.includes(id)
    ).length;

    return { path: bestPath, nextLabId, completedCount };
  }, [completedLabs]);
}
