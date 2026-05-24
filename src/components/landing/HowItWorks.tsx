const STEPS = [
  {
    title: "Tell us what you have",
    body: "Add ingredients from your fridge, or just name a dish you're craving. Our AI understands flavours and pairings perfectly.",
  },
  {
    title: "AI plans the recipe",
    body: "Our kitchen searches 500+ global cuisines and returns the perfect recipe with measurements, steps and timings.",
  },
  {
    title: "Cook & save",
    body: "Follow step-by-step guidance, save recipes to your personal pantry, and share your creations with the community.",
  },
];

export function HowItWorks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
      {STEPS.map((s, i) => (
        <div key={s.title} className="space-y-5">
          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary border border-primary/20 grid place-items-center font-display font-semibold text-lg">
            {i + 1}
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground leading-tight">
              {s.title}
            </h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              {s.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}