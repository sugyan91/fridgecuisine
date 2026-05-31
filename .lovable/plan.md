Add a contact form that routes messages to the right inbox based on the user's reason.

**New page: `/contact`** (`src/routes/contact.tsx`)
- Form fields: Name, Email, Reason (dropdown: Billing, Support, Feedback), Message
- Branded with FridgeCuisine's terracotta/editorial style matching the rest of the site
- Header + footer included
- Client-side validation with zod (length limits, email format, required fields)
- On submit: POST to `/api/public/contact`
- Shows success toast + confirmation message; resets form
- Includes the two emails as fallback contact info at the top

**Inbox routing**
- Billing → `main@fridgecuisine.com`
- Support → `support@fridgecuisine.com`
- Feedback → `main@fridgecuisine.com`

**New public API route** (`src/routes/api/public/contact.ts`)
- Accepts POST with `{ name, email, reason, message }`
- Re-validates with zod server-side (defense in depth, length caps to prevent abuse)
- Picks the right destination inbox from the reason
- Sends TWO emails via existing email infrastructure:
  1. **Staff notification** to the routed inbox (with reply-to set to the user's email so support can reply directly)
  2. **User confirmation** ("Thanks, we got your message") to the submitter
- Returns `{ ok: true }` on success
- Uses idempotency keys derived from a generated submission id

**New email templates** (`src/lib/email-templates/`)
- `contact-notification.tsx` — internal-facing template for staff (shows reason, name, email, message)
- `contact-confirmation.tsx` — user-facing thank-you with branded shell
- Both registered in `registry.ts`

**Navigation**
- Replace the existing "Support" mailto link in header desktop nav with a `<Link to="/contact">Contact</Link>` (cleaner UX than a mailto)
- Replace the mobile "Contact Support" mailto with the same Contact link
- Footer's Contact column keeps both raw emails (no change) so users who prefer their own mail client still have them

**Files**
- New: `src/routes/contact.tsx`, `src/routes/api/public/contact.ts`, `src/lib/email-templates/contact-notification.tsx`, `src/lib/email-templates/contact-confirmation.tsx`
- Edited: `src/routes/index.tsx` (nav link), `src/lib/email-templates/registry.ts` (register two templates)

No database tables or migrations needed — the existing email queue infrastructure handles delivery, retries, and rate limits.