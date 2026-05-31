## Goal

Users currently see the raw billing error "AI credits exhausted. Add credits in Settings → Workspace → Usage." surfaced via `toast.error(res.error)` in the recipe/fridge/dish flows. Replace it with a friendly, brand-appropriate message that doesn't expose Lovable billing internals.

## Changes

**`src/lib/hf-client.server.ts`** (2 occurrences, lines 129 and 184)

Replace the 402 error string with something neutral like:

> "Our kitchen is taking a quick break — please try again later."

Keep `code: "credits"` so internal handling/logging is unchanged; only the human-readable `error` text changes. This automatically fixes every call site because they all forward `res.error` into `toast.error(...)` (index.tsx lines 272, 296, 337, 366, 402).

## Out of scope

- No changes to AI quota logic, server-fn auth, or the actual billing remediation (that still needs to happen in Lovable workspace settings — but the user won't see it).
- Rate-limit (429) message stays as-is unless you also want it softened.

## Optional follow-up (ask before doing)

Also log the real reason to console server-side so you can still diagnose when it happens, and/or add an admin-only banner.
