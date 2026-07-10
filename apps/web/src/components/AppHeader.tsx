"use client";
// The persistent top bar for signed-in explorers, teachers, and parents. It is
// the one constant across the app: a way home, a way to the right dashboard, a
// way to switch who you are, and the account menu (with sign out). Hidden on the
// public landing page (which has its own marketing header) and never shown to
// signed-out visitors.
import { SignedIn, UserButton } from "@clerk/nextjs";
import { Compass, LayoutDashboard, UserCog } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/marketing/BrandArt";
import { APP_NAME } from "@logicland/shared";

const LINKS = [
  { href: "/student", label: "Play", icon: Compass },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Switch role", icon: UserCog },
];

export function AppHeader() {
  const pathname = usePathname();
  // The landing page owns its own header; auth pages should stay distraction-free.
  if (
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname === "/onboarding"
  ) {
    return null;
  }

  return (
    <SignedIn>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[rgb(var(--background))]/85 backdrop-blur dark:border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            aria-label={`${APP_NAME} home`}
          >
            <Wordmark className="h-7 w-7" />
            <span className="hidden font-display text-lg font-extrabold tracking-tight sm:inline">
              {APP_NAME}
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm font-semibold">
            {LINKS.map((l) => {
              const active =
                l.href === "/student"
                  ? pathname.startsWith("/student") || pathname.startsWith("/worlds") || pathname.startsWith("/play")
                  : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                    active
                      ? "bg-brand/10 text-brand"
                      : "opacity-75 hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  <l.icon className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">{l.label}</span>
                </Link>
              );
            })}
            <div className="ml-1.5">
              <UserButton
                afterSignOutUrl="/"
                appearance={{ elements: { avatarBox: "h-8 w-8" } }}
              />
            </div>
          </nav>
        </div>
      </header>
    </SignedIn>
  );
}
