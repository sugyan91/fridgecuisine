import { Link } from "@tanstack/react-router";
import { ChefHat, DollarSign, Globe2 } from "lucide-react";

export function ChefCTA() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-paprika to-saffron border-4 border-border rounded-[32px] p-6 md:p-10 shadow-[8px_8px_0px_0px_var(--border)]">
      <div className="absolute -right-6 -top-6 size-32 md:size-48 bg-turmeric border-4 border-border rounded-full opacity-90 rotate-12" />
      <div className="absolute right-8 bottom-4 hidden md:block">
        <ChefHat className="size-32 text-white opacity-20" strokeWidth={1.5} />
      </div>

      <div className="relative">
        <p className="font-black text-[10px] md:text-xs uppercase tracking-[0.2em] text-foreground bg-turmeric inline-block px-3 py-1 rounded-full border-2 border-border mb-3">
          For chefs & home cooks
        </p>
        <h2 className="font-display text-3xl md:text-5xl uppercase text-white leading-tight max-w-2xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]">
          Are you a chef? Earn from your recipes.
        </h2>
        <p className="text-white/95 text-sm md:text-base mt-3 max-w-xl font-medium">
          Share your signature dishes with home cooks worldwide. Set your own price.
        </p>

        <div className="flex flex-wrap gap-2 mt-5 mb-6">
          <Pill icon={DollarSign} label="You set the price" />
          <Pill icon={Globe2} label="Sell worldwide" />
          <Pill icon={ChefHat} label="No upfront cost" />
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/sell"
            className="bg-foreground text-background border-2 border-border px-5 md:px-6 py-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wide shadow-[0px_5px_0px_0px_var(--border)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0px_2px_0px_0px_var(--border)] transition-all"
          >
            Start selling →
          </Link>
          <Link
            to="/chefs"
            className="bg-white border-2 border-border px-5 md:px-6 py-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wide shadow-[0px_5px_0px_0px_var(--border)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0px_2px_0px_0px_var(--border)] transition-all"
          >
            Browse chefs
          </Link>
        </div>
      </div>
    </div>
  );
}

function Pill({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-white/95 border-2 border-border px-3 py-1 rounded-full text-[11px] md:text-xs font-black uppercase tracking-wide">
      <Icon className="size-3.5" strokeWidth={2.5} />
      {label}
    </span>
  );
}