import { useState } from "react";

type Country = { flag: string; cuisine: string; label: string };

const COUNTRIES: Country[] = [
  // Europe
  { flag: "🇮🇹", cuisine: "Italian", label: "Italy" },
  { flag: "🇫🇷", cuisine: "French", label: "France" },
  { flag: "🇪🇸", cuisine: "Spanish", label: "Spain" },
  { flag: "🇬🇷", cuisine: "Greek", label: "Greece" },
  { flag: "🇩🇪", cuisine: "German", label: "Germany" },
  { flag: "🇬🇧", cuisine: "British", label: "UK" },
  { flag: "🇵🇹", cuisine: "Portuguese", label: "Portugal" },
  { flag: "🇵🇱", cuisine: "Polish", label: "Poland" },
  { flag: "🇷🇺", cuisine: "Russian", label: "Russia" },
  { flag: "🇺🇦", cuisine: "Ukrainian", label: "Ukraine" },
  { flag: "🇭🇺", cuisine: "Hungarian", label: "Hungary" },
  { flag: "🇸🇪", cuisine: "Swedish", label: "Sweden" },
  { flag: "🇳🇱", cuisine: "Dutch", label: "Netherlands" },
  { flag: "🇮🇪", cuisine: "Irish", label: "Ireland" },
  // Asia
  { flag: "🇯🇵", cuisine: "Japanese", label: "Japan" },
  { flag: "🇨🇳", cuisine: "Chinese", label: "China" },
  { flag: "🇰🇷", cuisine: "Korean", label: "Korea" },
  { flag: "🇮🇳", cuisine: "Indian", label: "India" },
  { flag: "🇹🇭", cuisine: "Thai", label: "Thailand" },
  { flag: "🇻🇳", cuisine: "Vietnamese", label: "Vietnam" },
  { flag: "🇮🇩", cuisine: "Indonesian", label: "Indonesia" },
  { flag: "🇵🇭", cuisine: "Filipino", label: "Philippines" },
  { flag: "🇲🇾", cuisine: "Malaysian", label: "Malaysia" },
  { flag: "🇵🇰", cuisine: "Pakistani", label: "Pakistan" },
  { flag: "🇧🇩", cuisine: "Bangladeshi", label: "Bangladesh" },
  { flag: "🇱🇰", cuisine: "Sri Lankan", label: "Sri Lanka" },
  { flag: "🇳🇵", cuisine: "Nepali / Himalayan", label: "Nepal" },
  // Middle East
  { flag: "🇱🇧", cuisine: "Lebanese", label: "Lebanon" },
  { flag: "🇹🇷", cuisine: "Turkish", label: "Turkey" },
  { flag: "🇮🇷", cuisine: "Persian / Iranian", label: "Iran" },
  { flag: "🇮🇱", cuisine: "Israeli", label: "Israel" },
  { flag: "🇸🇦", cuisine: "Middle Eastern", label: "Saudi Arabia" },
  { flag: "🇸🇾", cuisine: "Syrian", label: "Syria" },
  // Africa
  { flag: "🇲🇦", cuisine: "Moroccan", label: "Morocco" },
  { flag: "🇪🇬", cuisine: "Egyptian", label: "Egypt" },
  { flag: "🇪🇹", cuisine: "Ethiopian", label: "Ethiopia" },
  { flag: "🇳🇬", cuisine: "Nigerian", label: "Nigeria" },
  { flag: "🇿🇦", cuisine: "South African", label: "South Africa" },
  { flag: "🇰🇪", cuisine: "Kenyan", label: "Kenya" },
  { flag: "🇬🇭", cuisine: "Ghanaian", label: "Ghana" },
  { flag: "🇸🇳", cuisine: "Senegalese", label: "Senegal" },
  { flag: "🇹🇳", cuisine: "Tunisian", label: "Tunisia" },
  // Americas
  { flag: "🇲🇽", cuisine: "Mexican", label: "Mexico" },
  { flag: "🇺🇸", cuisine: "American Southern", label: "USA" },
  { flag: "🇧🇷", cuisine: "Brazilian", label: "Brazil" },
  { flag: "🇵🇪", cuisine: "Peruvian", label: "Peru" },
  { flag: "🇦🇷", cuisine: "Argentinian", label: "Argentina" },
  { flag: "🇨🇴", cuisine: "Colombian", label: "Colombia" },
  { flag: "🇨🇺", cuisine: "Cuban", label: "Cuba" },
  { flag: "🇯🇲", cuisine: "Jamaican", label: "Jamaica" },
  // Oceania
  { flag: "🇦🇺", cuisine: "Australian", label: "Australia" },
];

