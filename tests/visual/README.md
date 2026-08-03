# Landing page breakpoint regression checks

`landing_breakpoints.py` opens the landing page in headless Chromium at 320 / 375 / 393 /
430 / 768 / 1024 / 1280 px and fails when:

- the header brand (`data-testid="brand-name"`) or tagline (`data-testid="brand-tagline"`)
  is missing, hidden, or text-clipped (`scrollWidth > clientWidth`)
- the brand and tagline bounding boxes overlap
- any header/main element extends past the viewport edge
- the document scrolls horizontally

Run with the dev server up:

```bash
bun run test:visual
# or against another origin
BASE_URL=https://fridgecuisine.com python3 tests/visual/landing_breakpoints.py
```

Screenshots for each breakpoint land in `tests/visual/screenshots/` for eyeballing or diffing.
