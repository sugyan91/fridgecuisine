import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, CalendarDays, ShoppingBag, User } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/community", label: "Discover", icon: Compass },
  { to: "/plan", label: "Plan", icon: CalendarDays },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/account", label: "Me", icon: User },
] as const;

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
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-background/95 backdrop-blur border-t-2 border-border pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/") || pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  active ? "text-paprika" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}