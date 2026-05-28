## Problem

When signing in with a **username** (instead of an email), the login page shows:

> Couldn't reach the server. Try again.

## Root cause

The login form calls two SQL functions through the API:

- `email_for_username(_username)` — resolves a username to its email so we can sign in
- `username_available(_username)` — checks if a username is free during signup

Both functions exist, but they were created **without granting EXECUTE permission to the `anon` and `authenticated` roles**. Because nobody is signed in yet on the login page, the request runs as `anon`, the database refuses it, and the UI shows the generic "Couldn't reach the server" message.

Email + password sign-in works because it doesn't go through these helpers.

## Fix

Add a migration that grants the missing permissions:

```sql
GRANT EXECUTE ON FUNCTION public.email_for_username(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.username_available(text)  TO anon, authenticated;
```

No code, schema, or RLS changes — just permissions. After this, signing in with `@username` + password works, and the live username availability check on the signup form starts responding too.

## Out of scope

- No changes to the login UI, auth flow, or any other tables.
