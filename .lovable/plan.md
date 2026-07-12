Restructure the footer link columns in `src/components/landing/SiteFooter.tsx` so the groups feel related and meaningful to a user of an AI personal-chef app.

Current state
- Columns: "Cook" (Recipes, Community, Cookbook, Pricing, Account) and "For chefs" (Sell recipes, Browse chefs).
- "Sell recipes" links to `/sell`, which has no route file — it is a dead link.
- The group labels and items overlap in purpose and don't match how a home cook thinks about the product.

Proposed change
Group links by what the user is trying to do:

```
Discover
  Recipes
  Community
  Chefs

My kitchen
  Cookbook
  Account

Upgrade
  Pricing
```

Details
- Replace the "Cook" and "For chefs" columns with the three intent-based columns above.
- Remove the dead "Sell recipes" link (no `/sell` route exists).
- Keep "Browse chefs" but move it under Discover as "Chefs".
- Keep the Contact column and legal row unchanged.
- Preserve the existing visual style: dark footer, uppercase tracking labels, white/85 links.

Verification
- Typecheck with `bunx tsgo --noEmit`.
- Confirm in the live preview that the footer shows the new columns and that all links resolve to existing routes.

Out of scope
- No changes to route files or page content.
- No backend or data wiring.