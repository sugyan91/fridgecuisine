## Make seeded comments sound like real humans

The current 256 community comments read like marketing copy ("Pure comfort food", "Quick weeknight winner") and repeat a small set of polished one-liners. I'll replace them all with a much larger, naturally-voiced pool.

### What changes

For each existing seeded comment in `community_recipe_comments`, rewrite the `body` text to sound like a real person typed it on their phone. Keep all other fields (recipe_id, user_id, timestamps) untouched so the threads, authors, and ordering stay the same.

### Voice rules for the new pool (~120 unique lines)

- **Lowercase-leaning, casual**: "made this last night, sooo good", "ok the smell alone 🤤"
- **Real reactions, not slogans**: "i was skeptical about the cumin amount tbh but trust the recipe", "took me longer than 30 min but worth it"
- **Mixed lengths**: some 3-word ("absolute banger"), some 1–3 sentence stories ("made it for my flatmate who hates spicy food and even she went back for seconds. only thing i'd change is less oil maybe")
- **Light typos / abbreviations**: "def making again", "lol my kitchen is destroyed", "btw used canned tomatoes, still 🔥"
- **Honest critique sprinkled in** (matches the downvotes that exist): "was a bit bland for me, added extra chili and it saved it", "steps 4 and 5 could be clearer", "mine came out drier than the photo, prob my oven"
- **Questions to the author**: "what brand of paprika do you use?", "can i swap the yogurt for coconut milk?"
- **Occasional emoji** (not on every line): 🔥 🤤 👏 😋 — used sparingly
- **No hashtags, no "5 stars", no influencer phrasing**

### How it runs

A single data update on the existing 256 rows: for each row, set `body` to a random pick from the new pool (allowing repeats since real communities do repeat phrases, but the pool is large enough that duplicates feel natural). Rows already authored by real signed-in users are left alone — only the seeded comments from fake users are rewritten.

### Out of scope

- No schema changes, no new comments added, none deleted.
- Comment dates are already hidden (done last turn) — staying hidden.
- The recipe text itself, titles, and image captions are not touched.
