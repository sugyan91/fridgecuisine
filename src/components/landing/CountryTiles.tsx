import { Flag } from "@/lib/flag";

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

type Props = {
  onPick: (cuisine: string) => void;
};

export function CountryTiles({ onPick }: Props) {
  const mid = Math.ceil(COUNTRIES.length / 2);
  const rowA = COUNTRIES.slice(0, mid);
  const rowB = [...COUNTRIES.slice(mid)].reverse();

  return (
    <div className="space-y-3 -mx-4 sm:-mx-6 lg:-mx-8">
      <MarqueeRow countries={rowA} direction="left" onPick={onPick} />
      <MarqueeRow countries={rowB} direction="right" onPick={onPick} />
    </div>
  );
}

function MarqueeRow({
  countries,
  direction,
  onPick,
}: {
  countries: Country[];
  direction: "left" | "right";
  onPick: (cuisine: string) => void;
}) {
  const loop = [...countries, ...countries];
  return (
    <div className="marquee-row marquee-mask overflow-hidden">
      <div
        className={`marquee-track gap-3 ${
          direction === "left" ? "marquee-left" : "marquee-right"
        }`}
      >
        {loop.map((c, i) => (
          <Chip key={`${c.cuisine}-${i}`} country={c} onPick={onPick} />
        ))}
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
      className="shrink-0 px-5 py-2.5 rounded-full bg-card border border-border text-foreground hover:bg-muted hover:border-primary/40 hover:shadow-sm transition-all flex items-center gap-2.5 text-sm font-medium"
      aria-label={`Cook ${country.cuisine} cuisine`}
    >
      <Flag
        emoji={country.flag}
        className="!w-6 !h-[18px] rounded-sm shadow-sm"
      />
      <span>{country.cuisine}</span>
    </button>
  );
}