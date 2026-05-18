import { useState, useEffect, useRef } from "react";
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
  const [email, setEmail] = useState("");           // signup only
  const [identifier, setIdentifier] = useState(""); // signin: email or username
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    | { state: "idle" }
    | { state: "checking" }
    | { state: "invalid"; message: string }
    | { state: "taken" }
    | { state: "available" }
  >({ state: "idle" });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  // Synchronous lock to guard against duplicate submissions when the UI lags
  // (state updates are async; a ref flips immediately).
  const submitLockRef = useRef(false);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const [signupSent, setSignupSent] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState<string | null>(null);
  const [formError, setFormError] = useState<{ message: string; action?: { label: string; onClick: () => void } } | null>(null);

  const redirectTo = search.redirect || "/";

  const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/;
  const RESERVED = new Set(["admin","root","support","help","api","auth","login","signup","me","fridgecuisine"]);

  // Detect what the sign-in identifier looks like, for the inline hint
  const identifierKind: "empty" | "email" | "username" | "invalid" = (() => {
    const v = identifier.trim();
    if (!v) return "empty";
    if (v.includes("@")) return z.string().email().safeParse(v.toLowerCase()).success ? "email" : "invalid";
    return USERNAME_RE.test(v.toLowerCase()) ? "username" : "invalid";
  })();

  // Clear inline error when user edits inputs
  useEffect(() => { setFormError(null); }, [identifier, email, username, password, mode]);

  // Debounced username availability check while typing on signup
  useEffect(() => {
    if (mode !== "signup") return;
    const u = username.trim().toLowerCase();
    if (!u) { setUsernameStatus({ state: "idle" }); return; }
    if (!USERNAME_RE.test(u)) {
      setUsernameStatus({ state: "invalid", message: "3–20 chars, lowercase letters/digits/_ , must start with a letter" });
      return;
    }
    if (RESERVED.has(u)) {
      setUsernameStatus({ state: "invalid", message: "That username is reserved" });
      return;
    }
    setUsernameStatus({ state: "checking" });
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("username_available", { _username: u });
      if (error) { setUsernameStatus({ state: "idle" }); return; }
      setUsernameStatus({ state: data ? "available" : "taken" });
    }, 350);
    return () => clearTimeout(t);
  }, [username, mode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Hard guard: ignore the call entirely if a request is already inflight.
    if (submitLockRef.current || loading) return;
    submitLockRef.current = true;
    // Imperatively disable the submit button NOW, before React re-renders,
    // so the UI reflects the lock even if the next render is delayed.
    if (submitBtnRef.current) submitBtnRef.current.disabled = true;
    setFormError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const cleanEmail = email.trim().toLowerCase();
        const cleanUsername = username.trim().toLowerCase();
        if (!z.string().email().safeParse(cleanEmail).success) {
          toast.error("Enter a valid email");
          setLoading(false);
          return;
        }
        if (!USERNAME_RE.test(cleanUsername) || RESERVED.has(cleanUsername)) {
          toast.error("Choose a valid username");
          setLoading(false);
          return;
        }
        if (usernameStatus.state === "taken") {
          toast.error("That username is taken");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { username: cleanUsername },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
        setSignupSent(cleanEmail);
      } else {
        const idRaw = identifier.trim();
        if (!idRaw) {
          setFormError({ message: "Enter your email or username to sign in." });
          setLoading(false);
          return;
        }
        let loginEmail = idRaw.toLowerCase();
        let usedUsername: string | null = null;
        if (!idRaw.includes("@")) {
          // treat as username — resolve to email
          const uname = idRaw.toLowerCase();
          if (!USERNAME_RE.test(uname)) {
            setFormError({
              message: "That doesn't look like a valid email or username. Usernames are 3–20 chars, letters/digits/_ , starting with a letter.",
            });
            setLoading(false);
            return;
          }
          usedUsername = uname;
          const { data, error: rpcErr } = await supabase.rpc("email_for_username", { _username: uname });
          if (rpcErr) {
            setFormError({ message: "Couldn't reach the server. Try again." });
            setLoading(false);
            return;
          }
          if (!data) {
            setFormError({
              message: `No account found with username "@${uname}".`,
              action: { label: "Create one", onClick: () => setMode("signup") },
            });
            setLoading(false);
            return;
          }
          loginEmail = data as string;
        } else if (!z.string().email().safeParse(loginEmail).success) {
          setFormError({ message: "Enter a valid email address." });
          setLoading(false);
          return;
        }
        if (!password) {
          setFormError({ message: "Enter your password." });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });
        if (error) {
          setFormError({
            message: usedUsername
              ? `Wrong password for @${usedUsername}.`
              : "Email or password is incorrect.",
          });
          setLoading(false);
          return;
        }
        // Remember-me: mark this session as persistent or ephemeral so the
        // root layout can sign the user out at the start of a new browser
        // session when "Remember me" was unchecked.
        try {
          if (remember) {
            localStorage.setItem("fc-auth-remember", "1");
            sessionStorage.removeItem("fc-auth-session");
          } else {
            localStorage.removeItem("fc-auth-remember");
            sessionStorage.setItem("fc-auth-session", "1");
          }
        } catch {}
        toast.success("Welcome back!");
        navigate({ to: redirectTo });
      }
    } catch (err: any) {
      setFormError({ message: err?.message || "Something went wrong" });
    } finally {
      setLoading(false);
      // Small cooldown so rapid double-clicks after a fast response are also
      // swallowed, not just the in-flight window.
      setTimeout(() => {
        submitLockRef.current = false;
        if (submitBtnRef.current) submitBtnRef.current.disabled = false;
      }, 400);
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

  const onApple = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message || "Apple sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: redirectTo });
  };

  const onForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!z.string().email().safeParse(cleanEmail).success) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForgotSent(cleanEmail);
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
            Global AI Kitchen
          </p>
        </Link>

        <div className="bg-white border-4 border-border rounded-[32px] p-6 shadow-[8px_8px_0px_0px_var(--border)]">
          {forgotOpen ? (
            forgotSent ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">📬</div>
                <h2 className="font-black text-2xl uppercase mb-2">Check your email</h2>
                <p className="text-sm text-muted-foreground mb-1">
                  We sent a password reset link to
                </p>
                <p className="font-black text-base mb-4 break-all">{forgotSent}</p>
                <p className="text-xs text-muted-foreground mb-5">
                  Open it to choose a new password. Don't see it? Check spam.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen(false);
                    setForgotSent(null);
                    setForgotEmail("");
                  }}
                  className="w-full bg-turmeric border-4 border-border py-3 rounded-2xl font-black uppercase shadow-[0px_5px_0px_0px_var(--border)] active:shadow-[0px_2px_0px_0px_var(--border)] active:translate-y-1 transition-all"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <div>
                <h2 className="font-black text-xl uppercase mb-1">Reset password</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Enter the email you signed up with — we'll send you a reset link.
                </p>
                <form onSubmit={onForgotPassword} className="space-y-3">
                  <div>
                    <label className="block font-bold text-xs uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                      className="w-full border-2 border-border rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-turmeric"
                      placeholder="you@example.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-turmeric border-4 border-border py-3 rounded-2xl font-black text-lg uppercase shadow-[0px_5px_0px_0px_var(--border)] active:shadow-[0px_2px_0px_0px_var(--border)] active:translate-y-1 transition-all disabled:opacity-60"
                  >
                    {loading ? "Sending…" : "Send reset link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(false)}
                    className="w-full text-xs font-bold underline text-muted-foreground"
                  >
                    Back to sign in
                  </button>
                </form>
              </div>
            )
          ) : signupSent ? (
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
            {formError && (
              <div role="alert" className="border-2 border-red-500 bg-red-50 text-red-900 rounded-xl px-3 py-2 text-xs font-bold">
                {formError.message}
                {formError.action && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={formError.action.onClick}
                      className="underline font-black"
                    >
                      {formError.action.label}
                    </button>
                  </>
                )}
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="block font-bold text-xs uppercase mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  required
                  minLength={3}
                  maxLength={20}
                  autoComplete="username"
                  className="w-full border-2 border-border rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-turmeric"
                 placeholder="Your username"
                />
                <p className={`text-[10px] mt-1 ${
                  usernameStatus.state === "available" ? "text-green-600 font-bold" :
                  usernameStatus.state === "taken" || usernameStatus.state === "invalid" ? "text-red-600 font-bold" :
                  "text-muted-foreground"
                }`}>
                  {usernameStatus.state === "checking" && "Checking…"}
                  {usernameStatus.state === "available" && "✓ Available"}
                  {usernameStatus.state === "taken" && "✗ Already taken"}
                  {usernameStatus.state === "invalid" && usernameStatus.message}
                  {usernameStatus.state === "idle" && "3–20 chars, letters/digits/_ , starts with a letter"}
                </p>
              </div>
            )}

            <div>
              <label className="block font-bold text-xs uppercase mb-1">
                {mode === "signup" ? "Email" : "Email or username"}
              </label>
              {mode === "signup" ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full border-2 border-border rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-turmeric"
                  placeholder="you@example.com"
                />
              ) : (
                <>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="username"
                    spellCheck={false}
                    autoCapitalize="none"
                    className={`w-full border-2 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-turmeric ${
                      identifierKind === "invalid" ? "border-red-500" : "border-border"
                    }`}
                   placeholder="you@example.com  or  Your username"
                  />
                  <p className={`text-[10px] mt-1 ${
                    identifierKind === "email" || identifierKind === "username"
                      ? "text-muted-foreground"
                      : identifierKind === "invalid"
                        ? "text-red-600 font-bold"
                        : "text-muted-foreground"
                  }`}>
                    {identifierKind === "empty" && "Use the email or username you signed up with."}
                    {identifierKind === "email" && "Signing in with email"}
                    {identifierKind === "username" && `Signing in as @${identifier.trim().toLowerCase()}`}
                    {identifierKind === "invalid" && (identifier.includes("@")
                      ? "That email doesn't look right."
                      : "Usernames are 3–20 chars, letters/digits/_ , starting with a letter.")}
                  </p>
                </>
              )}
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

            {mode === "signin" && (
              <label className="flex items-center gap-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 border-2 border-border rounded accent-turmeric cursor-pointer"
                />
                <span className="text-sm font-bold">Remember me</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {remember ? "— stay signed in" : "— sign out when I close the browser"}
                </span>
              </label>
            )}

            <button
              ref={submitBtnRef}
              type="submit"
              disabled={loading}
              className="w-full bg-turmeric border-4 border-border py-3 rounded-2xl font-black text-lg uppercase shadow-[0px_5px_0px_0px_var(--border)] active:shadow-[0px_2px_0px_0px_var(--border)] active:translate-y-1 transition-all disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 rounded-full border-2 border-border border-t-transparent animate-spin"
                  />
                  {mode === "signin" ? "Signing in…" : "Creating account…"}
                </span>
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {mode === "signin" && (
            <button
              type="button"
              onClick={() => {
                setForgotEmail(identifier.includes("@") ? identifier : "");
                setForgotOpen(true);
              }}
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

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onGoogle}
              disabled={loading}
              aria-label="Continue with Google"
              title="Continue with Google"
              className="h-12 w-12 bg-white border-2 border-border rounded-full shadow-[0px_4px_0px_0px_var(--border)] active:shadow-[0px_1px_0px_0px_var(--border)] active:translate-y-1 transition-all disabled:opacity-60 flex items-center justify-center"
            >
              <svg width="22" height="22" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            </button>

            <button
              type="button"
              onClick={onApple}
              disabled={loading}
              aria-label="Continue with Apple"
              title="Continue with Apple"
              className="h-12 w-12 bg-black text-white border-2 border-border rounded-full shadow-[0px_4px_0px_0px_var(--border)] active:shadow-[0px_1px_0px_0px_var(--border)] active:translate-y-1 transition-all disabled:opacity-60 flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            </button>

            <button
              type="button"
              disabled
              aria-label="Facebook (coming soon)"
              title="Facebook — coming soon"
              className="h-12 w-12 bg-white border-2 border-border rounded-full shadow-[0px_4px_0px_0px_var(--border)] opacity-40 cursor-not-allowed flex items-center justify-center"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </button>

            <button
              type="button"
              disabled
              aria-label="X (coming soon)"
              title="X — coming soon"
              className="h-12 w-12 bg-black text-white border-2 border-border rounded-full shadow-[0px_4px_0px_0px_var(--border)] opacity-40 cursor-not-allowed flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </button>
          </div>

          <p className="mt-3 text-[10px] text-center text-muted-foreground leading-relaxed">
            Facebook and X coming soon.
          </p>
          </>
          )}
        </div>
      </div>
    </main>
  );
}