import { useEffect, useMemo, useState } from "react";
import { Flag } from "@/lib/flag";
import phoBoImg from "@/assets/trending/pho-bo.jpg";
import momoImg from "@/assets/trending/momo.jpg";
import xiaoLongBaoImg from "@/assets/trending/xiao-long-bao.jpg";
import pierogiImg from "@/assets/trending/pierogi.jpg";
import borschtImg from "@/assets/trending/borscht.jpg";
import doroWatImg from "@/assets/trending/doro-wat.jpg";
import jollofRiceImg from "@/assets/trending/jollof-rice.jpg";
import bunnyChowImg from "@/assets/trending/bunny-chow.jpg";
import lomoSaltadoImg from "@/assets/trending/lomo-saltado.jpg";
import carbonaraImg from "@/assets/trending/carbonara.jpg";
import margheritaPizzaImg from "@/assets/trending/margherita-pizza.jpg";
import truffleRisottoImg from "@/assets/trending/truffle-risotto.jpg";
import cacioEPepeImg from "@/assets/trending/cacio-e-pepe.jpg";
import salmonSushiBowlImg from "@/assets/trending/salmon-sushi-bowl.jpg";
import tonkotsuRamenImg from "@/assets/trending/tonkotsu-ramen.jpg";
import handPulledNoodlesImg from "@/assets/trending/hand-pulled-noodles.jpg";
import tacosAlPastorImg from "@/assets/trending/tacos-al-pastor.jpg";
import molePoblanoImg from "@/assets/trending/mole-poblano.jpg";
import thaiGreenCurryImg from "@/assets/trending/thai-green-curry.jpg";
import padSeeEwImg from "@/assets/trending/pad-see-ew.jpg";
import butterChickenImg from "@/assets/trending/butter-chicken.jpg";
import bibimbapImg from "@/assets/trending/bibimbap.jpg";
import bouillabaisseImg from "@/assets/trending/bouillabaisse.jpg";
import coqAuVinImg from "@/assets/trending/coq-au-vin.jpg";
import paellaImg from "@/assets/trending/paella.jpg";
import moussakaImg from "@/assets/trending/moussaka.jpg";
import lambTagineImg from "@/assets/trending/lamb-tagine.jpg";
import iskenderKebapImg from "@/assets/trending/iskender-kebap.jpg";
import hummusImg from "@/assets/trending/hummus.jpg";
import shakshukaImg from "@/assets/trending/shakshuka.jpg";
import cevicheImg from "@/assets/trending/ceviche.jpg";
import shrimpLinguineImg from "@/assets/trending/shrimp-linguine.jpg";

type Dish = { name: string; img: string; flag: string; origin: string };

