"use client";
// Per-mission level progress. Two layers, best-of-both:
//   • localStorage — instant and offline: the ladder never stalls on the network.
//   • server (Prisma) — durable and cross-device, and what the parent/teacher
//     dashboards read.
// On mount we show the local cache immediately, then hydrate from the server and
// merge (keeping the best of each). On each clear we update local *and* mirror
// it to the server (fire-and-forget — a failed sync just leaves the local cache).
import { useCallback, useEffect, useState } from "react";
import {
  getLevelRecords,
  saveLevelResult,
} from "@/app/actions/levels";
import {
  mergeProgress,
  recordCompletion,
  type LevelProgress,
} from "@/lib/engines/level-progress";

const key = (slug: string) => `logicland:levels:${slug}`;

function load(slug: string): LevelProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key(slug));
    const parsed = raw ? (JSON.parse(raw) as LevelProgress) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function save(slug: string, progress: LevelProgress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(slug), JSON.stringify(progress));
  } catch {
    /* best-effort */
  }
}

export function useLevelProgress(slug: string) {
  const [progress, setProgress] = useState<LevelProgress>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    // 1) Show the local cache right away.
    const local = load(slug);
    setProgress(local);
    setReady(true);
    // 2) Hydrate from the server and merge in the best of both.
    getLevelRecords(slug)
      .then((server) => {
        if (!active) return;
        setProgress((prev) => {
          const merged = mergeProgress(prev, server);
          save(slug, merged);
          return merged;
        });
      })
      .catch(() => {
        /* offline / unauthenticated — the local cache stands */
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const record = useCallback(
    (levelId: string, stars: number) => {
      setProgress((prev) => {
        const next = recordCompletion(prev, levelId, stars);
        save(slug, next);
        return next;
      });
      // Mirror to the server without blocking play.
      void saveLevelResult(slug, levelId, stars).catch(() => {});
    },
    [slug],
  );

  return { progress, ready, record };
}
