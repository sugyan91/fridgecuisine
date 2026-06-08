// Hugging Face Inference Router client (OpenAI-compatible chat completions),
// with automatic fallback to the Lovable AI gateway (Gemini).
// Server-only: never import from browser code.

const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const HF_IMAGE_URL = "https://router.huggingface.co/v1/images/generations";
const LOVABLE_IMAGE_URL = "https://ai.gateway.lovable.dev/v1/images/generations";

// HF Inference Providers models, tried in order. Stronger models first.
const HF_MODEL_CHAIN = [
  "Qwen/Qwen2.5-72B-Instruct",
  "meta-llama/Llama-3.3-70B-Instruct",
  "meta-llama/Llama-3.1-8B-Instruct",
];
const LOVABLE_MODEL = "google/gemini-3-flash-preview";

const HF_IMAGE_MODEL_CHAIN = [
  "black-forest-labs/FLUX.1-schnell",
  "stabilityai/stable-diffusion-xl-base-1.0",
];
const LOVABLE_IMAGE_MODEL = "google/gemini-2.5-flash-image";

export type ChatJSONResult =
  | { ok: true; json: unknown; provider: "huggingface" | "lovable" }
  | { ok: false; code: "rate_limit" | "credits" | "server" | "parse"; error: string };

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

type VisionContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };
type VisionMsg = { role: "system" | "user"; content: string | VisionContent[] };

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
    for (const model of HF_MODEL_CHAIN) {
      try {
        // HF router doesn't reliably honor response_format; rely on prompt + parse.
        const r = await callOpenAICompat(HF_URL, hfKey, model, messages, false);
        if (r.status === 200) {
          const parsed = tryParseJSON(r.content);
          if (parsed) {
            console.log(`[hf] success with ${model}`);
            return { ok: true, json: parsed, provider: "huggingface" };
          }
          console.warn(`[hf] ${model} returned unparseable JSON, trying next model`);
        } else {
          console.warn(`[hf] ${model} ${r.status}, trying next. Body: ${r.raw.slice(0, 200)}`);
        }
      } catch (err) {
        console.warn(`[hf] ${model} threw, trying next:`, err);
      }
    }
    console.warn("[hf] all HF models failed, falling back to Lovable");
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
    if (r.status === 402) {
      console.error("[lovable] 402 credits exhausted");
      return { ok: false, code: "credits", error: "Our kitchen is taking a quick break — please try again later." };
    }
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

/**
 * Vision call via Lovable AI gateway (Gemini multimodal). Image is a data: URL
 * (e.g. "data:image/jpeg;base64,..."). Returns parsed JSON or an error.
 */
export async function callVisionJSON(
  systemPrompt: string,
  userPrompt: string,
  imageDataUrl: string,
): Promise<ChatJSONResult> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!lovableKey) {
    return { ok: false, code: "server", error: "AI vision not configured." };
  }

  const messages: VisionMsg[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "text", text: userPrompt },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    },
  ];

  try {
    const res = await fetch(LOVABLE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LOVABLE_MODEL,
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });
    const raw = await res.text();
    if (res.status === 429) return { ok: false, code: "rate_limit", error: "Too many requests — try again in a moment." };
    if (res.status === 402) {
      console.error("[lovable vision] 402 credits exhausted");
      return { ok: false, code: "credits", error: "Our kitchen is taking a quick break — please try again later." };
    }
    if (!res.ok) {
      console.error("[lovable vision]", res.status, raw.slice(0, 300));
      return { ok: false, code: "server", error: `AI vision error (${res.status}).` };
    }
    const payload = JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content ?? "";
    const parsed = tryParseJSON(content);
    if (!parsed) return { ok: false, code: "parse", error: "AI returned invalid JSON." };
    return { ok: true, json: parsed, provider: "lovable" };
  } catch (err) {
    console.error("[lovable vision] threw:", err);
    return { ok: false, code: "server", error: "Vision request failed." };
  }
}

export type ImageGenResult =
  | { ok: true; dataUrl: string; provider: "huggingface" | "lovable" }
  | { ok: false; error: string };

