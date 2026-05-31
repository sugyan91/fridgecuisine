## Problem
In the footer Contact section, the email addresses `main@fridgecuisine.com` and `support@fridgecuisine.com` wrap onto 2 lines on laptop and iPad. On mobile they display on a single line.

## Root Cause
Both email `<a>` tags in `SiteFooter.tsx` use the Tailwind class `break-all`, which forces text to break at any character. On the md+ 5-column grid layout the Contact column is only 1 column wide, so `break-all` causes wrapping.

## Fix
Remove `break-all` from the className of both email links in `src/components/landing/SiteFooter.tsx`:
- Line 78: `break-all` → remove
- Line 88: `break-all` → remove

The emails will then naturally stay on a single line since they fit within the container width at all breakpoints.