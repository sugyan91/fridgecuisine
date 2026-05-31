Update the mobile header so “Your own AI powered personal chef” is fully visible without overlapping the controls.

Implementation plan:
1. Replace the tagline’s hard `text-[9px]` + `truncate` behavior with responsive/clamped sizing so it can shrink on narrow mobile but stays readable on tablet/desktop.
2. Give the logo/text block a safer flexible width (`min-w-0`, constrained max width on mobile) so it uses available space without pushing into the language/sign-up/menu controls.
3. Keep the header to one row on mobile and avoid horizontal scroll or overlap by preserving compact mobile button spacing.

Technical detail:
- Target `src/routes/index.tsx` only.
- Use CSS `clamp(...)`/Tailwind arbitrary text sizing for the tagline and remove truncation from the tagline so the full sentence can render.