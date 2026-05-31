Add clear purpose labels next to each email so users know which one to use.

**Footer** (`src/components/landing/SiteFooter.tsx`)
Replace the current plain email row with a small two-column "Contact" block:

```
CONTACT
General inquiries     Help & support
main@fridgecuisine    support@fridgecuisine
.com                  .com
```

- Small uppercase "CONTACT" eyebrow heading (matches existing "Cook" / "For chefs" column style)
- Each email gets a tiny label above it: "General inquiries" for main@, "Help & support" for support@
- Mail icon + clickable mailto link below each label
- Stacks vertically on mobile, sits side-by-side on desktop

**Header nav** (`src/routes/index.tsx`)
- Keep the single "Support" link (envelope icon) — it's already self-explanatory and points to support@. No change needed there since "Support" is the obvious label.
- Mobile menu entry stays as "Contact Support".

This way users see at a glance: support@ = help, main@ = general/business inquiries.