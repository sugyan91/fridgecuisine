import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listSavedRecipesTool from "./tools/list-saved-recipes";
import searchCommunityRecipesTool from "./tools/search-community-recipes";
import getProfileTool from "./tools/get-profile";

// The OAuth issuer MUST be the direct Supabase host, not the `.lovable.cloud`
// proxy. Read the project ref from a Vite-inlined env var so the published
// Workers build keeps the correct issuer.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "fridgecuisine-mcp",
  title: "FridgeCuisine",
  version: "0.1.0",
  instructions:
    "Tools for FridgeCuisine — the AI-powered kitchen. Use these to read a signed-in user's saved recipes and profile, and to browse the FridgeCuisine community recipe collection.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listSavedRecipesTool, searchCommunityRecipesTool, getProfileTool],
});