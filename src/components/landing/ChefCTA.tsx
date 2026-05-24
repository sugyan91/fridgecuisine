import { Link } from "@tanstack/react-router";

export function ChefCTA() {
  return (
    <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-center bg-secondary/60 rounded-[2.5rem] p-8 md:p-14 border border-border">
      <div className="md:col-span-7 space-y-6">
        <p className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-primary">
          For chefs &amp; home cooks
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
          Are you a chef? Earn from your recipes.
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
          Share your signature dishes with home cooks worldwide. Set your own
          price and reach a global community of cooks.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/sell"
            className="bg-primary text-primary-foreground px-7 py-3.5 rounded-full font-display font-semibold text-sm hover:brightness-110 transition-all"
          >
            Start selling
          </Link>
          <Link
            to="/chefs"
            className="bg-transparent text-foreground border border-foreground/20 px-7 py-3.5 rounded-full font-display font-semibold text-sm hover:bg-foreground hover:text-background transition-all"
          >
            Browse chefs
          </Link>
        </div>
      </div>
      <div className="md:col-span-5 grid grid-cols-2 gap-3">
        <Stat label="You set the price" value="$0–∞" />
        <Stat label="Reach" value="Worldwide" />
        <Stat label="Upfront cost" value="None" />
        <Stat label="Payout" value="To your bank" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background rounded-2xl p-5 border border-border">
      <p className="font-display text-xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1 leading-snug">{label}</p>
    </div>
  );
}