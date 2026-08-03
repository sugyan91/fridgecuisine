import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Loader2, BookOpen, ChefHat } from "lucide-react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import {
  getCookbookDetail,
  createCookbookCheckout,
  type CookbookDetail,
} from "@/lib/cookbook-shop.functions";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePurchasesEnabled } from "@/hooks/use-purchases-enabled";
import { IapUnavailableNotice } from "@/components/native/IapUnavailableNotice";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { SafeImage } from "@/components/ui/safe-image";
import { supabase } from "@/integrations/supabase/client";
import { recordStorefrontView } from "@/lib/storefront-analytics.functions";

export const Route = createFileRoute("/shop/cookbook/$cookbookId")({
  loader: ({ params }) => getCookbookDetail({ data: { id: params.cookbookId } }),
  head: ({ loaderData, params }) => {
    const c = loaderData?.cookbook;
    const url = `https://fridgecuisine.com/shop/cookbook/${params.cookbookId}`;
    const title = c ? `${c.title} — Cookbook · FridgeCuisine` : "Cookbook — FridgeCuisine";
    const description =
      c?.description?.slice(0, 155) ||
      (c
        ? `Buy the ${c.title} cookbook by ${c.author_name || "a home chef"} on FridgeCuisine.`
        : "Chef-curated cookbook bundles.");
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (c?.cover_image_url) {
      meta.push({ property: "og:image", content: c.cover_image_url });
      meta.push({ name: "twitter:image", content: c.cover_image_url });
    }
    return { meta, links: [{ rel: "canonical", href: url }] };
  },
  errorComponent: ({ error }) => (
    <main className="min-h-screen grid place-items-center text-center px-4">
      <div>
        <p className="font-display text-2xl uppercase">Something went wrong</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    </main>
  ),
  notFoundComponent: () => (
    <main className="min-h-screen grid place-items-center text-center px-4">
      <p className="font-display text-2xl uppercase">Cookbook not found</p>
    </main>
  ),
  component: CookbookDetailPage,
});

function CookbookDetailPage() {
  const { cookbookId } = Route.useParams();
  const loaded = Route.useLoaderData();
  const cookbook = loaded?.cookbook as CookbookDetail | null;
  const isMobile = useIsMobile();
  const startCheckout = useServerFn(createCookbookCheckout);
  const purchasesEnabled = usePurchasesEnabled();

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `sv:cookbook:${cookbookId}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    recordStorefrontView({ data: { source: "cookbook", cookbook_id: cookbookId } }).catch(() => {});
  }, [cookbookId]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setAuthed(!!data.user);
      if (data.user) {
        const { data: p } = await supabase
          .from("recipe_purchases")
          .select("id")
          .eq("buyer_user_id", data.user.id)
          .eq("cookbook_id", cookbookId)
          .eq("status", "paid")
          .limit(1)
          .maybeSingle();
        setOwned(!!p);
      }
    })();
  }, [cookbookId]);

  if (!cookbook) {
    return (
      <main className="min-h-screen grid place-items-center px-4 text-center">
        <p className="font-display text-2xl uppercase">Cookbook not found</p>
      </main>
    );
  }

  const fetchClientSecret = async (): Promise<string> => {
    const returnUrl = `${window.location.origin}/checkout/return?type=cookbook&cookbook_id=${cookbookId}&session_id={CHECKOUT_SESSION_ID}`;
    const res = await startCheckout({
      data: {
        cookbookId,
        returnUrl,
        environment: getStripeEnvironment(),
      },
    });
    if (res.alreadyPurchased) {
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
      <div className="max-w-3xl mx-auto">
        <Link to="/shop" className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
          ← Back to shop
        </Link>

        {cookbook.cover_image_url ? (
          <SafeImage
            src={cookbook.cover_image_url}
            alt={cookbook.title}
            className="w-full aspect-video object-cover rounded-3xl border-4 border-border mt-4"
          />
        ) : (
          <div className="w-full aspect-video bg-muted rounded-3xl border-4 border-border mt-4 grid place-items-center">
            <BookOpen className="size-12 text-muted-foreground" />
          </div>
        )}

        <h1 className="font-display text-3xl md:text-5xl uppercase mt-4">{cookbook.title}</h1>
        {cookbook.author_username && (
          <p className="text-sm text-muted-foreground mt-1">
            by{" "}
            <Link to="/chef/$username" params={{ username: cookbook.author_username }} className="underline">
              {cookbook.author_name || "@" + cookbook.author_username}
            </Link>
          </p>
        )}

        {cookbook.description && <p className="mt-4 text-sm">{cookbook.description}</p>}

        <div className="mt-6 rounded-3xl border-4 border-dashed border-border bg-turmeric/15 p-6 text-center">
          <p className="font-display text-xl uppercase">Cookbook bundle</p>
          <p className="text-sm text-muted-foreground mt-1">
            {cookbook.recipes.length} recipe{cookbook.recipes.length === 1 ? "" : "s"} — buy once, unlock every recipe inside.
          </p>
          <p className="font-black text-3xl mt-3">${(cookbook.price_cents / 100).toFixed(2)}</p>
          {owned ? (
            <span className="mt-4 inline-block bg-foreground text-background border-2 border-border px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide">
              You own this
            </span>
          ) : !purchasesEnabled ? (
            <IapUnavailableNotice what="Cookbook purchases" className="mt-4" />
          ) : authed ? (
            <button
              type="button"
              data-purchase-gated
              onClick={() => setCheckoutOpen(true)}
              className="mt-4 bg-paprika text-white border-2 border-border px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide shadow-[0px_3px_0px_0px_var(--border)] active:translate-y-0.5"
            >
              Buy cookbook
            </button>
          ) : (
            <Link
              to="/login"
              data-purchase-gated
              search={{ redirect: `/shop/cookbook/${cookbookId}` }}
              className="mt-4 inline-block bg-paprika text-white border-2 border-border px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide shadow-[0px_3px_0px_0px_var(--border)] active:translate-y-0.5"
            >
              Sign in to buy
            </Link>
          )}
        </div>

        <section className="mt-8">
          <h2 className="font-display text-2xl uppercase mb-3">What's inside</h2>
          {cookbook.recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Recipes are being added.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {cookbook.recipes.map((r) => (
                <li key={r.id} className="rounded-2xl border-2 border-border bg-card overflow-hidden flex">
                  {r.cover_image_url ? (
                    <SafeImage src={r.cover_image_url} alt={r.title} className="w-24 h-24 object-cover shrink-0" />
                  ) : (
                    <div className="w-24 h-24 bg-muted grid place-items-center shrink-0">
                      <ChefHat className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-3 flex-1">
                    <p className="font-black text-sm leading-tight line-clamp-2">{r.title}</p>
                    {!owned && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Lock className="size-3" /> Unlocks with the bundle
                      </p>
                    )}
                    {owned && (
                      <Link
                        to="/shop/$recipeId"
                        params={{ recipeId: r.id }}
                        className="text-xs font-black uppercase text-paprika underline mt-1 inline-block"
                      >
                        Cook this →
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Drawer open={isMobile && checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DrawerContent className="h-[92vh] p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="font-display text-sm uppercase tracking-wide">Secure checkout</p>
            <DrawerClose asChild>
              <button className="text-xs font-black uppercase tracking-wide text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border-2 border-border">
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
