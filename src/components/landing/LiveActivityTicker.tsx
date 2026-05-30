import { useEffect, useState } from "react";

const events = [
  { name: "Sarah", city: "Austin", verb: "just cooked", dish: "Thai Basil Chicken" },
  { name: "Marco", city: "Milan", verb: "saved", dish: "Cacio e Pepe" },
  { name: "Priya", city: "London", verb: "is plating", dish: "Butter Chaat Bowl" },
  { name: "Yuki", city: "Osaka", verb: "rated", dish: "Miso Salmon ★★★★★" },
  { name: "Diego", city: "Mexico City", verb: "just cooked", dish: "Tacos al Pastor" },
  { name: "Amara", city: "Lagos", verb: "shared", dish: "Jollof Rice" },
  { name: "Léa", city: "Paris", verb: "is prepping", dish: "Coq au Vin" },
  { name: "Noah", city: "Brooklyn", verb: "just cooked", dish: "Smashburger Night" },
  { name: "Hana", city: "Seoul", verb: "saved", dish: "Kimchi Jjigae" },
  { name: "Omar", city: "Cairo", verb: "rated", dish: "Koshari ★★★★★" },
];

export function LiveActivityTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % events.length), 3000);
    return () => clearInterval(t);
  }, []);
  const e = events[i];
  return (
    <div className="mt-3 flex justify-center">
      <div className="inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-card/70 backdrop-blur-sm px-3.5 py-1.5 text-xs md:text-sm shadow-sm">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span key={i} className="animate-fade-in text-foreground/80">
          <span className="font-semibold text-foreground">{e.name}</span>
          <span className="text-foreground/60"> in {e.city} </span>
          {e.verb}{" "}
          <span className="font-semibold text-foreground">{e.dish}</span>
        </span>
      </div>
    </div>
  );
}