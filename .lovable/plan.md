Add small emoji icons to each dietary/allergy button in the FilterPanel for instant visual recognition.

**What I will change:**
- `src/components/fridge/FilterPanel.tsx`: Add emoji icons mapped to each dietary option (e.g. 🥬 Vegetarian, 🌱 Vegan, 🌾 Gluten-Free, 🥛 Dairy-Free, etc.) displayed left of the label text on every button.
- Adjust button padding and gap so the icon + text layout feels balanced and the buttons stay the same overall size.
- No new dependencies — using emoji keeps it lightweight and sharp at all sizes.

**Icon mapping:**
- Vegetarian 🥬, Vegan 🌱, Gluten-Free 🌾, Dairy-Free 🥛, High Protein 🍗, Low-Carb 🥑, Keto 🥓, Quick Meal ⚡, Halal 🕌, Kosher ✡️, Nut-Free 🥜❌, Pescatarian 🐟

No other files touched.