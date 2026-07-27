"use client";
// Global age-mode context (ADR-012). Holds the current mode, persists it, and
// exposes helpers so any component can adapt vocabulary and capabilities without
// importing the raw maps. Mounted once in the root layout.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  type AgeMode,
  type Capabilities,
  type TermKey,
  DEFAULT_MODE,
  capabilities,
  isAgeMode,
  term as termFor,
} from "@/lib/age-mode";

const STORAGE_KEY = "logicland:agemode:v1";

interface AgeModeContextValue {
  mode: AgeMode;
  setMode: (mode: AgeMode) => void;
  /** Vocabulary for the current mode. */
  term: (key: TermKey | string) => string;
  caps: Capabilities;
  /** Convenience: is a capability available in the current mode. */
  can: (cap: keyof Capabilities) => boolean;
  ready: boolean;
}

const AgeModeContext = createContext<AgeModeContextValue | null>(null);

export function AgeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AgeMode>(DEFAULT_MODE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isAgeMode(saved)) setModeState(saved);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setMode = useCallback((next: AgeMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<AgeModeContextValue>(() => {
    const caps = capabilities(mode);
    return {
      mode,
      setMode,
      term: (key) => termFor(key, mode),
      caps,
      can: (cap) => Boolean(caps[cap]),
      ready,
    };
  }, [mode, setMode, ready]);

  return <AgeModeContext.Provider value={value}>{children}</AgeModeContext.Provider>;
}

/** Read the age-mode context. Falls back to safe defaults if used outside the
 *  provider (so a stray component never crashes). */
export function useAgeMode(): AgeModeContextValue {
  const ctx = useContext(AgeModeContext);
  if (ctx) return ctx;
  const caps = capabilities(DEFAULT_MODE);
  return {
    mode: DEFAULT_MODE,
    setMode: () => {},
    term: (key) => termFor(key, DEFAULT_MODE),
    caps,
    can: (cap) => Boolean(caps[cap]),
    ready: false,
  };
}
