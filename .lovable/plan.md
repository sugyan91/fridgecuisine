## Goal

Show the Premium price as a tiny one-liner directly under each of the three main boxes on the homepage, instead of the large pricing block above the footer.

## Changes (frontend only, `src/routes/index.tsx`)

1. **Remove** the large `<section>` pricing callout currently placed after `<CommunityStrip />` (the `bg-paprika ... $5.99 / month ... Go Premium` block, ~lines 617+).

2. **Add a small price line** immediately below each of the three boxes — placed *inside* each section's white card, at the bottom, separated by a thin dashed divider:
   - **Dish to receipe** card (~line 517, just before `</div></section>`)
   - **What's in your Pantry** card (~line 561, just before `</div></section>`)
   - **Results / "Ready when you are"** section (~line 612, just before `</section>`)

3. **Markup** for each (consistent, minimal, neo-brutalist tone):

   ```tsx
   <div className="mt-4 pt-3 border-t border-dashed border-border/30 text-[11px] text-muted-foreground flex items-center justify-between">
     <span><span className="font-black text-foreground">$5.99/mo</span> · Premium · unlimited recipes</span>
     <Link to="/pricing" className="font-black uppercase tracking-wide underline underline-offset-2">Upgrade</Link>
   </div>
   ```

   Small enough to be informational, not a CTA banner. Same line on all three boxes for consistency.

No backend, route, or pricing-logic changes — `/pricing` route and Stripe wiring untouched.
