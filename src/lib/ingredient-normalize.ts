// Client-safe normalizer for recipe ingredients.
// Some data sources (legacy seed rows in paid_recipes / community_recipes)
// store ingredients as { name, quantity } objects instead of strings.
// Coerce anything to a single display string so downstream code
// (scaling, rendering, AI calls, localStorage) never sees a non-string.

export function normalizeIngredient(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();
  if (raw && typeof raw === "object") {
    const o = raw as {
      name?: unknown;
      quantity?: unknown;
      qty?: unknown;
      amount?: unknown;
      unit?: unknown;
    };
    const name = typeof o.name === "string" ? o.name : "";
    const qty =
      typeof o.quantity === "string"
        ? o.quantity
        : typeof o.qty === "string"
          ? o.qty
          : typeof o.amount === "string"
            ? o.amount
            : "";
    const unit = typeof o.unit === "string" ? o.unit : "";
    return [qty, unit, name].filter(Boolean).join(" ").trim();
  }
  return "";
}

export function normalizeIngredients(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeIngredient).filter((s) => s.length > 0);
}