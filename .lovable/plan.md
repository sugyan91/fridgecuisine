## Add username to signup & sign-in

Let users pick a unique username at signup, then sign in with either email **or** username + password.

### Username rules
- 3–20 characters
- Lowercase letters, digits, and underscores only (`^[a-z0-9_]{3,20}$`)
- Must start with a letter
- Case-insensitive, stored lowercase, globally unique
- Reserved list blocked: `admin`, `root`, `support`, `help`, `api`, `auth`, `login`, `signup`, `me`, `fridgecuisine`

### Database changes (migration)
- Add `username text` column to `profiles`, unique (case-insensitive via lowercase storage + unique index)
- Add CHECK constraint enforcing the regex
- Update `handle_new_user()` trigger to read `raw_user_meta_data->>'username'` and insert into `profiles.username` (fall back to email prefix if missing, e.g. for Google sign-in — appending a random suffix to guarantee uniqueness)
- Add SECURITY DEFINER function `public.email_for_username(_username text)` returning the auth email for a given username, so sign-in by username can resolve to an email without exposing the auth table

### Sign-up form (`/login?mode=signup`)
- Add **Username** field above Email
- Live validation: format check + "username taken" check (debounced, via a new public server fn `checkUsernameAvailable`)
- On submit, pass `options.data.username` to `supabase.auth.signUp` so the trigger picks it up
- Show inline error if username invalid/taken

### Sign-in form (`/login?mode=signin`)
- Rename label to **"Email or username"**
- On submit: if input contains `@` → treat as email; otherwise call new server fn `resolveLoginIdentifier({ username })` → returns email → call `signInWithPassword` with that email
- Errors surface as "No account with that username" / "Wrong password" without leaking which one failed (single "Invalid credentials" message)

### Google/Apple sign-in
- OAuth users won't have a chosen username. The trigger auto-generates one from their email prefix + random suffix; they can change it later from a profile page (out of scope for this task — flag it as a follow-up)

### Files touched
- `supabase/migrations/<new>.sql` — column, index, check, trigger update, helper function
- `src/lib/auth.functions.ts` (new) — `checkUsernameAvailable`, `resolveLoginIdentifier`
- `src/routes/login.tsx` — username field on signup, identifier label + resolution flow on signin
- `src/integrations/supabase/types.ts` — regenerated automatically by migration

### Out of scope
- Username change UI (post-signup)
- Username availability check during the OAuth-auto-generated flow
- Password reset by username (still email-only)
