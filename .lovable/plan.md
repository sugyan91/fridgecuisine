## Goal

For anonymous (free) users, `RecipeCard` currently calls `generateRecipeImage` (which requires auth) and silently fails, leaving only the emoji fallback. Make this explicit: skip the call when signed out and overlay a "Sign in to see the real food photo" CTA on the fallback image, so users understand the photo exists behind sign-in.

## Changes (single file: `src/components/fridge/RecipeCard.tsx`)

1. **Skip the server call when signed out.** In the `useEffect` that fetches the image, return early when `!isAuthenticated` — set `imageLoading=false`, `imageUrl=null`. No quota waste, no Unauthorized errors.

2. **Add a `SignInForPhotoOverlay` element** rendered on top of `FallbackImage` when `!isAuthenticated`:
   - Small pill/button: "🔒 Sign in to see the real photo"
   - Wrapped in `<Link to="/auth" search={{ redirect: <current path> }}>` (TanStack Router)
   - Positioned absolutely over the image area, centered, with subtle dark scrim so it reads over the gradient fallback

3. **Apply at both render sites** (expanded view ~L206 and compact view ~L477): wrap the existing image container in `relative`, render `<FallbackImage />` as today, and append the overlay when `!isAuthenticated`.

No changes to `recipe-image.functions.ts`, server quota, or other recipe surfaces.

## Out of scope

- Letting anonymous users actually generate images (they still need to sign in).
- Changing the fallback graphic itself.
- Quota/anonymous tracking changes.
