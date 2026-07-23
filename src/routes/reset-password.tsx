import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — FridgeCuisine" },
      { name: "description", content: "Choose a new password for your FridgeCuisine account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

type Status = "checking" | "ready" | "invalid" | "success";

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4); // 0..4
}

const STRENGTH_LABELS = ["Too weak", "Weak", "Okay", "Strong", "Excellent"];
const STRENGTH_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-turmeric",
  "bg-primary",
  "bg-primary",
];

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Verify we're in a recovery session (Supabase sets a session from the
  // recovery link before the app boots). Without this the user could land
  // here from anywhere and the updateUser call would silently change *their*
  // active session's password.
  useEffect(() => {
    let cancelled = false;
    // Listen for the PASSWORD_RECOVERY event that fires when Supabase
    // detects the recovery token in the URL hash.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      // Either the recovery session is already established OR the URL hash
      // has a recovery type token that Supabase is about to consume.
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const looksLikeRecovery = hash.includes("type=recovery") || hash.includes("access_token");
      if (data.session || looksLikeRecovery) setStatus("ready");
      else setStatus("invalid");
    })();
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const strength = useMemo(() => scorePassword(password), [password]);
  const passwordsMatch = confirm.length > 0 && confirm === password;
  const canSubmit =
    status === "ready" && !loading && password.length >= 8 && passwordsMatch;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setFormError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      const msg = /same.*password/i.test(error.message)
        ? "This is the same as your current password. Choose a new one."
        : /session/i.test(error.message)
        ? "Your reset link has expired. Request a new one from the sign-in page."
        : error.message;
      setFormError(msg);
      return;
    }
    setStatus("success");
    toast.success("Password updated");
    setTimeout(() => navigate({ to: "/" }), 1600);
  };

  return (
    <main className="relative min-h-dvh bg-background text-foreground flex items-center justify-center p-4 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-paprika/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <Toaster />
      <div className="relative w-full max-w-md">
        <Link to="/" className="block text-center text-xs font-black uppercase tracking-widest mb-4 opacity-60 hover:opacity-100">
          ← Back to site
        </Link>
        <div className="bg-card border-4 border-border rounded-[32px] p-6 shadow-[8px_8px_0px_0px_var(--border)]">
          {status === "checking" ? (
            <div className="text-center py-10" role="status" aria-live="polite">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-paprika" />
              <p className="mt-3 text-sm text-muted-foreground font-medium">
                Verifying your reset link…
              </p>
            </div>
          ) : status === "invalid" ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <h1 className="font-display text-2xl uppercase text-paprika mb-2">Link expired</h1>
              <p className="text-sm text-muted-foreground mb-5">
                This password reset link is invalid or has already been used. Request a fresh
                one and try again — links expire after a short time for your security.
              </p>
              <Link
                to="/login"
                className="inline-block w-full bg-turmeric border-4 border-border py-3 rounded-2xl font-black uppercase shadow-[0px_5px_0px_0px_var(--border)] active:shadow-[0px_2px_0px_0px_var(--border)] active:translate-y-1 transition-all"
              >
                Request a new link
              </Link>
            </div>
          ) : status === "success" ? (
            <div className="text-center py-8" role="status" aria-live="polite">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <h1 className="font-display text-2xl uppercase text-paprika mb-2">
                Password updated
              </h1>
              <p className="text-sm text-muted-foreground">
                Redirecting you to the app…
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h1 className="font-display text-2xl sm:text-3xl uppercase text-paprika leading-none">
                  Set new password
                </h1>
              </div>
              <p className="text-xs text-muted-foreground mb-5">
                Choose a strong password you don't use elsewhere.
              </p>
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="new-password" className="block font-bold text-xs uppercase mb-1">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      aria-describedby="pw-strength"
                      aria-invalid={formError ? true : undefined}
                      className="w-full border-2 border-border rounded-xl pl-3 pr-11 py-2.5 font-medium bg-background focus:outline-none focus:ring-2 focus:ring-turmeric"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turmeric"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Strength meter */}
                  <div id="pw-strength" className="mt-2" aria-live="polite">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            password.length > 0 && i < strength
                              ? STRENGTH_COLORS[strength]
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      {password.length === 0 ? "Minimum 8 characters" : STRENGTH_LABELS[strength]}
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block font-bold text-xs uppercase mb-1">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      aria-invalid={confirm.length > 0 && !passwordsMatch ? true : undefined}
                      className="w-full border-2 border-border rounded-xl pl-3 pr-11 py-2.5 font-medium bg-background focus:outline-none focus:ring-2 focus:ring-turmeric"
                      placeholder="Repeat password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turmeric"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirm.length > 0 && !passwordsMatch && (
                    <p className="mt-1 text-xs text-destructive font-medium">
                      Passwords don't match yet.
                    </p>
                  )}
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border-2 border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full bg-turmeric border-4 border-border py-3 rounded-2xl font-black uppercase shadow-[0px_5px_0px_0px_var(--border)] active:shadow-[0px_2px_0px_0px_var(--border)] active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Update password"
                  )}
                </button>

                <p className="text-center text-xs text-muted-foreground pt-1">
                  Remembered it?{" "}
                  <Link to="/login" className="font-bold text-paprika hover:underline">
                    Back to sign in
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}