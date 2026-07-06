"use client";
// Student state hook — now server-backed via Prisma (was localStorage in the
// Phase 2 demo). Same shape the pages already consume, so UI is unchanged; the
// source of truth is the database, keyed to the Clerk-authenticated user.
import { useCallback, useEffect, useState } from "react";
import {
  completeMission as completeMissionAction,
  getStudentState,
} from "@/app/actions/student";
import type { MissionReward } from "./engine";
import { EMPTY_STUDENT, type StudentState } from "./student-types";

export type { StudentState };

export function useStudent() {
  const [state, setState] = useState<StudentState>(EMPTY_STUDENT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    getStudentState()
      .then((s) => active && setState(s))
      .catch(() => {
        /* keep EMPTY_STUDENT on failure */
      })
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  /** Complete a mission server-side; returns the reward for the celebration. */
  const completeMission = useCallback(
    async (missionSlug: string): Promise<MissionReward> => {
      const { state: next, reward } = await completeMissionAction(missionSlug);
      setState(next);
      return reward;
    },
    [],
  );

  const refresh = useCallback(async () => {
    setState(await getStudentState());
  }, []);

  return { state, ready, completeMission, refresh };
}
