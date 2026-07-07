import { SignedIn, SignedOut } from "@clerk/nextjs";
import { APP_NAME, TAGLINE } from "@logicland/shared";
import { RoboAvatar } from "@logicland/ui";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <RoboAvatar mood="happy" size={96} />
      <span className="rounded-full bg-brand-soft/30 px-4 py-1 text-sm font-semibold text-brand">
        Mr. Kelly&apos;s Digital Coding Classroom
      </span>
      <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
        {APP_NAME}
      </h1>
      <p className="text-xl text-brand">{TAGLINE}</p>
      <p className="max-w-xl text-lg opacity-80">
        Every lesson is an adventure. Meet Robo, explore magical worlds, and
        learn to think clearly, build boldly, and create fearlessly.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <SignedOut>
          <a
            href="/sign-in"
            className="rounded-2xl bg-brand px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-105"
          >
            Enter LogicLand
          </a>
          <a
            href="/sign-up"
            className="rounded-2xl bg-brand-soft/30 px-6 py-3 font-semibold text-brand transition hover:scale-105"
          >
            Create an account
          </a>
        </SignedOut>
        <SignedIn>
          <a
            href="/dashboard"
            className="rounded-2xl bg-brand px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-105"
          >
            Go to my dashboard →
          </a>
        </SignedIn>
      </div>
    </main>
  );
}
