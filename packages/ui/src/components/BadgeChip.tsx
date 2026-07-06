import { Award } from "lucide-react";
import { cn } from "../cn";

/** A single earned badge, shown on the achievements wall and reward moments. */
export function BadgeChip({
  name,
  earned = true,
  className,
}: {
  name: string;
  earned?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl p-4 text-center",
        earned
          ? "bg-sunburst/15 text-sunburst"
          : "bg-black/5 text-black/40 grayscale dark:bg-white/5 dark:text-white/40",
        className,
      )}
    >
      <Award className="h-8 w-8" />
      <span className="text-xs font-semibold leading-tight">{name}</span>
    </div>
  );
}
