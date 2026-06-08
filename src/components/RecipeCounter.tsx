import { Link } from "@tanstack/react-router";
import { useRecipeUsage } from "@/hooks/use-recipe-usage";

type Props = {
  userId: string | undefined;
  isPremium: boolean;
  isUnlimited?: boolean;
};

export function RecipeCounter({ userId, isPremium, isUnlimited }: Props) {
  const { used, limit, countdown, loaded, atLimit, tier, unlimited } =
    useRecipeUsage(userId);
  const showUnlimited = isUnlimited || unlimited || tier === "unlimited";

  if (userId && showUnlimited) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide bg-turmeric text-foreground px-2 py-1 rounded-full border-2 border-border">
          Unlimited · No daily limit
        </span>
      </div>
    );
  }

  const tierLabel = tier === "basic" ? "Basic" : "free";
  const shortLabel = loaded ? `${used}/${limit} ${tierLabel} today` : `—/${limit} ${tierLabel} today`;
  const longLabel = loaded
    ? `${used} of ${limit} ${tierLabel} recipes today`
    : `— of ${limit} ${tierLabel} recipes today`;
  const upgradeCta = tier === "basic" ? "Go Unlimited →" : "Upgrade for more →";
  const upgradeCtaLong = tier === "basic" ? "Go Unlimited → no daily limit" : "Upgrade → 10 or unlimited a day";
  const tooltip =
    tier === "basic"
      ? "Basic plan: 10 AI recipes per day. Upgrade to Unlimited for no limit."
      : "Free plan: 3 AI recipes per day. Upgrade for 10 or unlimited.";

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
      <span
        className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full border-2 border-border ${
          atLimit ? "bg-paprika text-white" : "bg-background"
        }`}
        title={tooltip}
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
        <span className="sm:hidden">{upgradeCta}</span>
        <span className="hidden sm:inline">{upgradeCtaLong}</span>
      </Link>
    </div>
  );
}
