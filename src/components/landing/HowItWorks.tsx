const STEPS = [
  {
    icon: "🥬",
    title: "Tell us what you have",
    body: "Add ingredients from your fridge, or just name a dish you're craving. Our AI understands flavours and pairings perfectly.",
  },
  {
    icon: "👨‍🍳",
    title: "AI plans the recipe",
    body: "Our kitchen searches 500+ global cuisines and returns the perfect recipe with measurements, steps and timings.",
  },
  {
    icon: "🍽️",
    title: "Cook & save",
    body: "Follow step-by-step guidance, save recipes to your personal pantry, and share your creations with the community.",
  },
];

export function HowItWorks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
      {STEPS.map((s, i) => (
        <div
          key={s.title}
          className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-7 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <span
              aria-hidden
              className="grid place-items-center size-12 rounded-2xl bg-[var(--accent-gold)]/15 text-2xl"
            >
              {s.icon}
            </span>
            <span
              aria-hidden
              className="font-display text-3xl leading-none text-[var(--accent-gold)]/70"
            >
              0{i + 1}
            </span>
          </div>
          <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-white leading-tight mb-2">
            {s.title}
          </h3>
          <p className="text-sm md:text-base text-white/70 leading-relaxed">
            {s.body}
          </p>
        </div>
      ))}
    </div>
  );
}