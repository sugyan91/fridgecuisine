import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchDishImage, type DishImage } from "@/lib/dish-image.functions";

// Module-level cache shared across components.
const cache = new Map<string, DishImage>();
const inflight = new Map<string, Promise<DishImage>>();

function keyOf(title: string, cuisine?: string): string {
  return `${title.toLowerCase().trim()}|${(cuisine ?? "").toLowerCase().trim()}`;
}

export function useDishImage(params: {
  title: string;
  cuisine?: string;
  ingredients?: string[];
  enabled?: boolean;
}) {
  const { title, cuisine, ingredients, enabled = true } = params;
  const fetchFn = useServerFn(searchDishImage);
  const k = keyOf(title, cuisine);
  const [image, setImage] = useState<DishImage>(cache.get(k) ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !title) return;
    if (cache.has(k)) {
      setImage(cache.get(k) ?? null);
      return;
    }
    setLoading(true);
    let cancelled = false;

    const p =
      inflight.get(k) ??
      fetchFn({ data: { title, cuisine, ingredients } })
        .then((res) => {
          cache.set(k, res);
          return res;
        })
        .catch(() => null as DishImage)
        .finally(() => inflight.delete(k));
    inflight.set(k, p);

    p.then((res) => {
      if (!cancelled) {
        setImage(res);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, enabled]);

  return { image, loading };
}
