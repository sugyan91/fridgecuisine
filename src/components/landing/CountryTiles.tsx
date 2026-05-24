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

const COLLAPSED = 14;

type Props = {
  onPick: (cuisine: string) => void;
};

export function CountryTiles({ onPick }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? COUNTRIES : COUNTRIES.slice(0, COLLAPSED);
  const remaining = COUNTRIES.length - COLLAPSED;

  return (
    <div>
      {/* Mobile: horizontal swipe so the row never wraps awkwardly */}
      <div className="md:hidden -mx-4">
        <div className="flex gap-2.5 overflow-x-auto px-4 pb-2 scrollbar-none snap-x">
          {COUNTRIES.map((c) => (
            <Chip key={c.cuisine} country={c} onPick={onPick} />
          ))}
        </div>
      </div>

      {/* Tablet / desktop: wrap-flow chip row */}
      <div className="hidden md:flex flex-wrap gap-3">
        {visible.map((c) => (
          <Chip key={c.cuisine} country={c} onPick={onPick} />
        ))}
        {!expanded && remaining > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="px-5 py-2.5 rounded-full border border-foreground/15 text-sm font-medium text-foreground hover:bg-secondary transition-all"
          >
            + {remaining} more
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({
  country,
  onPick,
}: {
  country: { flag: string; cuisine: string };
  onPick: (cuisine: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(country.cuisine)}
      className="snap-start shrink-0 px-5 py-2.5 rounded-full bg-secondary border border-border hover:bg-primary hover:text-primary-foreground hover:border-transparent transition-all flex items-center gap-2.5 text-sm font-medium"
      aria-label={`Cook ${country.cuisine} cuisine`}
    >
      <span className="text-lg leading-none" aria-hidden>
        {country.flag}
      </span>
      <span>{country.cuisine}</span>
    </button>
  );
}