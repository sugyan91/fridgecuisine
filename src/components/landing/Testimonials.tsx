type Accent = "gold" | "paprika" | "sage";

const ACCENT_VAR: Record<Accent, string> = {
  gold: "var(--accent-gold)",
  paprika: "var(--paprika)",
  sage: "var(--sage)",
};

const QUOTES: {
  quote: string;
  name: string;
  role: string;
  initials: string;
  accent: Accent;
}[] = [
  {
    quote:
      "I had three sad ingredients in my fridge and ended up making the best stir-fry of my life. This app is my new best friend.",
    name: "Priya M.",
    role: "Home cook · London",
    initials: "PM",
    accent: "gold",
  },
  {
    quote:
      "Finally — a recipe app that doesn't bury the recipe under a life story. Type a dish, get a real recipe. That's it.",
    name: "Marco D.",
    role: "Weeknight dad · Milan",
    initials: "MD",
    accent: "paprika",
  },
  {
    quote:
      "I cook from 8 countries in a week now. My partner thinks I went to culinary school in secret.",
    name: "Jess K.",
    role: "Curious eater · Brooklyn",
    initials: "JK",
    accent: "sage",
  },
  {
    quote:
      "Pantry mode is genius. Half an onion, leftover rice, one egg — and somehow dinner. No grocery run, no guilt.",
    name: "Aisha R.",
    role: "Grad student · Toronto",
    initials: "AR",
    accent: "paprika",
  },
  {
    quote:
      "My kid is gluten-free and I'm out of ideas by Tuesday. This thing rescued my whole week — twice.",
    name: "Daniel O.",
    role: "Dad of two · Austin",
    initials: "DO",
    accent: "sage",
  },
  {
    quote:
      "I asked for ‘something my Sicilian grandmother would approve of’ and it actually delivered. I'm a little emotional.",
    name: "Elena V.",
    role: "Food writer · Lisbon",
    initials: "EV",
    accent: "gold",
  },
  {
    quote:
      "11pm, starving, three things in the fridge. Thirty seconds later I'm eating shakshuka. This shouldn't be legal.",
    name: "Sam T.",
    role: "Night owl · Berlin",
    initials: "ST",
    accent: "gold",
  },
  {
    quote:
      "I travel a lot and I miss the food. Typing ‘Hanoi street breakfast’ and getting it right — that's the magic.",
    name: "Noor A.",
    role: "Designer · Dubai",
    initials: "NA",
    accent: "sage",
  },
  {
    quote:
      "I cancelled two recipe subscriptions. No ads, no scrolling past someone's divorce — just dinner. Perfect.",
    name: "Hiro K.",
    role: "Engineer · Osaka",
    initials: "HK",
    accent: "paprika",
  },
];

export function Testimonials() {
  return (
    <>
      {/* Mobile: horizontal snap scroller */}
      <div className="md:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <div className="flex gap-4 pb-2">
          {QUOTES.map((q) => (
            <div
              key={q.name}
              className="snap-start shrink-0 w-[82%] first:pl-0"
            >
              <Card q={q} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: masonry via CSS columns */}
      <div className="hidden md:block columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
        {QUOTES.map((q) => (
          <div key={q.name} className="mb-5 break-inside-avoid">
            <Card q={q} />
          </div>
        ))}
      </div>
    </>
  );
}

function Card({
  q,
}: {
  q: {
    quote: string;
    name: string;
    role: string;
    initials: string;
    accent: Accent;
  };
}) {
  const accent = ACCENT_VAR[q.accent];
  return (
    <figure className="group h-full bg-card border border-border rounded-3xl p-6 shadow-[var(--shadow-soft)] flex flex-col transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift,var(--shadow-soft))]">
      <span
        aria-hidden
        className="font-display text-5xl leading-none mb-2"
        style={{ color: accent }}
      >
        “
      </span>
      <blockquote className="text-[15px] leading-relaxed text-foreground/90 flex-1">
        {q.quote}
      </blockquote>
      <figcaption className="mt-5 pt-4 border-t border-border flex items-center gap-3">
        <span
          aria-hidden
          className="size-10 rounded-full grid place-items-center font-display font-bold text-sm text-foreground shrink-0"
          style={{ backgroundColor: `color-mix(in oklab, ${accent} 28%, transparent)` }}
        >
          {q.initials}
        </span>
        <div className="min-w-0">
          <p className="font-display font-semibold text-sm tracking-tight truncate">
            {q.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {q.role}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}