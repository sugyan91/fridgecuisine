# Building the FridgeCuisine iOS App

This project is wrapped with [Capacitor](https://capacitorjs.com) so it can be
submitted to the Apple App Store as a native iOS app. The web code lives in
this repo; the iOS Xcode project is generated on your Mac.

## Prerequisites (one-time, on your Mac)

1. macOS with **Xcode 15+** (free, from the Mac App Store).
2. **Node.js 20+** and either `npm` or `bun`.
3. **CocoaPods**: `sudo gem install cocoapods` (Xcode usually installs Ruby).
4. An **Apple Developer Program** membership ($99/year, developer.apple.com).
5. App bundle identifier registered in App Store Connect — must match
   `appId` in `capacitor.config.ts` (currently `com.fridgecuisine.app`).

## First-time setup

```bash
git clone <your-repo-url>
cd <project>
npm install            # or: bun install
npm run build          # builds the web app into dist/
npx cap add ios        # creates the ios/ folder with the Xcode project
npx cap sync ios       # copies dist/ + Capacitor plugins into the iOS project
npx cap open ios       # opens Xcode
```

In Xcode:

1. Select the **App** target → **Signing & Capabilities**.
2. Check **Automatically manage signing** and choose your Team.
3. Add capabilities you need:
   - **Sign in with Apple** (required by Apple if you offer Google sign-in).
   - **Push Notifications** (only if you use them).
4. Open `ios/App/App/Info.plist` and confirm these usage strings are present
   (Capacitor adds them when you sync, but verify):

```xml
<key>NSCameraUsageDescription</key>
<string>FridgeCuisine uses the camera to scan ingredients in your fridge.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>FridgeCuisine reads photos so you can pick existing fridge pictures.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>FridgeCuisine saves recipe photos to your library when you tap Save.</string>
```

## Iterating

Whenever you pull new web changes from Lovable:

```bash
git pull
npm install            # only if package.json changed
npm run build
npx cap sync ios       # copies the new dist/ into the iOS project
```

Then in Xcode press **Run** (▶) to launch on the Simulator or a connected
iPhone.

## Submitting to the App Store

1. In Xcode set **Version** (e.g. `1.0.0`) and **Build** (`1`, increment for
   each upload).
2. Select **Any iOS Device (arm64)** as the run target.
3. **Product → Archive**. When done, the Organizer window opens.
4. Click **Distribute App → App Store Connect → Upload**. Xcode handles
   signing automatically.
5. In [App Store Connect](https://appstoreconnect.apple.com), attach the
   uploaded build to your app version, add screenshots, description, privacy
   answers, and submit for review.
6. Recommended: send to **TestFlight** first for internal testing before
   public release.

## Live-reload during development (optional)

If you want the app on your phone to reload from the published web URL
instead of bundled assets, uncomment the `server` block in
`capacitor.config.ts`, run `npx cap sync ios`, then `npx cap run ios`.
**Remove that block before submitting** — Apple requires the production
build to ship the assets, not load them from a remote URL.

## Troubleshooting

- *"No such module 'Capacitor'"* — run `npx cap sync ios` and reopen Xcode.
- *Camera button does nothing on device* — check the Info.plist usage
  strings above and confirm the user granted permission in Settings.
- *Sign in with Apple missing* — add the capability in Xcode (Signing &
  Capabilities → + Capability → Sign in with Apple).