import * as React from "react";
import { cn } from "../cn";

/** Rounded, soft-shadow surface — the workhorse container across LogicLand. */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-black/5 bg-white/80 p-6 shadow-sm backdrop-blur",
        "dark:border-white/10 dark:bg-white/5",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display text-xl font-bold", className)}
      {...props}
    />
  );
}
