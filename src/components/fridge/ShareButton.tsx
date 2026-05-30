import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { createSharedReceipe, type SharedReceipeData } from "@/lib/shared-receipes.functions";

type Props = {
  receipe: SharedReceipeData;
  isAuthenticated: boolean;
  variant?: "icon" | "full" | "pill";
  className?: string;
};

function buildSnippet(r: SharedReceipeData): string {
  const lines: string[] = [];
  lines.push(`🍳 ${r.title}`);
  if (r.cuisine) lines.push(`Cuisine: ${r.cuisine}`);
  const allIng = [
    ...(r.usedIngredients ?? []),
    ...(r.missingIngredients ?? []),
  ];
  if (allIng.length) {
    lines.push("");
    lines.push("Ingredients:");
    for (const i of allIng) lines.push(`• ${i}`);
  }
  if (r.steps?.length) {
    lines.push("");
    lines.push("Steps:");
    r.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  }
  return lines.join("\n");
}

export function ShareButton({
  receipe,
  isAuthenticated,
  variant = "icon",
  className = "",
}: Props) {
  const createShared = useServerFn(createSharedReceipe);
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    const snippet = buildSnippet(receipe);
    try {
      let url: string | undefined;
      if (isAuthenticated) {
        try {
          const { slug } = await createShared({ data: { receipe } });
          url = `${window.location.origin}/shared/${slug}`;
        } catch (err) {
          console.error("create share link failed", err);
        }
      }

      const shareText = url ? `${snippet}\n\n${url}` : snippet;

      // Try native share first (mobile)
      if (typeof navigator !== "undefined" && (navigator as Navigator).share) {
        try {
          await (navigator as Navigator).share({
            title: receipe.title,
            text: snippet,
            url,
          });
          return;
        } catch (err) {
          // User cancelled or share failed — fall through to clipboard
          if ((err as DOMException)?.name === "AbortError") return;
        }
      }

      // Clipboard fallback
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success(
          url
            ? "Share link copied!"
            : "Recipe copied — sign in to share a link too.",
        );
      } catch {
        toast.error("Couldn't copy. Long-press to copy manually.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-label="Share receipe"
        className={`size-10 border-2 border-border rounded-full grid place-items-center bg-white hover:bg-turmeric/20 transition-colors disabled:opacity-60 ${className}`}
      >
        <Share2 size={16} />
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 bg-card border border-border text-foreground px-4 py-2 rounded-full font-display font-semibold text-sm hover:bg-secondary transition-colors disabled:opacity-60 ${className}`}
      >
        <Share2 size={14} />
        {busy ? "Sharing…" : "Share"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`w-full bg-white text-cardamom py-3 rounded-xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2 ${className}`}
    >
      <Share2 size={16} />
      {busy ? "Sharing…" : "Share Receipe"}
    </button>
  );
}
