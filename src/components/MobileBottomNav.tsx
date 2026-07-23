import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, CalendarDays, ShoppingBag, User } from "lucide-react";

type Tab = {
  to: "/" | "/community" | "/plan" | "/shop" | "/account";
  label: string;
  icon: typeof Home;
  exact?: boolean;
};

const TABS: Tab[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/community", label: "Discover", icon: Compass },
  { to: "/plan", label: "Plan", icon: CalendarDays },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/account", label: "Me", icon: User },
];

// Routes where we hide the bottom nav (fullscreen / focused flows).
const HIDDEN_PREFIXES = [
  "/cook/",
  "/login",
  "/reset-password",
  "/checkout",
  "/.lovable",
  "/.well-known",
  "/.mcp",
];

function isHidden(pathname: string) {
  return HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));
}

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (isHidden(pathname)) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-background/90 backdrop-blur-xl border-t border-border/70 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_-12px_rgb(27_18_14_/_0.15)]"
    >
      <ul className="grid grid-cols-5 px-1 pt-1.5">
        {TABS.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/") || pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={`group relative flex flex-col items-center justify-center gap-1 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  active
                    ? "text-paprika"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                    active
                      ? "bg-paprika/12 scale-100"
                      : "bg-transparent scale-95 group-hover:bg-muted/60"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] transition-transform duration-200 ${
                      active ? "stroke-[2.5] scale-110" : "stroke-2"
                    } motion-reduce:transform-none`}
                    aria-hidden
                  />
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}