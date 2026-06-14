import { useEffect, useMemo, useState, type ImgHTMLAttributes, type ReactNode } from "react";

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  fallback?: ReactNode;
  fallbackClassName?: string;
};

function normalizeImageSrc(src?: string | null) {
  const trimmed = src?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://")) return `https://${trimmed.slice("http://".length)}`;
  return trimmed;
}

export function SafeImage({
  src,
  alt = "",
  className = "",
  fallback,
  fallbackClassName,
  loading,
  decoding,
  referrerPolicy,
  onError,
  ...props
}: SafeImageProps) {
  const normalizedSrc = useMemo(() => normalizeImageSrc(src), [src]);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [normalizedSrc]);

  if (!normalizedSrc || broken) {
    if (fallback) return <>{fallback}</>;
    return (
      <div
        className={`grid place-items-center bg-muted text-muted-foreground ${fallbackClassName ?? className}`}
        aria-label={alt || "Image unavailable"}
        role={alt ? "img" : undefined}
      >
        <span className="font-display text-2xl font-semibold opacity-50">{alt?.charAt(0) || "•"}</span>
      </div>
    );
  }

  return (
    <img
      {...props}
      src={normalizedSrc}
      alt={alt}
      className={className}
      loading={loading ?? "lazy"}
      decoding={decoding ?? "async"}
      referrerPolicy={referrerPolicy ?? "no-referrer"}
      onError={(event) => {
        onError?.(event);
        setBroken(true);
      }}
    />
  );
}