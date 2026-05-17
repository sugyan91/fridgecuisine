## Why the current images mismatch

The current image helper uses LoremFlickr with broad keywords from the recipe title/cuisine. That loads fast, but it cannot guarantee the photo is actually the dish. For specific cuisines like Bhutanese, it may return generic or unrelated food because Flickr has limited exact matches.

## Plan

1. **Stop relying on loose keyword photo search for generated recipes**
   - Replace the current external photo-search URL builder with a more reliable dish-aware image strategy.

2. **Generate/store a better image prompt from the actual recipe data**
   - Build image keywords from the recipe title, cuisine, and key ingredients instead of only the first title words.
   - Avoid vague fallback terms like just `food` unless no better fields exist.

3. **Use a curated fallback for hard-to-match cuisines**
   - If a dish/cuisine is too specific for the photo service, show a branded, appetizing cuisine illustration/placeholder rather than a wrong random food photo.
   - This is better UX than showing unrelated food.

4. **Keep image behavior consistent everywhere**
   - Apply the same image helper to recipe cards and saved recipes so preview and full output match.
   - Keep deterministic seeds/locks so the same recipe keeps the same visual.

## Technical details

- Update `src/lib/recipe-images.ts` so `pickRecipeImage` can accept optional ingredient data and produce tighter query terms.
- Update `RecipeCard.tsx` and `SavedDrawer.tsx` calls to pass recipe ingredients into `pickRecipeImage`.
- Add an `onError` fallback in image rendering so broken or irrelevant external URLs can degrade to a local styled placeholder instead of blank/wrong-looking output.
- No database changes are needed.