import { Link } from "@tanstack/react-router";

export function ChefCTA() {
  return (
    <div className="relative bg-secondary text-secondary-foreground rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-16 lg:p-20 shadow-[var(--shadow-card)] overflow-hidden">
      {/* Soft radial glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 size-[28rem] rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-24 size-[24rem] rounded-full bg-[var(--accent-gold)]/15 blur-3xl"
      />
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <p className="font-display text-[10px] tracking-[0.3em] uppercase text-primary">
              For chefs &amp; home cooks
            </p>
          </div>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl uppercase tracking-tight leading-[0.92]">
            Monetize your <span className="text-primary italic normal-case font-serif font-normal">culinary flair.</span>
          </h2>
          <p className="text-base md:text-lg text-secondary-foreground/75 max-w-xl leading-relaxed">
            Share your signature dishes with home cooks worldwide. Set your own
            price and reach a global community of cooks.
          </p>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-3 lg:items-end">
          <Link
            to="/sell"
            className="w-full lg:w-auto text-center bg-primary text-primary-foreground px-8 py-4 rounded-full font-display text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_12px_24px_-8px_rgba(0,0,0,0.35)]"
          >
            Start selling
          </Link>
          <Link
            to="/chefs"
            className="w-full lg:w-auto text-center bg-transparent text-secondary-foreground border border-secondary-foreground/30 px-8 py-4 rounded-full font-display text-sm uppercase tracking-widest hover:bg-secondary-foreground hover:text-secondary transition-all"
          >
            Browse chefs
          </Link>
          <p className="text-[11px] uppercase tracking-[0.2em] text-secondary-foreground/50 mt-1 lg:text-right">
            No subscription · keep 85%
          </p>
        </div>
      </div>
    </div>
  );
}
