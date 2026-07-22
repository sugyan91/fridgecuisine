import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Lock, MapPin, Clock, Sparkles, ChefHat, ListChecks } from "lucide-react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import {
  getPaidRecipeDetail,
  getPaidRecipeFull,
  getPaidRecipeTeaser,
  type PaidRecipeTeaser,
  type PaidRecipeFull,
} from "@/lib/paid-recipes.functions";
import { createRecipePurchaseCheckout } from "@/lib/payments.functions";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { fakeRating, Stars } from "@/lib/fake-ratings";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { SafeImage } from "@/components/ui/safe-image";
import { recordStorefrontView } from "@/lib/storefront-analytics.functions";

export const Route = createFileRoute("/shop/$recipeId")({
  loader: ({ params }) => getPaidRecipeDetail({ data: { id: params.recipeId } }),
  head: ({ params, loaderData }) => {
    const r = loaderData?.recipe;
    const url = `https://fridgecuisine.com/shop/${params.recipeId}`;
    const title = r ? `${r.title} — FridgeCuisine Shop` : "Recipe — FridgeCuisine";
    const description =
      r?.description?.slice(0, 155) ||
      (r
        ? `Buy the full ${r.cuisine ?? ""} recipe for ${r.title} from a verified home chef on FridgeCuisine.`.trim()
        : "Chef-made recipes you can unlock and cook tonight.");
    const image = r?.cover_image_url ?? undefined;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { property: "og:url", content: url },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    const scripts: Array<{ type: string; children: string }> = [];
    if (r) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: r.title,
          description,
          image: image ? [image] : undefined,
          brand: { "@type": "Brand", name: r.author_name || "FridgeCuisine Chef" },
          offers: {
            "@type": "Offer",
            price: ((r.price_cents ?? 0) / 100).toFixed(2),
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url,
          },
        }),
      });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts,
    };
  },
  component: RecipeDetail,
});

