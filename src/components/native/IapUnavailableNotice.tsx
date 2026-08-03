import { Info } from "lucide-react";

type Props = {
  /** Short context line, e.g. "Premium plans" or "Recipe purchases". */
  what?: string;
  className?: string;
};

/**
 * Shown in the native iOS app where a Stripe purchase CTA would normally be.
 */
export function IapUnavailableNotice({ what = "Purchases", className = "" }: Props) {
  return (
    <div
      className={`rounded-xl border-2 border-border bg-muted/50 p-3 text-left ${className}`}
      role="note"
    >
      <p className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          {what} aren't available in the iOS app yet. Everything on the free
          plan works here — you can manage {what.toLowerCase()} at
          fridgecuisine.com in your browser.
        </span>
      </p>
    </div>
  );
}
