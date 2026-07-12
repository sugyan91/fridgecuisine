export const DIETARY_ICONS: Record<string, string> = {
  Vegetarian: "🥬",
  Vegan: "🌱",
  "Gluten-Free": "🌾",
  "Dairy-Free": "🥛",
  "High Protein": "🍗",
  "Low-Carb": "🥑",
  Keto: "🥓",
  "Quick Meal": "⚡",
  Halal: "🕌",
  Kosher: "✡️",
  "Nut-Free": "🥜",
  Pescatarian: "🐟",
  "Contains Pork": "🐖",
  "Contains Nuts": "🥜",
  Spicy: "🌶️",
};

export function dietaryIcon(label: string): string {
  if (DIETARY_ICONS[label]) return DIETARY_ICONS[label];
  const l = label.toLowerCase();
  if (l.includes("peanut") || l.includes("nut")) return "🥜";
  if (l.includes("egg")) return "🥚";
  if (l.includes("soy")) return "🫘";
  if (l.includes("shellfish") || l.includes("shrimp")) return "🦐";
  if (l.includes("fish")) return "🐟";
  if (l.includes("dairy") || l.includes("lactose")) return "🥛";
  if (l.includes("gluten") || l.includes("wheat")) return "🌾";
  if (l.includes("sugar")) return "🍬";
  if (l.includes("spice") || l.includes("spicy")) return "🌶️";
  if (l.includes("sesame")) return "🌰";
  if (l.includes("pork")) return "🐖";
  return "🍽️";
}