function RecipeDetail() {
  const { recipeId } = Route.useParams();
  const fetchPublic = useServerFn(getPaidRecipeDetail);
  const fetchFull = useServerFn(getPaidRecipeFull);
  const startCheckout = useServerFn(createRecipePurchaseCheckout);
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Partial<PaidRecipeFull> | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `sv:recipe:${recipeId}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    recordStorefrontView({ data: { source: "paid_recipe", paid_recipe_id: recipeId } }).catch(() => {});
  }, [recipeId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userResp } = await supabase.auth.getUser();
      const isAuthed = !!userResp.user;
      if (cancelled) return;
      setAuthed(isAuthed);
      try {
        if (isAuthed) {
          const res = await fetchFull({ data: { id: recipeId } });
          if (cancelled) return;
          if (res.recipe) {
            setData(res.recipe);
            setUnlocked(res.unlocked);
          } else {
            const pub = await fetchPublic({ data: { id: recipeId } });
            if (cancelled) return;
            setData(pub.recipe);
          }
        } else {
          const pub = await fetchPublic({ data: { id: recipeId } });
          if (cancelled) return;
          setData(pub.recipe);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recipeId, fetchFull, fetchPublic]);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="size-8 animate-spin opacity-50" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen grid place-items-center bg-background text-center px-4">
        <div>
          <p className="font-display text-2xl uppercase">Recipe not found</p>
          <Link to="/shop" className="text-sm text-paprika underline">
            Back to shop
          </Link>
        </div>
      </main>
    );
  }

  const fetchClientSecret = async (): Promise<string> => {
    const returnUrl = `${window.location.origin}/checkout/return?type=recipe&recipe_id=${recipeId}&session_id={CHECKOUT_SESSION_ID}`;
    const promoCode =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("promo") ?? undefined
        : undefined;
    const res = await startCheckout({
      data: {
        recipeId: recipeId,
        returnUrl,
        environment: getStripeEnvironment(),
        ...(promoCode && { promoCode }),
      },
    });
    if (res.alreadyPurchased) {
      // Refresh into unlocked state.
      window.location.reload();
      throw new Error("Already purchased");
    }
    if (!res.clientSecret) throw new Error("No client secret");
    return res.clientSecret;
  };

  const checkoutInner = checkoutOpen ? (
    <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  ) : null;

  return (
    <main className="min-h-screen bg-background text-foreground px-4 md:px-8 py-8">
      <PaymentTestModeBanner />
      <div className="max-w-2xl mx-auto">
        <Link
          to="/shop"
          className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Back to shop
        </Link>

        {data.cover_image_url && (
          <SafeImage
            src={data.cover_image_url}
            alt={data.title}
            className="w-full aspect-video object-cover rounded-3xl border-4 border-border mt-4"
          />
        )}

        <h1 className="font-display text-3xl md:text-5xl uppercase mt-4">{data.title}</h1>
        {data.local_name && (
          <p className="text-lg text-muted-foreground italic">{data.local_name}</p>
        )}
        <AuthorAndRating
          id={recipeId}
          name={data.author_name ?? null}
          avatar={data.author_avatar_url ?? null}
        />
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
          <MapPin className="size-4" />
          {[data.city, data.country].filter(Boolean).join(", ") || "—"}
        </p>

        {data.description && <p className="mt-4 text-sm">{data.description}</p>}

        {unlocked ? (
          <UnlockedView recipe={data as PaidRecipeFull} />
        ) : (
          <LockedView
            priceCents={data.price_cents ?? 0}
            authed={!!authed}
            onBuy={() => setCheckoutOpen(true)}
            recipeId={recipeId}
          />
        )}
      </div>

      {!unlocked && (
        <div className="fixed bottom-16 md:hidden inset-x-0 z-30 p-3 bg-background/95 backdrop-blur border-t-2 border-border pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          {authed ? (
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="w-full bg-paprika text-white border-2 border-border px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wide shadow-[0px_3px_0px_0px_var(--border)] active:translate-y-0.5"
            >
              Unlock — ${((data.price_cents ?? 0) / 100).toFixed(2)}
            </button>
          ) : (
            <Link
              to="/login"
              search={{ redirect: `/shop/${recipeId}` }}
              className="block text-center w-full bg-paprika text-white border-2 border-border px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wide shadow-[0px_3px_0px_0px_var(--border)] active:translate-y-0.5"
            >
              Sign in to buy · ${((data.price_cents ?? 0) / 100).toFixed(2)}
            </Link>
          )}
        </div>
      )}

      <Drawer open={isMobile && checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DrawerContent className="h-[92vh] p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="font-display text-sm uppercase tracking-wide">Secure checkout</p>
            <DrawerClose asChild>
              <button
                type="button"
                className="text-xs font-black uppercase tracking-wide text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border-2 border-border"
              >
                Cancel
              </button>
            </DrawerClose>
          </div>
          <div className="h-full overflow-y-auto px-2 pb-6 pt-2">{checkoutInner}</div>
        </DrawerContent>
      </Drawer>
      <Dialog open={!isMobile && checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Secure checkout</DialogTitle>
          </DialogHeader>
          {checkoutInner}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function UnlockedView({ recipe }: { recipe: PaidRecipeFull }) {
  return (
    <div className="mt-6 space-y-6">
      {recipe.ingredients?.length > 0 && (
        <section>
          <h2 className="font-display text-xl uppercase mb-2">Ingredients</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2 className="font-display text-xl uppercase mb-2">Steps</h2>
        <ol className="space-y-3">
          {recipe.steps.map((s, i) => (
            <li key={i} className="bg-white border-2 border-border rounded-2xl p-3 flex gap-3">
              <span className="size-7 rounded-full bg-foreground text-background grid place-items-center text-xs font-black shrink-0">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm">{s.text}</p>
                {s.minutes != null && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="size-3" /> {s.minutes} min
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function AuthorAndRating({
  id,
  name,
  avatar,
}: {
  id: string;
  name: string | null;
  avatar: string | null;
}) {
  const { rating, count } = fakeRating(id);
  const author = name || "Home chef";
  const initial = author.charAt(0).toUpperCase();
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        {avatar ? (
          <SafeImage
            src={avatar}
            alt=""
            className="size-8 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <span className="size-8 rounded-full bg-paprika/20 text-paprika text-sm font-black grid place-items-center border-2 border-border">
            {initial}
          </span>
        )}
        <p className="text-sm">
          by <span className="font-black">{author}</span>
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <Stars rating={rating} size="text-base" />
        <span className="text-sm font-black">{rating.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">
          · {count} ratings
        </span>
      </div>
    </div>
  );
}

function LockedView({
  priceCents,
  authed,
  onBuy,
  recipeId,
}: {
  priceCents: number;
  authed: boolean;
  onBuy: () => void;
  recipeId: string;
}) {
  const fetchTeaser = useServerFn(getPaidRecipeTeaser);
  const [teaser, setTeaser] = useState<PaidRecipeTeaser | null>(null);
  const [loadingTeaser, setLoadingTeaser] = useState(false);
  const [teaserError, setTeaserError] = useState<string | null>(null);

  const loadTeaser = async () => {
    if (teaser || loadingTeaser) return;
    setLoadingTeaser(true);
    setTeaserError(null);
    try {
      const res = await fetchTeaser({ data: { id: recipeId } });
      if (!res.teaser) setTeaserError("Preview unavailable.");
      else setTeaser(res.teaser);
    } catch {
      setTeaserError("Couldn't generate preview. Try again.");
    } finally {
      setLoadingTeaser(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {!teaser && (
        <div className="bg-turmeric/15 border-4 border-dashed border-border rounded-3xl p-6 text-center">
          <div className="size-12 rounded-2xl bg-foreground text-background border-2 border-border grid place-items-center mx-auto mb-3">
            <Lock className="size-5" />
          </div>
          <p className="font-display text-xl uppercase">Unlock the full recipe</p>
          <p className="text-sm text-muted-foreground mt-1">
            Not sure yet? Get a free AI-generated peek at what's inside.
          </p>
          <button
            type="button"
            onClick={loadTeaser}
            disabled={loadingTeaser}
            className="mt-4 inline-flex items-center gap-2 bg-foreground text-background border-2 border-border px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide shadow-[0px_3px_0px_0px_var(--border)] active:translate-y-0.5 disabled:opacity-60"
          >
            {loadingTeaser ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Cooking preview…
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Peek with AI
              </>
            )}
          </button>
          {teaserError && (
            <p className="text-xs text-destructive mt-3">{teaserError}</p>
          )}
        </div>
      )}

      {teaser && (
        <div className="bg-white border-2 border-border rounded-3xl p-5 shadow-[3px_3px_0px_0px_var(--border)]">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-paprika">
            <Sparkles className="size-3.5" /> AI preview
          </div>
          <p className="font-display text-lg md:text-xl mt-2 leading-snug">
            {teaser.hook}
          </p>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <Stat label="Ingredients" value={teaser.totalIngredients} />
            <Stat label="Steps" value={teaser.totalSteps} />
            <Stat
              label="Total time"
              value={teaser.totalMinutes ? `${teaser.totalMinutes}m` : "—"}
            />
          </div>

          {teaser.ingredientHints.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                <ChefHat className="size-3.5" /> What's inside (hints)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {teaser.ingredientHints.map((h, i) => (
                  <span
                    key={i}
                    className="text-xs bg-turmeric/20 border-2 border-border rounded-full px-2.5 py-1 font-black"
                  >
                    {h}
                  </span>
                ))}
                {teaser.totalIngredients > teaser.ingredientHints.length && (
                  <span className="text-xs bg-muted border-2 border-dashed border-border rounded-full px-2.5 py-1 font-black text-muted-foreground">
                    + {teaser.totalIngredients - teaser.ingredientHints.length} more
                  </span>
                )}
              </div>
            </div>
          )}

          {teaser.stepPeeks.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                <ListChecks className="size-3.5" /> First moves
              </div>
              <ol className="space-y-2">
                {teaser.stepPeeks.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm bg-background border-2 border-border rounded-2xl p-3 flex gap-2"
                  >
                    <span className="size-6 rounded-full bg-foreground text-background grid place-items-center text-[10px] font-black shrink-0">
                      {i + 1}
                    </span>
                    <span className="italic opacity-90">{s}</span>
                  </li>
                ))}
                {teaser.totalSteps > teaser.stepPeeks.length && (
                  <li className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center pt-1">
                    + {teaser.totalSteps - teaser.stepPeeks.length} more steps locked
                  </li>
                )}
              </ol>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
            AI-generated preview. Exact amounts, timings, and technique are in
            the full recipe.
          </p>
        </div>
      )}

      <div className="bg-turmeric/15 border-4 border-dashed border-border rounded-3xl p-6 text-center">
        <div className="size-12 rounded-2xl bg-foreground text-background border-2 border-border grid place-items-center mx-auto mb-3">
          <Lock className="size-5" />
        </div>
        <p className="font-display text-xl uppercase">Unlock the full recipe</p>
        <p className="text-sm text-muted-foreground mt-1">
          Ingredients and step-by-step method are available after purchase.
        </p>
        <p className="font-black text-2xl mt-3">${(priceCents / 100).toFixed(2)}</p>
        {authed ? (
          <button
            type="button"
            onClick={onBuy}
            className="mt-4 bg-paprika text-white border-2 border-border px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide shadow-[0px_3px_0px_0px_var(--border)] active:translate-y-0.5"
          >
            Buy & unlock
          </button>
        ) : (
          <Link
            to="/login"
            search={{ redirect: `/shop/${recipeId}` }}
            className="mt-4 inline-block bg-paprika text-white border-2 border-border px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide shadow-[0px_3px_0px_0px_var(--border)] active:translate-y-0.5"
          >
            Sign in or sign up to buy
          </Link>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-background border-2 border-border rounded-2xl py-2">
      <p className="font-black text-lg leading-none">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">
        {label}
      </p>
    </div>
  );
}