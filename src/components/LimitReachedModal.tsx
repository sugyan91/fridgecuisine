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
  const isBasic = resolvedTier === "basic";
  const limitCount = isBasic ? 10 : 3;
  const title = isBasic
    ? "You've used your 10 recipes today 🔥"
    : `You've cooked through your ${limitCount} free recipes today 🔥`;
  const description = isBasic
    ? "Upgrade to Unlimited and never hit the limit again — or wait for the daily reset."
    : isSignedIn
      ? "Upgrade to Basic ($5.99/mo) for 10 recipes a day, or Unlimited ($19.99/mo) for no limit."
      : "Sign up free to save recipes — or go paid for more daily recipes.";
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
            to="/pricing"
            onClick={onClose}
            className="w-full text-center px-4 py-3 rounded-full bg-primary text-primary-foreground font-display font-semibold text-sm hover:brightness-110 transition-all"
          >
            {isBasic ? "Go Unlimited — $19.99/mo" : "See plans — from $5.99/mo"}
          </Link>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Daily limit resets in <span className="font-semibold text-foreground">{countdown}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}