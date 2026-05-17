import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});

type Mode = "signin" | "signup";

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSent, setSignupSent] = useState<string | null>(null);

  const redirectTo = search.redirect || "/";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!z.string().email().safeParse(cleanEmail).success) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
        setSignupSent(cleanEmail);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: redirectTo });
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message || "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: redirectTo });
  };

  const onForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!z.string().email().safeParse(cleanEmail).success) {
      toast.error("Enter your email above first");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent.");
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Toaster />
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center text-xs font-black uppercase tracking-widest mb-4 opacity-60 hover:opacity-100">
          ← Back to site
        </Link>
        <Link to="/" className="block text-center mb-6">
          <h1 className="font-display text-5xl md:text-6xl uppercase tracking-tighter text-paprika leading-none">
            FridgeCuisine
          </h1>
          <p className="font-black uppercase tracking-widest text-[10px] mt-2">
            Global Kitchen AI
          </p>
        </Link>

        <div className="bg-white border-4 border-border rounded-[32px] p-6 shadow-[8px_8px_0px_0px_var(--border)]">
          {signupSent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">📬</div>
              <h2 className="font-black text-2xl uppercase mb-2">Check your email</h2>
              <p className="text-sm text-muted-foreground mb-1">
                We sent a sign-in link to
              </p>
              <p className="font-black text-base mb-4 break-all">{signupSent}</p>
              <p className="text-xs text-muted-foreground mb-5">
                Open it from your inbox to confirm and sign in. Don't see it? Check spam.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSignupSent(null);
                  setMode("signin");
                  setPassword("");
                }}
                className="w-full bg-turmeric border-4 border-border py-3 rounded-2xl font-black uppercase shadow-[0px_5px_0px_0px_var(--border)] active:shadow-[0px_2px_0px_0px_var(--border)] active:translate-y-1 transition-all"
              >
                Back to sign in
              </button>
            </div>
          ) : (
          <>
          <div className="flex gap-1 bg-muted/40 border-2 border-border rounded-full p-1 mb-5">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 text-[11px] md:text-xs font-black uppercase py-2 rounded-full transition-colors ${
                  mode === m ? "bg-turmeric text-foreground" : "text-muted-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block font-bold text-xs uppercase mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border-2 border-border rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-turmeric"
                placeholder="you@example.com"
              />
            </div>

            <div>
                <label className="block font-bold text-xs uppercase mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="w-full border-2 border-border rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-turmeric"
                  placeholder="••••••••"
                />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-turmeric border-4 border-border py-3 rounded-2xl font-black text-lg uppercase shadow-[0px_5px_0px_0px_var(--border)] active:shadow-[0px_2px_0px_0px_var(--border)] active:translate-y-1 transition-all disabled:opacity-60"
            >
              {loading
                ? "Working…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          {mode === "signin" && (
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={loading}
              className="mt-2 w-full text-xs font-bold underline text-muted-foreground"
            >
              Forgot password?
            </button>
          )}

          <div className="my-4 flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            or
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={loading}
            className="w-full bg-white border-2 border-border py-2.5 rounded-2xl font-black text-sm uppercase shadow-[0px_4px_0px_0px_var(--border)] active:shadow-[0px_1px_0px_0px_var(--border)] active:translate-y-1 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
          </>
          )}
        </div>
      </div>
    </main>
  );
}