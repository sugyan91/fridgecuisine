# Option B — Client-only iOS build

## The core problem

Your web app runs on **TanStack Start**, which is an SSR framework. `npm run build` produces a Cloudflare Worker bundle in `.output/`, not a static `dist/index.html`. Capacitor needs a static folder it can ship inside the iPhone — there is no Node/Worker running on the device to render pages or execute server functions.

The app uses **~30+ `createServerFn` modules** (auth, recipes, payments, community, AI vision, Stripe, email, etc). Every one of those is a server-side RPC that the iPhone cannot run. They must be reached over HTTPS by calling your hosted backend at `https://fridgecuisine.com`.

## What I'll build

A second build target — let's call it `build:ios` — that produces a plain SPA in `dist/` by:

1. **Adding a parallel Vite config** (`vite.ios.config.ts`) that:
   - Disables TanStack Start's SSR plugin and Cloudflare plugin.
   - Builds a regular client-side React + TanStack Router app.
   - Outputs `dist/index.html` + hashed JS/CSS chunks.
   - Inlines `VITE_API_BASE_URL=https://fridgecuisine.com` at build time.

2. **Switching server-function calls to fetch over HTTPS.** TanStack Start server functions are already RPC under the hood (POST to `/_serverFn/<id>`). I'll add a thin client shim that, when running on iOS, rewrites every server-function call to hit `https://fridgecuisine.com/_serverFn/<id>` instead of the local origin. This keeps the existing `useServerFn(...)` call sites unchanged — no rewriting individual `.functions.ts` consumers.

3. **CORS on the hosted backend.** Add an `Access-Control-Allow-Origin: capacitor://localhost` (and `ionic://localhost`) middleware so the iOS WebView is allowed to call your server functions. Today nothing is configured for cross-origin because the web app is same-origin.

4. **Auth token handling.** Supabase auth uses cookies on the web. On iOS the WebView origin (`capacitor://localhost`) is different from `fridgecuisine.com`, so cookies won't be sent. I'll switch the iOS client to use the Supabase JS client in `localStorage` mode (already default) and attach the bearer token to each server-function fetch via the existing `attachSupabaseAuth` flow — but on the client side. The server-side `requireSupabaseAuth` middleware already accepts a bearer token, so no server changes needed.

5. **Replace SSR-only bits with client equivalents.**
   - The root layout uses `shellComponent` (SSR HTML shell). The iOS build needs a standard `index.html` with a `<div id="root">` and a client-side React mount.
   - Route `head()` SEO metadata becomes irrelevant inside the app and can be no-op'd.
   - Public-route loaders that call server functions stay — they'll fetch over HTTPS.

6. **Wire the build into Capacitor.** `package.json` script: `"build:ios": "vite build --config vite.ios.config.ts"`. README updated to: `npm run build:ios && npx cap sync ios && npx cap open ios`.

## Risks and unknowns I want you to know about

- **TanStack Start's server-function RPC URL/protocol is not a public contract.** It works today; a future Start upgrade could break it. Mitigation: pin `@tanstack/react-start` version and add a smoke test.
- **Stripe Checkout, magic-link auth callbacks, and email links all redirect to web URLs.** Inside the iOS app these will open Safari, not stay in the app. For v1 that's acceptable; v2 would need `@capacitor/browser` and deep linking.
- **Payments inside the app:** Apple requires StoreKit (IAP) for digital goods and takes 15–30%. If your paid recipes / subscriptions count as digital content, Apple may reject Stripe checkout. Physical goods and services consumed outside the app are fine via Stripe. Worth checking before submission.
- **Realtime / push notifications** are out of scope for this pass.
- **First-load size:** the SPA bundle will be bigger than the SSR'd page because nothing is pre-rendered. Acceptable for a native app.

## What I won't do

- Won't change anything about the web (`fridgecuisine.com`) — it keeps running TanStack Start SSR exactly as today.
- Won't add IAP / StoreKit (separate workstream if Apple flags payments).
- Won't generate the Xcode project — still happens on your Mac with `npx cap add ios`.

## Deliverables in this pass

- `vite.ios.config.ts`
- `src/ios-entry.tsx` (client-only React mount)
- `index.html` (SPA template for the iOS build)
- `src/lib/server-fn-client.ts` (HTTPS rewrite shim for server-function calls)
- CORS handling in `src/server.ts` / start middleware
- `package.json` script `build:ios`
- Updated `README-ios.md` with the new flow
- A placeholder/empty `dist/index.html` is no longer needed — the real build will produce one

## After I'm done, on your Mac

```bash
git pull
npm install
npm run build:ios        # produces dist/index.html for Capacitor
npx cap sync ios
npx cap open ios
```

## One question before I start

Apple's IAP rule is the single biggest rejection risk. Are your paid recipes / Premium subscription **digital content unlocked inside the app** (likely needs StoreKit), or are they **services / physical** (Stripe is fine)? If digital, I should plan a follow-up to swap Stripe → StoreKit for the iOS build, or hide the paywall on iOS entirely for v1 submission.
