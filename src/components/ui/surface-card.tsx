import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * SurfaceCard — canonical premium card. Consistent radius, warm border,
 * and optional lift-on-hover. Prefer this over raw `<Card>` on marketing
 * and content surfaces.
 */
const surfaceCardVariants = cva(
  "rounded-3xl bg-card text-card-foreground",
  {
    variants: {
      tone: {
        default: "border border-border/60 shadow-soft",
        elevated: "border border-border/50 shadow-card",
        outline: "border border-border/70 bg-transparent",
        warm: "border border-primary/15 bg-gradient-to-br from-card to-secondary/60 shadow-soft",
        dark: "surface-cocoa border border-white/10 shadow-card",
      },
      interactive: {
        true: "surface-lift cursor-pointer",
        false: "",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      tone: "default",
      interactive: false,
      padding: "md",
    },
  },
);

export interface SurfaceCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceCardVariants> {
  as?: "div" | "article" | "section";
}

export const SurfaceCard = React.forwardRef<HTMLDivElement, SurfaceCardProps>(
  ({ className, tone, interactive, padding, as: Comp = "div", ...props }, ref) => (
    <Comp
      ref={ref as never}
      className={cn(surfaceCardVariants({ tone, interactive, padding }), className)}
      {...props}
    />
  ),
);
SurfaceCard.displayName = "SurfaceCard";

export { surfaceCardVariants };