import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ShieldAlert, Search, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-is-admin";
import {
  adminGetUserQuota,
  adminAdjustUserQuota,
  adminGetAnonQuota,
  adminAdjustAnonQuota,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/quota")({
  head: () => ({
    meta: [
      { title: "Quota troubleshooting — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminQuotaPage,
});

function startOfTodayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function AdminQuotaPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);
  const isAdmin = useIsAdmin(userId);

  if (userId === null) {
    return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-destructive" />
        <h1 className="text-2xl font-black">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have permission to view this page.
        </p>
        <Button className="mt-6" onClick={() => navigate({ to: "/" })}>
          Back home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to="/admin/abuse">
            <ArrowLeft className="mr-2 h-4 w-4" /> Abuse events
          </Link>
        </Button>

        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tight">Quota troubleshooting</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View and manually adjust free-quota counters for a signed-in user, an
            anonymous fingerprint, or an IP address. All adjustments are logged
            with your admin user id.
          </p>
        </header>

        <UserQuotaPanel />
        <div className="my-10 h-px bg-border" />
        <AnonQuotaPanel />
      </div>
    </div>
  );
}

type UserSnapshot = Awaited<ReturnType<typeof adminGetUserQuota>>;

function UserQuotaPanel() {
  const get = useServerFn(adminGetUserQuota);
  const adjust = useServerFn(adminAdjustUserQuota);
  const [uid, setUid] = useState("");
  const [snap, setSnap] = useState<UserSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [deleteN, setDeleteN] = useState<number>(1);

  const load = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await get({ data: { userId: uid.trim(), sinceIso: startOfTodayIso() } });
      setSnap(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const doAdjust = async (deleteAllSince: boolean) => {
    if (!uid || !snap) return;
    if (!deleteAllSince && deleteN <= 0) return;
    setLoading(true);
    try {
      const res = await adjust({
        data: {
          userId: uid.trim(),
          sinceIso: snap.since,
          deleteCount: deleteAllSince ? undefined : deleteN,
          deleteAllSince: deleteAllSince || undefined,
          reason: reason || undefined,
        },
      });
      toast.success(`Deleted ${res.deleted} generation${res.deleted === 1 ? "" : "s"}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Adjust failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="text-2xl font-black">Signed-in user</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Counters live in <code>recipe_generations</code>. Adjusting deletes rows
        in the current UTC day, freeing daily quota.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[260px]">
          <Label htmlFor="uid">User ID (UUID)</Label>
          <Input id="uid" value={uid} onChange={(e) => setUid(e.target.value)} placeholder="00000000-…" />
        </div>
        <Button onClick={load} disabled={!uid || loading}>
          <Search className="mr-2 h-4 w-4" /> Look up
        </Button>
      </div>

      {snap && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <div><span className="text-muted-foreground">Email:</span> {snap.user?.email ?? <em className="text-muted-foreground">unknown</em>}</div>
            <div><span className="text-muted-foreground">Window since:</span> {snap.since}</div>
            <div className="mt-1 text-2xl font-black">{snap.usedSince} <span className="text-sm font-medium text-muted-foreground">used today</span></div>
          </div>

          {snap.recent.length > 0 && (
            <details className="rounded-lg border p-3 text-sm">
              <summary className="cursor-pointer font-medium">Last {snap.recent.length} generations</summary>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                {snap.recent.map((r) => (
                  <li key={r.id}>{r.created_at} · {r.id}</li>
                ))}
              </ul>
            </details>
          )}

          <div>
            <Label htmlFor="reason1">Reason (logged)</Label>
            <Input id="reason1" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. support ticket #1234" />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-32">
              <Label htmlFor="dn">Delete N most recent</Label>
              <Input
                id="dn"
                type="number"
                min={1}
                max={1000}
                value={deleteN}
                onChange={(e) => setDeleteN(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <Button variant="secondary" onClick={() => doAdjust(false)} disabled={loading || deleteN <= 0}>
              <RotateCcw className="mr-2 h-4 w-4" /> Refund {deleteN}
            </Button>
            <Button variant="destructive" onClick={() => doAdjust(true)} disabled={loading}>
              Reset today (delete all in window)
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

type AnonSnapshot = Awaited<ReturnType<typeof adminGetAnonQuota>>;

function AnonQuotaPanel() {
  const get = useServerFn(adminGetAnonQuota);
  const adjust = useServerFn(adminAdjustAnonQuota);
  const [fingerprint, setFingerprint] = useState("");
  const [ipHash, setIpHash] = useState("");
  const [rawIp, setRawIp] = useState("");
  const [snap, setSnap] = useState<AnonSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [dayCount, setDayCount] = useState<string>("");
  const [dayDate, setDayDate] = useState<string>("");
  const [count, setCount] = useState<string>("");

  const load = async () => {
    if (!fingerprint && !ipHash && !rawIp) {
      toast.error("Enter fingerprint, IP hash, or raw IP");
      return;
    }
    setLoading(true);
    try {
      const res = await get({
        data: {
          fingerprint: fingerprint.trim() || undefined,
          ipHash: ipHash.trim() || undefined,
          rawIp: rawIp.trim() || undefined,
        },
      });
      setSnap(res);
      if (res.ipHash && !ipHash) setIpHash(res.ipHash);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const save = async (resetDaily = false) => {
    setLoading(true);
    try {
      const res = await adjust({
        data: {
          fingerprint: fingerprint.trim() || undefined,
          ipHash: ipHash.trim() || undefined,
          rawIp: rawIp.trim() || undefined,
          dayCount: resetDaily ? undefined : (dayCount === "" ? undefined : Number(dayCount)),
          dayDate: resetDaily ? undefined : (dayDate || undefined),
          count: count === "" ? undefined : Number(count),
          resetDaily: resetDaily || undefined,
          reason: reason || undefined,
        },
      });
      toast.success(
        `Updated · fingerprint=${res.updatedFingerprint ? "yes" : "no"} ip=${res.updatedIp ? "yes" : "no"}`,
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="text-2xl font-black">Anonymous (fingerprint / IP)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Counters live in <code>anonymous_ai_usage</code> (per fingerprint) and
        <code className="ml-1">anonymous_ai_usage_by_ip</code>. Either is enough
        to block at the daily cap, so adjust both when fully refunding a user.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="fp">Fingerprint</Label>
          <Input id="fp" value={fingerprint} onChange={(e) => setFingerprint(e.target.value)} placeholder="sha256 hex…" />
        </div>
        <div>
          <Label htmlFor="ih">IP hash</Label>
          <Input id="ih" value={ipHash} onChange={(e) => setIpHash(e.target.value)} placeholder="sha256 hex…" />
        </div>
        <div>
          <Label htmlFor="ri">Raw IP (hashed server-side)</Label>
          <Input id="ri" value={rawIp} onChange={(e) => setRawIp(e.target.value)} placeholder="203.0.113.42" />
        </div>
      </div>
      <div className="mt-3">
        <Button onClick={load} disabled={loading}>
          <Search className="mr-2 h-4 w-4" /> Look up
        </Button>
      </div>

      {snap && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <div className="mb-2 font-bold">Per-fingerprint row</div>
              {snap.fingerprintRow ? (
                <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs">
{JSON.stringify(snap.fingerprintRow, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">No row.</p>
              )}
            </div>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <div className="mb-2 font-bold">Per-IP row</div>
              {snap.ipRow ? (
                <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs">
{JSON.stringify(snap.ipRow, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">No row (ipHash: {snap.ipHash ?? "—"}).</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="reason2">Reason (logged)</Label>
            <Input id="reason2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. shared office IP" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="dc">day_count override</Label>
              <Input id="dc" type="number" min={0} value={dayCount} onChange={(e) => setDayCount(e.target.value)} placeholder="leave blank to skip" />
            </div>
            <div>
              <Label htmlFor="dd">day_date override</Label>
              <Input id="dd" value={dayDate} onChange={(e) => setDayDate(e.target.value)} placeholder="YYYY-MM-DD (today: {snap.today})" />
            </div>
            <div>
              <Label htmlFor="ct">count / total_count override</Label>
              <Input id="ct" type="number" min={0} value={count} onChange={(e) => setCount(e.target.value)} placeholder="leave blank to skip" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => save(false)} disabled={loading}>
              <Save className="mr-2 h-4 w-4" /> Apply overrides
            </Button>
            <Button variant="secondary" onClick={() => save(true)} disabled={loading}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset today's counters
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}