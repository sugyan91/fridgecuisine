import { Link } from "@tanstack/react-router";
import chefBanner from "@/assets/chef-banner.jpg";

export function ChefSellBanner() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-20">
      <div className="group relative overflow-hidden rounded-[2.5rem] min-h-[300px] md:min-h-[380px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)] transition-transform duration-500 hover:scale-[1.005]">
        <img
          src={chefBanner}
          alt="Chef plating a signature dish"
          loading="lazy"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/10 md:from-black/80 md:via-black/40 md:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:hidden" />

        <div className="relative z-10 flex flex-col justify-center h-full min-h-[300px] md:min-h-[380px] px-6 sm:px-10 md:px-14 py-10 md:py-12 max-w-2xl">
          <p className="font-display text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent-gold)] mb-3 md:mb-4">
            For Home Chefs
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.05] tracking-tight text-white">
            Your signature dish<br />
            <span className="italic font-serif text-[var(--accent-gold)]">deserves an audience.</span>
          </h2>
          <p className="mt-4 md:mt-5 text-sm md:text-base text-white/80 max-w-md">
            Publish a recipe, set your own price, you keep the lion's share. Reach home cooks hungry for the real thing.
          </p>
          <div className="mt-6 md:mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/sell"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm md:text-base font-display font-semibold text-black hover:bg-[var(--accent-gold)] transition-colors shadow-lg"
            >
              Start selling
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              to="/sell"
              className="text-sm md:text-base font-medium text-white/80 hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white"
            >
              See how it works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}