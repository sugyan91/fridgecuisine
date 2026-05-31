import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useConsent } from "@/lib/consent";

export function CookieConsentBanner() {
  const { bannerOpen, acceptAll, rejectAll, save, categories } = useConsent();
  const [analytics, setAnalytics] = useState(categories.analytics);
  const [customizing, setCustomizing] = useState(false);

  if (!bannerOpen) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-sm text-foreground/85">
            <p className="font-semibold text-foreground">We use cookies</p>
            <p className="mt-1 leading-relaxed">
              Essential cookies keep the site working. With your permission we also
              use analytics cookies to understand how the site is used. You can change
              this anytime.{" "}
              <Link to="/cookies" className="underline underline-offset-2">
                Cookie Policy
              </Link>
            </p>

            {customizing && (
              <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked disabled className="mt-1" />
                  <span>
                    <span className="font-medium text-foreground">Essential</span>
                    <span className="block text-xs text-muted-foreground">
                      Required for login, security and core features. Always on.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium text-foreground">Analytics</span>
                    <span className="block text-xs text-muted-foreground">
                      Helps us measure usage and improve the product. No ads.
                    </span>
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
            {customizing ? (
              <button
                onClick={() => save({ analytics })}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Save choices
              </button>
            ) : (
              <button
                onClick={acceptAll}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Accept all
              </button>
            )}
            <button
              onClick={rejectAll}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Reject non-essential
            </button>
            {!customizing && (
              <button
                onClick={() => setCustomizing(true)}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground"
              >
                Customize
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}