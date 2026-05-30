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
    <div className="relative">
      {/* Connecting hairline on desktop */}
      <div
        aria-hidden
        className="hidden md:block absolute top-1/2 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-y-1/2"
      />
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 md:items-center">
        {STEPS.map((s, i) => {
          const isMiddle = i === 1;
          return (
            <div
              key={s.title}
              className={`relative rounded-3xl border p-6 md:p-8 backdrop-blur-sm transition-transform ${
                isMiddle
                  ? "md:-translate-y-6 md:scale-[1.04] bg-white/[0.08] border-[var(--accent-gold)]/30 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]"
                  : "bg-white/[0.04] border-white/10"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  aria-hidden
                  className={`grid place-items-center size-12 rounded-2xl text-2xl ${
                    isMiddle
                      ? "bg-[var(--accent-gold)]/25"
                      : "bg-[var(--accent-gold)]/15"
                  }`}
                >
                  {s.icon}
                </span>
                <span
                  aria-hidden
                  className={`font-display text-4xl leading-none ${
                    isMiddle
                      ? "text-[var(--accent-gold)]"
                      : "text-[var(--accent-gold)]/60"
                  }`}
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
          );
        })}
      </div>
    </div>
  );
}