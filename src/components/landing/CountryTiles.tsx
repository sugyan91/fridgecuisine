type Country = { flag: string; cuisine: string; label: string };

const COUNTRIES: Country[] = [
  { flag: "🇮🇹", cuisine: "Italian", label: "Italy" },
  { flag: "🇯🇵", cuisine: "Japanese", label: "Japan" },
  { flag: "🇮🇳", cuisine: "Indian", label: "India" },
  { flag: "🇲🇽", cuisine: "Mexican", label: "Mexico" },
  { flag: "🇹🇭", cuisine: "Thai", label: "Thailand" },
  { flag: "🇫🇷", cuisine: "French", label: "France" },
  { flag: "🇰🇷", cuisine: "Korean", label: "Korea" },
  { flag: "🇨🇳", cuisine: "Chinese", label: "China" },
  { flag: "🇻🇳", cuisine: "Vietnamese", label: "Vietnam" },
  { flag: "🇱🇧", cuisine: "Lebanese", label: "Lebanon" },
  { flag: "🇪🇹", cuisine: "Ethiopian", label: "Ethiopia" },
  { flag: "🇵🇪", cuisine: "Peruvian", label: "Peru" },
  { flag: "🇪🇸", cuisine: "Spanish", label: "Spain" },
  { flag: "🇬🇷", cuisine: "Greek", label: "Greece" },
  { flag: "🇹🇷", cuisine: "Turkish", label: "Turkey" },
  { flag: "🇲🇦", cuisine: "Moroccan", label: "Morocco" },
  { flag: "🇧🇷", cuisine: "Brazilian", label: "Brazil" },
  { flag: "🇩🇪", cuisine: "German", label: "Germany" },
];

type Props = {
  onPick: (cuisine: string) => void;
};

export function CountryTiles({ onPick }: Props) {
  return (
    <div className="-mx-4 md:mx-0">
      <div className="flex md:grid md:grid-cols-6 lg:grid-cols-9 gap-3 overflow-x-auto px-4 md:px-0 pb-3 md:pb-0 snap-x snap-mandatory scrollbar-none">
        {COUNTRIES.map((c) => (
          <button
            key={c.cuisine}
            type="button"
            onClick={() => onPick(c.cuisine)}
            className="snap-start shrink-0 w-[88px] md:w-auto flex flex-col items-center justify-center gap-1 bg-white border-2 border-border rounded-2xl py-3 px-2 shadow-[3px_3px_0px_0px_var(--border)] hover:-translate-y-0.5 hover:shadow-[4px_5px_0px_0px_var(--border)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_var(--border)] transition-all"
            aria-label={`Cook ${c.cuisine} cuisine`}
          >
            <span className="text-3xl md:text-4xl leading-none" aria-hidden>{c.flag}</span>
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-wide text-center leading-tight">
              {c.cuisine}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}