Add a subtle "Beta" pill badge next to the "fridge cuisine." logo text in the fixed header navbar (`src/routes/index.tsx`, line ~512-520). The badge should be a small rounded pill with muted styling — e.g. a 1px border, small font size, and low-contrast color — so it reads as a status indicator without competing with the brand name.

**Technical details:**
- Target: the `<h1>` logo block inside the `<header>` in `src/routes/index.tsx`
- Add an inline `<span>` immediately after the `<span className="text-primary">.</span>` inside the `<h1>`
- Styling: `rounded-full border border-border px-1.5 py-0 text-[9px] font-semibold tracking-wider uppercase text-muted-foreground ml-1.5 align-middle` (or similar muted pill style using the design tokens already in `src/styles.css`)
- Ensure it renders cleanly on both desktop and mobile breakpoints without breaking the logo layout.
- No other files need changes.
