import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton-shimmer rounded-lg", className)} {...props} />;
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft">
      <Skeleton className="h-5 w-2/3 mb-3" />
      <Skeleton className="h-3 w-1/3 mb-5" />
      <Skeleton className="h-9 w-full rounded-full" />
    </div>
  );
}

function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonList };
