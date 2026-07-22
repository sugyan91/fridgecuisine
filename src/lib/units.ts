// Ingredient line parsing + serving scaling + metric/US conversion.
// Client-safe, no imports.
import { normalizeIngredient } from "./ingredient-normalize";

export type UnitSystem = "us" | "metric";

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75,
  "⅕": 0.2, "⅖": 0.4, "⅗": 0.6, "⅘": 0.8,
  "⅙": 1 / 6, "⅚": 5 / 6, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

// Match qty + optional unit at the start. Units are alphabetic ~1-12 chars.
const QTY_RE =
  /^\s*((?:\d+\s+\d+\/\d+)|(?:\d+\/\d+)|(?:\d+(?:[.,]\d+)?)|(?:[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]))\s*([a-zA-Zµ°]+\.?)?\s+/;

function fractionToNumber(f: string): number {
  const [a, b] = f.split("/");
  const na = parseFloat(a);
  const nb = parseFloat(b);
  return nb ? na / nb : na;
}

function parseQty(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (UNICODE_FRACTIONS[s]) return UNICODE_FRACTIONS[s];
  if (/^\d+\s+\d+\/\d+$/.test(s)) {
    const [whole, frac] = s.split(/\s+/);
    return parseFloat(whole) + fractionToNumber(frac);
  }
  if (/^\d+\/\d+$/.test(s)) return fractionToNumber(s);
  const cleaned = s.replace(",", ".");
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : null;
}

function formatQty(n: number): string {
  if (!isFinite(n) || n <= 0) return "";
  if (Math.abs(n - Math.round(n)) < 0.02) return String(Math.round(n));
  // Snap to common fractions when close.
  const rounded = Math.round(n * 4) / 4;
  if (Math.abs(rounded - n) < 0.03) {
    const whole = Math.floor(rounded);
    const frac = rounded - whole;
    const fracStr = frac === 0.25 ? "¼" : frac === 0.5 ? "½" : frac === 0.75 ? "¾" : "";
    if (fracStr) return whole ? `${whole}${fracStr}` : fracStr;
  }
  return n.toFixed(n < 10 ? 2 : 1).replace(/\.?0+$/, "");
}

export type ParsedIngredient = {
  qty: number | null;
  unit: string | null;
  rest: string;
  raw: string;
};

export function parseIngredient(line: string): ParsedIngredient {
  const m = line.match(QTY_RE);
  if (!m) return { qty: null, unit: null, rest: line, raw: line };
  const qty = parseQty(m[1]);
  const unit = (m[2] ?? null)?.replace(/\.$/, "") ?? null;
  const rest = line.slice(m[0].length);
  return { qty, unit, rest, raw: line };
}

// Simple, forgiving unit conversion between US and metric.
// Returns null when the unit isn't convertible / recognized.
const US_TO_METRIC: Array<{ match: RegExp; to: string; factor: number; round?: number }> = [
  { match: /^(cups?|c)$/i, to: "ml", factor: 240, round: 5 },
  { match: /^(tbsp|tablespoons?|tbs)$/i, to: "ml", factor: 15, round: 1 },
  { match: /^(tsp|teaspoons?)$/i, to: "ml", factor: 5, round: 1 },
  { match: /^(fl\s*oz|floz)$/i, to: "ml", factor: 30, round: 5 },
  { match: /^(oz|ounces?)$/i, to: "g", factor: 28, round: 1 },
  { match: /^(lbs?|pounds?)$/i, to: "g", factor: 454, round: 5 },
  { match: /^(quarts?|qt)$/i, to: "ml", factor: 946, round: 10 },
  { match: /^(pints?|pt)$/i, to: "ml", factor: 473, round: 5 },
];
const METRIC_TO_US: Array<{ match: RegExp; to: string; factor: number; round?: number }> = [
  { match: /^ml$/i, to: "tsp", factor: 1 / 5, round: 0.25 },
  { match: /^cl$/i, to: "tbsp", factor: 10 / 15 },
  { match: /^l$/i, to: "cups", factor: 1000 / 240, round: 0.25 },
  { match: /^g$/i, to: "oz", factor: 1 / 28, round: 0.25 },
  { match: /^kg$/i, to: "lb", factor: 1000 / 454, round: 0.25 },
];

function convert(qty: number, unit: string, target: UnitSystem): { qty: number; unit: string } | null {
  const table = target === "metric" ? US_TO_METRIC : METRIC_TO_US;
  for (const row of table) {
    if (row.match.test(unit)) {
      let converted = qty * row.factor;
      // Promote ml→l or g→kg when large.
      let outUnit = row.to;
      if (row.to === "ml" && converted >= 1000) {
        converted = converted / 1000;
        outUnit = "L";
      }
      if (row.to === "g" && converted >= 1000) {
        converted = converted / 1000;
        outUnit = "kg";
      }
      if (row.round) converted = Math.round(converted / row.round) * row.round;
      return { qty: converted, unit: outUnit };
    }
  }
  return null;
}

/** Scale (and optionally convert) a single ingredient string. */
export function scaleIngredient(line: unknown, factor: number, system?: UnitSystem): string {
  const safe = typeof line === "string" ? line : normalizeIngredient(line);
  if (!safe) return "";
  const p = parseIngredient(safe);
  if (p.qty == null) {
    // Non-parseable — mark with ~ when scaled to any non-1 factor.
    return factor === 1 ? safe : `~ ${safe}`;
  }
  let qty = p.qty * factor;
  let unit = p.unit ?? "";
  if (system && unit) {
    const conv = convert(qty, unit, system);
    if (conv) {
      qty = conv.qty;
      unit = conv.unit;
    }
  }
  const qtyStr = formatQty(qty);
  const parts = [qtyStr, unit, p.rest].filter(Boolean).map((s) => s.trim());
  return parts.join(" ").trim();
}

/** Scale a whole list of ingredient strings. */
export function scaleIngredients(list: unknown[], factor: number, system?: UnitSystem): string[] {
  return list.map((l) => scaleIngredient(l, factor, system)).filter((s) => s.length > 0);
}

/** Return the ingredient name (rest) lowercased for pantry-diffing. */
export function ingredientKey(line: string): string {
  const p = parseIngredient(line);
  return (p.rest || p.raw)
    .toLowerCase()
    .replace(/[,()].*/g, "")
    .replace(/\b(fresh|dried|ground|chopped|minced|sliced|to\s+taste|optional)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}