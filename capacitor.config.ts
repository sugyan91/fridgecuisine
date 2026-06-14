import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fridgecuisine.app",
  appName: "FridgeCuisine",
  webDir: "dist",
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
  },
  // The iOS app loads the live web app from fridgecuisine.com. The bundled
  // dist/index.html is a minimal bootstrap that redirects into the live site
  // so the WebView origin is fridgecuisine.com (cookies, auth, Stripe all
  // work normally). Native plugins (camera, push, etc.) are still bridged.
  server: {
    url: "https://fridgecuisine.com",
    cleartext: false,
    allowNavigation: [
      "fridgecuisine.com",
      "*.fridgecuisine.com",
      "*.lovable.app",
      "cdn.jsdelivr.net",
      "*.jsdelivr.net",
      "images.unsplash.com",
      "*.unsplash.com",
      "storage.googleapis.com",
      "*.googleapis.com",
      "*.stripe.com",
      "checkout.stripe.com",
      "*.supabase.co",
      "accounts.google.com",
      "appleid.apple.com",
    ],
  },
};

export default config;