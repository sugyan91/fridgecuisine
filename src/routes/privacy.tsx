import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/landing/SiteFooter";
import logoAsset from "@/assets/fridge-cuisine-logo.png.asset.json";

const LAST_UPDATED = "May 31, 2026";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — FridgeCuisine" },
      {
        name: "description",
        content:
          "How FridgeCuisine collects, uses, and protects your data. Plain-language privacy policy for our AI recipe service.",
      },
      { property: "og:title", content: "Privacy Policy — FridgeCuisine" },
      {
        property: "og:description",
        content:
          "How FridgeCuisine collects, uses, and protects your data.",
      },
      { property: "og:url", content: "https://fridgecuisine.com/privacy" },
    ],
    links: [
      { rel: "canonical", href: "https://fridgecuisine.com/privacy" },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-foreground/80">
        {children}
      </div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 md:px-8 py-4">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <img
              src={logoImg}
              alt="Fridge Cuisine"
              className="h-8 md:h-9 w-auto rounded-lg bg-background"
            />
            <div className="min-w-0">
              <h1 className="font-display tracking-tight text-foreground leading-none text-lg md:text-xl lowercase whitespace-nowrap font-semibold">
                fridge cuisine<span className="text-primary">.</span>
              </h1>
              <p className="hidden sm:block text-[10px] sm:text-xs text-foreground/60 leading-tight mt-0.5 font-bold">
                Your own AI powered personal chef
              </p>
            </div>
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-foreground/80 hover:text-foreground px-3 py-2 rounded-full hover:bg-secondary transition-colors"
          >
            ← Back home
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 md:px-8 pt-12 md:pt-16 pb-4">
        <p className="font-display text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
          Legal
        </p>
        <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
          Privacy Policy
        </h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>
        <p className="mt-6 text-base md:text-lg text-muted-foreground">
          FridgeCuisine ("we", "us") helps you turn ingredients into recipes
          using AI. This page explains, in plain language, what we collect,
          why we collect it, and the control you have over it.
        </p>
      </section>

      <article className="max-w-3xl mx-auto px-4 md:px-8 pb-16">
        <Section title="1. What we collect">
          <p>We keep data collection to the minimum needed to run the service:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Account info:</strong> email address, display name, and
              authentication identifiers (e.g. Google sign-in ID) when you
              create an account.
            </li>
            <li>
              <strong>Recipe inputs:</strong> the ingredients, filters, and
              dietary preferences you submit to generate recipes.
            </li>
            <li>
              <strong>Saved content:</strong> recipes you save, cook, share,
              or publish to the community.
            </li>
            <li>
              <strong>Usage data:</strong> basic analytics (page views, feature
              usage, error reports) to improve the product.
            </li>
            <li>
              <strong>Payment data:</strong> if you subscribe, billing is
              handled by our payment processor (Stripe). We never see or store
              your full card number.
            </li>
          </ul>
        </Section>

        <Section title="2. How we use your data">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Generate personalized recipes from your ingredients.</li>
            <li>Save your recipes, preferences, and cooking history.</li>
            <li>Send essential account and transactional emails (welcome, password reset, receipts).</li>
            <li>Improve recipe quality, fix bugs, and prevent abuse.</li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal data, and we do not
            use your recipe inputs to train third-party AI models for other
            customers.
          </p>
        </Section>

        <Section title="3. Third parties we share with">
          <p>To run the service we share limited data with:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>AI providers</strong> (OpenAI, Google) — to generate
              recipes and images from your inputs.
            </li>
            <li>
              <strong>Lovable Cloud (Supabase)</strong> — for database,
              authentication, and file storage.
            </li>
            <li>
              <strong>Stripe</strong> — for subscription billing.
            </li>
            <li>
              <strong>Resend</strong> — for transactional and account emails.
            </li>
            <li>
              <strong>Cloudflare</strong> — for hosting, security (Turnstile),
              and content delivery.
            </li>
          </ul>
          <p>
            Each provider processes data only as needed to deliver their
            service to us.
          </p>
        </Section>

        <Section title="4. Storage and security">
          <p>
            Data is stored on managed cloud infrastructure with encryption in
            transit (HTTPS) and at rest. Access is restricted by row-level
            security policies and authenticated APIs. No system is perfectly
            secure, but we apply industry-standard practices.
          </p>
        </Section>

        <Section title="5. Cookies and tracking">
          <p>
            We use essential cookies and local storage for authentication,
            session persistence, and remembering your preferences. We use
            lightweight analytics to understand aggregate usage. We do not
            run third-party advertising or cross-site tracking pixels.
          </p>
        </Section>

        <Section title="6. Your rights">
          <p>You can:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Access and update your account info from your profile.</li>
            <li>Delete saved recipes at any time.</li>
            <li>Request a copy of your data or account deletion by emailing us.</li>
            <li>Unsubscribe from non-essential emails via the link in any email.</li>
          </ul>
          <p>
            Depending on where you live, you may have additional rights under
            GDPR (EU/UK) or CCPA (California). Contact us and we will honor
            them.
          </p>
        </Section>

        <Section title="7. Data retention">
          <p>
            We keep your data while your account is active. If you delete your
            account, we remove your personal data within 30 days, except where
            we're legally required to keep records (e.g. tax invoices).
          </p>
        </Section>

        <Section title="8. Children's privacy">
          <p>
            FridgeCuisine is not directed at children under 13 (or under 16 in
            the EU). We do not knowingly collect personal data from children.
            If you believe a child has provided us data, contact us and we'll
            delete it.
          </p>
        </Section>

        <Section title="9. International users">
          <p>
            Our infrastructure operates globally. By using FridgeCuisine you
            consent to your data being processed in the countries where our
            providers operate, including the United States and the European
            Union.
          </p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>
            We may update this policy as the service evolves. Material changes
            will be announced via email or an in-app notice. The "Last updated"
            date at the top reflects the current version.
          </p>
        </Section>

        <Section title="11. Contact us">
          <p>
            Questions about privacy? Email{" "}
            <a
              href="mailto:support@fridgecuisine.com"
              className="text-primary underline-offset-4 hover:underline"
            >
              support@fridgecuisine.com
            </a>{" "}
            or use the{" "}
            <Link to="/contact" className="text-primary underline-offset-4 hover:underline">
              contact form
            </Link>
            .
          </p>
        </Section>
      </article>

      <SiteFooter />
    </main>
  );
}