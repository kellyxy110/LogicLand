// Shared, client-safe shape for a student's persisted state. Lives outside the
// "use server" action module (which may only export async functions).
export interface StudentState {
  id: string;
  name: string;
  xp: number;
  coins: number;
  stars: number;
  level: number;
  dailyStreak: number;
  completedMissions: string[];
  badges: string[];
}

export const EMPTY_STUDENT: StudentState = {
  id: "",
  name: "Explorer",
  xp: 0,
  coins: 0,
  stars: 0,
  level: 1,
  dailyStreak: 1,
  completedMissions: [],
  badges: [],
};
