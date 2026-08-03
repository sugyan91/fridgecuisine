# FridgeCuisine App Store Submission Assets

Use this template when creating the app listing in App Store Connect.

## App Information

| Field | Value |
| --- | --- |
| App Name | FridgeCuisine |
| Subtitle | AI recipes from your fridge |
| Bundle ID | com.fridgecuisine.app |
| SKU | fridgecuisine-2026 |
| Primary Category | Food & Drink |
| Secondary Category | Lifestyle |
| Primary Language | English (US) |

## Keywords (100 characters max, comma-separated)

```
recipe, recipes, ai chef, meal planner, cooking, food, pantry, ingredients, meal prep, home cook
```

## App Description

```
Turn whatever is in your fridge into a delicious recipe — instantly.

FridgeCuisine is your AI-powered kitchen companion. Snap a photo of your fridge or pantry, tell us what you have, and our AI chef generates personalized recipes in seconds. No more "what's for dinner?" stress.

FOR HOME COOKS:
• Get recipe ideas based on ingredients you already own
• Generate breakfast, lunch, dinner, snacks, and desserts
• Save favorites and build your own digital cookbook
• Plan your week with the built-in meal planner
• Create shopping lists from any recipe

FOR CHEFS & FOOD CREATORS:
• Build a public storefront to sell your recipes from home
• Track views, likes, sales, and tips with storefront analytics
• Share recipes with followers and grow your audience

PREMIUM FEATURES:
• Higher daily AI generation limits
• Richer outputs: nutrition facts, wine pairings, and recipe variations
• PDF export for your cookbooks
• Priority support

Download FridgeCuisine today and cook smarter with what you already have.
```

## What's New (for first release)

```
Initial release of FridgeCuisine — AI recipe generation, meal planner, shopping lists, recipe storefronts, and chef analytics.
```

## Support & Marketing URLs

- Support URL: `https://fridgecuisine.com/support`
- Marketing URL: `https://fridgecuisine.com`
- Privacy Policy URL: `https://fridgecuisine.com/privacy`

## App Review Information

- Contact First Name: [Your first name]
- Contact Last Name: [Your last name]
- Phone Number: [Your phone]
- Email: [Your email]
- Demo Account: not required (sign-up is free)
- Notes for Review:

```
FridgeCuisine is a hybrid Capacitor app that wraps our responsive web app at https://fridgecuisine.com. The app provides native functionality through the Capacitor Camera plugin, allowing users to take photos of their fridge and pantry ingredients for AI recipe generation. All payments and subscriptions for digital content are handled via Apple In-App Purchase (StoreKit).
```

## Required Screenshots

Submit screenshots for these device sizes. You can generate them from the iOS Simulator in Xcode or from a physical device.

| Size | Devices | Dimensions | Count |
| --- | --- | --- | --- |
| 6.7" Display | iPhone 15 Pro Max, iPhone 14 Pro Max | 1290 x 2796 px | 4–10 |
| 6.5" Display | iPhone 14 Plus, iPhone 13 Pro Max | 1284 x 2778 px | 4–10 |
| 5.5" Display | iPhone 8 Plus | 1242 x 2208 px | 4–10 |
| 12.9" Display | iPad Pro (6th gen) | 2048 x 2732 px | 4–10 |

Suggested screenshot flows:
1. Home / ingredient input
2. AI-generated recipe result
3. Meal planner week view
4. Saved recipes / cookbook
5. Storefront analytics (chef view)

## Privacy Policy Template

Host this at `https://fridgecuisine.com/privacy` before submission:

```markdown
# Privacy Policy

Last updated: [Date]

FridgeCuisine ("we", "our", or "us") is committed to protecting your privacy.

## Information We Collect

- Account information: email address and profile details
- User-generated content: recipes, photos, pantry items, and meal plans
- Usage data: recipe generations, storefront views, likes, and sales
- Device permissions: camera and photo library (only when you use those features)

## How We Use Information

- To generate personalized recipes using AI
- To power social features like storefronts, follows, and sharing
- To process payments and subscriptions
- To improve the app and provide customer support

## Sharing

We do not sell personal data. We use trusted third-party services for authentication, payments, analytics, and cloud storage.

## Your Choices

You can delete your account and data at any time from the Account settings screen.

## Contact

For questions, email [support email].
```

