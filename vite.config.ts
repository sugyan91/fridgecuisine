// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import path from "node:path";
import { loadEnv, type Plugin } from "vite";
import fs from "node:fs";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

// Load all env vars (no prefix) into process.env for server routes
const serverEnv = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
Object.assign(process.env, serverEnv);

// Build-time guard: fail the build if any source file has a top-level identifier
// collision (duplicate exports, or an import whose local name shadows a
// top-level declaration). Catches issues like `import { X }` + `const X = ...`
// before they reach runtime / the TanStack code-splitter.
function duplicateIdentifierGuard(): Plugin {
  const exportRe = /^\s*export\s+(?:const|let|var|function|class|enum|interface|type)\s+([A-Za-z_$][\w$]*)/gm;
  const declRe = /^\s*(?:export\s+)?(?:const|let|var|function|class|enum|interface|type)\s+([A-Za-z_$][\w$]*)/gm;
  const importRe = /^\s*import\s+(?:type\s+)?(?:([A-Za-z_$][\w$]*)\s*,?\s*)?(?:\{([^}]+)\})?\s*from\s*['"][^'"]+['"]/gm;
  const check = (file: string, code: string) => {
    // Strip line + block comments and strings to avoid false positives.
    const src = code
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1")
      .replace(/`(?:\\.|[^`\\])*`/g, "``")
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      .replace(/"(?:\\.|[^"\\])*"/g, '""');
    const errors: string[] = [];
    const exported = new Set<string>();
    for (const m of src.matchAll(exportRe)) {
      if (exported.has(m[1])) errors.push(`duplicate export "${m[1]}"`);
      exported.add(m[1]);
    }
    const decls = new Set<string>();
    for (const m of src.matchAll(declRe)) decls.add(m[1]);
    for (const m of src.matchAll(importRe)) {
      const names = [m[1], ...(m[2] ? m[2].split(",") : [])]
        .filter(Boolean)
        .map((n) => n!.trim().split(/\s+as\s+/).pop()!.trim())
        .filter(Boolean);
      for (const n of names) {
        if (decls.has(n)) errors.push(`import "${n}" collides with a local declaration`);
      }
    }
    if (errors.length) {
      throw new Error(`[duplicate-identifier-guard] ${file}:\n  - ${errors.join("\n  - ")}`);
    }
  };
  return {
    name: "duplicate-identifier-guard",
    enforce: "pre",
    transform(code, id) {
      if (!/\.(?:t|j)sx?$/.test(id) || id.includes("node_modules")) return;
      if (!fs.existsSync(id.split("?")[0])) return;
      check(id, code);
    },
  };
}

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [duplicateIdentifierGuard(), mcpPlugin()],
    resolve: {
      alias: {
        "entities/lib/decode.js": path.resolve(__dirname, "node_modules/entities/lib/decode.js"),
        "entities/lib/encode.js": path.resolve(__dirname, "node_modules/entities/lib/encode.js"),
        entities: path.resolve(__dirname, "node_modules/entities"),
      },
    },
  },
});
