"use server";
// Server actions: the persistence bridge between Clerk identity, the FastAPI
// intelligence engine, and Prisma. Called directly from client components; they
// replace the old localStorage demo store.
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentRole } from "@logicland/auth/server";
import {
  ensureStudent,
  saveMissionCompletion,
  type Student,
} from "@logicland/database";
import { engine, type MissionReward } from "@/lib/engine";
import type { StudentState } from "@/lib/student-types";

function toState(s: Student): StudentState {
  return {
    id: s.id,
    name: s.displayName,
    xp: s.xp,
    coins: s.coins,
    stars: s.stars,
    level: s.level,
    dailyStreak: s.dailyStreak,
    completedMissions: s.completedMissions,
    badges: s.earnedBadges,
  };
}

async function currentStudent(): Promise<Student> {
  const user = await currentUser();
  if (!user) throw new Error("Not authenticated");
  const role = (await getCurrentRole()) ?? "STUDENT";
  const email =
    user.primaryEmailAddress?.emailAddress ?? `${user.id}@logicland.local`;
  return ensureStudent({
    clerkId: user.id,
    email,
    name: user.firstName ?? "Explorer",
    role,
  });
}

/** Load (creating if needed) the signed-in student's persisted state. */
export async function getStudentState(): Promise<StudentState> {
  return toState(await currentStudent());
}

/** Complete a mission: engine computes the reward, Prisma persists the result.
 *  Idempotent — replaying a completed mission returns a reward without
 *  double-awarding. */
export async function completeMission(
  missionSlug: string,
): Promise<{ state: StudentState; reward: MissionReward }> {
  const s = await currentStudent();
  const already = s.completedMissions.includes(missionSlug);

  const reward = await engine.completeMission({
    student_id: s.id,
    mission_slug: missionSlug,
    xp: s.xp,
    coins: s.coins,
    stars: s.stars,
    daily_streak: s.dailyStreak,
    correct: 3,
    total: 3,
    with_project: true,
  });

  if (already) return { state: toState(s), reward };

  const updated = await saveMissionCompletion(s.id, {
    xp: reward.new_total_xp,
    level: reward.new_level,
    coins: s.coins + reward.coins_awarded,
    stars: s.stars + reward.stars_awarded,
    completedMissions: Array.from(
      new Set([...s.completedMissions, missionSlug]),
    ),
    earnedBadges: Array.from(
      new Set([...s.earnedBadges, ...reward.badges.map((b) => b.name)]),
    ),
  });
  return { state: toState(updated), reward };
}
