# Publish FridgeCuisine to the Apple App Store

Goal: Package the existing Capacitor-based iOS app and submit it to the App Store using your existing Apple Developer account.

## Current state
- `capacitor.config.ts` already exists with `appId: "com.fridgecuisine.app"` and `appName: "FridgeCuisine"`.
- `@capacitor/ios` and `@capacitor/cli` are already in `package.json`.
- `README-ios.md` documents the full native build flow.
- The iOS app loads the live web app from `https://fridgecuisine.com`, so web updates do not require a new app submission.

## Step-by-step directions

### 1. Prepare your Mac environment
- macOS with Xcode 15+ installed from the Mac App Store.
- Node.js 22+ (`nvm install 22 && nvm use 22`).
- CocoaPods: `sudo gem install cocoapods`.
- You already have an Apple Developer Program membership.

### 2. Register the app in App Store Connect
- Go to https://appstoreconnect.apple.com → Apps → click the plus (+) → New App.
- Platform: iOS.
- Name: FridgeCuisine (must be unique in App Store).
- Primary language: English.
- Bundle ID: choose `com.fridgecuisine.app` (must match `capacitor.config.ts`).
- SKU: any unique identifier, e.g. `fridgecuisine-2026`.
- User access: choose your team.

### 3. Generate the native iOS project
In the project folder on your Mac:

```bash
git clone <your-repo-url>
cd fridgecuisine
bun install
# dist/index.html is already committed; no web build is required for the iOS shell.
npx cap add ios
npx cap sync ios
npx cap open ios
```

### 4. Configure Xcode
- Select the **App** target → **Signing & Capabilities**.
- Check **Automatically manage signing** and pick your Apple Developer team.
- Add capabilities:
  - **Sign in with Apple** (required because the app offers Google sign-in).
  - **Push Notifications** (optional; only if you plan to use them).
- Verify `ios/App/App/Info.plist` contains these usage descriptions:
  - `NSCameraUsageDescription`: "FridgeCuisine uses the camera to scan ingredients in your fridge."
  - `NSPhotoLibraryUsageDescription`: "FridgeCuisine reads photos so you can pick existing fridge pictures."
  - `NSPhotoLibraryAddUsageDescription`: "FridgeCuisine saves recipe photos to your library when you tap Save."

### 5. Address the Apple review payment risk
Apple requires StoreKit (In-App Purchase) for digital content or subscriptions unlocked inside the app. Stripe Checkout for paid recipes or Premium subscriptions will likely be rejected.

Choose one path:
- **Option A (fastest first submission):** Hide the Premium paywall and paid recipe purchase UI on iOS. Ship the free tier only. Add StoreKit IAP later.
- **Option B (full monetization):** Implement Apple StoreKit In-App Purchases for the Premium tier and any digital recipe unlocks before submission.

### 6. Build and upload
- In Xcode, set **Version** (e.g. `1.0.0`) and **Build** (`1`).
- Set the run target to **Any iOS Device (arm64)**.
- Go to **Product → Archive**. The Organizer window opens.
- Click **Distribute App → App Store Connect → Upload**.
- Wait for the upload to finish.

### 7. Complete App Store Connect submission
- In App Store Connect, select the new build under the FridgeCuisine app.
- Fill in required metadata:
  - App screenshots for required iPhone sizes.
  - Description, keywords, support URL, marketing URL.
  - Privacy policy URL.
  - App Review Information (contact, demo account if needed).
- Answer the privacy questionnaire (data usage, analytics, etc.).
- Recommended: first distribute to **TestFlight** internal testers for smoke testing.
- When ready, click **Submit for Review**.

### 8. After launch
- Web updates shipped to `fridgecuisine.com` are picked up by the iOS app automatically.
- Only re-run `npx cap sync ios` and re-archive when you change `capacitor.config.ts`, add native plugins, or update native dependencies.

## Open decisions before we proceed
1. Which payment path do you want: hide paid features on iOS for v1, or implement StoreKit IAP first?
2. Do you want push notifications in the first release, or skip them?
3. Do you have a Mac available right now to run Xcode?

## Next action if you approve
I can prepare the iOS submission assets (screenshot sizes, App Store description template, privacy policy text) and, if you choose Option A, add an iOS-specific flag that hides the Premium paywall in the native app.