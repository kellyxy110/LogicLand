import * as React from "react";
import { cn } from "../cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-lg hover:brightness-110",
  secondary: "bg-brand-soft/30 text-brand hover:bg-brand-soft/40",
  ghost: "bg-transparent hover:bg-black/5 dark:hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** Big, friendly, rounded button. Large tap targets for young hands. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold",
        "transition-transform duration-150 hover:scale-[1.03] active:scale-95",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
