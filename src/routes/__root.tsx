import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";
import { saveRecipe as saveRecipeFn } from "@/lib/saved-recipes.functions";
import { sendWelcomeEmail } from "@/lib/email/welcome.functions";
import { LanguageProvider } from "@/lib/language";
import { ConsentProvider } from "@/lib/consent";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { initAnalytics, trackPageview } from "@/lib/analytics";

const PENDING_SAVE_KEY = "fc-pending-save";

async function drainPendingSave() {
  if (typeof window === "undefined") return;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PENDING_SAVE_KEY);
  } catch {
    return;
  }
  if (!raw) return;
  try {
    const recipe = JSON.parse(raw);
    await saveRecipeFn({ data: { recipe } });
  } catch (e) {
    console.error("Failed to drain pending save", e);
  } finally {
    try {
      localStorage.removeItem(PENDING_SAVE_KEY);
    } catch {}
  }
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 font-display text-4xl font-bold text-primary">
          404
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          We can't find that page
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          The link may be broken, or the page may have been moved. Let's get you back to something delicious.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="btn-premium-surface inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-transform hover:-translate-y-[1px]"
          >
            Back to Home
          </Link>
          <Link
            to="/community"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-background/60 px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent/40"
          >
            Discover recipes
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md rounded-3xl border border-border/60 bg-card p-8 text-center shadow-soft">
        <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/></svg>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          We couldn't finish loading this page. Try again in a moment, or head back home.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-premium-surface inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-transform hover:-translate-y-[1px]"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-background/60 px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent/40"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FridgeCuisine — Your AI personal chef" },
      {
        name: "description",
        content:
          "Turn what's in your fridge into real meals. AI recipes with steps, cook times, and substitutions — any cuisine, any diet.",
      },
      { name: "author", content: "FridgeCuisine" },
      { name: "theme-color", content: "#c4654a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "FridgeCuisine" },
      { name: "google-site-verification", content: "VLZZMynlIIESF6ygQoSSBH10dZntp_KolorFqbOrcRo" },
      { property: "og:title", content: "FridgeCuisine — Your AI personal chef" },
      {
        property: "og:description",
        content:
          "Turn what's in your fridge into real meals. AI recipes, meal plans, and chef-made dishes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "FridgeCuisine — Your AI personal chef" },
      { name: "twitter:description", content: "Turn what's in your fridge into real meals. AI recipes, meal plans, and chef-made dishes." },
      { property: "og:site_name", content: "FridgeCuisine" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/Q2fhDCrVOphfKxIevHpm4F2c6Fu1/social-images/social-1779069681377-Screenshot_2026-05-17_at_4.37.34_PM.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/Q2fhDCrVOphfKxIevHpm4F2c6Fu1/social-images/social-1779069681377-Screenshot_2026-05-17_at_4.37.34_PM.webp" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,500;1,9..144,600;1,9..144,700&family=Inter+Tight:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=Inter:wght@400;500;600;700&family=Hind:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "FridgeCuisine",
          url: "https://fridgecuisine.com",
          logo: "https://fridgecuisine.com/favicon.ico",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "FridgeCuisine",
          url: "https://fridgecuisine.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://fridgecuisine.com/?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    // Boot consent-aware analytics. Will only actually load the analytics
    // script if the user has granted analytics consent (and a GA id is set).
    initAnalytics();
    try { trackPageview(window.location.pathname + window.location.search); } catch {}
    const unsub = router.subscribe("onResolved", () => {
      try { trackPageview(window.location.pathname + window.location.search); } catch {}
    });

    // Remember-me enforcement: if the user signed in without "Remember me",
    // we set a sessionStorage marker. When the browser is closed the marker
    // is gone, so on the next load we sign them out.
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        // Only sign out when the user explicitly chose "don't remember me"
        // on the last sign-in (we set fc-auth-ephemeral=1 in that case) AND
        // the in-tab marker is gone — meaning the browser was reopened.
        // Google / magic-link / password-reset sign-ins never set this flag,
        // so their sessions persist normally.
        const ephemeral = localStorage.getItem("fc-auth-ephemeral") === "1";
        const sessionMarker = sessionStorage.getItem("fc-auth-session") === "1";
        if (ephemeral && !sessionMarker) {
          localStorage.removeItem("fc-auth-ephemeral");
          await supabase.auth.signOut();
        }
      } catch {}
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Fire-and-forget: drain any recipe the user tried to save before signup
        drainPendingSave();
        // Fire-and-forget welcome email (server-side idempotent — at most one per user).
        try {
          const flagKey = `fc-welcome-sent-${session.user.id}`;
          if (!localStorage.getItem(flagKey)) {
            sendWelcomeEmail().then(() => {
              try { localStorage.setItem(flagKey, "1"); } catch {}
            }).catch(() => {});
          }
        } catch {}
      }
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => {
      subscription.unsubscribe();
      try { unsub(); } catch {}
    };
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ConsentProvider>
          <div className="pb-16 md:pb-0">
            <Outlet />
          </div>
          <MobileBottomNav />
          <CookieConsentBanner />
        </ConsentProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
