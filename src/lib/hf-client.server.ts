// Hugging Face Inference Router client (OpenAI-compatible chat completions),
// with automatic fallback to the Lovable AI gateway (Gemini).
// Server-only: never import from browser code.

const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Solid free-tier instruction model on HF Inference Providers.
const HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const LOVABLE_MODEL = "google/gemini-3-flash-preview";

export type ChatJSONResult =
  | { ok: true; json: unknown; provider: "huggingface" | "lovable" }
  | { ok: false; code: "rate_limit" | "credits" | "server" | "parse"; error: string };

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

async function callOpenAICompat(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMsg[],
  useResponseFormat: boolean,
): Promise<{ status: number; content: string; raw: string }> {
  const body: Record<string, unknown> = { model, messages, temperature: 0.7 };
  if (useResponseFormat) body.response_format = { type: "json_object" };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) return { status: res.status, content: "", raw };
  try {
    const payload = JSON.parse(raw) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return {
      status: res.status,
      content: payload.choices?.[0]?.message?.content ?? "",
      raw,
    };
  } catch {
    return { status: res.status, content: "", raw };
  }
}

function tryParseJSON(content: string): unknown | null {
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

/**
 * Calls Hugging Face first; on any failure (network, 4xx, 5xx, parse),
 * falls back to Lovable AI gateway. Both endpoints are OpenAI-compatible.
 */
export async function callChatJSON(
  systemPrompt: string,
  userPrompt: string,
): Promise<ChatJSONResult> {
  const messages: ChatMsg[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const hfKey = process.env.HUGGINGFACE_API_KEY;
  if (hfKey) {
    try {
      // HF router doesn't reliably honor response_format; rely on prompt + parse.
      const r = await callOpenAICompat(HF_URL, hfKey, HF_MODEL, messages, false);
      if (r.status === 200) {
        const parsed = tryParseJSON(r.content);
        if (parsed) return { ok: true, json: parsed, provider: "huggingface" };
        console.warn("[hf] returned unparseable JSON, falling back to Lovable");
      } else {
        console.warn(`[hf] ${r.status}, falling back to Lovable. Body: ${r.raw.slice(0, 200)}`);
      }
    } catch (err) {
      console.warn("[hf] threw, falling back to Lovable:", err);
    }
  } else {
    console.warn("[hf] HUGGINGFACE_API_KEY not set — using Lovable only");
  }

  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!lovableKey) {
    return { ok: false, code: "server", error: "AI service not configured." };
  }
  try {
    const r = await callOpenAICompat(LOVABLE_URL, lovableKey, LOVABLE_MODEL, messages, true);
    if (r.status === 429) return { ok: false, code: "rate_limit", error: "Too many requests — try again in a moment." };
    if (r.status === 402) return { ok: false, code: "credits", error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." };
    if (r.status !== 200) {
      console.error("[lovable]", r.status, r.raw.slice(0, 300));
      return { ok: false, code: "server", error: `AI service error (${r.status}).` };
    }
    const parsed = tryParseJSON(r.content);
    if (!parsed) return { ok: false, code: "parse", error: "AI returned invalid JSON." };
    return { ok: true, json: parsed, provider: "lovable" };
  } catch (err) {
    console.error("[lovable] threw:", err);
    return { ok: false, code: "server", error: "Something went wrong. Try again." };
  }
}
