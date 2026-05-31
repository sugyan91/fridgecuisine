## Footer Cleanup

### Problem
The "Cook" column mixes product navigation with legal/compliance links, and the "For chefs" column has a generic "Sign up free" that isn't chef-specific. This makes the footer feel disorganized and the columns lose their purpose.

### Changes (1 file)

**File:** `src/components/landing/SiteFooter.tsx`

1. **Cook column** — keep product nav only:
   - Keep: Recipes, Community, Cookbook, Pricing, Account
   - Remove: Privacy, Terms, Cookies, Manage cookies

2. **For chefs column** — keep chef-specific links only:
   - Keep: Sell recipes, Browse chefs
   - Remove: Sign up free

3. **Bottom bar** — add a legal links row next to the copyright:
   - Privacy
   - Terms
   - Cookies
   - Manage cookies (conditional, same as current consent check)

### Result
Clean 3-column footer where each column has a clear theme, with legal links separated into the bottom bar.