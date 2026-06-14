import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/landing/SiteFooter";
import logoAsset from "@/assets/fridge-cuisine-logo.png.asset.json";

const LAST_UPDATED = "May 31, 2026";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — FridgeCuisine" },
      {
        name: "description",
        content:
          "Cookie Policy for FridgeCuisine. Learn what cookies we use, why we use them, and how to manage your preferences.",
      },
      { property: "og:title", content: "Cookie Policy — FridgeCuisine" },
      {
        property: "og:description",
        content:
          "Cookie Policy for FridgeCuisine. Learn what cookies we use, why we use them, and how to manage your preferences.",
      },
      { property: "og:url", content: "https://fridgecuisine.com/cookies" },
    ],
    links: [
      { rel: "canonical", href: "https://fridgecuisine.com/cookies" },
    ],
  }),
  component: CookiesPage,
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

function CookieTable({
  rows,
}: {
  rows: { name: string; type: string; purpose: string; duration: string }[];
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 font-semibold text-foreground">Cookie / Storage Key</th>
            <th className="px-4 py-3 font-semibold text-foreground">Type</th>
            <th className="px-4 py-3 font-semibold text-foreground">Purpose</th>
            <th className="px-4 py-3 font-semibold text-foreground">Duration</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.name} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-foreground/90 whitespace-nowrap">
                {row.name}
              </td>
              <td className="px-4 py-3 text-foreground/80">{row.type}</td>
              <td className="px-4 py-3 text-foreground/80">{row.purpose}</td>
              <td className="px-4 py-3 text-foreground/80 whitespace-nowrap">{row.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CookiesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 md:px-8 py-4">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <img
              src={logoAsset.url}
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
          Cookie Policy
        </h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>
        <p className="mt-6 text-base md:text-lg text-muted-foreground">
          This page explains how FridgeCuisine uses cookies and similar technologies.
          We believe in transparency: you deserve to know exactly what is stored on your
          device and why.
        </p>
      </section>

      <article className="max-w-3xl mx-auto px-4 md:px-8 pb-16">
        <Section title="1. What are cookies?">
          <p>
            Cookies are small text files placed on your device by websites you visit.
            They are widely used to make websites work efficiently, improve user
            experience, and provide information to site owners. Similar technologies
            include local storage, session storage, and indexed databases.
          </p>
        </Section>

        <Section title="2. How we use cookies">
          <p>
            FridgeCuisine uses cookies and browser storage for three main purposes:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Essential:</strong> Required for the Service to function —
              authentication, session management, and security.
            </li>
            <li>
              <strong>Preferences:</strong> Remember your settings and choices
              (e.g., dietary filters, display preferences) so you do not have to
              re-enter them.
            </li>
            <li>
              <strong>Analytics:</strong> Help us understand how visitors interact with
              the Service so we can improve it. This data is aggregated and
              anonymized where possible.
            </li>
          </ul>
          <p>
            We do <strong>not</strong> use cookies for targeted advertising or sell
            cookie data to third parties.
          </p>
        </Section>

        <Section title="3. Cookies and storage we use">
          <p className="mb-2">
            Below is a complete list of cookies and local storage keys used by
            FridgeCuisine:
          </p>
          <CookieTable
            rows={[
              {
                name: "sb-access-token",
                type: "Essential",
                purpose: "Supabase authentication access token",
                duration: "Session / 1 hour",
              },
              {
                name: "sb-refresh-token",
                type: "Essential",
                purpose: "Supabase authentication refresh token",
                duration: "Persistent",
              },
              {
                name: "sb-provider-token",
                type: "Essential",
                purpose: "OAuth provider token (Google sign-in)",
                duration: "Session",
              },
              {
                name: "fridgecuisine-session",
                type: "Essential",
                purpose: "App session state and CSRF protection",
                duration: "Session",
              },
              {
                name: "dietary-preferences",
                type: "Preferences",
                purpose: "Saved dietary filters (vegan, gluten-free, etc.)",
                duration: "Persistent",
              },
              {
                name: "cuisine-preferences",
                type: "Preferences",
                purpose: "Saved cuisine type preferences",
                duration: "Persistent",
              },
              {
                name: "theme",
                type: "Preferences",
                purpose: "Light / dark mode preference",
                duration: "Persistent",
              },
              {
                name: "recent-ingredients",
                type: "Preferences",
                purpose: "Recently used ingredients for quick access",
                duration: "Persistent",
              },
              {
                name: "_ga",
                type: "Analytics",
                purpose: "Google Analytics unique user identifier",
                duration: "2 years",
              },
              {
                name: "_ga_xxx",
                type: "Analytics",
                purpose: "Google Analytics session identifier",
                duration: "2 years",
              },
              {
                name: "cf-turnstile",
                type: "Essential",
                purpose: "Cloudflare Turnstile spam protection",
                duration: "Session",
              },
            ]}
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Third-party cookies (e.g., Google Analytics) are set by the respective
            service providers and are subject to their own privacy policies.
          </p>
        </Section>

        <Section title="4. Managing your cookie preferences">
          <p>
            You have full control over cookies through your browser settings:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Block all cookies:</strong> Most browsers allow you to refuse
              all cookies. Note that essential cookies are required for login and
              core features — blocking them may prevent the Service from working.
            </li>
            <li>
              <strong>Delete existing cookies:</strong> You can clear cookies at any
              time via your browser&apos;s settings or privacy menu.
            </li>
            <li>
              <strong>Analytics opt-out:</strong> You can install the{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                Google Analytics Opt-out Browser Add-on
              </a>{" "}
              to prevent Google Analytics from collecting your data.
            </li>
          </ul>
          <p>
            For detailed instructions, consult your browser&apos;s help documentation:
            {" "}
            <a
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              Chrome
            </a>
            ,{" "}
            <a
              href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              Firefox
            </a>
            ,{" "}
            <a
              href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              Safari
            </a>
            ,{" "}
            <a
              href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-578b-31ebb79794f3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              Edge
            </a>
            .
          </p>
        </Section>

        <Section title="5. Do Not Track">
          <p>
            Some browsers support a &ldquo;Do Not Track&rdquo; (DNT) signal. FridgeCuisine does
            not currently respond to DNT signals because there is no consistent
            industry standard for how to interpret them. However, you can manage
            cookie preferences as described above.
          </p>
        </Section>

        <Section title="6. Changes to this policy">
          <p>
            We may update this Cookie Policy as we add or remove features. Material
            changes will be announced via an in-app notice. The &ldquo;Last updated&rdquo; date
            at the top reflects the current version.
          </p>
        </Section>

        <Section title="7. Contact us">
          <p>
            Questions about cookies or this policy? Email{" "}
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
