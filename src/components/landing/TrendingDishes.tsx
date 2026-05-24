import pastaImg from "@/assets/food-pasta.jpg";
import sushiImg from "@/assets/food-sushi.jpg";
import tacosImg from "@/assets/food-tacos.jpg";
import curryImg from "@/assets/food-curry.jpg";
import burgerImg from "@/assets/food-burger.jpg";
import pizzaImg from "@/assets/food-pizza.jpg";
import dalImg from "@/assets/recipe-dal.jpg";
import paneerImg from "@/assets/recipe-paneer.jpg";
import momoImg from "@/assets/recipe-momo.jpg";

type Dish = { name: string; img: string; flag: string; origin: string };

const DISHES: Dish[] = [
  { name: "Creamy Carbonara", img: pastaImg, flag: "🇮🇹", origin: "Italy" },
  { name: "Salmon Sushi Bowl", img: sushiImg, flag: "🇯🇵", origin: "Japan" },
  { name: "Street Tacos al Pastor", img: tacosImg, flag: "🇲🇽", origin: "Mexico" },
  { name: "Thai Green Curry", img: curryImg, flag: "🇹🇭", origin: "Thailand" },
  { name: "Smash Burger", img: burgerImg, flag: "🇺🇸", origin: "USA" },
  { name: "Margherita Pizza", img: pizzaImg, flag: "🇮🇹", origin: "Italy" },
  { name: "Yellow Dal Tadka", img: dalImg, flag: "🇮🇳", origin: "India" },
  { name: "Paneer Butter Masala", img: paneerImg, flag: "🇮🇳", origin: "India" },
  { name: "Steamed Momo", img: momoImg, flag: "🇳🇵", origin: "Nepal" },
];

type Props = {
  onPick: (dishName: string) => void;
};

export function TrendingDishes({ onPick }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      {DISHES.map((d) => (
        <button
          key={d.name}
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
            <span className="uppercase tracking-wide">{d.origin}</span>
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