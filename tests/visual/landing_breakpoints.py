#!/usr/bin/env python3
"""
Landing page breakpoint regression checks.

Launches the running dev server in headless Chromium at the key mobile/tablet/
desktop widths and asserts that the header brand + tagline render fully and that
nothing overflows or overlaps. Screenshots are written to
tests/visual/screenshots/ for manual/visual diffing.

Usage:  bun run test:visual        (dev server must be running on :8080)
        BASE_URL=... python3 tests/visual/landing_breakpoints.py
"""
import asyncio
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080")
SCREENSHOTS = Path(__file__).parent / "screenshots"
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

BREAKPOINTS = [
    ("mobile-320", 320, 800),
    ("mobile-375", 375, 812),
    ("mobile-393", 393, 852),
    ("mobile-430", 430, 932),
    ("tablet-768", 768, 1024),
    ("tablet-1024", 1024, 900),
    ("desktop-1280", 1280, 900),
]

# Elements that must be visible and fully rendered at every breakpoint.
REQUIRED = [
    ("brand", '[data-testid="brand-name"]'),
    ("tagline", '[data-testid="brand-tagline"]'),
]

CLIP_JS = """
(sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const visibleParts = [...el.children].filter((c) => {
    const cs = getComputedStyle(c);
    return c.offsetParent !== null && cs.display !== 'none' && cs.visibility !== 'hidden';
  });
  const targets = visibleParts.length ? visibleParts : [el];
  const clipper = (node) => {
    for (let n = node; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.overflowX !== 'visible') return n;
    }
    return null;
  };
  let clipped = false;
  const text = targets.map((t) => (t.textContent || '').trim()).join(' | ');
  for (const t of targets) {
    const cs = getComputedStyle(t);
    // ellipsis truncation of the element's own text
    if (cs.textOverflow === 'ellipsis' && t.scrollWidth > t.clientWidth + 2) clipped = true;
    const c = clipper(t);
    if (c) {
      const cr = c.getBoundingClientRect();
      const tr = t.getBoundingClientRect();
      if (tr.right > cr.right + 2 || tr.left < cr.left - 2) clipped = true;
      if (c !== t && getComputedStyle(c).textOverflow === 'ellipsis' && c.scrollWidth > c.clientWidth + 2) clipped = true;
    }
  }
  return { clipped, text, parts: targets.length };
}
"""

MEASURE_JS = """
(sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return {
    x: r.x, y: r.y, w: r.width, h: r.height,
    scrollW: el.scrollWidth, clientW: el.clientWidth,
    text: (el.textContent || '').trim(),
    visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none',
  };
}
"""

OVERFLOW_JS = """
() => {
  const vw = document.documentElement.clientWidth;
  const bad = [];
  // Intentional horizontal scrollers (marquees, snap carousels) legitimately
  // extend past the viewport; only static layout overflow is a regression.
  const skip = (el) => {
    if (el.closest('.marquee-track, .marquee, [data-overflow-ok]')) return true;
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true;
    }
    return false;
  };
  const inMarquee = (el) => skip(el);
  for (const el of document.querySelectorAll('header *, main *')) {
    if (inMarquee(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > vw + 1 || r.left < -1) {
      bad.push({ tag: el.tagName.toLowerCase(), cls: el.className?.toString?.().slice(0, 60), left: Math.round(r.left), right: Math.round(r.right) });
    }
  }
  return { vw, bad: bad.slice(0, 8), docScrollW: document.documentElement.scrollWidth };
}
"""


def overlaps(a, b, tol=1):
    return (
        a["x"] < b["x"] + b["w"] - tol
        and b["x"] < a["x"] + a["w"] - tol
        and a["y"] < b["y"] + b["h"] - tol
        and b["y"] < a["y"] + a["h"] - tol
    )


async def check(page, name, width):
    failures = []
    measured = {}

    for label, sel in REQUIRED:
        m = await page.evaluate(MEASURE_JS, sel)
        if m is None:
            failures.append(f"{name}: missing element {label} ({sel})")
            continue
        measured[label] = m
        if not m["visible"]:
            failures.append(f"{name}: {label} is not visible")
        clip = await page.evaluate(CLIP_JS, sel)
        if clip and clip["clipped"]:
            failures.append(
                f"{name}: {label} text is clipped/truncated (text={clip['text']!r})"
            )

    if "brand" in measured and "tagline" in measured:
        if overlaps(measured["brand"], measured["tagline"]):
            failures.append(f"{name}: brand and tagline bounding boxes overlap")

    o = await page.evaluate(OVERFLOW_JS)
    if o["bad"]:
        failures.append(f"{name}: {len(o['bad'])} element(s) overflow the {o['vw']}px viewport: {o['bad']}")
    if o["docScrollW"] > o["vw"] + 1:
        failures.append(
            f"{name}: page scrolls horizontally (scrollWidth {o['docScrollW']} > viewport {o['vw']})"
        )

    return failures


async def main():
    all_failures = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        try:
            for name, w, h in BREAKPOINTS:
                context = await browser.new_context(
                    viewport={"width": w, "height": h},
                    device_scale_factor=2 if w <= 500 else 1,
                )
                page = await context.new_page()
                await page.goto(BASE_URL, wait_until="networkidle")
                await page.wait_for_timeout(400)
                await page.screenshot(path=str(SCREENSHOTS / f"{name}.png"))
                failures = await check(page, name, w)
                status = "PASS" if not failures else "FAIL"
                print(f"[{status}] {name} ({w}x{h})")
                for f in failures:
                    print(f"        - {f}")
                all_failures += failures
                await context.close()
        finally:
            await browser.close()

    print(f"\nScreenshots: {SCREENSHOTS}")
    if all_failures:
        print(f"\n{len(all_failures)} layout regression(s) detected.")
        sys.exit(1)
    print("\nAll landing page breakpoints passed layout checks.")


asyncio.run(main())
