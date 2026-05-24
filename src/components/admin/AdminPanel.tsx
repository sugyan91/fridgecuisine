import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  adminListUsers,
  adminListCommunityReceipes,
  adminListComments,
  adminGetUserSummary,
  adminResetUsage,
  adminSendPasswordReset,
  adminDeleteUser,
  adminGrantPremium,
  adminRevokePremium,
  adminDeleteCommunityReceipe,
  adminDeleteComment,
} from "@/lib/admin.functions";

type Tab = "users" | "receipes" | "comments";

type UserRow = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  created_at: string;
  usedToday: number;
  isPremium: boolean;
};

type ReceipeRow = {
  id: string;
  user_id: string;
  title: string;
  city: string | null;
  country: string | null;
  cuisine: string | null;
  created_at: string;
  is_published: boolean;
  author_username: string | null;
  author_display_name: string | null;
};

type CommentRow = {
  id: string;
  user_id: string;
  receipe_id: string;
  body: string;
  created_at: string;
  author_username: string | null;
  receipe_title: string | null;
};

const PAGE_SIZE = 50;

export function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("users");
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border-4 border-border rounded-3xl shadow-[8px_8px_0px_0px_var(--border)] w-full max-w-5xl mt-8 mb-8 p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-paprika">Admin dashboard</h2>
          <button
            onClick={onClose}
            className="border-2 border-border rounded-full w-8 h-8 font-black text-sm"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1 bg-muted/40 border-2 border-border rounded-full p-1 mb-5">
          {(["users", "receipes", "comments"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-xs font-black uppercase py-2 rounded-full transition-colors ${
                tab === t ? "bg-turmeric text-foreground" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "users" && <UsersTab />}
        {tab === "receipes" && <ReceipesTab />}
        {tab === "comments" && <CommentsTab />}
      </div>
    </div>
  );
}

function Pager({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between mt-3 text-xs">
      <span className="opacity-60">
        {total} total · page {page} / {last}
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="border-2 border-border rounded-full px-3 py-1 font-black uppercase disabled:opacity-40"
        >
          Prev
        </button>
        <button
          disabled={page >= last}
          onClick={() => onPage(page + 1)}
          className="border-2 border-border rounded-full px-3 py-1 font-black uppercase disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function SearchBar({
  value,
  onChange,
  placeholder,
  right,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex gap-2 mb-3">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="flex-1 border-2 border-border rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-turmeric"
      />
      {right}
    </div>
  );
}

function FilterSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="border-2 border-border rounded-full px-3 py-2 text-xs font-black uppercase bg-white focus:outline-none focus:ring-2 focus:ring-turmeric"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ----------------- USERS ----------------- */

function UsersTab() {
  const list = useServerFn(adminListUsers);
  const summary = useServerFn(adminGetUserSummary);
  const resetUsage = useServerFn(adminResetUsage);
  const sendReset = useServerFn(adminSendPasswordReset);
  const deleteUser = useServerFn(adminDeleteUser);
  const grant = useServerFn(adminGrantPremium);
  const revoke = useServerFn(adminRevokePremium);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [premium, setPremium] = useState<"all" | "premium" | "free">("all");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await list({
        data: { page, pageSize: PAGE_SIZE, search: search || undefined, premium },
      });
      setRows(r.users);
      setTotal(r.total);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) setPage(1);
      else load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, premium]);

  const run = async (label: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(label);
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search email, username, display name, ID…"
        right={
          <FilterSelect
            value={premium}
            onChange={setPremium}
            options={[
              { value: "all", label: "All" },
              { value: "premium", label: "Premium" },
              { value: "free", label: "Free" },
            ]}
          />
        }
      />
      <div className="border-2 border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_70px_70px_60px] gap-2 px-3 py-2 bg-muted/30 text-[10px] font-black uppercase">
          <div>User</div>
          <div>Username</div>
          <div className="text-center">Today</div>
          <div className="text-center">Prem</div>
          <div></div>
        </div>
        {loading && <div className="px-3 py-4 text-xs opacity-60">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="px-3 py-4 text-xs opacity-60">No users found.</div>
        )}
        {rows.map((u) => (
          <div key={u.id} className="border-t-2 border-border">
            <div className="grid grid-cols-[1fr_120px_70px_70px_60px] gap-2 px-3 py-2 items-center text-xs">
              <div className="truncate">
                <div className="font-black truncate">{u.display_name || u.email || u.id}</div>
                <div className="opacity-60 truncate text-[10px]">{u.email}</div>
              </div>
              <div className="truncate opacity-80">{u.username ? `@${u.username}` : "—"}</div>
              <div className="text-center font-black">{u.usedToday}</div>
              <div className="text-center">{u.isPremium ? "✓" : "—"}</div>
              <button
                onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                className="border-2 border-border rounded-full px-2 py-1 text-[10px] font-black uppercase"
              >
                {expanded === u.id ? "Hide" : "Open"}
              </button>
            </div>
            {expanded === u.id && (
              <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                <button
                  disabled={!!busy}
                  onClick={() =>
                    run("r", () => resetUsage({ data: { user_id: u.id } }), "Usage reset")
                  }
                  className="bg-white border-2 border-border rounded-full px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-60"
                >
                  Reset usage
                </button>
                <button
                  disabled={!!busy || !u.email}
                  onClick={() =>
                    run("pw", () => sendReset({ data: { email: u.email! } }), "Reset email sent")
                  }
                  className="bg-white border-2 border-border rounded-full px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-60"
                >
                  Send password reset
                </button>
                <button
                  disabled={!!busy}
                  onClick={() =>
                    run(
                      "g",
                      () => grant({ data: { user_id: u.id, days: 30, environment: "live" } }),
                      "Premium granted 30d",
                    )
                  }
                  className="bg-cardamom text-white border-2 border-border rounded-full px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-60"
                >
                  Grant premium 30d
                </button>
                <button
                  disabled={!!busy}
                  onClick={() => run("v", () => revoke({ data: { user_id: u.id } }), "Premium revoked")}
                  className="bg-white border-2 border-border rounded-full px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-60"
                >
                  Revoke premium
                </button>
                <button
                  disabled={!!busy}
                  onClick={() => {
                    if (!confirm(`Permanently delete ${u.email}? This cannot be undone.`)) return;
                    run("d", () => deleteUser({ data: { user_id: u.id } }), "User deleted");
                  }}
                  className="col-span-2 bg-paprika text-white border-2 border-border rounded-full px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-60"
                >
                  Delete user
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <Pager page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
    </div>
  );
}

/* ----------------- RECEIPES ----------------- */

function ReceipesTab() {
  const list = useServerFn(adminListCommunityReceipes);
  const del = useServerFn(adminDeleteCommunityReceipe);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [published, setPublished] = useState<"all" | "published" | "unpublished">("all");
  const [rows, setRows] = useState<ReceipeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await list({
        data: { page, pageSize: PAGE_SIZE, search: search || undefined, published },
      });
      setRows(r.receipes);
      setTotal(r.total);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load receipes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) setPage(1);
      else load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, published]);

  const onDelete = async (r: ReceipeRow) => {
    if (!confirm(`Delete receipe "${r.title}"? This also removes its comments and likes.`)) return;
    setBusy(r.id);
    try {
      await del({ data: { receipe_id: r.id } });
      toast.success("Receipe deleted");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search title, author, city, country…"
        right={
          <FilterSelect
            value={published}
            onChange={setPublished}
            options={[
              { value: "all", label: "All" },
              { value: "published", label: "Published" },
              { value: "unpublished", label: "Unpublished" },
            ]}
          />
        }
      />
      <div className="border-2 border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_120px_70px_140px] gap-2 px-3 py-2 bg-muted/30 text-[10px] font-black uppercase">
          <div>Title</div>
          <div>Author</div>
          <div>Where</div>
          <div className="text-center">Pub</div>
          <div className="text-right">Actions</div>
        </div>
        {loading && <div className="px-3 py-4 text-xs opacity-60">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="px-3 py-4 text-xs opacity-60">No receipes found.</div>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            className="border-t-2 border-border grid grid-cols-[1fr_140px_120px_70px_140px] gap-2 px-3 py-2 items-center text-xs"
          >
            <div className="truncate">
              <div className="font-black truncate">{r.title}</div>
              <div className="opacity-60 text-[10px]">
                {new Date(r.created_at).toLocaleDateString()} · {r.cuisine ?? "—"}
              </div>
            </div>
            <div className="truncate opacity-80">
              {r.author_username ? `@${r.author_username}` : r.author_display_name ?? "—"}
            </div>
            <div className="truncate opacity-80">
              {[r.city, r.country].filter(Boolean).join(", ") || "—"}
            </div>
            <div className="text-center">{r.is_published ? "✓" : "—"}</div>
            <div className="flex gap-1 justify-end">
              <a
                href={`/community/${r.id}`}
                target="_blank"
                rel="noreferrer"
                className="border-2 border-border rounded-full px-2 py-1 text-[10px] font-black uppercase"
              >
                Open
              </a>
              <button
                disabled={busy === r.id}
                onClick={() => onDelete(r)}
                className="bg-paprika text-white border-2 border-border rounded-full px-2 py-1 text-[10px] font-black uppercase disabled:opacity-60"
              >
                {busy === r.id ? "…" : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <Pager page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
    </div>
  );
}

/* ----------------- COMMENTS ----------------- */

function CommentsTab() {
  const list = useServerFn(adminListComments);
  const del = useServerFn(adminDeleteComment);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await list({ data: { page, pageSize: PAGE_SIZE, search: search || undefined } });
      setRows(r.comments);
      setTotal(r.total);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) setPage(1);
      else load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const onDelete = async (c: CommentRow) => {
    if (!confirm("Delete this comment?")) return;
    setBusy(c.id);
    try {
      await del({ data: { comment_id: c.id } });
      toast.success("Comment deleted");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search body, author, receipe title…"
      />
      <div className="border-2 border-border rounded-2xl overflow-hidden">
        {loading && <div className="px-3 py-4 text-xs opacity-60">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="px-3 py-4 text-xs opacity-60">No comments found.</div>
        )}
        {rows.map((c) => (
          <div key={c.id} className="border-t-2 border-border first:border-t-0 px-3 py-2 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap break-words">{c.body}</p>
                <p className="opacity-60 text-[10px] mt-1">
                  {c.author_username ? `@${c.author_username}` : "anon"} on{" "}
                  <a
                    href={`/community/${c.receipe_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {c.receipe_title ?? c.receipe_id}
                  </a>{" "}
                  · {new Date(c.created_at).toLocaleString()}
                </p>
              </div>
              <button
                disabled={busy === c.id}
                onClick={() => onDelete(c)}
                className="bg-paprika text-white border-2 border-border rounded-full px-2 py-1 text-[10px] font-black uppercase disabled:opacity-60 shrink-0"
              >
                {busy === c.id ? "…" : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <Pager page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
    </div>
  );
}
