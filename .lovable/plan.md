Plan: Add a Privacy Policy page at /privacy

## What we're building
A privacy policy page at `fridgecuisine.com/privacy`, required for App Store submission and user trust. It will follow the existing page design pattern (sticky header + content + footer).

## Files to create / modify

1. **Create `src/routes/privacy.tsx`**
   - TanStack route at `/privacy`
   - SEO meta: title, description, og:title, og:description
   - Sticky header with logo + "Back home" link (same pattern as `/contact`)
   - Content sections covering:
     - What data we collect (ingredients, recipes, account info, usage analytics)
     - How we use it (AI recipe generation, personalization, improving the service)
     - Data storage & security (Lovable Cloud/Supabase, encryption at rest)
     - Third parties (AI model providers for recipe generation)
     - Cookies & tracking (essential + analytics)
     - User rights (access, delete account, export data)
     - Children's privacy (not for under 13)
     - Contact for privacy concerns
   - `SiteFooter` at bottom
   - Styled with the existing design system (max-w-3xl, prose-like spacing, semantic headings)

2. **Edit `src/components/landing/SiteFooter.tsx`**
   - Add a "Privacy" link in the footer (under "Cook" or in a new "Legal" column)

## Design notes
- Match the `/contact` page layout: clean, readable, generous whitespace
- Use existing CSS variables and Tailwind classes
- No new dependencies needed