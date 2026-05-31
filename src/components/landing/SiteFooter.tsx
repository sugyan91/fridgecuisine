import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import logoImg from "@/assets/fridge-cuisine-logo.png";

export function SiteFooter() {
  return (
    <footer className="bg-[var(--surface-dark)] text-white/85 mt-16">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src={logoImg}
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
                ★ 4.9 from 12,000+ cooks
              </span>
            </div>
          </div>

          <div>
            <p className="font-display text-[10px] tracking-[0.25em] uppercase text-white/45 mb-3">
              Cook
            </p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white">Recipes</Link></li>
              <li><Link to="/community" className="hover:text-white">Community</Link></li>
              <li><Link to="/cookbook" className="hover:text-white">Cookbook</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-display text-[10px] tracking-[0.25em] uppercase text-white/45 mb-3">
              For chefs
            </p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/sell" className="hover:text-white">Sell recipes</Link></li>
              <li><Link to="/chefs" className="hover:text-white">Browse chefs</Link></li>
              <li>
                <Link
                  to="/login"
                  search={{ mode: "signup" }}
                  className="hover:text-white"
                >
                  Sign up free
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <p className="font-display text-[10px] tracking-[0.25em] uppercase text-white/45 mb-3">
              Contact
            </p>
            <p className="mb-4 text-sm">
              <Link to="/contact" className="text-white/85 hover:text-white underline-offset-4 hover:underline">
                Use the contact form →
              </Link>
            </p>
            <ul className="space-y-4 text-sm">
              <li>
                <p className="text-[11px] text-white/50 mb-1">General inquiries</p>
                <a
                  href="mailto:main@fridgecuisine.com"
                  className="inline-flex items-center gap-2 text-white/85 hover:text-white transition-colors whitespace-nowrap"
                >
                  <Mail size={13} className="shrink-0" />
                  main@fridgecuisine.com
                </a>
              </li>
              <li>
                <p className="text-[11px] text-white/50 mb-1">Help &amp; support</p>
                <a
                  href="mailto:support@fridgecuisine.com"
                  className="inline-flex items-center gap-2 text-white/85 hover:text-white transition-colors whitespace-nowrap"
                >
                  <Mail size={13} className="shrink-0" />
                  support@fridgecuisine.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/55">
          <p>
            <span className="font-semibold text-white/85">$5.99/mo</span> · Premium · unlimited recipes
          </p>
          <p>© {new Date().getFullYear()} Fridge Cuisine. Made with garlic and butter.</p>
        </div>
      </div>
    </footer>
  );
}