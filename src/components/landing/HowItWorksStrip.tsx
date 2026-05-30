const STEPS = [
  {
    title: "Tell us what you have",
    body: "Add whatever's in your fridge, or name a dish you're craving.",
  },
  {
    title: "AI plans the recipe",
    body: "500+ global cuisines, measurements, steps and timings.",
  },
  {
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
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className="relative bg-card border border-border rounded-2xl p-5 md:p-6 flex items-start gap-4"
          >
            <span
              aria-hidden
              className="shrink-0 font-serif italic text-4xl md:text-5xl leading-none text-border select-none"
              style={{ fontWeight: 400 }}
            >
              0{i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-accent mb-1.5">
                Step 0{i + 1}
              </p>
              <h3 className="font-serif text-lg md:text-xl tracking-tight leading-tight mb-1.5 text-foreground">
                {s.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {s.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}