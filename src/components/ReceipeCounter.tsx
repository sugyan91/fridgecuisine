import { Link } from "@tanstack/react-router";
import { useRecipeUsage } from "@/hooks/use-receipe-usage";

type Props = {
  userId: string | undefined;
  isPremium: boolean;
};

export function RecipeCounter({ userId, isPremium }: Props) {
  const { used, limit, countdown, loaded, atLimit } = useRecipeUsage(userId);

  if (userId && isPremium) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide bg-turmeric text-foreground px-2 py-1 rounded-full border-2 border-border">
          Premium · Unlimited
        </span>
        <span className="text-[11px] text-muted-foreground font-bold">
          No daily limit
        </span>
      </div>
    );
  }

  const shortLabel = loaded ? `${used}/${limit} free today` : `—/${limit} free today`;
  const longLabel = loaded
    ? `${used} of ${limit} free receipes today`
    : `— of ${limit} free receipes today`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
      <span
        className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full border-2 border-border ${
          atLimit ? "bg-paprika text-white" : "bg-background"
        }`}
        title="You get 5 AI receipes per day on the free plan. Upgrade for unlimited."
      >
        <span className="sm:hidden">{shortLabel}</span>
        <span className="hidden sm:inline">{longLabel}</span>
      </span>
      <span className="text-muted-foreground/50">·</span>
      <span className="text-[11px] text-muted-foreground font-bold">
        {atLimit ? (
          <>
            Limit reached ·{" "}
            {!userId ? (
              <Link
                to="/login"
                search={{ mode: "signup" }}
                className="underline underline-offset-2 text-foreground"
              >
                Sign up
              </Link>
            ) : (
            <Link
              to="/pricing"
              className="underline underline-offset-2 text-foreground"
            >
              Upgrade
            </Link>
            )}
          </>
        ) : (
          <>Resets in {countdown}</>
        )}
      </span>
      <span className="text-muted-foreground/50">·</span>
      <Link
        to="/pricing"
        className="text-[11px] font-bold text-accent underline underline-offset-2 hover:brightness-110"
      >
        <span className="sm:hidden">Go unlimited →</span>
        <span className="hidden sm:inline">Go unlimited → cook anything, anytime</span>
      </Link>
    </div>
  );
}
