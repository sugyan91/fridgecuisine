/**
 * Platform detection helpers for Capacitor/native app behavior.
 *
 * The iOS/Android apps are Capacitor shells that load the live web app.
 * These utilities let us branch UI logic (e.g. hide Stripe paywalls on iOS
 * when Apple In-App Purchase is required) without hard-coding hostnames.
 */

export type CapacitorPlatform = "ios" | "android" | "web";

interface CapacitorGlobal {
  getPlatform?: () => CapacitorPlatform;
  isNativePlatform?: () => boolean;
  Platform?: {
    getPlatform?: () => CapacitorPlatform;
    isNativePlatform?: () => boolean;
  };
}

declare global {
  interface Window {
    Capacitor?: CapacitorGlobal;
  }
}

export function getCapacitorPlatform(): CapacitorPlatform {
  if (typeof window === "undefined") return "web";
  const cap = window.Capacitor;
  const platform = cap?.getPlatform?.() ?? cap?.Platform?.getPlatform?.();
  return platform ?? "web";
}

export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  const cap = window.Capacitor;
  return (
    cap?.isNativePlatform?.() ?? cap?.Platform?.isNativePlatform?.() ?? false
  );
}

export function isIOSNative(): boolean {
  return isNativePlatform() && getCapacitorPlatform() === "ios";
}

export function isAndroidNative(): boolean {
  return isNativePlatform() && getCapacitorPlatform() === "android";
}
