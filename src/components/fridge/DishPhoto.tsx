import { useDishImage } from "@/hooks/use-dish-image";
import { pickFallbackImage } from "@/lib/receipe-images";

type Props = {
  title: string;
  cuisine?: string;
  ingredients?: string[];
  className?: string;
  enabled?: boolean;
};

export function DishPhoto({ title, cuisine, ingredients, className, enabled }: Props) {
  const { image, loading } = useDishImage({ title, cuisine, ingredients, enabled });
  const src = image?.url ?? pickFallbackImage(title, cuisine);
  const alt = image?.alt ?? title;

  return (
    <figure className={className}>
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loading && !image ? "opacity-70" : "opacity-100"
          }`}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = pickFallbackImage(title, cuisine);
          }}
        />
      </div>
      {image?.credit && (
        <figcaption className="text-[10px] text-muted-foreground px-3 py-1 italic">
          Photo by{" "}
          <a
            href={image.credit.link}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {image.credit.name}
          </a>{" "}
          on{" "}
          <a
            href="https://unsplash.com/?utm_source=fridge_cuisine&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Unsplash
          </a>
        </figcaption>
      )}
    </figure>
  );
}