## Data Usage Questionnaire (App Store Connect)

When Apple asks about data collection, answer as follows based on current features:

| Data Type | Collected? | Used For | Linked to User? | Tracking? |
| --- | --- | --- | --- | --- |
| Contact Info (email) | Yes | Authentication, support | Yes | No |
| User Content (photos, recipes, text) | Yes | Core app features | Yes | No |
| Identifiers (user ID) | Yes | Account functionality | Yes | No |
| Usage Data | Yes | Analytics, product improvement | Yes | No |
| Diagnostics | Yes | Crash reporting | No | No |

Enable **App Tracking Transparency** only if you later add advertising; otherwise leave tracking disabled.

## Payment path for v1 (Option A — free tier only on iOS)

The iOS build ships without any in-app purchase surface, so Apple's IAP rule
(3.1.1) is not triggered.

How it works in code:
- `src/lib/platform.ts` — detects the Capacitor iOS shell.
- `src/hooks/use-purchases-enabled.ts` — returns `false` inside native iOS.
- `src/components/native/IapUnavailableNotice.tsx` — replacement copy where a
  purchase CTA would appear.
- `src/routes/__root.tsx` — injects an inline script that adds the `.ios-native`
  class to `<html>` before React mounts.
- `src/styles.css` — hides any element marked `data-purchase-gated` immediately
  via CSS, preventing a flash of purchase UI on cold launch.
- `src/routes/checkout.return.tsx` — redirects any native iOS user who lands on
  the Stripe success route back to the home screen.

Hidden inside the iOS app:
- Pricing plan CTAs and Stripe embedded checkout (`/pricing`)
- Plan upgrade/downgrade switcher in Account
- Paid recipe unlocks and cookbook purchases (`/shop/*`)
- Chef tipping
- All "See plans" / "Upgrade" links (footer, banners, limit modal, usage,
  account, recipe cards, PDF export upsell)

Review notes to paste in App Store Connect:
> This version offers the free tier only. No subscriptions, purchases, or
> external payment links are presented in the app. Paid features are planned
> for a future release using Apple In-App Purchase.

Follow-up for v2: implement StoreKit IAP (subscriptions + consumable recipe
unlocks) and flip `usePurchasesEnabled` to return true on iOS once the
StoreKit flow is wired.

## App icon (fixes "None of the input catalogs contained ... AppIcon")

Xcode fails the build when `ios/App/App/Assets.xcassets` has no populated
`AppIcon.appiconset`. The source artwork lives in the repo at `resources/`:

- `resources/icon.png` — 1024x1024, opaque, no rounded corners, no alpha
- `resources/splash.png` / `resources/splash-dark.png` — 2732x2732 launch image

Regenerate the native icon and splash sets from those files:

```bash
git pull                 # get resources/ + the ios:icons script
npm install              # installs @capacitor/assets
npm run build
npx cap sync ios
npm run ios:icons        # writes ios/App/App/Assets.xcassets/AppIcon.appiconset
npx cap open ios
```

Then in Xcode: target **App → General → App Icons and Launch Screen** should
show `AppIcon`. Clean the build folder (Shift+Cmd+K) and build again.

## "Your team has no devices from which to generate a provisioning profile"

This is an account-side requirement, not a code issue. Pick one:

1. **Build for a Simulator** — no device or profile needed. Choose any iPhone
   simulator in the run-destination dropdown and press Cmd+R. Enough to verify
   that no purchase UI appears.
2. **Register a real iPhone** — plug it in, unlock, tap *Trust*, then
   Xcode → Window → Devices and Simulators → select it → *Use for Development*.
3. **Add the UDID manually** at developer.apple.com → Certificates, Identifiers
   & Profiles → Devices → **+**, then Xcode → Settings → Accounts →
   *Download Manual Profiles*.

For archiving/uploading to App Store Connect you need a **Distribution**
profile, which does not require a registered device: set the run destination to
**Any iOS Device (arm64)** and use Product → Archive.
