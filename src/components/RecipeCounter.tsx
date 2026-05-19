import { Link } from "@tanstack/react-router";
import { useRecipeUsage } from "@/hooks/use-recipe-usage";

type Props = {
  userId: string | undefined;
  isPremium: boolean;
};

export function RecipeCounter({ userId, isPremium }: Props) {
  const { used, limit, countdown, loaded } = useRecipeUsage(userId);

  if (!userId) return null;

  if (isPremium) {
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

  const atLimit = loaded && used >= limit;
  const label = loaded ? `${used}/${limit} today` : `—/${limit} today`;

  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full border-2 border-border ${
          atLimit ? "bg-paprika text-white" : "bg-background"
        }`}
        title="Free plan: 5 recipes per day"
      >
        {label}
      </span>
      <span className="text-[10px] text-muted-foreground font-bold">
        {atLimit ? (
          <>
            Limit reached ·{" "}
            <Link
              to="/pricing"
              className="underline underline-offset-2 text-foreground"
            >
              Upgrade
            </Link>
          </>
        ) : (
          <>Resets in {countdown}</>
        )}
      </span>
    </div>
  );
}
