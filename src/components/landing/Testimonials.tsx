const QUOTES = [
  {
    quote:
      "I had three sad ingredients in my fridge and ended up making the best stir-fry of my life. This app is my new best friend.",
    name: "Priya M.",
    role: "Home cook · London",
  },
  {
    quote:
      "Finally — a recipe app that doesn't bury the recipe under a life story. Type a dish, get a real recipe. That's it.",
    name: "Marco D.",
    role: "Weeknight dad · Milan",
  },
  {
    quote:
      "I cook from 8 countries in a week now. My partner thinks I went to culinary school in secret.",
    name: "Jess K.",
    role: "Curious eater · Brooklyn",
  },
];

export function Testimonials() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {QUOTES.map((q) => (
        <figure
          key={q.name}
          className="bg-card border border-border rounded-3xl p-6 shadow-[var(--shadow-soft)] flex flex-col"
        >
          <span
            aria-hidden
            className="font-display text-5xl leading-none text-[var(--accent-gold)] mb-2"
          >
            “
          </span>
          <blockquote className="text-base leading-relaxed text-foreground/90 flex-1">
            {q.quote}
          </blockquote>
          <figcaption className="mt-5 pt-4 border-t border-border">
            <p className="font-display font-semibold text-sm tracking-tight">
              {q.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{q.role}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}