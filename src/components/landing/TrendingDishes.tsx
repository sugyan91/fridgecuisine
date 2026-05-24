import { useEffect, useMemo, useState } from "react";
import pastaImg from "@/assets/food-pasta.jpg";
import sushiImg from "@/assets/food-sushi.jpg";
import tacosImg from "@/assets/food-tacos.jpg";
import curryImg from "@/assets/food-curry.jpg";
import burgerImg from "@/assets/food-burger.jpg";
import pizzaImg from "@/assets/food-pizza.jpg";
import dalImg from "@/assets/recipe-dal.jpg";
import paneerImg from "@/assets/recipe-paneer.jpg";
import momoImg from "@/assets/recipe-momo.jpg";
import chanaImg from "@/assets/recipe-chana.jpg";
import riceImg from "@/assets/recipe-rice.jpg";
import saagImg from "@/assets/recipe-saag.jpg";

type Dish = { name: string; img: string; flag: string; origin: string };

const DISHES: Dish[] = [
  { name: "Creamy Carbonara", img: pastaImg, flag: "🇮🇹", origin: "Italy" },
  { name: "Salmon Sushi Bowl", img: sushiImg, flag: "🇯🇵", origin: "Japan" },
  { name: "Street Tacos al Pastor", img: tacosImg, flag: "🇲🇽", origin: "Mexico" },
  { name: "Thai Green Curry", img: curryImg, flag: "🇹🇭", origin: "Thailand" },
  { name: "Smash Burger", img: burgerImg, flag: "🇺🇸", origin: "USA" },
  { name: "Yellow Dal Tadka", img: dalImg, flag: "🇮🇳", origin: "India" },
  { name: "Steamed Momo", img: momoImg, flag: "🇳🇵", origin: "Nepal" },
  { name: "Bibimbap", img: riceImg, flag: "🇰🇷", origin: "Korea" },
  { name: "Pho Bo", img: curryImg, flag: "🇻🇳", origin: "Vietnam" },
  { name: "Kung Pao Chicken", img: paneerImg, flag: "🇨🇳", origin: "China" },
  { name: "Coq au Vin", img: pastaImg, flag: "🇫🇷", origin: "France" },
  { name: "Paella Valenciana", img: riceImg, flag: "🇪🇸", origin: "Spain" },
  { name: "Moussaka", img: saagImg, flag: "🇬🇷", origin: "Greece" },
  { name: "Lamb Tagine", img: chanaImg, flag: "🇲🇦", origin: "Morocco" },
  { name: "Doro Wat", img: saagImg, flag: "🇪🇹", origin: "Ethiopia" },
  { name: "Jollof Rice", img: riceImg, flag: "🇳🇬", origin: "Nigeria" },
  { name: "Mezze Platter", img: chanaImg, flag: "🇱🇧", origin: "Lebanon" },
  { name: "Adana Kebab", img: tacosImg, flag: "🇹🇷", origin: "Turkey" },
  { name: "Lomo Saltado", img: burgerImg, flag: "🇵🇪", origin: "Peru" },
  { name: "Feijoada", img: chanaImg, flag: "🇧🇷", origin: "Brazil" },
  { name: "Chimichurri Steak", img: burgerImg, flag: "🇦🇷", origin: "Argentina" },
  { name: "Chicken Adobo", img: paneerImg, flag: "🇵🇭", origin: "Philippines" },
  { name: "Nasi Goreng", img: riceImg, flag: "🇮🇩", origin: "Indonesia" },
  { name: "Fish & Chips", img: burgerImg, flag: "🇬🇧", origin: "UK" },
  { name: "Bratwurst Plate", img: burgerImg, flag: "🇩🇪", origin: "Germany" },
  { name: "Margherita Pizza", img: pizzaImg, flag: "🇮🇹", origin: "Italy-alt" },
];

type Props = {
  onPick: (dishName: string) => void;
};

const ROTATE_MS = 210_000; // 3.5 minutes

function pickUnique(pool: Dish[], cursor: number, count: number): Dish[] {
  const seen = new Set<string>();
  const out: Dish[] = [];
  const n = pool.length;
  for (let i = 0; i < n && out.length < count; i++) {
    const d = pool[(cursor + i) % n];
    const key = d.origin.replace("-alt", "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
  }
  return out;
}

export function TrendingDishes({ onPick }: Props) {
  // Four bento slots: 0=hero (large), 1=wide secondary, 2/3=small squares.
  const SLOTS = 4;
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCursor((c) => (c + SLOTS) % DISHES.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const visible = useMemo(() => pickUnique(DISHES, cursor, SLOTS), [cursor]);
  const [hero, second, third, fourth] = visible;

  if (!hero) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-[280px_280px] md:grid-rows-2 md:h-[640px] gap-4 md:gap-6">
      <BentoTile dish={hero} onPick={onPick} variant="hero" className="col-span-2 row-span-2" />
      {second && (
        <BentoTile
          dish={second}
          onPick={onPick}
          variant="wide"
          className="col-span-2 md:col-span-2"
        />
      )}
      {third && (
        <BentoTile dish={third} onPick={onPick} variant="small" className="col-span-1" />
      )}
      {fourth && (
        <BentoTile dish={fourth} onPick={onPick} variant="small" className="col-span-1" />
      )}
    </div>
  );
}

function BentoTile({
  dish,
  onPick,
  variant,
  className,
}: {
  dish: Dish;
  onPick: (name: string) => void;
  variant: "hero" | "wide" | "small";
  className?: string;
}) {
  const country = dish.origin.replace("-alt", "");
  return (
    <button
      type="button"
      onClick={() => onPick(dish.name)}
      className={`relative group overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-secondary text-left transition-all hover:shadow-[0_24px_48px_-16px_rgb(31_42_26/0.18)] ${className ?? ""}`}
    >
      <img
        src={dish.img}
        alt={dish.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1F2A1A]/80 via-[#1F2A1A]/10 to-transparent" />

      {variant === "hero" ? (
        <div className="absolute bottom-8 left-8 right-8 text-white space-y-3">
          <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-semibold border border-white/20 inline-flex items-center gap-1.5 uppercase tracking-[0.15em]">
            <span aria-hidden>{dish.flag}</span>
            {country}
          </span>
          <h3 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-[1.05]">
            {dish.name}
          </h3>
          <p className="opacity-80 text-sm flex items-center gap-2 group-hover:translate-x-1 transition-transform">
            Start cooking <span className="text-lg">→</span>
          </p>
        </div>
      ) : variant === "wide" ? (
        <div className="absolute bottom-6 left-6 text-white">
          <span className="text-[10px] font-display font-semibold uppercase tracking-[0.15em] text-primary-foreground/90 mb-1 flex items-center gap-1.5">
            <span aria-hidden>{dish.flag}</span> {country}
          </span>
          <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight">
            {dish.name}
          </h3>
        </div>
      ) : (
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <h3 className="font-display text-base md:text-lg font-semibold leading-tight">
            {dish.name}
          </h3>
          <p className="text-[10px] opacity-80 mt-0.5 flex items-center gap-1">
            <span aria-hidden>{dish.flag}</span> {country}
          </p>
        </div>
      )}
    </button>
  );
}