// Teacher dashboard — the classroom command center. Server Component: greets the
// signed-in teacher and links to the tools. Generators reduce manual work.
import { Card, CardTitle } from "@logicland/ui";
import {
  BarChart3,
  FileText,
  Megaphone,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@logicland/auth/server";

const TOOLS = [
  {
    href: "/teacher/studio",
    title: "Generator Studio",
    desc: "AI-draft worksheets, quizzes & flashcards — you approve.",
    icon: Wand2,
    live: true,
  },
  { href: "/teacher/roster", title: "Students", desc: "Live roster & progress.", icon: Users, live: true },
  { href: "/teacher/analytics", title: "Analytics", desc: "Mastery, engagement, streaks.", icon: BarChart3, live: true },
  { href: "/teacher", title: "Weekly Reports", desc: "Draft-then-send parent summaries.", icon: FileText, live: false },
  { href: "/teacher", title: "Announcements", desc: "Broadcast to your classroom.", icon: Megaphone, live: false },
];

export default async function TeacherDashboard() {
  const user = await getCurrentUser();
  const name = user?.firstName ?? "Mr. Kelly";

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold">
          Welcome back, {name} 👋
        </h1>
        <p className="opacity-70">Your classroom, ready when you are.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((t) => (
          <Link key={t.title} href={t.href} className="group">
            <Card className="h-full transition group-hover:scale-[1.02]">
              <div className="mb-2 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <t.icon className="h-5 w-5" />
                </span>
                <CardTitle>{t.title}</CardTitle>
                {t.live && (
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-meadow/15 px-2 py-0.5 text-xs font-semibold text-meadow">
                    <Sparkles className="h-3 w-3" /> Live
                  </span>
                )}
              </div>
              <p className="text-sm opacity-70">{t.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
