import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callImageGen } from "./hf-client.server";

const inputSchema = z.object({
  dishName: z.string().trim().min(2).max(200),
  cuisine: z.string().trim().max(80).optional(),
});

export type ReceipeImageResult =
  | { ok: true; dataUrl: string; provider: "huggingface" | "lovable" }
  | { ok: false; error: string };

export const generateReceipeImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<ReceipeImageResult> => {
    const cuisinePart = data.cuisine ? `, ${data.cuisine} cuisine` : "";
    const prompt = `Professional overhead food photography of ${data.dishName}${cuisinePart}. Natural lighting, shallow depth of field, rustic wooden table, garnished and plated beautifully, appetizing, high detail, vibrant colors, magazine quality.`;
    return callImageGen(prompt);
  });