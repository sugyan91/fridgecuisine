import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "search_community_recipes",
  title: "Search community recipes",
  description:
    "Search FridgeCuisine's published community recipes by title, cuisine, or city.",
  inputSchema: {
    search: z.string().trim().max(80).optional().describe("Text to match in the title."),
    cuisine: z.string().trim().max(80).optional().describe("Filter by cuisine name."),
    city: z.string().trim().max(80).optional().describe("Filter by city (substring)."),
    limit: z.number().int().min(1).max(50).default(20).describe("Max recipes to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, cuisine, city, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("community_recipes")
      .select("id, title, description, cuisine, city, country, dietary, image_url, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (search) q = q.ilike("title", `%${search}%`);
    if (cuisine) q = q.eq("cuisine", cuisine);
    if (city) q = q.ilike("city", `%${city}%`);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { recipes: data ?? [] },
    };
  },
});