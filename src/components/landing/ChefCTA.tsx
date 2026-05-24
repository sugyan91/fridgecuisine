import { Link } from "@tanstack/react-router";

export function ChefCTA() {
  return (
    <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center bg-primary text-primary-foreground rounded-[2.5rem] p-8 md:p-14 border-t-4 border-accent shadow-[var(--shadow-card)]">
      <div className="lg:col-span-7 space-y-6">
        <p className="font-display text-[10px] tracking-[0.3em] uppercase text-accent">
          For chefs &amp; home cooks
        </p>
        <h2 className="font-display text-4xl md:text-6xl uppercase tracking-tight leading-[0.95]">
          Monetize your <span className="text-accent">culinary flair.</span>
        </h2>
        <p className="text-lg text-primary-foreground/80 max-w-xl leading-relaxed">
          Share your signature dishes with home cooks worldwide. Set your own
          price and reach a global community of cooks.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/sell"
            className="bg-accent text-accent-foreground px-7 py-3.5 rounded-full font-display text-sm uppercase tracking-widest hover:brightness-110 transition-all"
          >
            Start selling
          </Link>
          <Link
            to="/chefs"
            className="bg-transparent text-primary-foreground border border-primary-foreground/30 px-7 py-3.5 rounded-full font-display text-sm uppercase tracking-widest hover:bg-primary-foreground hover:text-primary transition-all"
          >
            Browse chefs
          </Link>
        </div>
      </div>
      <div className="lg:col-span-5 grid grid-cols-2 gap-3 w-full">
        <Stat label="You set the price" value="$0–∞" />
        <Stat label="Reach" value="Global" />
        <Stat label="Upfront cost" value="None" />
        <Stat label="Payout" value="Direct" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-primary-foreground/5 backdrop-blur-sm rounded-2xl p-5 border border-accent/20 min-w-0">
      <p className="font-display text-xl md:text-2xl tracking-tight text-accent truncate">
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-primary-foreground/60 mt-2 leading-snug">{label}</p>
    </div>
  );
}