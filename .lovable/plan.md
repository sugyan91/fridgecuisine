Add your two email addresses (support@fridgecuisine.com and main@fridgecuisine.com) to the site in a clean, professional way:

**Header nav**
- Desktop: Add a "Support" link with a small envelope icon in the top navigation bar, between "Shop" and the auth buttons. Clicking it opens the user's email client pre-addressed to support@fridgecuisine.com.
- Mobile: Add the same "Support" link inside the hamburger dropdown menu.

**Site footer**
- Add a centered horizontal row of contact emails just above the copyright bar.
- Each email sits next to a Mail icon and is a clickable mailto link:
  - main@fridgecuisine.com
  - support@fridgecuisine.com
- Subtle hover effect (text brightens on hover) matching the dark footer aesthetic.

**Files to edit:**
- `src/routes/index.tsx` — add Mail icon import, Support nav link in desktop + mobile menus
- `src/components/landing/SiteFooter.tsx` — add Mail icon import, email contact row above copyright

**No new pages or routes created.**