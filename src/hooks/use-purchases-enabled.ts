import { useEffect, useState } from "react";
import { isIOSNative } from "@/lib/platform";

/**
 * Option A for the App Store build: the iOS app ships free-tier only.
 * Apple requires digital goods to use In-App Purchase, so every Stripe
 * paywall, subscription CTA, recipe unlock and tip flow is hidden inside
 * the native iOS shell.
 *
 * Returns true on web/Android, false inside the native iOS app.
 * Resolved after mount to stay hydration-safe; the inline platform script
 * in __root.tsx hides purchase UI immediately via CSS to avoid a flash.
 */
export function usePurchasesEnabled(): boolean {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (isIOSNative()) setEnabled(false);
  }, []);

  return enabled;
}
