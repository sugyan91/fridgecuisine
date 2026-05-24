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
  const [cursor, setCursor] = useState(0);
  const [count, setCount] = useState(6);

  useEffect(() => {
    const update = () =>
      setCount(typeof window !== "undefined" && window.innerWidth < 768 ? 4 : 6);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCursor((c) => (c + count) % DISHES.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [count]);

  const visible = useMemo(() => pickUnique(DISHES, cursor, count), [cursor, count]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      {visible.map((d, slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onPick(d.name)}
          className="group relative aspect-[4/5] md:aspect-[4/3] overflow-hidden rounded-2xl border-2 border-border shadow-[3px_3px_0px_0px_var(--border)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_var(--border)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_var(--border)] transition-all text-left bg-white"
        >
          <img
            src={d.img}
            alt={d.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
          <div className="absolute top-2 left-2 bg-white/95 border-2 border-border rounded-full px-2 py-0.5 text-[11px] font-black flex items-center gap-1">
            <span aria-hidden>{d.flag}</span>
            <span className="uppercase tracking-wide">{d.origin.replace("-alt", "")}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="font-display text-white text-lg md:text-xl uppercase leading-tight drop-shadow">
              {d.name}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-turmeric mt-1">
              Tap to cook →
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}