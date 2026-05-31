## What's happening

The contact form's CAPTCHA is failing at load time with Cloudflare error **400020**, which Cloudflare uses for **"Invalid sitekey"**. The UI then correctly shows the "Something went wrong loading the security check" message we added — so the frontend logic is working as designed. The root cause is on the Turnstile configuration side, not in our code.

Both secrets are already set:
- `TURNSTILE_SITE_KEY` ✓
- `TURNSTILE_SECRET_KEY` ✓

So the value exists, but Cloudflare is rejecting it for this page. The two realistic causes:

1. **Hostname not allowed on the Turnstile widget.** A Turnstile sitekey is bound to a list of hostnames in the Cloudflare dashboard. You're previewing on `id-preview--b3c5ce0d-...lovable.app` (and the published site is `fridgecuisine.lovable.app` / `fridgecuisine.com`). If those hostnames aren't in the widget's allow-list, Cloudflare returns 400020.
2. **Wrong key pasted.** e.g. the secret key was pasted into `TURNSTILE_SITE_KEY`, or a typo / extra whitespace. Site keys start with `0x4AAAAAAA...`.

## Plan

1. Open the Cloudflare Turnstile dashboard → your widget → **Settings** and add these hostnames to the allow-list:
   - `fridgecuisine.com`
   - `www.fridgecuisine.com`
   - `fridgecuisine.lovable.app`
   - `lovable.app` (covers all `*.lovable.app` preview/sandbox subdomains)
   - `localhost` (optional, for local dev)
2. Confirm the **Site Key** value (starts with `0x4AAAAAAA…`) and the **Secret Key** value (starts with `0x4AAAAAAA…` too but is the "secret" one) are not swapped. If they were swapped, update `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` accordingly.
3. Reload the contact page — the widget should render without 400020.

If after step 1+2 it still fails, I'll add a small server-side log of the verification response (`error-codes` from siteverify) so we can pinpoint the exact reason, and I can also offer a "test mode" sitekey (`1x00000000000000000000AA`) to confirm the integration end-to-end independent of your real key.

## No code changes proposed yet

The code is behaving correctly given a bad/blocked sitekey. I'd rather fix the config first than start patching code. Let me know once you've updated the hostnames (or if you'd like me to switch to a Turnstile test key temporarily to prove the wiring).
