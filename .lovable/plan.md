## Why images aren't loading
Cards currently point at `https://image.pollinations.ai/prompt/...`. That endpoint generates an AI image on every unique prompt. First-time prompts can take 10–30s (often longer under load) and frequently time out, so the `<img>` either spins forever or fails. That's what you're seeing in the output.

## Fix
Switch the image source to **LoremFlickr** (`https://loremflickr.com/512/512/<keywords>?lock=<seed>`), which serves real, cached Creative-Commons food photos from Flickr by keyword. Responses are sub-second, the `lock` param makes each recipe's image stable across reloads, and it requires no API key.

### Change
**`src/lib/recipe-images.ts`** — replace the pollinations URL builder with a LoremFlickr URL builder:
- Tokenize `title` into words, filter out parenthetical / non-alphanumeric junk.
- Build keywords: `<title-words>,<cuisine>,food` (comma-separated, max ~5 tokens — LoremFlickr matches all listed tags).
- Use a deterministic `lock` from a hash of `title|cuisine` so the same dish always shows the same photo.
- Final URL: `https://loremflickr.com/512/512/<encoded keywords>?lock=<seed>`.

No other files change. `RecipeCard` and `SavedDrawer` already call `pickRecipeImage(title, index, cuisine)`.

## Result
Recipe images load near-instantly with real, on-topic food photos for every dish (Butter Chicken, Frikadeller, Palak Paneer, etc.), and the same recipe keeps the same photo on every render.
