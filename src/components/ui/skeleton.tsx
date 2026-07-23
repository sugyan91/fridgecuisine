import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-primary/10", className)} {...props} />;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border-2 border-border bg-white p-4 shadow-[3px_3px_0px_0px_var(--border)]">
      <Skeleton className="h-5 w-2/3 mb-3" />
      <Skeleton className="h-3 w-1/3 mb-4" />
      <Skeleton className="h-9 w-full" />
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
