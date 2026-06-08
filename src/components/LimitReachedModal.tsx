import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  isSignedIn: boolean;
  countdown: string;
  tier?: "anon" | "free" | "basic" | "unlimited";
};

export function LimitReachedModal({ open, onClose, isSignedIn, countdown, tier }: Props) {
  const resolvedTier = tier ?? (isSignedIn ? "free" : "anon");
  const isAnon = resolvedTier === "anon";
  const isBasic = resolvedTier === "basic";
  const isUnlimited = resolvedTier === "unlimited";

  const title = isUnlimited
    ? "You've hit today's fair-use cap 🔥"
    : isBasic
      ? "You've used your 10 recipes today 🔥"
      : isAnon
        ? "That's your free taste 🔥"
        : "You've used your 2 free recipes today 🔥";

  const description = isUnlimited
    ? "Unlimited has a fair-use cap of 50 recipes/day to keep things sustainable. Resets at midnight."
    : isBasic
      ? "Upgrade to Unlimited ($19.99/mo · 50/day) or wait for the daily reset."
      : isAnon
        ? "Sign up free and get 2 recipes every day. Paid plans go up to 50/day."
        : "Upgrade to Basic ($5.99/mo · 10/day) or Unlimited ($19.99/mo · 50/day).";

  const ctaLabel = isUnlimited
    ? "Manage plan"
    : isBasic
      ? "Go Unlimited — $19.99/mo"
      : "See plans — from $5.99/mo";
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl md:text-3xl tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-2">
          {!isSignedIn && (
            <Link
              to="/login"
              search={{ mode: "signup" }}
              onClick={onClose}
              className="w-full text-center px-4 py-3 rounded-full bg-foreground text-background font-display font-semibold text-sm hover:brightness-110 transition-all"
            >
              Sign up free — keep cooking
            </Link>
          )}
          <Link
            to={isUnlimited ? "/account" : "/pricing"}
            onClick={onClose}
            className="w-full text-center px-4 py-3 rounded-full bg-primary text-primary-foreground font-display font-semibold text-sm hover:brightness-110 transition-all"
          >
            {ctaLabel}
          </Link>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Daily limit resets in <span className="font-semibold text-foreground">{countdown}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}