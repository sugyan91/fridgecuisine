import { useEffect, useMemo, useState } from "react";
import phoBoImg from "@/assets/trending/pho-bo.jpg";
import momoImg from "@/assets/trending/momo.jpg";
import xiaoLongBaoImg from "@/assets/trending/xiao-long-bao.jpg";
import pierogiImg from "@/assets/trending/pierogi.jpg";
import borschtImg from "@/assets/trending/borscht.jpg";
import doroWatImg from "@/assets/trending/doro-wat.jpg";
import jollofRiceImg from "@/assets/trending/jollof-rice.jpg";
import bunnyChowImg from "@/assets/trending/bunny-chow.jpg";
import lomoSaltadoImg from "@/assets/trending/lomo-saltado.jpg";

type Dish = { name: string; img: string; flag: string; origin: string };

// 120+ real food photos via Unsplash CDN — no API key, free, hot-linkable.
const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;

const DISHES: Dish[] = [
  { name: "Creamy Carbonara", flag: "🇮🇹", origin: "Italy", img: u("1612874742237-6526221588e3") },
  { name: "Margherita Pizza", flag: "🇮🇹", origin: "Italy-2", img: u("1574071318508-1cdbab80d002") },
  { name: "Truffle Mushroom Risotto", flag: "🇮🇹", origin: "Italy-3", img: u("1476124369491-e7addf5db371") },
  { name: "Salmon Sushi Bowl", flag: "🇯🇵", origin: "Japan", img: u("1579871494447-9811cf80d66c") },
  { name: "Tonkotsu Ramen", flag: "🇯🇵", origin: "Japan-2", img: u("1557872943-16a5ac26437e") },
  { name: "Crispy Tempura", flag: "🇯🇵", origin: "Japan-3", img: u("1569718212165-3a8278d5f624") },
  { name: "Street Tacos al Pastor", flag: "🇲🇽", origin: "Mexico", img: u("1565299585323-38d6b0865b47") },
  { name: "Carne Asada Burrito", flag: "🇲🇽", origin: "Mexico-2", img: u("1626700051175-6818013e1d4f") },
  { name: "Chiles en Nogada", flag: "🇲🇽", origin: "Mexico-3", img: u("1599974579688-8dbdd335c77f") },
  { name: "Thai Green Curry", flag: "🇹🇭", origin: "Thailand", img: u("1455619452474-d2be8b1e70cd") },
  { name: "Pad Thai", flag: "🇹🇭", origin: "Thailand-2", img: u("1559314809-0d155014e29e") },
  { name: "Tom Yum Goong", flag: "🇹🇭", origin: "Thailand-3", img: u("1569562211093-4ed0d0758f12") },
  { name: "Smash Burger", flag: "🇺🇸", origin: "USA", img: u("1568901346375-23c9450c58cd") },
  { name: "Buffalo Wings", flag: "🇺🇸", origin: "USA-2", img: u("1567620832903-9fc6debc209f") },
  { name: "Brisket Plate", flag: "🇺🇸", origin: "USA-3", img: u("1544025162-d76694265947") },
  { name: "Mac & Cheese", flag: "🇺🇸", origin: "USA-4", img: u("1543339308-43e59d6b73a6") },
  { name: "Yellow Dal Tadka", flag: "🇮🇳", origin: "India", img: u("1546833999-b9f581a1996d") },
  { name: "Butter Chicken", flag: "🇮🇳", origin: "India-2", img: u("1588166524941-3bf61a9c41db") },
  { name: "Masala Dosa", flag: "🇮🇳", origin: "India-3", img: u("1630383249896-424e482df921") },
  { name: "Biryani", flag: "🇮🇳", origin: "India-4", img: u("1563379091339-03b21ab4a4f8") },
  { name: "Tandoori Chicken", flag: "🇮🇳", origin: "India-5", img: u("1599487488170-d11ec9c172f0") },
  { name: "Steamed Momo", flag: "🇳🇵", origin: "Nepal", img: u("1496116218417-1a781b1c416c") },
  { name: "Bibimbap", flag: "🇰🇷", origin: "Korea", img: u("1590301157890-4810ed352733") },
  { name: "Korean BBQ", flag: "🇰🇷", origin: "Korea-2", img: u("1583224964978-2257b960c3d3") },
  { name: "Kimchi Stew", flag: "🇰🇷", origin: "Korea-3", img: u("1583835746434-cf1534674b41") },
  { name: "Pho Bo", flag: "🇻🇳", origin: "Vietnam", img: phoBoImg },
  { name: "Banh Mi", flag: "🇻🇳", origin: "Vietnam-2", img: u("1590301157890-4810ed352733") },
  { name: "Spring Rolls", flag: "🇻🇳", origin: "Vietnam-3", img: u("1606502281004-f0e3a3d9d6d6") },
  { name: "Kung Pao Chicken", flag: "🇨🇳", origin: "China", img: u("1525755662778-989d0524087e") },
  { name: "Xiao Long Bao", flag: "🇨🇳", origin: "China-2", img: u("1496116218417-1a781b1c416c") },
  { name: "Mapo Tofu", flag: "🇨🇳", origin: "China-3", img: u("1582450871972-04a5b6b9eafa") },
  { name: "Peking Duck", flag: "🇨🇳", origin: "China-4", img: u("1563245372-f21724e3856d") },
  { name: "Coq au Vin", flag: "🇫🇷", origin: "France", img: u("1600891964092-4316c288032e") },
  { name: "Ratatouille", flag: "🇫🇷", origin: "France-2", img: u("1572453800999-e8d2d1589b7c") },
  { name: "Croque Monsieur", flag: "🇫🇷", origin: "France-3", img: u("1528207776546-365bb710ee93") },
  { name: "Beef Bourguignon", flag: "🇫🇷", origin: "France-4", img: u("1547496502-affa22d38842") },
  { name: "Paella Valenciana", flag: "🇪🇸", origin: "Spain", img: u("1534080564583-6be75777b70a") },
  { name: "Patatas Bravas", flag: "🇪🇸", origin: "Spain-2", img: u("1565299507177-b0ac66763828") },
  { name: "Gambas al Ajillo", flag: "🇪🇸", origin: "Spain-3", img: u("1585032226651-759b368d7246") },
  { name: "Moussaka", flag: "🇬🇷", origin: "Greece", img: u("1530469912745-a215c6b256ea") },
  { name: "Greek Salad", flag: "🇬🇷", origin: "Greece-2", img: u("1540420773420-3366772f4999") },
  { name: "Souvlaki Plate", flag: "🇬🇷", origin: "Greece-3", img: u("1551782450-a2132b4ba21d") },
  { name: "Lamb Tagine", flag: "🇲🇦", origin: "Morocco", img: u("1547573854-74d2a71d0826") },
  { name: "Couscous Royale", flag: "🇲🇦", origin: "Morocco-2", img: u("1505253758473-96b7015fcd40") },
  { name: "Doro Wat", flag: "🇪🇹", origin: "Ethiopia", img: u("1565958011703-44f9829ba187") },
  { name: "Jollof Rice", flag: "🇳🇬", origin: "Nigeria", img: u("1604329760661-e71dc83f8f26") },
  { name: "Suya Skewers", flag: "🇳🇬", origin: "Nigeria-2", img: u("1529193591184-b1d58069ecdd") },
  { name: "Mezze Platter", flag: "🇱🇧", origin: "Lebanon", img: u("1540914124281-342587941389") },
  { name: "Lamb Kibbeh", flag: "🇱🇧", origin: "Lebanon-2", img: u("1562967914-608f82629710") },
  { name: "Adana Kebab", flag: "🇹🇷", origin: "Turkey", img: u("1599487488170-d11ec9c172f0") },
  { name: "Turkish Baklava", flag: "🇹🇷", origin: "Turkey-2", img: u("1571877227200-a0d98ea607e9") },
  { name: "Lomo Saltado", flag: "🇵🇪", origin: "Peru", img: u("1565958011703-44f9829ba187") },
  { name: "Ceviche", flag: "🇵🇪", origin: "Peru-2", img: u("1559339352-11d035aa65de") },
  { name: "Feijoada", flag: "🇧🇷", origin: "Brazil", img: u("1604329760661-e71dc83f8f26") },
  { name: "Açaí Bowl", flag: "🇧🇷", origin: "Brazil-2", img: u("1490474504059-bf2db5ab2348") },
  { name: "Chimichurri Steak", flag: "🇦🇷", origin: "Argentina", img: u("1546964124-0cce460f38ef") },
  { name: "Empanadas", flag: "🇦🇷", origin: "Argentina-2", img: u("1604544539681-3e74cc97817b") },
  { name: "Chicken Adobo", flag: "🇵🇭", origin: "Philippines", img: u("1604329760661-e71dc83f8f26") },
  { name: "Lechon", flag: "🇵🇭", origin: "Philippines-2", img: u("1544025162-d76694265947") },
  { name: "Nasi Goreng", flag: "🇮🇩", origin: "Indonesia", img: u("1567337710282-00832b415979") },
  { name: "Satay Skewers", flag: "🇮🇩", origin: "Indonesia-2", img: u("1529193591184-b1d58069ecdd") },
  { name: "Fish & Chips", flag: "🇬🇧", origin: "UK", img: u("1580217593608-61931cefc821") },
  { name: "Sunday Roast", flag: "🇬🇧", origin: "UK-2", img: u("1544025162-d76694265947") },
  { name: "Shepherd's Pie", flag: "🇬🇧", origin: "UK-3", img: u("1574484184081-afea8a62f9c4") },
  { name: "Bratwurst Plate", flag: "🇩🇪", origin: "Germany", img: u("1599974579688-8dbdd335c77f") },
  { name: "Schnitzel", flag: "🇩🇪", origin: "Germany-2", img: u("1599487488170-d11ec9c172f0") },
  { name: "Pretzel & Beer", flag: "🇩🇪", origin: "Germany-3", img: u("1568827999250-3f6afff96e66") },
  { name: "Pierogi", flag: "🇵🇱", origin: "Poland", img: u("1496116218417-1a781b1c416c") },
  { name: "Borscht", flag: "🇺🇦", origin: "Ukraine", img: u("1547573854-74d2a71d0826") },
  { name: "Beef Stroganoff", flag: "🇷🇺", origin: "Russia", img: u("1547573854-74d2a71d0826") },
  { name: "Goulash", flag: "🇭🇺", origin: "Hungary", img: u("1547496502-affa22d38842") },
  { name: "Smørrebrød", flag: "🇩🇰", origin: "Denmark", img: u("1540420773420-3366772f4999") },
  { name: "Swedish Meatballs", flag: "🇸🇪", origin: "Sweden", img: u("1544025162-d76694265947") },
  { name: "Salmon Gravlax", flag: "🇳🇴", origin: "Norway", img: u("1519708227418-c8fd9a32b7a2") },
  { name: "Belgian Waffles", flag: "🇧🇪", origin: "Belgium", img: u("1562376552-0d160a2f238d") },
  { name: "Stamppot", flag: "🇳🇱", origin: "Netherlands", img: u("1543339308-43e59d6b73a6") },
  { name: "Fondue", flag: "🇨🇭", origin: "Switzerland", img: u("1541592106381-b31e9677c0e5") },
  { name: "Wiener Schnitzel", flag: "🇦🇹", origin: "Austria", img: u("1599487488170-d11ec9c172f0") },
  { name: "Bacalhau", flag: "🇵🇹", origin: "Portugal", img: u("1534080564583-6be75777b70a") },
  { name: "Pastel de Nata", flag: "🇵🇹", origin: "Portugal-2", img: u("1571877227200-a0d98ea607e9") },
  { name: "Hummus Plate", flag: "🇮🇱", origin: "Israel", img: u("1540914124281-342587941389") },
  { name: "Shakshuka", flag: "🇮🇱", origin: "Israel-2", img: u("1590412200988-a436970781fa") },
  { name: "Falafel Wrap", flag: "🇪🇬", origin: "Egypt", img: u("1540420773420-3366772f4999") },
  { name: "Koshari", flag: "🇪🇬", origin: "Egypt-2", img: u("1565958011703-44f9829ba187") },
  { name: "Bunny Chow", flag: "🇿🇦", origin: "South Africa", img: u("1565958011703-44f9829ba187") },
  { name: "Bobotie", flag: "🇿🇦", origin: "South Africa-2", img: u("1547496502-affa22d38842") },
  { name: "Jerk Chicken", flag: "🇯🇲", origin: "Jamaica", img: u("1604329760661-e71dc83f8f26") },
  { name: "Cuban Sandwich", flag: "🇨🇺", origin: "Cuba", img: u("1528207776546-365bb710ee93") },
  { name: "Arepas", flag: "🇻🇪", origin: "Venezuela", img: u("1604544539681-3e74cc97817b") },
  { name: "Ajiaco", flag: "🇨🇴", origin: "Colombia", img: u("1547573854-74d2a71d0826") },
  { name: "Poutine", flag: "🇨🇦", origin: "Canada", img: u("1585032226651-759b368d7246") },
  { name: "Maple Pancakes", flag: "🇨🇦", origin: "Canada-2", img: u("1567620905732-2d1ec7ab7445") },
  { name: "Lobster Roll", flag: "🇺🇸", origin: "USA-5", img: u("1559339352-11d035aa65de") },
  { name: "Clam Chowder", flag: "🇺🇸", origin: "USA-6", img: u("1547573854-74d2a71d0826") },
  { name: "Avocado Toast", flag: "🥑", origin: "Brunch", img: u("1541519227354-08fa5d50c44d") },
  { name: "Eggs Benedict", flag: "🍳", origin: "Brunch-2", img: u("1525351484163-7529414344d8") },
  { name: "Açaí Smoothie Bowl", flag: "🍓", origin: "Brunch-3", img: u("1490474504059-bf2db5ab2348") },
  { name: "Pancake Stack", flag: "🥞", origin: "Brunch-4", img: u("1567620905732-2d1ec7ab7445") },
  { name: "French Toast", flag: "🥐", origin: "Brunch-5", img: u("1484723091739-30a097e8f929") },
  { name: "Croissant Plate", flag: "🥐", origin: "Brunch-6", img: u("1555507036-ab1f4038808a") },
  { name: "Caesar Salad", flag: "🥗", origin: "Salad", img: u("1546793665-c74683f339c1") },
  { name: "Burrata Caprese", flag: "🥗", origin: "Salad-2", img: u("1540420773420-3366772f4999") },
  { name: "Poke Bowl", flag: "🥗", origin: "Salad-3", img: u("1546069901-ba9599a7e63c") },
  { name: "Quinoa Power Bowl", flag: "🥗", origin: "Salad-4", img: u("1490645935967-10de6ba17061") },
  { name: "Charcuterie Board", flag: "🧀", origin: "Snack", img: u("1541529086526-db283c563270") },
  { name: "Cheese Plate", flag: "🧀", origin: "Snack-2", img: u("1486297678162-eb2a19b0a32d") },
  { name: "Loaded Nachos", flag: "🌶️", origin: "Snack-3", img: u("1582169296194-e4d644c48063") },
  { name: "Chocolate Lava Cake", flag: "🍫", origin: "Dessert", img: u("1551024506-0bccd828d307") },
  { name: "Tiramisu", flag: "🍰", origin: "Dessert-2", img: u("1571877227200-a0d98ea607e9") },
  { name: "Crème Brûlée", flag: "🍮", origin: "Dessert-3", img: u("1567337710282-00832b415979") },
  { name: "Macarons", flag: "🍬", origin: "Dessert-4", img: u("1558326567-98ae2405596b") },
  { name: "Ice Cream Sundae", flag: "🍨", origin: "Dessert-5", img: u("1563805042-7684c019e1cb") },
  { name: "Cheesecake Slice", flag: "🍰", origin: "Dessert-6", img: u("1565958011703-44f9829ba187") },
  { name: "Donut Box", flag: "🍩", origin: "Dessert-7", img: u("1551024601-bec78aea704b") },
  { name: "Espresso Affogato", flag: "☕", origin: "Dessert-8", img: u("1572490122747-3968b75cc699") },
  { name: "Acai Bowl Tropical", flag: "🍍", origin: "Healthy", img: u("1490474504059-bf2db5ab2348") },
  { name: "Grain Buddha Bowl", flag: "🥣", origin: "Healthy-2", img: u("1512621776951-a57141f2eefd") },
  { name: "Avocado Sushi Roll", flag: "🍣", origin: "Healthy-3", img: u("1579871494447-9811cf80d66c") },
  { name: "Roasted Veg Plate", flag: "🥕", origin: "Healthy-4", img: u("1574484184081-afea8a62f9c4") },
  { name: "Grilled Salmon", flag: "🐟", origin: "Seafood", img: u("1519708227418-c8fd9a32b7a2") },
  { name: "Shrimp Linguine", flag: "🍤", origin: "Seafood-2", img: u("1551183053-bf91a1d81141") },
  { name: "Seared Tuna", flag: "🐟", origin: "Seafood-3", img: u("1585032226651-759b368d7246") },
  { name: "Crab Cakes", flag: "🦀", origin: "Seafood-4", img: u("1559339352-11d035aa65de") },
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
  return (
    <button
      type="button"
      onClick={() => onPick(dish.name)}
      className={`relative group overflow-hidden rounded-2xl md:rounded-3xl bg-secondary text-left transition-all hover:shadow-[0_18px_36px_-14px_rgb(31_42_26/0.22)] aspect-[4/5] ${className ?? ""}`}
    >
      <img
        src={dish.img}
        alt={dish.name}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

      {variant === "hero" ? (
        <div className="absolute bottom-8 left-8 right-8 text-white space-y-3">
          <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 uppercase tracking-[0.15em]">
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
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-1 flex items-center gap-1.5">
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