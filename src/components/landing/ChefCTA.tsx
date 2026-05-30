import { Link } from "@tanstack/react-router";

export function ChefCTA() {
  return (
    <div className="relative bg-secondary text-secondary-foreground rounded-full px-6 py-4 md:px-8 md:py-5 shadow-[var(--shadow-soft)] flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-center">
      <p className="font-display text-sm md:text-base tracking-tight">
        Are you a chef? Sell your recipes on FridgeCuisine.
      </p>
      <Link
        to="/sell"
        className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-5 py-2 rounded-full font-display text-xs md:text-sm uppercase tracking-widest hover:brightness-110 transition-all whitespace-nowrap"
      >
        Start selling →
      </Link>
    </div>
  );
}
