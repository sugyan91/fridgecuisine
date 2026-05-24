import { Link } from "@tanstack/react-router";
import { useRecipeUsage } from "@/hooks/use-recipe-usage";

type Props = {
  userId: string | undefined;
  isPremium: boolean;
};

export function RecipeCounter({ userId, isPremium }: Props) {
  const { used, limit, countdown, loaded, atLimit } = useRecipeUsage(userId);

  if (userId && isPremium) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide bg-turmeric text-foreground px-2 py-1 rounded-full border-2 border-border">
          Premium · Unlimited
        </span>
        <span className="text-[10px] text-muted-foreground font-bold">
          No daily limit
        </span>
      </div>
    );
  }

  const shortLabel = loaded ? `${used}/${limit} free today` : `—/${limit} free today`;
  const longLabel = loaded
    ? `${used} of ${limit} free recipes today`
    : `— of ${limit} free recipes today`;

  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full border-2 border-border ${
          atLimit ? "bg-paprika text-white" : "bg-background"
        }`}
        title="You get 5 AI recipes per day on the free plan. Upgrade for unlimited."
      >
        <span className="sm:hidden">{shortLabel}</span>
        <span className="hidden sm:inline">{longLabel}</span>
      </span>
      <span className="text-[10px] text-muted-foreground font-bold text-right">
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
      <Link
        to="/pricing"
        className="text-[10px] font-bold text-accent underline underline-offset-2 hover:brightness-110"
      >
        Go unlimited → cook anything, anytime
      </Link>
    </div>
  );
}
