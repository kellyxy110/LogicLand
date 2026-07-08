// Teacher roster — the classroom at a glance. Server Component: reads every
// student's real progress from Prisma and resolves mission slugs to titles via
// the engine curriculum. No mock data.
import { Card, CardTitle } from "@logicland/ui";
import { listClassroomStudents } from "@logicland/database";
import { Flame, Sparkles } from "lucide-react";
import Link from "next/link";
import { getMissionIndex, titleFor } from "@/lib/missions-server";
import { lastActiveLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TeacherRoster() {
  const [students, missions] = await Promise.all([
    listClassroomStudents(),
    getMissionIndex(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Students</h1>
          <p className="opacity-70">
            {students.length} explorer{students.length === 1 ? "" : "s"} in your
            classroom.
          </p>
        </div>
        <Link href="/teacher" className="text-sm text-brand hover:underline">
          ← Dashboard
        </Link>
      </header>

      {students.length === 0 ? (
        <Card className="text-center">
          <CardTitle>No students yet</CardTitle>
          <p className="mt-1 opacity-70">
            When children sign up and start their first mission, they&apos;ll
            appear here with live progress.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left dark:border-white/10">
                <th className="p-4 font-semibold">Explorer</th>
                <th className="p-4 font-semibold">Level</th>
                <th className="p-4 font-semibold">XP</th>
                <th className="p-4 font-semibold">Streak</th>
                <th className="p-4 font-semibold">Missions</th>
                <th className="p-4 font-semibold">Badges</th>
                <th className="p-4 font-semibold">Last active</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const last = s.completedMissions.at(-1);
                return (
                  <tr
                    key={s.id}
                    className="border-b border-black/5 last:border-0 dark:border-white/5"
                  >
                    <td className="p-4">
                      <div className="font-semibold">{s.displayName}</div>
                      <div className="text-xs opacity-60">
                        {s.ageYears ? `Age ${s.ageYears} · ` : ""}
                        {s.email}
                      </div>
                    </td>
                    <td className="p-4 font-semibold">{s.level}</td>
                    <td className="p-4">{s.xp.toLocaleString()}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1">
                        <Flame className="h-4 w-4 text-sunburst" />
                        {s.dailyStreak}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold">
                        {s.completedMissions.length}
                      </div>
                      {last && (
                        <div className="text-xs opacity-60">
                          Latest: {titleFor(missions, last)}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-brand" />
                        {s.earnedBadges.length}
                      </span>
                    </td>
                    <td className="p-4 opacity-80">
                      {lastActiveLabel(s.lastActiveOn)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </main>
  );
}
