import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/landing/SiteFooter";
import logoAsset from "@/assets/fridge-cuisine-logo.png.asset.json";

const LAST_UPDATED = "May 31, 2026";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — FridgeCuisine" },
      {
        name: "description",
        content:
          "Terms of Service for FridgeCuisine. Read our user agreement, liability terms, and acceptable use policy.",
      },
      { property: "og:title", content: "Terms of Service — FridgeCuisine" },
      {
        property: "og:description",
        content:
          "Terms of Service for FridgeCuisine. Read our user agreement, liability terms, and acceptable use policy.",
      },
      { property: "og:url", content: "https://fridgecuisine.com/terms" },
    ],
    links: [
      { rel: "canonical", href: "https://fridgecuisine.com/terms" },
    ],
  }),
  component: TermsPage,
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

function TermsPage() {
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
          Terms of Service
        </h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>
        <p className="mt-6 text-base md:text-lg text-muted-foreground">
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of
          FridgeCuisine (&ldquo;the Service&rdquo;). By creating an account or using the
          Service, you agree to be bound by these Terms. If you do not agree,
          please do not use the Service.
        </p>
      </section>

      <article className="max-w-3xl mx-auto px-4 md:px-8 pb-16">
        <Section title="1. Eligibility and accounts">
          <p>
            You must be at least 13 years old (or the minimum age of digital consent in your
            jurisdiction) to use FridgeCuisine. You are responsible for maintaining the
            confidentiality of your account credentials and for all activity that occurs
            under your account. Notify us immediately of any unauthorized use.
          </p>
        </Section>

        <Section title="2. Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Use the Service for any illegal, fraudulent, or harmful purpose.</li>
            <li>Attempt to reverse engineer, scrape, or exploit the Service or its AI systems.</li>
            <li>Upload malicious code, spam, or content that infringes on third-party rights.</li>
            <li>Impersonate another person or misrepresent your affiliation with any entity.</li>
            <li>Interfere with or disrupt the integrity or performance of the Service.</li>
            <li>Circumvent any usage limits, rate limits, or access controls.</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these rules.
          </p>
        </Section>

        <Section title="3. AI-generated content">
          <p>
            Recipes, images, and suggestions generated by FridgeCuisine are produced by artificial
            intelligence. While we strive for quality and safety, we cannot guarantee accuracy,
            nutritional correctness, or suitability for every dietary need.
          </p>
          <p>
            <strong>Food safety:</strong> Always use your own judgment when cooking. Verify
            cooking temperatures, allergen information, and expiration dates of ingredients.
            FridgeCuisine is not a substitute for professional culinary or medical advice.
          </p>
          <p>
            AI-generated content may be imperfect, inconsistent, or culturally inappropriate.
            You are responsible for reviewing and adapting any recipe before preparing it.
          </p>
        </Section>

        <Section title="4. User content">
          <p>
            You retain ownership of any content you submit (ingredient lists, recipe notes,
            reviews). By submitting content, you grant FridgeCuisine a non-exclusive, worldwide,
            royalty-free license to use, display, and distribute that content solely to operate
            and improve the Service.
          </p>
          <p>
            You represent that you have the right to share any content you upload and that it
            does not violate the rights of any third party.
          </p>
        </Section>

        <Section title="5. Subscriptions and payments">
          <p>
            Premium features may require a paid subscription. Billing is handled by Stripe.
            All fees are exclusive of taxes unless stated otherwise.
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Subscriptions auto-renew unless canceled before the renewal date.</li>
            <li>You may cancel at any time from your account settings.</li>
            <li>No partial refunds for unused portions of a billing period unless required by law.</li>
            <li>We may change pricing with reasonable notice to existing subscribers.</li>
          </ul>
        </Section>

        <Section title="6. Intellectual property">
          <p>
            FridgeCuisine, its logos, branding, software, and all original content (excluding
            user submissions) are the property of FridgeCuisine and its licensors. You may not
            copy, modify, distribute, or create derivative works without our written permission.
          </p>
          <p>
            AI-generated recipes and images are provided for your personal, non-commercial use
            within the Service. Commercial redistribution of generated content outside the
            Service requires explicit permission.
          </p>
        </Section>

        <Section title="7. Disclaimers and liability">
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind,
            either express or implied, including but not limited to merchantability, fitness for
            a particular purpose, or non-infringement.
          </p>
          <p>
            <strong>To the maximum extent permitted by law, FridgeCuisine and its affiliates,
            officers, employees, and agents shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages</strong> arising out of or related to your
            use of the Service, including but not limited to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Food poisoning, allergic reactions, or other health issues resulting from prepared recipes.</li>
            <li>Loss of data, profits, or business opportunities.</li>
            <li>Service interruptions, errors, or unauthorized access to your account.</li>
            <li>Any reliance on AI-generated advice, recipes, or nutritional information.</li>
          </ul>
          <p>
            In jurisdictions that do not allow the exclusion of certain warranties or the
            limitation of liability, our liability shall be limited to the amount you paid us
            in the 12 months preceding the claim, or $100 USD, whichever is greater.
          </p>
        </Section>

        <Section title="8. Indemnification">
          <p>
            You agree to indemnify and hold harmless FridgeCuisine and its affiliates from any
            claims, damages, losses, liabilities, costs, or expenses (including reasonable
            attorneys&apos; fees) arising out of your use of the Service, your violation of these
            Terms, or your violation of any rights of a third party.
          </p>
        </Section>

        <Section title="9. Termination">
          <p>
            You may stop using the Service and delete your account at any time. We may suspend
            or terminate your access without notice if you violate these Terms or if we
            discontinue the Service. Upon termination, your right to use the Service ceases
            immediately, but provisions related to intellectual property, liability, and
            indemnification survive.
          </p>
        </Section>

        <Section title="10. Governing law and disputes">
          <p>
            These Terms are governed by the laws of the State of California, United States,
            without regard to its conflict of law provisions. Any dispute arising from these
            Terms shall first be attempted to be resolved through good-faith negotiation. If
            unresolved, disputes shall be submitted to binding arbitration in San Francisco,
            California, under the rules of the American Arbitration Association.
          </p>
          <p>
            Nothing in this section prevents either party from seeking injunctive or other
            equitable relief in a court of competent jurisdiction.
          </p>
        </Section>

        <Section title="11. Changes to these Terms">
          <p>
            We may update these Terms from time to time. Material changes will be communicated
            via email or an in-app notice. Continued use of the Service after changes constitutes
            acceptance of the revised Terms. The &ldquo;Last updated&rdquo; date at the top of this page
            reflects the current version.
          </p>
        </Section>

        <Section title="12. Contact us">
          <p>
            Questions about these Terms? Email{" "}
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
