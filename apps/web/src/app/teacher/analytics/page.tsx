// Teacher analytics — class-wide signal from real student data. Server
// Component: aggregates every student's persisted progress into KPIs plus the
// most-completed missions and most-earned badges.
import { Card, CardTitle } from "@logicland/ui";
import { listClassroomStudents } from "@logicland/database";
import { Award, Flame, Layers, TrendingUp, UserCheck, Users } from "lucide-react";
import Link from "next/link";
import { getMissionIndex, titleFor } from "@/lib/missions-server";
import { isActiveToday } from "@/lib/format";

export const dynamic = "force-dynamic";

function tally(items: string[][]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const list of items) {
    for (const key of list) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export default async function TeacherAnalytics() {
  const [students, missions] = await Promise.all([
    listClassroomStudents(),
    getMissionIndex(),
  ]);

  const n = students.length;
  const activeToday = students.filter((s) => isActiveToday(s.lastActiveOn)).length;
  const totalMissions = students.reduce(
    (a, s) => a + s.completedMissions.length,
    0,
  );
  const totalBadges = students.reduce((a, s) => a + s.earnedBadges.length, 0);
  const avgLevel = n ? students.reduce((a, s) => a + s.level, 0) / n : 0;
  const avgStreak = n ? students.reduce((a, s) => a + s.dailyStreak, 0) / n : 0;

  const topMissions = tally(students.map((s) => s.completedMissions)).slice(0, 6);
  const topBadges = tally(students.map((s) => s.earnedBadges)).slice(0, 6);

  const kpis = [
    { label: "Explorers", value: n, icon: Users },
    { label: "Active today", value: activeToday, icon: UserCheck },
    { label: "Avg. level", value: avgLevel.toFixed(1), icon: TrendingUp },
    { label: "Missions done", value: totalMissions, icon: Layers },
    { label: "Badges earned", value: totalBadges, icon: Award },
    { label: "Avg. streak", value: avgStreak.toFixed(1), icon: Flame },
  ];

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Analytics</h1>
          <p className="opacity-70">How your classroom is doing right now.</p>
        </div>
        <Link href="/teacher" className="text-sm text-brand hover:underline">
          ← Dashboard
        </Link>
      </header>

      {n === 0 ? (
        <Card className="text-center">
          <CardTitle>Nothing to chart yet</CardTitle>
          <p className="mt-1 opacity-70">
            Analytics come alive once students begin their adventures.
          </p>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {kpis.map((k) => (
              <Card key={k.label} className="text-center">
                <k.icon className="mx-auto mb-1 h-5 w-5 text-brand" />
                <div className="font-display text-2xl font-extrabold">
                  {k.value}
                </div>
                <div className="text-xs opacity-60">{k.label}</div>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardTitle className="mb-3">Most-completed missions</CardTitle>
              {topMissions.length === 0 ? (
                <p className="text-sm opacity-60">No completions yet.</p>
              ) : (
                <ul className="space-y-2">
                  {topMissions.map(([slug, count]) => (
                    <li key={slug}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{titleFor(missions, slug)}</span>
                        <span className="opacity-60">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-black/5 dark:bg-white/10">
                        <div
                          className="h-2 rounded-full bg-brand"
                          style={{ width: `${(count / n) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardTitle className="mb-3">Most-earned badges</CardTitle>
              {topBadges.length === 0 ? (
                <p className="text-sm opacity-60">No badges earned yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {topBadges.map(([name, count]) => (
                    <li key={name} className="flex justify-between">
                      <span className="inline-flex items-center gap-2">
                        <Award className="h-4 w-4 text-sunburst" />
                        {name}
                      </span>
                      <span className="opacity-60">
                        {count} explorer{count === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </main>
  );
}
