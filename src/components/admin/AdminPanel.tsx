import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  adminFindUser,
  adminGetUserSummary,
  adminResetUsage,
  adminSendPasswordReset,
  adminDeleteUser,
  adminGrantPremium,
  adminRevokePremium,
} from "@/lib/admin.functions";

type FoundUser = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  created_at: string;
};

type Summary = {
  usedToday: number;
  isPremium: boolean;
  subscriptions: { status: string; environment: string; current_period_end: string | null; stripe_subscription_id: string }[];
};

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const find = useServerFn(adminFindUser);
  const summary = useServerFn(adminGetUserSummary);
  const resetUsage = useServerFn(adminResetUsage);
  const sendReset = useServerFn(adminSendPasswordReset);
  const deleteUser = useServerFn(adminDeleteUser);
  const grant = useServerFn(adminGrantPremium);
  const revoke = useServerFn(adminRevokePremium);

  const [query, setQuery] = useState("");
  const [user, setUser] = useState<FoundUser | null>(null);
  const [info, setInfo] = useState<Summary | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (!open) return null;

  const loadSummary = async (uid: string) => {
    try {
      const s = await summary({ data: { user_id: uid } });
      setInfo(s);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load");
    }
  };

  const search = async () => {
    if (!query.trim()) return;
    setBusy("search");
    try {
      const r = await find({ data: { query: query.trim() } });
      if (!r.user) {
        toast.error("No user found");
        setUser(null);
        setInfo(null);
      } else {
        setUser(r.user);
        await loadSummary(r.user.id);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Search failed");
    } finally {
      setBusy(null);
    }
  };

  const run = async (label: string, fn: () => Promise<unknown>, successMsg: string) => {
    setBusy(label);
    try {
      await fn();
      toast.success(successMsg);
      if (user) await loadSummary(user.id);
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border-4 border-border rounded-3xl shadow-[8px_8px_0px_0px_var(--border)] w-full max-w-xl mt-12 p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-paprika">Admin panel</h2>
          <button
            onClick={onClose}
            className="border-2 border-border rounded-full w-8 h-8 font-black text-sm"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Email, username, or user ID"
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="flex-1 border-2 border-border rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-turmeric"
          />
          <button
            onClick={search}
            disabled={busy === "search"}
            className="bg-turmeric border-2 border-border rounded-full px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-60"
          >
            {busy === "search" ? "…" : "Find"}
          </button>
        </div>

        {user && (
          <div className="border-2 border-border rounded-2xl p-4 space-y-3">
            <div>
              <p className="font-black text-sm">{user.display_name ?? user.username ?? "Unnamed"}</p>
              <p className="text-xs opacity-70">{user.email}</p>
              <p className="text-[10px] opacity-50 font-mono break-all">{user.id}</p>
              {info && (
                <p className="text-xs mt-2">
                  <span className="font-black">Today's usage:</span> {info.usedToday} ·{" "}
                  <span className="font-black">Premium:</span>{" "}
                  {info.isPremium ? "Yes" : "No"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={!!busy}
                onClick={() =>
                  run("reset", () => resetUsage({ data: { user_id: user.id } }), "Usage reset for today")
                }
                className="bg-white border-2 border-border rounded-full px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-60"
              >
                Reset usage
              </button>
              <button
                disabled={!!busy || !user.email}
                onClick={() =>
                  run("reset-pw", () => sendReset({ data: { email: user.email! } }), "Password reset email sent")
                }
                className="bg-white border-2 border-border rounded-full px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-60"
              >
                Send password reset
              </button>
              <button
                disabled={!!busy}
                onClick={() =>
                  run(
                    "grant",
                    () => grant({ data: { user_id: user.id, days: 30, environment: "live" } }),
                    "Premium granted for 30 days",
                  )
                }
                className="bg-cardamom text-white border-2 border-border rounded-full px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-60"
              >
                Grant premium 30d
              </button>
              <button
                disabled={!!busy}
                onClick={() =>
                  run("revoke", () => revoke({ data: { user_id: user.id } }), "Premium revoked")
                }
                className="bg-white border-2 border-border rounded-full px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-60"
              >
                Revoke premium
              </button>
              <button
                disabled={!!busy}
                onClick={() => {
                  if (!confirm(`Permanently delete ${user.email}? This cannot be undone.`)) return;
                  run("del", () => deleteUser({ data: { user_id: user.id } }), "User deleted").then(() => {
                    setUser(null);
                    setInfo(null);
                  });
                }}
                className="col-span-2 bg-paprika text-white border-2 border-border rounded-full px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-60"
              >
                Delete user
              </button>
            </div>
          </div>
        )}

        <p className="text-[10px] opacity-50 mt-4 leading-relaxed">
          Admins can also delete any community recipe or comment directly from those pages.
        </p>
      </div>
    </div>
  );
}
