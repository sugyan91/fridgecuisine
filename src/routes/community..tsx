import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getCommunityRecipe, getMyVote, setRecipeVote } from "@/lib/community.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/community/")({
  component: RecipePage,
});

function RecipePage() {
  const { recipeId } = Route.useParams();
  const get = useServerFn(getCommunityRecipe);
  const fetchVote = useServerFn(getMyVote);
  const submitVote = useServerFn(setRecipeVote);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [myVote, setMyVote] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    get({ data: { id: recipeId } }).then((r) => {
      setData(r);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      const isAuthed = !!s.session;
      setAuthed(isAuthed);
      if (isAuthed) {
        fetchVote({ data: { recipe_id: recipeId } })
          .then((v) => setMyVote(v.vote))
          .catch(() => {});
      }
    });
  }, [get, fetchVote, recipeId]);

  const vote = async (next: "up" | "down") => {
    if (!authed) {
      toast("Sign in to vote");
      return;
    }
    const target: "up" | "down" | null = myVote === next ? null : next;
    const prevVote = myVote;
    setMyVote(target);
    setData((d: any) => {
      if (!d) return d;
      let up = d.up_count ?? 0;
      let down = d.down_count ?? 0;
      if (prevVote === "up") up -= 1;
      if (prevVote === "down") down -= 1;
      if (target === "up") up += 1;
      if (target === "down") down += 1;
      return { ...d, up_count: up, down_count: down };
    });
    try {
      await submitVote({ data: { recipe_id: recipeId, vote: target } });
    } catch {
      toast.error("Couldn't save vote");
    }
  };

  if (loading) return <p className="p-8 text-center">Loading…</p>;
  if (!data?.recipe) return <p className="p-8 text-center">Recipe not found.</p>;

  const r = data.recipe;
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
            {(r.ingredients as string[]).map((ing, i) => (
              <li key={i} className="text-sm before:content-['▸'] before:mr-2 before:text-turmeric">
                {ing}
              </li>
            ))}
          </ul>

          <h2 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-2">Steps</h2>
          <ol className="space-y-3 list-decimal list-inside mb-6">
            {(r.steps as string[]).map((s, i) => (
              <li key={i} className="text-sm leading-relaxed">{s}</li>
            ))}
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
            <button
              onClick={() => vote("down")}
              aria-pressed={myVote === "down"}
              className={`border-2 border-border px-4 py-2 rounded-full font-black text-sm uppercase shadow-[2px_2px_0px_0px_var(--border)] hover:translate-y-[-1px] transition-all ${
                myVote === "down" ? "bg-foreground text-background" : "bg-white"
              }`}
            >
              👎 {data.down_count}
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
        </div>
      </div>
    </main>
  );
}
