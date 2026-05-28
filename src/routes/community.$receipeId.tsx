import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getCommunityReceipe,
  getMyVote,
  setReceipeVote,
  listReceipeComments,
  addReceipeComment,
  deleteReceipeComment,
  setReceipeCommentsEnabled,
  deleteCommunityReceipe,
} from "@/lib/community.functions";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-is-admin";

export const Route = createFileRoute("/community/$receipeId")({
  component: ReceipePage,
});

function ReceipePage() {
  const { receipeId } = Route.useParams();
  const get = useServerFn(getCommunityReceipe);
  const fetchVote = useServerFn(getMyVote);
  const submitVote = useServerFn(setReceipeVote);
  const fetchComments = useServerFn(listReceipeComments);
  const postComment = useServerFn(addReceipeComment);
  const removeComment = useServerFn(deleteReceipeComment);
  const toggleComments = useServerFn(setReceipeCommentsEnabled);
  const removeReceipe = useServerFn(deleteCommunityReceipe);
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [myVote, setMyVote] = useState<"up" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const isAdmin = useIsAdmin(userId);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [comments, setComments] = useState<
    { id: string; body: string; created_at: string; user_id: string; author_name: string }[]
  >([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    get({ data: { id: receipeId } }).then((r) => {
      setData(r);
      setLoading(false);
    });
    fetchComments({ data: { recipe_id: receipeId } })
      .then((r) => setComments(r.comments))
      .catch(() => {});
    supabase.auth.getSession().then(({ data: s }) => {
      const isAuthed = !!s.session;
      setAuthed(isAuthed);
      const u = s.session?.user;
      setUserId(u?.id ?? null);
      setUserEmail(u?.email ?? null);
      setEmailVerified(!!u?.email_confirmed_at);
      if (isAuthed) {
        fetchVote({ data: { recipe_id: receipeId } })
          .then((v) => setMyVote(v.vote))
          .catch(() => {});
      }
    });
  }, [get, fetchVote, fetchComments, receipeId]);

  const vote = async (next: "up") => {
    if (!authed) {
      toast("Sign in to vote");
      return;
    }
    const target: "up" | null = myVote === next ? null : next;
    const prevVote = myVote;
    setMyVote(target);
    setData((d: any) => {
      if (!d) return d;
      let up = d.up_count ?? 0;
      if (prevVote === "up") up -= 1;
      if (target === "up") up += 1;
      return { ...d, up_count: up };
    });
    try {
      await submitVote({ data: { recipe_id: receipeId, vote: target } });
    } catch {
      toast.error("Couldn't save vote");
    }
  };

  if (loading) return <p className="p-8 text-center">Loading…</p>;
  if (!data?.receipe) return <p className="p-8 text-center">Receipe not found.</p>;

  const r = data.receipe;
  const isOwner = !!userId && userId === r.user_id;
  const canManageReceipe = isOwner || isAdmin;
  const commentsEnabled = r.comments_enabled !== false;

  const submitComment = async () => {
    const body = commentDraft.trim();
    if (body.length < 1) return;
    setPostingComment(true);
    try {
      const res = await postComment({ data: { recipe_id: receipeId, body } });
      setComments((c) => [...c, res.comment]);
      setCommentDraft("");
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const onDeleteComment = async (id: string) => {
    const prev = comments;
    setComments((c) => c.filter((x) => x.id !== id));
    try {
      await removeComment({ data: { id } });
    } catch {
      toast.error("Couldn't delete");
      setComments(prev);
    }
  };

  const onToggleComments = async (next: boolean) => {
    const prev = data;
    setData({ ...data, receipe: { ...r, comments_enabled: next } });
    try {
      await toggleComments({ data: { recipe_id: receipeId, enabled: next } });
      toast.success(next ? "Comments turned on" : "Comments turned off");
    } catch {
      toast.error("Couldn't update");
      setData(prev);
    }
  };

  const onDeleteReceipe = async () => {
    if (!confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await removeReceipe({ data: { id: receipeId } });
      toast.success("Receipe deleted");
      navigate({ to: "/community" });
    } catch {
      toast.error("Couldn't delete receipe");
      setDeleting(false);
    }
  };

  const resendVerification = async () => {
    if (!userEmail) return;
    const { error } = await supabase.auth.resend({ type: "signup", email: userEmail });
    if (error) toast.error(error.message);
    else toast.success("Verification email sent");
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/community" className="font-black text-xs uppercase opacity-60 hover:opacity-100">
          ← Back to community
        </Link>
        <div className="bg-white border-4 border-border rounded-3xl p-6 md:p-8 mt-4 shadow-[8px_8px_0px_0px_var(--border)]">
          {r.image_url && (
            <img
              src={r.image_url}
              alt={r.title}
              className="w-full max-h-80 object-cover rounded-2xl border-2 border-border mb-5"
            />
          )}
          <h1 className="font-display text-4xl md:text-5xl text-paprika leading-tight mb-2">{r.title}</h1>
          <p className="text-xs font-black uppercase tracking-wider opacity-60 mb-4">
            {[r.city, r.country, r.cuisine].filter(Boolean).join(" · ")} · by {data.author_name}
          </p>
          {r.description && <p className="mb-5 text-base">{r.description}</p>}
          {canManageReceipe && (
            <div className="mb-5 flex justify-end">
              <button
                type="button"
                onClick={onDeleteReceipe}
                disabled={deleting}
                className="bg-paprika text-white border-2 border-border rounded-full px-3 py-1.5 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete receipe"}
              </button>
            </div>
          )}
          {r.dietary?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {r.dietary.map((d: string) => (
                <span key={d} className="bg-turmeric/30 border-2 border-border rounded-full px-2 py-0.5 text-[11px] font-black uppercase">
                  {d}
                </span>
              ))}
            </div>
          )}

          {r.history && (
            <>
              <h2 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-2">
                History & background
              </h2>
              <p className="mb-6 text-sm leading-relaxed whitespace-pre-wrap">{r.history}</p>
            </>
          )}

          <h2 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-2">Ingredients</h2>
          <ul className="mb-6 space-y-1">
            {(r.ingredients as Array<string | { name?: string; quantity?: string }>).map((ing, i) => {
              const text =
                typeof ing === "string"
                  ? ing
                  : [ing?.quantity, ing?.name].filter(Boolean).join(" ");
              return (
                <li key={i} className="text-sm before:content-['▸'] before:mr-2 before:text-turmeric">
                  {text}
                </li>
              );
            })}
          </ul>

          <h2 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-2">Steps</h2>
          <ol className="space-y-3 list-decimal list-inside mb-6">
            {(r.steps as Array<string | { text?: string; instruction?: string }>).map((s, i) => {
              const text = typeof s === "string" ? s : s?.text ?? s?.instruction ?? "";
              return (
                <li key={i} className="text-sm leading-relaxed">{text}</li>
              );
            })}
          </ol>

          <div className="flex items-center gap-3">
            <button
              onClick={() => vote("up")}
              aria-pressed={myVote === "up"}
              className={`border-2 border-border px-4 py-2 rounded-full font-black text-sm uppercase shadow-[2px_2px_0px_0px_var(--border)] hover:translate-y-[-1px] transition-all ${
                myVote === "up" ? "bg-paprika text-white" : "bg-white"
              }`}
            >
              👍 {data.up_count}
            </button>
            {!authed && (
              <span className="text-xs opacity-70">
                <Link to="/login" className="underline font-black text-paprika">
                  Sign in
                </Link>{" "}
                to vote
              </span>
            )}
          </div>

          <div className="mt-8 pt-6 border-t-2 border-dashed border-border/40">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-black text-lg uppercase">
                Comments ({comments.length})
              </h2>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => onToggleComments(!commentsEnabled)}
                  className={`border-2 border-border rounded-full px-3 py-1 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border)] ${
                    commentsEnabled ? "bg-cardamom text-white" : "bg-white"
                  }`}
                >
                  Comments: {commentsEnabled ? "On" : "Off"}
                </button>
              )}
            </div>

            {!commentsEnabled && (
              <p className="text-sm opacity-70 mb-4">
                Comments are turned off by the author.
              </p>
            )}

            {commentsEnabled && (
              <div className="mb-5">
                {!authed ? (
                  <p className="text-sm opacity-70">
                    <Link to="/login" className="underline font-black text-paprika">
                      Sign in
                    </Link>{" "}
                    to comment or ask a question.
                  </p>
                ) : !emailVerified ? (
                  <div className="bg-turmeric/10 border-2 border-dashed border-border/50 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold">Verify your email to comment.</p>
                    <button
                      type="button"
                      onClick={resendVerification}
                      className="bg-white border-2 border-border rounded-full px-3 py-1 text-[11px] font-black uppercase"
                    >
                      Resend verification
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value.slice(0, 1000))}
                      placeholder="Share thoughts or ask a question…"
                      rows={3}
                      className="w-full border-2 border-border rounded-2xl p-3 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-turmeric"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] opacity-60 font-bold">
                        {commentDraft.length}/1000
                      </span>
                      <button
                        type="button"
                        onClick={submitComment}
                        disabled={postingComment || commentDraft.trim().length < 1}
                        className="bg-paprika text-white border-2 border-border rounded-full px-4 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_var(--border)] disabled:opacity-60"
                      >
                        {postingComment ? "Posting…" : "Post"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {comments.length === 0 ? (
              <p className="text-sm opacity-60">No comments yet.</p>
            ) : (
              <ul className="space-y-3">
                {comments.map((c) => {
                  const canDelete = userId === c.user_id || isOwner || isAdmin;
                  return (
                    <li
                      key={c.id}
                      className="bg-background border-2 border-border rounded-2xl p-3"
                    >
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="font-black text-xs uppercase">
                          {c.author_name}
                          {c.user_id === r.user_id && (
                            <span className="ml-2 bg-turmeric/40 border border-border rounded-full px-1.5 py-0.5 text-[9px]">
                              Author
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDeleteComment(c.id)}
                          className="mt-2 text-[10px] font-black uppercase opacity-60 hover:opacity-100 hover:text-paprika"
                        >
                          Delete
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
