import type { UnitSystem } from "@/lib/units";

export function UnitToggle({
  value,
  onChange,
}: {
  value: UnitSystem;
  onChange: (u: UnitSystem) => void;
}) {
  return (
    <div className="inline-flex bg-white border-2 border-border rounded-full p-0.5 text-[11px] font-black uppercase tracking-widest">
      <button
        onClick={() => onChange("us")}
        className={`px-3 py-1 rounded-full ${value === "us" ? "bg-foreground text-background" : "opacity-60"}`}
      >
        US
      </button>
      <button
        onClick={() => onChange("metric")}
        className={`px-3 py-1 rounded-full ${value === "metric" ? "bg-foreground text-background" : "opacity-60"}`}
      >
        Metric
      </button>
    </div>
  );
}