// Soft rotating background tints (using existing palette tokens via inline styles)
const TINTS = [
  "bg-[#FFF4E6]",
  "bg-[#FFE8E0]",
  "bg-[#E8F4EA]",
  "bg-[#FFF7D6]",
  "bg-[#F0EAFB]",
  "bg-[#E0F2F7]",
];

type Props = {
  onPick: (cuisine: string) => void;
};

export function CountryTiles({ onPick }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState("");

  const submitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const v = custom.trim();
    if (v.length < 2) return;
    onPick(v);
    setCustom("");
    setShowCustom(false);
  };

  return (
    <div className="-mx-4 md:mx-0">
      <div className="relative">
        {/* Mobile: 2-row horizontal snap carousel. Desktop: full grid. */}
        <div
          className="
            grid grid-rows-2 grid-flow-col auto-cols-[88px] gap-3
            overflow-x-auto px-4 pb-3 snap-x snap-mandatory scrollbar-none
            md:grid-rows-none md:grid-flow-row md:auto-cols-auto
            md:grid-cols-6 lg:grid-cols-9 md:px-0 md:pb-0 md:overflow-visible
          "
        >
          {COUNTRIES.map((c, i) => (
            <button
              key={c.cuisine}
              type="button"
              onClick={() => onPick(c.cuisine)}
              className={`snap-start ${TINTS[i % TINTS.length]} flex flex-col items-center justify-center gap-1 border-2 border-border rounded-2xl py-3 px-2 shadow-[3px_3px_0px_0px_var(--border)] hover:-translate-y-0.5 hover:shadow-[4px_5px_0px_0px_var(--border)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_var(--border)] transition-all`}
              aria-label={`Cook ${c.cuisine} cuisine`}
            >
              <span className="text-4xl leading-none" aria-hidden>
                {c.flag}
              </span>
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-wide text-center leading-tight">
                {c.cuisine}
              </span>
            </button>
          ))}

          {/* "Your cuisine" inclusive tile */}
          <button
            type="button"
            onClick={() => setShowCustom((s) => !s)}
            className="snap-start bg-gradient-to-br from-paprika/15 to-turmeric/20 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-foreground rounded-2xl py-3 px-2 shadow-[3px_3px_0px_0px_var(--border)] hover:-translate-y-0.5 hover:shadow-[4px_5px_0px_0px_var(--border)] active:translate-y-0.5 transition-all"
            aria-label="Add your own cuisine"
          >
            <span className="text-4xl leading-none" aria-hidden>🌍</span>
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-wide text-center leading-tight">
              Your cuisine
            </span>
          </button>
        </div>

        {/* Right-edge fade hint on mobile */}
        <div className="md:hidden pointer-events-none absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-background to-transparent" />
      </div>

      {/* Swipe hint on mobile */}
      <p className="md:hidden px-4 mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        ← Swipe for 50+ cuisines →
      </p>

      {/* Inline custom-cuisine input */}
      {showCustom && (
        <form
          onSubmit={submitCustom}
          className="mx-4 md:mx-0 mt-3 flex gap-2 bg-white border-2 border-border rounded-2xl p-2 shadow-[3px_3px_0px_0px_var(--border)]"
        >
          <input
            autoFocus
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. Cambodian, Georgian, Bolivian…"
            className="flex-1 bg-transparent outline-none px-2 text-sm font-medium placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="bg-paprika text-white font-black uppercase text-xs px-4 py-2 rounded-xl border-2 border-border shadow-[2px_2px_0px_0px_var(--border)] active:translate-y-0.5 active:shadow-none transition-all"
          >
            Cook it
          </button>
        </form>
      )}
    </div>
  );
}