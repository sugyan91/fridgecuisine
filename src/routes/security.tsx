import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { Lock, KeyRound, Database, CreditCard, UserCog, Mail } from "lucide-react";
import logoAsset from "@/assets/fridge-cuisine-logo.png.asset.json";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security & privacy — FridgeCuisine" },
      {
        name: "description",
        content:
          "How FridgeCuisine handles your account, data, payments, and privacy. Maintained by the FridgeCuisine team.",
      },
      { property: "og:title", content: "Security & privacy — FridgeCuisine" },
      {
        property: "og:description",
        content: "Our security and privacy posture, in plain language.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fridgecuisine.com/security" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Security & privacy — FridgeCuisine" },
      { name: "twitter:description", content: "Our security and privacy posture, in plain language." },
    ],
    links: [{ rel: "canonical", href: "https://fridgecuisine.com/security" }],
  }),
  component: SecurityPage,
});

function SecurityPage() {
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
          Trust
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]">
          Security & privacy
        </h1>
        <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
          This page is maintained by the FridgeCuisine team to answer common
          security and privacy questions about the app. It describes controls we
          have enabled today. It is not an independent certification or audit
          report.
        </p>

        <Section icon={<KeyRound className="h-5 w-5" />} title="Accounts & sign-in">
          <ul className="list-disc pl-5 space-y-2">
            <li>Email + password with strength enforcement, or Google sign-in.</li>
            <li>Password reset via time-limited email link.</li>
            <li>Optional "Remember me" — when unchecked, your session ends when the browser closes.</li>
            <li>Session tokens are stored in your browser and rotated automatically.</li>
          </ul>
        </Section>

        <Section icon={<Database className="h-5 w-5" />} title="Data we hold">
          <ul className="list-disc pl-5 space-y-2">
            <li>Your account (email, sign-in method) and profile you set.</li>
            <li>Your saved recipes, pantry items, meal plans, and dietary preferences.</li>
            <li>Anonymised usage counts for rate-limiting AI generations.</li>
            <li>Payment metadata for purchases (charges are handled by Stripe — we never see your card number).</li>
          </ul>
        </Section>

        <Section icon={<Lock className="h-5 w-5" />} title="How data is protected">
          <ul className="list-disc pl-5 space-y-2">
            <li>All traffic to the app is served over HTTPS.</li>
            <li>Row-level security on our database restricts each user to their own rows.</li>
            <li>Administrative access to the backend is restricted and audited.</li>
            <li>Secrets and API keys are held server-side and never shipped to the browser.</li>
          </ul>
        </Section>

        <Section icon={<CreditCard className="h-5 w-5" />} title="Payments & payouts">
          <ul className="list-disc pl-5 space-y-2">
            <li>Purchases, subscriptions, and chef payouts are processed by Stripe.</li>
            <li>FridgeCuisine does not store card numbers, CVCs, or bank credentials.</li>
            <li>Chef payouts follow Stripe Connect's identity and payout rules.</li>
          </ul>
        </Section>

        <Section icon={<UserCog className="h-5 w-5" />} title="Your rights & controls">
          <ul className="list-disc pl-5 space-y-2">
            <li>Export or delete your account and data from{" "}
              <Link to="/account" className="text-primary underline-offset-4 hover:underline">Account</Link>.
            </li>
            <li>Manage cookie preferences from the banner or the footer.</li>
            <li>Withdraw AI personalisation from{" "}
              <Link to="/preferences" className="text-primary underline-offset-4 hover:underline">Preferences</Link>.
            </li>
          </ul>
        </Section>

        <Section icon={<Mail className="h-5 w-5" />} title="Report a security issue">
          <p>
            If you believe you've found a security issue, please email{" "}
            <a
              href="mailto:support@fridgecuisine.com"
              className="text-primary underline-offset-4 hover:underline"
            >
              support@fridgecuisine.com
            </a>{" "}
            with steps to reproduce. We'll acknowledge within 3 business days.
          </p>
        </Section>

        <div className="mt-14 rounded-2xl border border-border/60 bg-card/50 p-5 text-xs text-muted-foreground">
          Shared responsibility: FridgeCuisine operates the app and its platform
          controls. You are responsible for the strength of your password, the
          security of the device you sign in from, and what you choose to share
          publicly (e.g. recipes you publish or sell). See our{" "}
          <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">Privacy policy</Link>{" "}
          and{" "}
          <Link to="/terms" className="text-primary underline-offset-4 hover:underline">Terms</Link>{" "}
          for the full agreement.
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      </div>
      <div className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}