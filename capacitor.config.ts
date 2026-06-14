import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fridgecuisine.app",
  appName: "FridgeCuisine",
  webDir: "dist",
  ios: {
    contentInset: "always",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
  },
  // For live-reload during development against the published preview, uncomment
  // and run `npx cap sync ios && npx cap run ios`. REMOVE before submitting to
  // the App Store — production builds must serve the bundled `dist/` assets.
  // server: {
  //   url: "https://fridgecuisine.lovable.app",
  //   cleartext: false,
  // },
};

export default config;