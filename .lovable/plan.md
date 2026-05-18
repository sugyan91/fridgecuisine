## Goal

Remove the "Pricing" link from the top-right nav and display the pricing inline on the home page as a prominent block:

> **$5.99 / month — Unlimited recipes**

with a CTA button linking to `/pricing` (or directly to checkout for signed-in users).

## Changes (frontend only)

**`src/routes/index.tsx`**

1. Delete the `<Link to="/pricing">Pricing</Link>` chip in the top nav (lines ~352–357).
2. Add a new `<PricingCallout />` section placed right after `<CommunityStrip />` (line 621), so it sits near the bottom of the page above the mobile saved-button floater. It will:
   - Match the existing neo-brutalist style (thick border, hard shadow, turmeric/paprika accents, font-display + uppercase).
   - Show the headline "Unlimited Recipes", the price `$5.99` with `/month` muted, a one-line value prop ("Skip the 5/day limit. Cook anything, anytime."), and a CTA button "Go Premium" linking via TanStack `<Link to="/pricing">`.
   - Be full-width inside the existing `max-w-6xl` main container, responsive (stacks on mobile, row on md+).

No backend, route, or business-logic changes. The `/pricing` route and Stripe wiring stay as-is — only its entry point on the homepage moves from the nav into an in-page section.
