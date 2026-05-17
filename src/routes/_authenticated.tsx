import { useEffect, useState } from "react";
import { createFileRoute, Outlet, redirect, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <div>
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-white border-2 border-border rounded-full px-3 py-1.5 shadow-[3px_3px_0px_0px_var(--border)]">
        {email && <span className="hidden sm:inline text-xs font-bold truncate max-w-[160px]">{email}</span>}
        <button
          onClick={handleLogout}
          className="text-xs font-black uppercase tracking-wide bg-paprika text-white px-2.5 py-1 rounded-full"
        >
          Sign out
        </button>
      </div>
      <Outlet />
    </div>
  );
}