async function callImageEndpoint(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<{ status: number; b64: string | null; raw: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) return { status: res.status, b64: null, raw };
  try {
    const payload = JSON.parse(raw) as {
      data?: Array<{ b64_json?: string; url?: string }>;
    };
    const b64 = payload.data?.[0]?.b64_json ?? null;
    return { status: res.status, b64, raw };
  } catch {
    return { status: res.status, b64: null, raw };
  }
}

/**
 * HF-first image generation with Lovable AI fallback. Returns a data URL.
 */
export async function callImageGen(prompt: string): Promise<ImageGenResult> {
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  if (hfKey) {
    for (const model of HF_IMAGE_MODEL_CHAIN) {
      try {
        const r = await callImageEndpoint(HF_IMAGE_URL, hfKey, {
          model,
          prompt,
          response_format: "b64_json",
        });
        if (r.status === 200 && r.b64) {
          console.log(`[hf-image] success with ${model}`);
          return {
            ok: true,
            dataUrl: `data:image/png;base64,${r.b64}`,
            provider: "huggingface",
          };
        }
        console.warn(`[hf-image] ${model} ${r.status}, trying next. Body: ${r.raw.slice(0, 200)}`);
      } catch (err) {
        console.warn(`[hf-image] ${model} threw, trying next:`, err);
      }
    }
    console.warn("[hf-image] all HF image models failed, falling back to Lovable");
  }

  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!lovableKey) {
    return { ok: false, error: "Image generation not configured." };
  }
  try {
    const r = await callImageEndpoint(LOVABLE_IMAGE_URL, lovableKey, {
      model: LOVABLE_IMAGE_MODEL,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    });
    if (r.status === 200 && r.b64) {
      return {
        ok: true,
        dataUrl: `data:image/png;base64,${r.b64}`,
        provider: "lovable",
      };
    }
    console.error("[lovable-image]", r.status, r.raw.slice(0, 300));
    return { ok: false, error: `Image generation failed (${r.status}).` };
  } catch (err) {
    console.error("[lovable-image] threw:", err);
    return { ok: false, error: "Image generation failed." };
  }
}

/**
 * Food-optimized image generation. Skips FLUX/SDXL (which hallucinate regional
 * dish names) and uses Lovable AI Gateway directly: Nano Banana 2 first, then
 * gpt-image-2 (low quality) as fallback. Both have strong world-cuisine
 * knowledge.
 */
export async function callFoodImageGen(prompt: string): Promise<ImageGenResult> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!lovableKey) {
    return { ok: false, error: "Image generation not configured." };
  }

  // 1. Gemini Nano Banana 2 — uses chat-completions image shape.
  try {
    const r = await callImageEndpoint(LOVABLE_IMAGE_URL, lovableKey, {
      model: "google/gemini-3.1-flash-image-preview",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    });
    if (r.status === 200 && r.b64) {
      return { ok: true, dataUrl: `data:image/png;base64,${r.b64}`, provider: "lovable" };
    }
    console.warn(`[food-image] gemini ${r.status}, falling back. Body: ${r.raw.slice(0, 200)}`);
  } catch (err) {
    console.warn("[food-image] gemini threw, falling back:", err);
  }

  // 2. gpt-image-2 fallback — uses OpenAI images shape.
  try {
    const r = await callImageEndpoint(LOVABLE_IMAGE_URL, lovableKey, {
      model: "openai/gpt-image-2",
      prompt,
      quality: "low",
      size: "1024x1024",
      n: 1,
    });
    if (r.status === 200 && r.b64) {
      return { ok: true, dataUrl: `data:image/png;base64,${r.b64}`, provider: "lovable" };
    }
    console.error("[food-image] gpt-image-2", r.status, r.raw.slice(0, 300));
    return { ok: false, error: `Image generation failed (${r.status}).` };
  } catch (err) {
    console.error("[food-image] gpt-image-2 threw:", err);
    return { ok: false, error: "Image generation failed." };
  }
}
