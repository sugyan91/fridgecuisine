## Getting your app on the App Store

Lovable builds web apps, not native iOS apps. To publish to the Apple App Store, you wrap your web app in a thin native shell using **Capacitor**. Apple will not accept a plain web URL or a PWA submission for most use cases.

### What you'll need
- A **Mac** with Xcode installed (App Store builds can only be produced on macOS)
- An **Apple Developer account** ($99/year — sign up at developer.apple.com)
- Your project exported to GitHub (Lovable → GitHub → Connect project)
- About 1–2 hours for first-time setup, plus Apple's review time (typically 1–3 days)

### The full path, step by step

**1. Prepare the app inside Lovable**
- Make sure every page is responsive and works at iPhone widths
- Add a proper app name, icon, splash screen assets
- Test all flows on a narrow viewport in the preview

**2. Export to GitHub and clone locally on your Mac**
- In Lovable: + menu → GitHub → Connect project
- `git clone` your repo to your Mac

**3. Add Capacitor locally** (on your Mac, not in Lovable)
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "Your App Name" com.yourcompany.yourapp
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```
This opens Xcode with a native iOS project that loads your built web app.

**4. Configure in Xcode**
- Set bundle ID, version, signing team (your Apple Developer account)
- Add app icons (1024×1024 master + generated sizes) and launch screen
- Set required `Info.plist` permissions if you use camera, location, etc.

**5. Submit through App Store Connect**
- Create the app listing at appstoreconnect.apple.com
- Fill in metadata: description, keywords, screenshots (6.7", 6.5", 5.5" required), privacy policy URL, support URL, age rating
- In Xcode: Product → Archive → Distribute App → App Store Connect
- Submit for review

**6. Keep updating**
- Changes in Lovable → push to GitHub → pull on Mac → `npm run build && npx cap sync ios` → archive and resubmit

### Things Apple will check that often cause rejection
- A working sign-in flow with a demo account they can use
- A privacy policy URL (required)
- "Sign in with Apple" if you offer any third-party social login (you currently have Google — Apple may require Apple sign-in too)
- Account deletion must be available in-app, not just on the web
- Any premium subscription **must use Apple's in-app purchase**, not Stripe. Stripe is fine for the web version, but the iOS build will be rejected if it sells subscriptions through Stripe. You'll need to either: (a) hide premium upgrade on iOS and let users subscribe on the web, or (b) implement StoreKit and Apple's IAP

### Alternatives if the App Store is too heavy
- **PWA / "Add to Home Screen"** — users open Safari, tap Share → Add to Home Screen. Looks like an app, no review, no fee, no Apple IAP rules. Trade-off: no App Store discovery.
- **Wait on App Store**, ship the PWA path first, then add the native wrapper later when you have traction.

### What I can do for you inside Lovable right now
None of the Capacitor work happens inside Lovable — it's all local on your Mac. But before you wrap, I can help you:
- Audit and tighten mobile responsiveness
- Add a web app manifest + icons so iOS users can "Add to Home Screen" cleanly
- Add "Sign in with Apple" alongside Google (required by Apple if you keep Google sign-in)
- Add in-app account deletion (required by Apple)
- Replace or hide the Stripe upgrade flow on iOS builds

Tell me which of those you want me to start on, or if you'd rather I just walk you through the Capacitor setup in more detail.