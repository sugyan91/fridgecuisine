import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props = {
  count?: number;
  className?: string;
  itemClassName?: string;
};

/**
 * Uniform vertical list of skeleton rows. Use for saved lists, search results,
 * comments, activity feeds — anywhere a list is loading and you want a
 * consistent shimmer instead of ad-hoc placeholders.
 */
export function SkeletonList({ count = 4, className, itemClassName }: Props) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-2xl border-2 border-border/60 bg-white/60 p-4 flex items-center gap-3",
            itemClassName,
          )}
        >
          <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}