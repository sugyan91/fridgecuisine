### Fix text visibility for "Do you want the receipe as well?"

**Problem:** The prompt text "Do you want the receipe as well?" uses `text-foreground` inside a `bg-secondary` box. In the current dark theme, both colors are dark, making the text invisible (black-on-black).

**Solution:** Change the text color class on the `<p>` element from `text-foreground` to `text-white` so it stands out clearly against the dark `bg-secondary` background.

**File:** `src/routes/index.tsx` (around line 722)

**Change:**
```diff
- <p className="font-medium text-sm text-foreground">
+ <p className="font-medium text-sm text-white">
```

No other changes needed.