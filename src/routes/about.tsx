import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { Sparkles, ShieldCheck, ChefHat, Leaf, Globe, HeartHandshake } from "lucide-react";
import logoAsset from "@/assets/fridge-cuisine-logo.png.asset.json";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About FridgeCuisine — our mission and how the AI works" },
      {
        name: "description",
        content:
          "FridgeCuisine helps home cooks turn what's in the fridge into real meals. Learn who we are, how the AI works, and what we stand for.",
      },
      { property: "og:title", content: "About FridgeCuisine" },
      {
        property: "og:description",
        content: "Our mission, how the AI works, and what home cooks can expect.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fridgecuisine.com/about" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "About FridgeCuisine" },
      { name: "twitter:description", content: "Meet the team behind your AI personal chef." },
    ],
    links: [{ rel: "canonical", href: "https://fridgecuisine.com/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="max-w-6xl mx-auto px-6 md:px-8 pt-8 pb-4">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <img src={logoAsset.url} alt="FridgeCuisine" className="h-9 w-auto rounded-lg" />
          <span className="font-display text-lg lowercase tracking-tight text-foreground">
            fridge cuisine<span className="text-primary">.</span>
          </span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-16">
        <p className="font-display text-[11px] tracking-[0.28em] uppercase text-primary/80 mb-4">
          Our story
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
          Cooking should start with what you already have.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          FridgeCuisine started with a simple frustration: standing in front of an
          open fridge, ingredients everywhere, and no idea what to make. We built
          the AI cooking companion we wanted for ourselves — one that respects your
          pantry, your diet, your time, and the way you actually cook.
        </p>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            What we believe
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Belief icon={<Leaf className="h-5 w-5" />} title="Less waste, more cooking">
              Recipes built around what's in your fridge, not shopping lists you'll never finish.
            </Belief>
            <Belief icon={<Globe className="h-5 w-5" />} title="Every kitchen counts">
              500+ world cuisines. Any diet, any allergen, any spice level — respected by default.
            </Belief>
            <Belief icon={<ChefHat className="h-5 w-5" />} title="Real chefs, real pay">
              Home chefs keep 90% of every recipe or cookbook they sell. Your kitchen, your business.
            </Belief>
            <Belief icon={<HeartHandshake className="h-5 w-5" />} title="Cook, don't scroll">
              We optimise for meals made, not minutes spent in the app.
            </Belief>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            How the AI works
          </h2>
          <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">You describe the goal.</span>{" "}
              A dish name, a list of ingredients, or a mood ("something warming, 20 minutes").
            </p>
            <p>
              <span className="font-semibold text-foreground">The AI proposes a full recipe.</span>{" "}
              Steps, timings, substitutions, and nutrition — grounded by your saved preferences
              (diet, allergies, kitchen equipment, skill level).
            </p>
            <p>
              <span className="font-semibold text-foreground">You cook.</span>{" "}
              Step-by-step cook mode keeps your screen on, reads steps aloud, and runs timers so
              your hands stay in the pan.
            </p>
            <p>
              <span className="font-semibold text-foreground">It learns quietly.</span>{" "}
              Skipped picks and dislikes shape tomorrow's dinner suggestion — no data leaves your
              account, and you can wipe it any time from{" "}
              <Link to="/preferences" className="text-primary underline-offset-4 hover:underline">
                Preferences
              </Link>.
            </p>
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-border/60 bg-card/60 p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Safety, privacy & trust
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                Read how we handle your data, how payments to home chefs work, and what our
                security posture looks like today.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/security"
                  className="inline-flex h-10 items-center rounded-full border border-border/70 bg-background/70 px-5 text-sm font-medium text-foreground hover:bg-accent/40"
                >
                  Security & privacy
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex h-10 items-center rounded-full border border-border/70 bg-background/70 px-5 text-sm font-medium text-foreground hover:bg-accent/40"
                >
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Ready when you are
          </div>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground">
            Let's cook something tonight.
          </h2>
          <div className="mt-6">
            <Link
              to="/"
              className="btn-premium-surface inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-semibold"
            >
              Open your kitchen
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Belief({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}