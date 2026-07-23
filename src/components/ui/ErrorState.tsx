import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

/**
 * Consistent inline error surface with an optional retry action. Pair with
 * friendlyError() from '@/lib/errors' to turn thrown errors into a message.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this. Give it another try in a moment.",
  onRetry,
  retryLabel = "Try again",
  className,
}: Props) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-3xl border-2 border-dashed border-paprika/40 bg-paprika/5 px-6 py-10",
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-paprika/15 text-paprika">
        <AlertTriangle className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="font-display text-xl text-paprika mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-5">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-full bg-paprika text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest border-2 border-border shadow-[3px_3px_0px_0px_var(--border)] hover:translate-y-[-1px] transition-transform"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}