import { getIngredientIcon } from "@/lib/ingredient-icons";

type Props = {
  name: string;
  className?: string;
};

/**
 * Renders ingredient icons with the platform emoji font instead of a remote
 * CDN image, so iOS WebViews are not blocked by third-party image loading.
 */
export function IngredientIcon({ name, className = "" }: Props) {
  const emoji = getIngredientIcon(name);
  return (
    <span
      aria-hidden
      className={`inline-flex w-[1.15em] h-[1.15em] items-center justify-center align-[-0.18em] leading-none ${className}`}
      style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", emoji, sans-serif' }}
    >
      {emoji}
    </span>
  );
}