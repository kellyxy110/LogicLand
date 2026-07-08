// Small display helpers shared by the dashboards.

/** Human "last active" label from a timestamp (or null). */
export function lastActiveLabel(date: Date | null): string {
  if (!date) return "Never";
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const days = Math.floor((startOfToday - startOfDay(date)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** True if the timestamp falls on the current calendar day. */
export function isActiveToday(date: Date | null): boolean {
  return !!date && lastActiveLabel(date) === "Today";
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
