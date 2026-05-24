## Goal

Two small visual fixes to the homepage hero on mobile (and scale cleanly on larger screens):

1. The "What food is living rent-free in your head right now?" headline is too large on mobile — it dominates the viewport.
2. The free-recipe counter (pill + "Resets in…" + "Go unlimited") is right-aligned and stacked into three lines, which looks awkward sitting alone above the centered headline.

## Changes

### 1. Smaller hero headline — `src/routes/index.tsx` (line 550)

Reduce the type scale by one step at every breakpoint while keeping the same font, weight, color, and `<span class="text-accent">head</span>` treatment.

- Current: `text-5xl md:text-7xl lg:text-8xl`
- New:     `text-4xl md:text-6xl lg:text-7xl`

Keep `leading-[0.9]`, `tracking-tight`, `uppercase`, and the `<br className="hidden sm:inline" />`.

### 2. Compact horizontal counter row — `src/components/RecipeCounter.tsx`

Replace the right-aligned 3-line vertical stack with a single centered horizontal row that wraps gracefully on very narrow screens.

Layout (free user):
```
[ 0/5 free today ]  ·  Resets in 20h 32m  ·  Go unlimited →
```

Implementation notes:
- Wrapper: `flex flex-wrap items-center justify-center gap-x-2 gap-y-1` (replaces `flex flex-col items-end gap-1`).
- Pill: keep existing styling (border, rounded-full, bg, atLimit paprika variant), keep the short/long responsive labels.
- Separators: thin `·` dots as `<span className="text-muted-foreground/50">·</span>`, hidden on the smallest screens if they cause wrapping issues (use `hidden xs:inline` is not in the stack — just allow flex-wrap to handle it).
- "Resets in {countdown}" / "Limit reached · Sign up|Upgrade": same text, inline, `text-[11px] font-bold text-muted-foreground`.
- "Go unlimited → cook anything, anytime": shorten on mobile to **"Go unlimited →"** and show the full phrase on `sm:` and up via two spans (`sm:hidden` / `hidden sm:inline`). Keep `text-accent`, underline, link to `/pricing`.
- Premium variant: also switch to a single centered row (pill + "No daily limit") instead of right-aligned column, for consistency.

Parent in `src/routes/index.tsx` already wraps it in `flex justify-center` so the new row will center naturally — no parent change needed.

## Out of scope

No backend, no usage-limit logic changes, no copy changes to the headline text itself, no changes to the input/button or other sections.
