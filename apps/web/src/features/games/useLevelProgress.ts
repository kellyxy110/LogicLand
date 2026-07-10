"use client";
// Per-mission level progress, cached to localStorage so a returning learner
// resumes at their last unfinished level and keeps their best stars — the ladder
// never restarts. Mission *completion* stays server-authoritative (see
// MissionRunner → completeMission); this caches the finer-grained level state.
import { useCallback, useEffect, useState } from "react";
import {
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
  // Hydrate after mount so SSR and first client render agree (localStorage is
  // client-only). `ready` lets the UI hold until the real state is known.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProgress(load(slug));
    setReady(true);
  }, [slug]);

  const record = useCallback(
    (levelId: string, stars: number) => {
      setProgress((prev) => {
        const next = recordCompletion(prev, levelId, stars);
        save(slug, next);
        return next;
      });
    },
    [slug],
  );

  return { progress, ready, record };
}
