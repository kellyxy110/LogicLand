import { cn } from "../cn";

/** Loading placeholder. Every data view ships one of these. */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-black/10 dark:bg-white/10",
        className,
      )}
      {...props}
    />
  );
}
