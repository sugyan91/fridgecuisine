import { Refrigerator, Sparkles, ChefHat } from "lucide-react";

const STEPS = [
  {
    icon: Refrigerator,
    title: "Tell us what you have",
    body: "Add ingredients from your fridge, or just name a dish you're craving.",
    color: "bg-turmeric",
  },
  {
    icon: Sparkles,
    title: "AI plans the recipe",
    body: "Our kitchen searches 500+ cuisines and returns the recipe with ingredients & timings.",
    color: "bg-sage",
  },
  {
    icon: ChefHat,
    title: "Cook & save",
    body: "Follow step-by-step timers, save your favourites, share with the community.",
    color: "bg-paprika text-white",
  },
];

export function HowItWorks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
      {STEPS.map((s, i) => (
        <div
          key={s.title}
          className="bg-white border-4 border-border rounded-3xl p-5 shadow-[6px_6px_0px_0px_var(--border)] relative"
        >
          <span className="absolute -top-3 -left-3 size-9 bg-foreground text-background font-black grid place-items-center rounded-full border-2 border-border">
            {i + 1}
          </span>
          <div className={`${s.color} size-12 rounded-2xl border-2 border-border grid place-items-center mb-3 shadow-[2px_2px_0px_0px_var(--border)]`}>
            <s.icon className="size-6" strokeWidth={2.5} />
          </div>
          <h3 className="font-display text-xl uppercase mb-1 leading-tight">{s.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  );
}