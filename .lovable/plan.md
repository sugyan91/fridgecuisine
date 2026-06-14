# Ship FridgeCuisine to the iOS App Store (Native)

Since you need native phone features (camera for fridge photos, push notifications, etc.) and don't yet have an Apple Developer account, here's the full path. Capacitor is the right wrapper — it takes your existing React/TanStack web app and packages it as a real native iOS app you can submit to Apple.

## What you'll need before we start

1. **Apple Developer Program account** — $99/year, sign up at developer.apple.com/programs. Approval can take 24–48 hours (sometimes longer if Apple asks for ID verification). Start this now in parallel.
2. **A Mac** with Xcode 15+ installed (from the Mac App Store, free). iOS apps can only be built and submitted from a Mac — there is no cloud workaround that avoids this for first submission. If you don't own one, options: borrow one, rent a cloud Mac (MacInCloud, MacStadium ~$30/mo), or use a service like Codemagic/Ionic Appflow that builds in the cloud.
3. **An iPhone** (recommended, for real-device testing). Simulator works for most testing but camera/notifications need real hardware.

## Phase 1 — Add Capacitor to the project (I do this in Lovable)

1. Install Capacitor core + iOS platform + the native plugins you need: `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/camera`, `@capacitor/push-notifications`, `@capacitor/preferences`, `@capacitor/splash-screen`, `@capacitor/status-bar`.
2. Create `capacitor.config.ts` with:
   - `appId: 'com.fridgecuisine.app'` (reverse-DNS, must match what you register with Apple later)
   - `appName: 'FridgeCuisine'`
   - `webDir: 'dist'` (TanStack Start build output)
   - Server config pointing at your published URL for hot-reload during dev, removed for production builds.
3. Wire the native camera into the existing fridge photo flow — wrap the current file-input upload so it calls Capacitor's `Camera.getPhoto()` when running on iOS, and falls back to the web file picker on the browser. Same for any other native feature you want (push, haptics).
4. Add iOS-specific permission strings we'll need for `Info.plist`:
   - `NSCameraUsageDescription` — "FridgeCuisine uses the camera to scan ingredients in your fridge."
   - `NSPhotoLibraryUsageDescription` — "FridgeCuisine reads photos so you can pick existing fridge pictures."
   - (Push only) enable Push Notifications capability.
5. Make sure Sign in with Apple works in-app (Apple **requires** Sign in with Apple if you offer any third-party login like Google). Lovable Cloud already supports it — I'll verify the button is wired.

## Phase 2 — Export to GitHub and pull down on your Mac (you do this)

1. In Lovable: GitHub → Connect → push the project.
2. On your Mac:
   ```bash
   git clone <your-repo>
   cd <project>
   npm install
   npx cap add ios          # creates the ios/ Xcode project (one-time)
   npm run build            # builds the web app to dist/
   npx cap sync ios         # copies web build + plugins into the iOS project
   npx cap open ios         # opens Xcode
   ```
3. Every time you make changes in Lovable: `git pull && npm run build && npx cap sync ios`.

## Phase 3 — Apple Developer setup (in parallel with Phase 1)

1. Enroll at https://developer.apple.com/programs ($99). Use a personal Apple ID or, if this is a company, an Organization enrollment (needs a D-U-N-S number, takes longer).
2. Once approved, in App Store Connect (appstoreconnect.apple.com):
   - Create a new App: name "FridgeCuisine", bundle ID `com.fridgecuisine.app` (must match `capacitor.config.ts`), language, SKU.
   - Fill App Information: category (Food & Drink), content rights, age rating questionnaire.
   - Privacy: declare data collection (email if you have auth, photos if camera, etc.).
   - Prepare screenshots: 6.7" iPhone (1290x2796) and 6.5" iPhone (1284x2778) — at least 3 each. You can capture them from the Simulator.
   - App icon: 1024x1024 PNG, no transparency, no rounded corners.

## Phase 4 — Build, sign, and submit (on your Mac, in Xcode)

1. In Xcode, select the project → Signing & Capabilities → check "Automatically manage signing" → pick your Team (created during enrollment). Xcode provisions everything automatically.
2. Set Version (1.0.0) and Build (1).
3. Run on Simulator first, then on a real iPhone (plug in, select device, Run).
4. When ready: Product → Archive. When the archive finishes, Organizer opens → "Distribute App" → App Store Connect → Upload.
5. Back in App Store Connect, the build appears in 15–30 min. Attach it to your 1.0 version, add release notes, submit for review.
6. **TestFlight** (recommended first): submit the build to TestFlight before the App Store. Lets you and beta testers try the real app. Approval for TestFlight is usually <24h; App Store review currently averages 24–48h.

## Phase 5 — After approval

- Updates: bump Build number, archive, upload, submit. Same flow.
- Web changes that don't touch native plugins can ship to your existing fridgecuisine.com immediately; native app updates always require resubmission.

## Common rejection reasons to avoid

- Missing Sign in with Apple when other social logins exist → already handled by Lovable Cloud, I'll just enable the button.
- Vague camera/photo permission strings → I'll write specific ones.
- "App is just a website" → because we add real native camera + push, this is fine.
- Missing privacy policy URL → add one before submitting (a simple `/privacy` route).

---

## What I'll do in this project (if you approve)

1. Install Capacitor + iOS plugins listed above.
2. Add `capacitor.config.ts`.
3. Add a `useNativeCamera()` hook that uses Capacitor Camera on iOS and falls back to file input on the web; wire it into the existing fridge photo upload.
4. Add a `/privacy` route with a basic privacy policy you can edit.
5. Verify Sign in with Apple button is present on `/auth`.
6. Add a short `README-ios.md` with the exact `cap add / build / sync / open` commands for your Mac.

I will **not** generate the iOS Xcode project itself — that has to happen on your Mac with `npx cap add ios` because it requires Xcode.

## Out of scope (you handle)

- Apple Developer enrollment + payment.
- Anything inside Xcode (signing, archiving, screenshots, App Store Connect listing).
- Buying/renting a Mac if you don't have one.

Approve and I'll do Phase 1 in the project.
