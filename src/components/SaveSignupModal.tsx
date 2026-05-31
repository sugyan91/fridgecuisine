import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { Recipe } from "@/lib/recipes.functions";

type Props = {
  open: boolean;
  onClose: () => void;
  recipe: Recipe | null;
};

const PENDING_KEY = "fc-pending-save";

export function SaveSignupModal({ open, onClose, recipe }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const stashPending = () => {
    if (!recipe) return;
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(recipe));
    } catch {}
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    stashPending();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't send magic link. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    stashPending();
    try {
      await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't start Google sign-in.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setSent(false);
          setEmail("");
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl md:text-2xl tracking-tight">
            Save <span className="text-accent">{recipe?.title ?? "this recipe"}</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            Drop your email — we'll send a one-click sign-in link and save this recipe to your cookbook automatically.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="mt-4 p-4 rounded-2xl bg-secondary border border-border text-sm">
            <p className="font-semibold mb-1">Check your inbox 📬</p>
            <p className="text-muted-foreground">
              We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>.
              Click it and your recipe will be waiting in your cookbook.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-full bg-foreground text-background font-display font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-60"
            >
              {loading ? "Sending…" : "Email me the link"}
            </button>
            <div className="flex items-center gap-3 my-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="flex-1 h-px bg-border" />
              or
              <span className="flex-1 h-px bg-border" />
            </div>
            <button
              type="button"
              onClick={onGoogle}
              className="w-full px-4 py-3 rounded-full border border-border bg-card font-display font-semibold text-sm hover:bg-secondary transition-all"
            >
              Continue with Google
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}