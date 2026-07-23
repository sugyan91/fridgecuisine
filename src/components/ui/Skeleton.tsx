import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...rest }: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted/60",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        "before:animate-[shimmer_1.6s_infinite]",
        "motion-reduce:before:animate-none",
        className,
      )}
      {...rest}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border-2 border-border bg-white p-4 shadow-[3px_3px_0px_0px_var(--border)]">
      <Skeleton className="h-5 w-2/3 mb-3" />
      <Skeleton className="h-3 w-1/3 mb-4" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}