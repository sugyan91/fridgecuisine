# More visual improvements

Here are concrete next-level polish moves I can apply, grouped so you can pick what to ship.

## A. Hero — make it stop-scrolling

1. **Headline typography upgrade**: switch the H1 to a serif display face (Fraunces or Instrument Serif) at ~88px desktop / ~52px mobile with tight leading, and italicize one word ("*tonight*", "*world*") in the accent coral for editorial feel.
2. **Animated ingredient ticker** under the search bar: a slow horizontal marquee of pill chips ("🥑 avocado · 🍅 tomato · 🧄 garlic · 🍋 lemon …") so the hero feels alive even before you type.
3. **Replace the blurred photo grid backdrop** with one large, sharp hero photo on the right (split-screen on desktop) + a subtle film-grain overlay. The blur grid currently reads as "stock-photo noise".
4. **Real social-proof avatars**: replace the plain "★★★★★ 12,000+ meals" line with 4 overlapping circular avatars + the stat, like Linear/Notion landing pages.

## B. Section rhythm & color

5. **Alternate three surface tones** down the page — cream → white → dark → cream — instead of mostly white. Right now only "How it works" is dark; one more dark band (around Testimonials or ChefCTA) creates real rhythm.
6. **Section eyebrows**: small uppercase coral labels above every H2 ("01 — Tonight's idea", "02 — How it works"). Cheap, instantly more magazine-like.
7. **Gold hairline dividers** between sections using `--accent-gold` at low opacity instead of plain whitespace breaks.

## C. Cards & imagery

8. **Cuisine / country tiles**: give them a 4:5 portrait aspect, real food photo, dish name + country in a bottom gradient overlay (Airbnb-card pattern). Today they read as flat tiles.
9. **Trending dishes carousel**: add hover-lift + image zoom on hover, a small "🔥 Trending" badge, and the cuisine flag emoji in the corner.
10. **Testimonial cards**: add a tiny circular avatar (initials on a coral background works fine, no photos needed) and a soft cream background instead of white-on-white.

## D. Motion & micro-delight

11. **Scroll-reveal** on every section heading + first card row (fade + 12px up, framer-motion, 400ms). Already imported, just not used on the new sections.
12. **Sticky compact nav** that appears after 400px scroll — logo + "Start cooking" CTA — so the primary action is always one click away (directly helps signups).
13. **Hover state on the main input**: ring glow in coral + a tiny "⌘K" hint, makes the input feel like the hero of the page.

## E. Footer & trust

14. **Logo lockup row** above the footer ("As seen in / Built with") even if just decorative icons — instantly increases perceived legitimacy.
15. **Footer redesign**: dark surface, 4 columns, newsletter input on the right, social icons, fine-print copyright. Current footer is a single block.

---

## Recommended shortlist for biggest visual jump (if you want me to just pick)

Ship **1, 2, 3, 5, 8, 11, 12** together — that's the set that transforms "clean SaaS page" into "editorial food product" and also nudges signups via the sticky CTA (#12).

## Question for you

Tell me which letters/numbers above to implement (e.g. "do A + C + 12"), or say "do the shortlist" and I'll execute the 7-item recommendation in one pass.
