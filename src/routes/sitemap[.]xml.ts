import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "https://fridgecuisine.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/chefs", changefreq: "weekly", priority: "0.8" },
          { path: "/shop", changefreq: "daily", priority: "0.9" },
          { path: "/community", changefreq: "daily", priority: "0.8" },
          { path: "/pricing", changefreq: "monthly", priority: "0.7" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
          { path: "/security", changefreq: "monthly", priority: "0.4" },
          { path: "/contact", changefreq: "monthly", priority: "0.4" },
          { path: "/terms", changefreq: "monthly", priority: "0.3" },
          { path: "/privacy", changefreq: "monthly", priority: "0.3" },
          { path: "/cookies", changefreq: "monthly", priority: "0.3" },
        ];

        try {
          const { data: paid } = await supabaseAdmin
            .from("paid_recipes")
            .select("id, updated_at")
            .eq("is_published", true);
          for (const r of paid ?? []) {
            entries.push({
              path: `/shop/${r.id}`,
              lastmod: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
              changefreq: "weekly",
              priority: "0.7",
            });
          }
        } catch {}

        try {
          const { data: community } = await supabaseAdmin
            .from("community_recipes")
            .select("id, updated_at")
            .eq("is_published", true);
          for (const r of community ?? []) {
            entries.push({
              path: `/community/${r.id}`,
              lastmod: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
              changefreq: "weekly",
              priority: "0.6",
            });
          }
        } catch {}

        try {
          const { data: shared } = await supabaseAdmin
            .from("shared_recipes")
            .select("slug, created_at");
          for (const r of shared ?? []) {
            entries.push({
              path: `/shared/${r.slug}`,
              lastmod: r.created_at ? new Date(r.created_at).toISOString() : undefined,
              changefreq: "weekly",
              priority: "0.5",
            });
          }
        } catch {}

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});