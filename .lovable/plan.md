# Multi-language support

Let users interact with FridgeCuisine in their own language. They pick a language, type ingredients or a dish name in it, and the AI returns the recipe (dish name, ingredients, steps, tips) in that same language.

## Scope (this iteration)

- AI output language: every recipe-generating server function returns content in the chosen language.
- User input: free-text inputs (ingredients, dish name, fridge photo results) are accepted in any language.
- UI chrome (buttons, nav, labels): stays in English for now. Full UI i18n is a much bigger effort — call out as a follow-up.

## UX

1. **Language picker** in the top nav (next to the existing controls), with a globe icon and the current language label.
   - Initial supported languages: English, Spanish, French, German, Italian, Portuguese, Hindi, Bengali, Tamil, Arabic, Japanese, Chinese (Simplified), Korean, Turkish, Russian.
   - Selection persists in `localStorage` (`fc.lang`) and defaults to the browser language if supported, else English.
2. A small hint near the ingredient input / dish search: "Type in {Language} — recipe will be in {Language}."
3. Selected language is also surfaced on recipe pages (badge: "Recipe in Hindi").

## Technical plan

- **Language context**: new `src/lib/language.tsx` with `LanguageProvider`, `useLanguage()` hook, language list, and localStorage persistence. Mount provider in `src/routes/__root.tsx`.
- **Language picker component**: `src/components/LanguagePicker.tsx` (shadcn `DropdownMenu`), placed in the header.
- **Server functions updated** to accept an optional `language: string` (BCP-47 name like "Spanish") and inject it into the system/user prompt. The response JSON schema stays the same — only the natural-language strings change.
  - `src/lib/receipes.functions.ts` (fridge → recipes)
  - `src/lib/dish-helper.functions.ts` (dish → recipe)
  - `src/lib/fridge-vision.functions.ts` (photo → ingredients, returned in the chosen language)
  - Any other AI recipe generator under `src/lib/*.functions.ts` discovered during implementation.
  - Prompt addition: *"Respond entirely in {language}. Translate dish name, ingredients (keep quantities/units), steps, and tips. Do not mix languages."*
- **Client call sites** pass `language` from `useLanguage()` when invoking those server functions (fridge page, dish helper, etc.).
- **Validation**: server-side `z.string().min(2).max(40)` against an allow-list to avoid prompt injection via the language field.
- **No DB changes.** Stored community/shop recipes remain in their original language; only newly generated AI recipes follow the selected language.

## Out of scope (call out to user)

- Translating static UI strings, marketing copy, country tiles, testimonials.
- Translating already-saved recipes.
- SEO/hreflang per language.

Happy to add any of those in a follow-up.
