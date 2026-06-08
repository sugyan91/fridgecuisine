import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const DISMISS_KEY = "fridge-banner-dismissed";
const DISMISS_DAYS = 7;

type Props = { isPremium: boolean; userId: string | undefined };

export function FreeTierBanner({ isPremium, userId }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isPremium) return;
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const { expiresAt } = JSON.parse(raw) as { expiresAt: number };
        if (expiresAt && Date.now() < expiresAt) return;
      }
    } catch {}
    setVisible(true);
  }, [isPremium]);

  const dismiss = () => {
    try {
      localStorage.setItem(
        DISMISS_KEY,
        JSON.stringify({
          expiresAt: Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000,
        }),
      );
    } catch {}
    setVisible(false);
  };

  if (isPremium || !visible) return null;

  return (
    <div className="max-w-6xl mx-auto mb-6">
      <div className="relative bg-turmeric/20 border-2 border-border rounded-2xl pl-4 pr-10 py-3 md:py-3.5 shadow-[var(--shadow-soft)] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm md:text-base font-bold tracking-tight text-foreground leading-snug">
            {userId ? (
              <><span className="text-accent">2 free recipes</span> every day on the Free plan.</>
            ) : (
              <><span className="text-accent">Try 1 free recipe</span> — sign in for 2 per day.</>
            )}
          </p>
          <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
            {userId
              ? "Basic $5.99/mo · 10 a day. Unlimited $19.99/mo · 50 a day (fair use)."
              : "Sign up free for 2/day. Paid plans from $5.99/mo for 10+ recipes a day."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!userId && (
            <Link
              to="/login"
              search={{ mode: "signup" }}
              className="text-[11px] md:text-xs font-display font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-foreground text-background hover:brightness-110 transition-all"
            >
              Sign up free
            </Link>
          )}
          <Link
            to="/pricing"
            className="text-[11px] md:text-xs font-display font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary text-primary-foreground hover:brightness-110 transition-all"
          >
            See plans →
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-2 right-2 size-7 grid place-items-center rounded-full hover:bg-background/60 text-foreground/60 hover:text-foreground transition-colors"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
    </div>
  );
}