import { Link } from "@tanstack/react-router";

export function ChefCTA() {
  return (
    <div className="bg-secondary text-secondary-foreground rounded-[2.5rem] p-8 md:p-14 shadow-[var(--shadow-card)]">
      <div className="space-y-6 max-w-3xl">
        <p className="font-display text-[10px] tracking-[0.3em] uppercase text-primary">
          For chefs &amp; home cooks
        </p>
        <h2 className="font-display text-4xl md:text-6xl uppercase tracking-tight leading-[0.95]">
          Monetize your <span className="text-primary">culinary flair.</span>
        </h2>
        <p className="text-lg text-secondary-foreground/80 max-w-xl leading-relaxed">
          Share your signature dishes with home cooks worldwide. Set your own
          price and reach a global community of cooks.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/sell"
            className="bg-primary text-primary-foreground px-7 py-3.5 rounded-full font-display text-sm uppercase tracking-widest hover:brightness-110 transition-all"
          >
            Start selling
          </Link>
          <Link
            to="/chefs"
            className="bg-transparent text-secondary-foreground border border-secondary-foreground/30 px-7 py-3.5 rounded-full font-display text-sm uppercase tracking-widest hover:bg-secondary-foreground hover:text-secondary transition-all"
          >
            Browse chefs
          </Link>
        </div>
      </div>
    </div>
  );
}
