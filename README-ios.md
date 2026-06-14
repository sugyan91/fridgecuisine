# Building the FridgeCuisine iOS App

The iOS app is a Capacitor shell that loads the live web app from
`https://fridgecuisine.com` inside a native WebView, plus native plugins
(camera, push, splash). This is the same pattern used by many production
apps (Basecamp HEY, X/Twitter for years, etc.) and is accepted by Apple
review as long as there is real native functionality — which we have
(native camera for fridge photos).

## Prerequisites (one-time, on your Mac)

1. macOS with **Xcode 15+** (free, Mac App Store).
2. **Node.js 22+** (Capacitor 8 requires it). Use `nvm install 22 && nvm use 22`.
3. **CocoaPods**: `sudo gem install cocoapods`.
4. **Apple Developer Program** membership ($99/year).
5. Bundle ID registered in App Store Connect matching `appId` in
   `capacitor.config.ts` (currently `com.fridgecuisine.app`).

## First-time setup

```bash
git clone <your-repo-url>
cd fridgecuisine
npm install
# dist/index.html is committed — no `npm run build` needed for iOS.
npx cap add ios
npx cap sync ios
npx cap open ios
```

In Xcode:

1. **App** target → **Signing & Capabilities** → check
   **Automatically manage signing**, pick your Team.
2. Add capabilities:
   - **Sign in with Apple** (required by Apple if you offer Google sign-in).
   - **Push Notifications** (only if you use them).
3. Confirm `ios/App/App/Info.plist` has:

```xml
<key>NSCameraUsageDescription</key>
<string>FridgeCuisine uses the camera to scan ingredients in your fridge.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>FridgeCuisine reads photos so you can pick existing fridge pictures.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>FridgeCuisine saves recipe photos to your library when you tap Save.</string>
```

## Iterating

Whenever the web app updates (you ship from Lovable to fridgecuisine.com),
**the iOS app picks it up automatically** — no rebuild, no resubmission.
That's the main benefit of the hybrid approach.

Only re-sync when `capacitor.config.ts`, native plugins, or `dist/` change:

```bash
git pull
npm install
npx cap sync ios
```

Then in Xcode press **Run** (▶).

## Submitting to the App Store

1. Xcode → set **Version** (e.g. `1.0.0`) and **Build** (`1`).
2. Run target: **Any iOS Device (arm64)**.
3. **Product → Archive** → Organizer opens.
4. **Distribute App → App Store Connect → Upload**.
5. In [App Store Connect](https://appstoreconnect.apple.com), attach the
   build, add screenshots/description/privacy answers, submit for review.
6. Recommended: ship to **TestFlight** first.

## Apple review notes

- **Native value:** the app uses the native camera (`@capacitor/camera`) to
  scan fridge ingredients — this is a genuine native feature and the
  primary justification for the app vs. mobile Safari.
- **Payments (IMPORTANT):** Apple requires StoreKit (IAP) for digital
  content unlocked inside the app. If your paid recipes / Premium
  subscription are digital content, Stripe Checkout will likely be
  **rejected** at review. Two options:
  1. Hide the paywall / Premium upsell on iOS for v1 submission, ship the
     free tier only, add StoreKit IAP later.
  2. Implement StoreKit IAP before submission.
  Physical goods and consumed-outside-the-app services are fine via Stripe.
- **Sign in with Apple:** required if you offer any other social sign-in
  (Google). Add the capability in Xcode and wire it up server-side.

## How it works (under the hood)

`capacitor.config.ts` has a `server.url` pointing at
`https://fridgecuisine.com`. When iOS launches the app, the WKWebView
loads that URL directly. The bundled `dist/index.html` is a fallback
splash that also redirects to `https://fridgecuisine.com` if the
`server.url` config is ever removed.

Because the WebView origin is `fridgecuisine.com`:
- Cookies, Supabase auth sessions, and Stripe redirects all work normally.
- Magic-link email callbacks open the app via universal links (configure
  in `apple-app-site-association` on fridgecuisine.com when you're ready).
- Native plugins (camera, push, status bar) are still bridged via the
  Capacitor JS shim injected at WebView startup.

## Troubleshooting

- *"The Capacitor CLI requires NodeJS >=22.0.0"* — `nvm install 22 && nvm use 22`.
- *"No such module 'Capacitor'"* — run `npx cap sync ios` and reopen Xcode.
- *Camera button does nothing on device* — check Info.plist usage strings
  above and confirm the user granted permission in iOS Settings.
- *Blank white screen on launch* — confirm `capacitor.config.ts` still has
  the `server.url` block; without it the app falls back to `dist/index.html`
  which then redirects.
- *Sign in with Apple missing* — add it in Xcode → Signing & Capabilities.
