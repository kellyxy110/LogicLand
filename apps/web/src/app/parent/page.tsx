// Parent dashboard — an informed, reassuring window into each child's journey.
// Server Component: reads the parent's linked children from Prisma and enriches
// mission slugs with titles + a plain-language "what they learned" summary from
// the engine curriculum. Degrades gracefully if the engine is offline.
import { Card, CardTitle, RoboAvatar, StreakFlame } from "@logicland/ui";
import {
  getLevelRecords,
  getParentChildren,
  getStudentSubmissions,
  type StudentProgress,
  type StudioSubmissionView,
} from "@logicland/database";
import { getCurrentUser } from "@logicland/auth/server";
import { Award, Code2, Coins, Send, Star, Trophy } from "lucide-react";
import { engine } from "@/lib/engine";
import { getMissionIndex, titleFor, type MissionIndex } from "@/lib/missions-server";

export const dynamic = "force-dynamic";

interface CodingProgress {
  levelsCleared: number;
  submissions: StudioSubmissionView[];
}

async function codingProgress(child: StudentProgress): Promise<CodingProgress> {
  try {
    const [levels, submissions] = await Promise.all([
      getLevelRecords(child.id),
      getStudentSubmissions(child.id),
    ]);
    return {
      levelsCleared: levels.filter((l) => l.completed).length,
      submissions,
    };
  } catch {
    return { levelsCleared: 0, submissions: [] };
  }
}

async function latestSummary(child: StudentProgress): Promise<string | null> {
  const slug = child.completedMissions.at(-1);
  if (!slug) return null;
  try {
    const detail = await engine.getMission(slug);
    return detail.parent_summary || null;
  } catch {
    return null;
  }
}

export default async function ParentDashboard() {
  const user = await getCurrentUser();
  const clerkId = user?.id ?? "";
  const [children, missions] = await Promise.all([
    clerkId ? getParentChildren(clerkId) : Promise.resolve([]),
    getMissionIndex(),
  ]);
  const [summaries, coding] = await Promise.all([
    Promise.all(children.map(latestSummary)),
    Promise.all(children.map(codingProgress)),
  ]);
  const firstName = user?.firstName ?? "there";

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <header className="mb-6 flex items-center gap-4">
        <RoboAvatar mood="happy" size={56} />
        <div>
          <h1 className="font-display text-3xl font-extrabold">
            Hello, {firstName}
          </h1>
          <p className="opacity-70">Here&apos;s how your young coder is doing.</p>
        </div>
      </header>

      {children.length === 0 ? (
        <Card className="text-center">
          <CardTitle>No children linked yet</CardTitle>
          <p className="mx-auto mt-1 max-w-md opacity-70">
            Once your child&apos;s teacher links their account to yours,
            you&apos;ll see their missions, badges, and progress here.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {children.map((child, i) => (
            <ChildCard
              key={child.id}
              child={child}
              missions={missions}
              summary={summaries[i] ?? null}
              coding={coding[i] ?? { levelsCleared: 0, submissions: [] }}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function ChildCard({
  child,
  missions,
  summary,
  coding,
}: {
  child: StudentProgress;
  missions: MissionIndex;
  summary: string | null;
  coding: CodingProgress;
}) {
  const levelProgress = Math.round(((child.xp % 250) / 250) * 100);
  const recent = [...child.completedMissions].reverse().slice(0, 3);
  const recentSubs = coding.submissions.slice(0, 3);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <CardTitle>{child.displayName}</CardTitle>
          <p className="text-sm opacity-60">
            Level {child.level}
            {child.ageYears ? ` · Age ${child.ageYears}` : ""}
          </p>
        </div>
        <StreakFlame days={child.dailyStreak} />
      </div>

      <div className="mb-1 flex justify-between text-xs opacity-60">
        <span>Level {child.level}</span>
        <span>{child.xp.toLocaleString()} XP</span>
      </div>
      <div className="mb-4 h-2.5 rounded-full bg-black/5 dark:bg-white/10">
        <div
          className="h-2.5 rounded-full bg-brand"
          style={{ width: `${levelProgress}%` }}
        />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3 text-center text-sm">
        <Stat icon={Trophy} value={child.completedMissions.length} label="Missions" />
        <Stat icon={Award} value={child.earnedBadges.length} label="Badges" />
        <Stat icon={Star} value={child.stars} label="Stars" />
      </div>

      {summary && (
        <div className="mb-4 rounded-2xl bg-brand/5 p-4 text-sm">
          <p className="mb-1 font-semibold text-brand">Latest adventure</p>
          <p className="opacity-80">{summary}</p>
        </div>
      )}

      {(coding.levelsCleared > 0 || recentSubs.length > 0) && (
        <div className="mb-4 rounded-2xl bg-sky/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-sky" />
            <p className="text-sm font-semibold text-sky">Coding studio</p>
          </div>
          <p className="text-sm opacity-80">
            {coding.levelsCleared > 0
              ? `${child.displayName} has cleared ${coding.levelsCleared} game ${coding.levelsCleared === 1 ? "level" : "levels"}`
              : `${child.displayName} is starting to code`}
            {recentSubs.length > 0
              ? ` and handed in ${recentSubs.length} coding ${recentSubs.length === 1 ? "project" : "projects"}.`
              : "."}
          </p>
          {recentSubs.length > 0 && (
            <ul className="mt-2 space-y-1.5 text-sm">
              {recentSubs.map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-sky/15 text-sky">
                    <Send className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex-1 truncate">{s.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      s.status === "REVIEWED"
                        ? "bg-meadow/15 text-meadow"
                        : "bg-sunburst/15 text-sunburst"
                    }`}
                  >
                    {s.status === "REVIEWED" ? "Reviewed" : "Submitted"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {recent.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-50">
            Recent missions
          </p>
          <ul className="space-y-1.5 text-sm">
            {recent.map((slug) => (
              <li key={slug} className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-meadow/15 text-meadow">
                  <Coins className="h-3.5 w-3.5" />
                </span>
                {titleFor(missions, slug)}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm opacity-60">
          No missions completed yet — the adventure is just beginning!
        </p>
      )}
    </Card>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Trophy;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-black/[0.03] p-3 dark:bg-white/[0.04]">
      <Icon className="mx-auto mb-1 h-4 w-4 text-brand" />
      <div className="font-display text-lg font-extrabold">{value}</div>
      <div className="text-xs opacity-60">{label}</div>
    </div>
  );
}
