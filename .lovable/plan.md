Update the footer layout in `src/components/landing/SiteFooter.tsx` so the contact column has enough space on iPad and laptop widths.

Plan:
1. Change the desktop footer grid from 5 columns to 6 columns.
2. Keep the brand area at 2 columns, keep Cook and For chefs at 1 column each, and make Contact span 2 columns.
3. Keep each email on one line with `whitespace-nowrap`.
4. Slightly reduce the desktop grid gap if needed so the columns shift left and the full `.com` remains visible without horizontal overflow.

This keeps the existing footer design and icons, but gives Contact a wider dedicated area so both email addresses fit cleanly.