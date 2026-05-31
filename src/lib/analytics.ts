// Consent-aware analytics loader.
// Only loads the analytics script AFTER the user grants analytics consent.
// If VITE_GA_MEASUREMENT_ID is not set, this is a no-op (safe to ship now).

import { getConsentSnapshot } from "./consent";

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let loaded = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function loadGA(id: string) {
  if (loaded || typeof window === "undefined") return;
  loaded = true;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  // anonymize_ip + no ad personalization keeps this minimal-PII by default.
  window.gtag("config", id, {
    anonymize_ip: true,
    allow_ad_personalization_signals: false,
  });
}

function unloadGA() {
  if (typeof window === "undefined") return;
  // We cannot fully unload GA after it ran, but we can stop further tracking
  // and clear the queue so no new events fire.
  window.gtag = () => {};
  window.dataLayer = [];
  // Best-effort: clear known GA cookies for the current domain.
  try {
    const names = ["_ga", "_gid", "_gat"];
    for (const n of names) {
      document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${location.hostname}`;
    }
    // Also clear _ga_* (GA4 client cookie).
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0]?.trim();
      if (name && name.startsWith("_ga_")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${location.hostname}`;
      }
    });
  } catch {}
  loaded = false;
}

function syncFromConsent() {
  if (!GA_ID) return;
  const { decided, categories } = getConsentSnapshot();
  if (decided && categories.analytics) loadGA(GA_ID);
  else unloadGA();
}

export function initAnalytics() {
  if (typeof window === "undefined") return;
  syncFromConsent();
  window.addEventListener("fc:consent-changed", syncFromConsent);
}

export function trackPageview(path: string) {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;
  const { decided, categories } = getConsentSnapshot();
  if (!decided || !categories.analytics) return;
  window.gtag("event", "page_view", { page_path: path });
}