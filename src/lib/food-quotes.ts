/** Short, chef-style inspiring lines used by premium celebration moments. */
export const FOOD_QUOTES: string[] = [
  "Cooking is love you can taste.",
  "The best meals start with what you already have.",
  "A good cook is a small act of magic, repeated daily.",
  "Flavour is patience with a little bit of fire.",
  "No recipe is finished until it tastes like you.",
  "Feed people well and you change their day.",
  "Salt, heat, timing — everything else is confidence.",
  "Every fridge is a story waiting for dinner.",
];

/** Pick a quote at random. Call once per mount so the text never flickers. */
export function pickFoodQuote(): string {
  return FOOD_QUOTES[Math.floor(Math.random() * FOOD_QUOTES.length)]!;
}