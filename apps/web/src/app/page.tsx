import { SignedIn, SignedOut } from "@clerk/nextjs";
import { APP_NAME, TAGLINE } from "@logicland/shared";
import Link from "next/link";
import { HeroArt, JourneyMark, Wordmark } from "@/components/marketing/BrandArt";

// The public landing page. Deliberately editorial and typographic — premium,
// trustworthy, and calm — rather than a mascot-and-emoji splash. All artwork is
// custom geometry (see BrandArt); color is used sparingly against generous space.

const AUDIENCES = [
  {
    label: "For young explorers",
    title: "A world, not a worksheet",
    body: "Children enter themed worlds and learn to think in sequences, patterns, and logic — the foundations of computing — through play they choose to return to.",
  },
  {
    label: "For parents",
    title: "See real progress",
    body: "Clear, honest reports show what your child is learning and how they are growing — skills mastered, adventures completed, momentum building.",
  },
  {
    label: "For teachers",
    title: "A classroom that scales",
    body: "Live rosters, class analytics, and a scaffolded curriculum let one teacher guide many learners — the AI assists, and never replaces, your judgement.",
  },
];

const WORLDS = [
  { name: "Logic Forest", tone: "#22C55E", open: true },
  { name: "Coding City", tone: "#38BDF8", open: true },
  { name: "Number Kingdom", tone: "#FFB020", open: false },
  { name: "Robot Factory", tone: "#F97316", open: false },
  { name: "AI Mountain", tone: "#8B5CF6", open: false },
  { name: "Innovation Space", tone: "#6C5CE7", open: false },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={APP_NAME}>
          <Wordmark className="h-8 w-8" />
          <span className="font-display text-xl font-extrabold tracking-tight">
            {APP_NAME}
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold">
          <SignedOut>
            <Link
              href="/sign-in"
              className="rounded-full px-4 py-2 text-brand transition-colors hover:bg-brand/5"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-brand px-5 py-2 text-white shadow-sm transition-transform hover:scale-[1.03]"
            >
              Get started
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="rounded-full bg-brand px-5 py-2 text-white shadow-sm transition-transform hover:scale-[1.03]"
            >
              Enter LogicLand
            </Link>
          </SignedIn>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-16">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Mr. Kelly&apos;s Digital Coding Classroom
          </p>
          <h1 className="mt-4 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Think clearly.
            <br />
            Build boldly.
            <br />
            <span className="text-brand">Create fearlessly.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed opacity-75">
            A premium coding and computational-thinking academy for children
            aged five to ten — where learning to think like a builder feels like
            an adventure worth having.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <SignedOut>
              <Link
                href="/sign-up"
                className="rounded-2xl bg-brand px-7 py-3.5 font-semibold text-white shadow-lg transition-transform hover:scale-[1.03]"
              >
                Begin the journey
              </Link>
              <Link
                href="/sign-in"
                className="rounded-2xl border border-black/10 px-7 py-3.5 font-semibold transition-colors hover:bg-black/[0.03] dark:border-white/15 dark:hover:bg-white/5"
              >
                Sign in
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="rounded-2xl bg-brand px-7 py-3.5 font-semibold text-white shadow-lg transition-transform hover:scale-[1.03]"
              >
                Continue your adventure
              </Link>
            </SignedIn>
          </div>
          <p className="mt-6 text-sm opacity-55">
            Built for the classroom. Loved at home. Safe by design.
          </p>
        </div>

        <div className="animate-in fade-in zoom-in-95 duration-1000">
          <HeroArt className="mx-auto w-full max-w-md" />
        </div>
      </section>

      {/* Statement */}
      <section className="border-y border-black/5 bg-black/[0.015] dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="font-display text-2xl font-bold leading-snug sm:text-3xl">
            Computational thinking is a way of seeing the world — breaking big
            problems into small, solvable steps.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg opacity-70">
            LogicLand teaches it the way children learn best: through story,
            curiosity, and the quiet pride of building something that works.
          </p>
        </div>
      </section>

      {/* Audiences */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {AUDIENCES.map((a) => (
            <article
              key={a.label}
              className="rounded-3xl border border-black/[0.07] p-7 transition-shadow hover:shadow-md dark:border-white/10"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
                {a.label}
              </p>
              <h3 className="mt-3 font-display text-xl font-bold">{a.title}</h3>
              <p className="mt-2 leading-relaxed opacity-70">{a.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* The journey */}
      <section className="border-t border-black/5 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
              The journey
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight">
              Six worlds, one growing mind
            </h2>
            <p className="mt-3 text-lg opacity-70">
              Each world teaches a core skill and unlocks the next — a designed
              path from first steps to real code.
            </p>
          </div>

          <ol className="mt-12 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {WORLDS.map((w, i) => (
              <li key={w.name} className="flex items-start gap-4">
                <JourneyMark tone={w.tone} index={i + 1} open={w.open} />
                <div>
                  <h3 className="font-display text-lg font-bold">{w.name}</h3>
                  <p className="mt-0.5 text-sm font-semibold opacity-55">
                    {w.open ? "Open now" : "Coming soon"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-[2rem] bg-brand px-8 py-14 text-center text-white">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {TAGLINE}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/80">
            Give a child the confidence to build the future — one clear idea at a
            time.
          </p>
          <div className="mt-8">
            <SignedOut>
              <Link
                href="/sign-up"
                className="inline-block rounded-2xl bg-white px-8 py-3.5 font-semibold text-brand shadow-lg transition-transform hover:scale-[1.03]"
              >
                Create your account
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-block rounded-2xl bg-white px-8 py-3.5 font-semibold text-brand shadow-lg transition-transform hover:scale-[1.03]"
              >
                Open your dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm opacity-60 sm:flex-row">
          <div className="flex items-center gap-2">
            <Wordmark className="h-5 w-5" />
            <span className="font-semibold">
              {APP_NAME} — {TAGLINE}
            </span>
          </div>
          <p>Mr. Kelly&apos;s Digital Coding Classroom</p>
        </div>
      </footer>
    </div>
  );
}