const DISHES: Dish[] = [
  // Italy
  { name: "Creamy Carbonara",        flag: "🇮🇹", origin: "Italy",       img: carbonaraImg },
  { name: "Margherita Pizza",        flag: "🇮🇹", origin: "Italy-2",     img: margheritaPizzaImg },
  { name: "Truffle Mushroom Risotto",flag: "🇮🇹", origin: "Italy-3",     img: truffleRisottoImg },
  { name: "Cacio e Pepe",            flag: "🇮🇹", origin: "Italy-4",     img: cacioEPepeImg },
  // Japan
  { name: "Salmon Sushi Bowl",       flag: "🇯🇵", origin: "Japan",       img: salmonSushiBowlImg },
  { name: "Tonkotsu Ramen",          flag: "🇯🇵", origin: "Japan-2",     img: tonkotsuRamenImg },
  { name: "Hand-Pulled Noodles",     flag: "🇨🇳", origin: "China-2",     img: handPulledNoodlesImg },
  // Mexico
  { name: "Street Tacos al Pastor",  flag: "🇲🇽", origin: "Mexico",      img: tacosAlPastorImg },
  { name: "Mole Poblano",            flag: "🇲🇽", origin: "Mexico-2",    img: molePoblanoImg },
  // Thailand
  { name: "Thai Green Curry",        flag: "🇹🇭", origin: "Thailand",    img: thaiGreenCurryImg },
  { name: "Pad See Ew",              flag: "🇹🇭", origin: "Thailand-2",  img: padSeeEwImg },
  // India
  { name: "Butter Chicken",          flag: "🇮🇳", origin: "India",       img: butterChickenImg },
  // Nepal & East Asia
  { name: "Steamed Momo",            flag: "🇳🇵", origin: "Nepal",       img: momoImg },
  { name: "Bibimbap",                flag: "🇰🇷", origin: "Korea",       img: bibimbapImg },
  { name: "Xiao Long Bao",           flag: "🇨🇳", origin: "China",       img: xiaoLongBaoImg },
  // Vietnam
  { name: "Pho Bo",                  flag: "🇻🇳", origin: "Vietnam",     img: phoBoImg },
  // France
  { name: "Bouillabaisse",           flag: "🇫🇷", origin: "France",      img: bouillabaisseImg },
  { name: "Coq au Vin",              flag: "🇫🇷", origin: "France-2",    img: coqAuVinImg },
  // Spain & Greece
  { name: "Paella Valenciana",       flag: "🇪🇸", origin: "Spain",       img: paellaImg },
  { name: "Lamb Moussaka",           flag: "🇬🇷", origin: "Greece",      img: moussakaImg },
  // Africa
  { name: "Lamb Tagine",             flag: "🇲🇦", origin: "Morocco",     img: lambTagineImg },
  { name: "Doro Wat",                flag: "🇪🇹", origin: "Ethiopia",    img: doroWatImg },
  { name: "Jollof Rice",             flag: "🇳🇬", origin: "Nigeria",     img: jollofRiceImg },
  { name: "Bunny Chow",              flag: "🇿🇦", origin: "South Africa",img: bunnyChowImg },
  // Middle East
  { name: "İskender Kebap",          flag: "🇹🇷", origin: "Turkey",      img: iskenderKebapImg },
  { name: "Hummus Plate",            flag: "🇱🇧", origin: "Lebanon",     img: hummusImg },
  { name: "Shakshuka",               flag: "🇮🇱", origin: "Israel",      img: shakshukaImg },
  // Americas
  { name: "Ceviche Mixto",           flag: "🇵🇪", origin: "Peru",        img: cevicheImg },
  { name: "Lomo Saltado",            flag: "🇵🇪", origin: "Peru-2",      img: lomoSaltadoImg },
  // Eastern Europe
  { name: "Pierogi",                 flag: "🇵🇱", origin: "Poland",      img: pierogiImg },
  { name: "Borscht",                 flag: "🇺🇦", origin: "Ukraine",     img: borschtImg },
  // Seafood / Pasta extras
  { name: "Shrimp Linguine",         flag: "🇮🇹", origin: "Italy-5",     img: shrimpLinguineImg },
];

type Props = {
  onPick: (dishName: string) => void;
};

const ROTATE_MS = 8_000; // 8 seconds — show off the 120-photo pool

function pickUnique(pool: Dish[], cursor: number, count: number): Dish[] {
  const seen = new Set<string>();
  const out: Dish[] = [];
  const n = pool.length;
  for (let i = 0; i < n && out.length < count; i++) {
    const d = pool[(cursor + i) % n];
    const key = d.origin.replace(/-\d+$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
  }
  return out;
}

export function TrendingDishes({ onPick }: Props) {
  // Uniform Airbnb-style dish grid: 8 equal cards, 2 rows of 4 on desktop.
  const SLOTS = 8;
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCursor((c) => (c + SLOTS) % DISHES.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const visible = useMemo(() => pickUnique(DISHES, cursor, SLOTS), [cursor]);

  if (visible.length === 0) return null;

  return (
    <div
      key={cursor}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 animate-fade-in"
    >
      {visible.map((d) => (
        <BentoTile key={d.origin} dish={d} onPick={onPick} variant="small" />
      ))}
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
  const country = dish.origin.replace(/-\d+$/, "");
  const [broken, setBroken] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onPick(dish.name)}
      className={`relative group overflow-hidden rounded-2xl md:rounded-3xl bg-secondary text-left transition-all hover:shadow-[0_18px_36px_-14px_rgb(31_42_26/0.22)] aspect-[4/5] ${className ?? ""}`}
    >
      {broken ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-accent/15 to-primary/30">
          <Flag emoji={dish.flag} className="!w-16 !h-12 mb-2 rounded-md shadow" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70">
            {country}
          </span>
        </div>
      ) : (
        <img
          src={dish.img}
          alt={dish.name}
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

      {variant === "hero" ? (
        <div className="absolute bottom-8 left-8 right-8 text-white space-y-3">
          <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 uppercase tracking-[0.15em]">
            <Flag emoji={dish.flag} className="!w-4 !h-3 rounded-[2px]" />
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
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-1 flex items-center gap-1.5">
            <Flag emoji={dish.flag} className="!w-4 !h-3 rounded-[2px]" /> {country}
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
            <Flag emoji={dish.flag} className="!w-4 !h-3 rounded-[2px]" /> {country}
          </p>
        </div>
      )}
    </button>
  );
}