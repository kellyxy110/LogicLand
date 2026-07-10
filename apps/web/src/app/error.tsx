"use client";
// Route-level error boundary. When a Server Component page throws (e.g. a
// database read fails), Next renders this instead of a blank screen. We show a
// calm, kid-and-parent-friendly message with a Retry — never a stack trace or
// any secret. The real error is logged to the browser console for debugging;
// server-side details stay on the server logs.
import { Button } from "@logicland/ui";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Message only — no stack, no secrets. `digest` ties back to the server log.
    console.error("Page error:", error.message, error.digest ? `(${error.digest})` : "");
  }, [error]);

  return (
    <main className="mx-auto grid min-h-[60vh] max-w-lg place-items-center px-5 text-center">
      <div>
        <h1 className="font-display text-3xl font-extrabold">
          Something went wrong
        </h1>
        <p className="mt-2 opacity-70">
          We couldn&apos;t load this page just now. This is usually temporary —
          please try again.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => reset()}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
          <Link href="/">
            <Button variant="secondary">Go home</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
