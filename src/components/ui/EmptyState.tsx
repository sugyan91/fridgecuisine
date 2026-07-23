import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type LinkTo = React.ComponentProps<typeof Link>["to"];

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?:
    | { label: string; to: LinkTo }
    | { label: string; onClick: () => void };
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-3xl border-2 border-dashed border-border/70 bg-white/60 px-6 py-12",
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-turmeric/25 text-paprika">
          <Icon className="h-7 w-7" aria-hidden />
        </div>
      )}
      <h3 className="font-display text-2xl text-paprika mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-5">{description}</p>
      )}
      {action && ("to" in action ? (
        <Link
          to={action.to}
          className="inline-flex items-center justify-center rounded-full bg-paprika text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest border-2 border-border shadow-[3px_3px_0px_0px_var(--border)] hover:translate-y-[-1px] transition-transform"
        >
          {action.label}
        </Link>
      ) : (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center justify-center rounded-full bg-paprika text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest border-2 border-border shadow-[3px_3px_0px_0px_var(--border)] hover:translate-y-[-1px] transition-transform"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}