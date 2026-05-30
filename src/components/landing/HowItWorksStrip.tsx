const STEPS = [
  {
    icon: "🥬",
    title: "Tell us what you have",
    body: "Add whatever's in your fridge, or name a dish you're craving.",
  },
  {
    icon: "👨‍🍳",
    title: "AI plans the recipe",
    body: "500+ global cuisines, measurements, steps and timings.",
  },
  {
    icon: "🍽️",
    title: "Cook & save",
    body: "Follow step-by-step, save favourites, share with the community.",
  },
];

export function HowItWorksStrip() {
  return (
    <div className="relative">
      {/* Connecting hairline on desktop */}
      <div
        aria-hidden
        className="hidden md:block absolute top-1/2 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2"
      />
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className="relative bg-card border border-border rounded-2xl p-4 md:p-5 flex items-start gap-3 shadow-[var(--shadow-soft)]"
          >
            <span
              aria-hidden
              className="shrink-0 grid place-items-center size-10 rounded-xl bg-[var(--accent-gold)]/15 text-xl"
            >
              {s.icon}
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span
                  aria-hidden
                  className="font-display text-xs font-bold tracking-[0.2em] text-accent"
                >
                  0{i + 1}
                </span>
                <h3 className="font-display text-sm md:text-base font-semibold tracking-tight leading-tight">
                  {s.title}
                </h3>
              </div>
              <p className="text-xs md:text-[13px] text-muted-foreground leading-snug">
                {s.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}