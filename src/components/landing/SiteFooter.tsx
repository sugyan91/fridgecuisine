import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import logoAsset from "@/assets/fridge-cuisine-logo.png.asset.json";
import { useConsent } from "@/lib/consent";

export function SiteFooter() {
  const consent = useConsentSafe();
  return (
    <footer className="bg-[var(--surface-dark)] text-white/85 mt-16">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-6">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src={logoAsset.url}
                alt="Fridge Cuisine"
                className="h-9 w-auto rounded-lg bg-white/10 p-1"
              />
              <div>
                <p className="font-display text-lg lowercase tracking-tight">
                  fridge cuisine<span className="text-primary">.</span>
                </p>
                <p className="text-[11px] text-white/55 mt-0.5">
                  Your own AI powered personal chef
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] px-3 py-1 text-xs font-semibold">
                Made for home cooks
              </span>
            </div>
          </div>

          <div>
            <p className="font-display text-[10px] tracking-[0.25em] uppercase text-white/45 mb-3">
              Discover
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" title="Find recipes from your ingredients" className="hover:text-white block">Recipes</Link>
              </li>
              <li>
                <Link to="/community" title="Join the cooking community" className="hover:text-white block">Community</Link>
              </li>
              <li>
                <Link to="/chefs" title="Browse chef profiles" className="hover:text-white block">Chefs</Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-display text-[10px] tracking-[0.25em] uppercase text-white/45 mb-3">
              My kitchen
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/cookbook" title="Your saved recipes" className="hover:text-white block">Cookbook</Link>
              </li>
              <li>
                <Link to="/account" title="Manage your account" className="hover:text-white block">Account</Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-display text-[10px] tracking-[0.25em] uppercase text-white/45 mb-3">
              Upgrade
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/pricing" title="View pricing plans" className="hover:text-white block">Pricing</Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-2">
            <p className="font-display text-[10px] tracking-[0.25em] uppercase text-white/45 mb-3">
              Contact
            </p>
            <p className="mb-4 text-sm">
              <Link to="/contact" title="Send us a message" className="text-white/85 hover:text-white underline-offset-4 hover:underline">
                Use the contact form →
              </Link>
            </p>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:main@fridgecuisine.com"
                  title="Email general inquiries"
                  className="inline-flex items-center gap-2 text-white/85 hover:text-white transition-colors whitespace-nowrap"
                >
                  <Mail size={13} className="shrink-0" />
                  main@fridgecuisine.com
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@fridgecuisine.com"
                  title="Email support"
                  className="inline-flex items-center gap-2 text-white/85 hover:text-white transition-colors whitespace-nowrap"
                >
                  <Mail size={13} className="shrink-0" />
                  support@fridgecuisine.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col gap-4 text-xs text-white/55">
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/privacy" title="Privacy policy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" title="Terms of service" className="hover:text-white">Terms</Link>
            <Link to="/cookies" title="Cookie policy" className="hover:text-white">Cookies</Link>
            {consent && (
              <button
                type="button"
                onClick={consent.reopen}
                title="Update cookie preferences"
                className="hover:text-white"
              >
                Manage cookies
              </button>
            )}
          </nav>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p>
              <span className="font-semibold text-white/85">From $5.99/mo</span> · Free 2/day · Basic 10/day · Unlimited 50/day
            </p>
            <p>© {new Date().getFullYear()} Fridge Cuisine. Made with garlic and butter.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Safe wrapper so the footer still renders if used outside ConsentProvider
// (e.g. in isolated stories / SSR partial trees).
function useConsentSafe() {
  try {
    return useConsent();
  } catch {
    return null;
  }
}
