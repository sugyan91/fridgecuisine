import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { z } from 'zod'

export const getTurnstileSiteKey = createServerFn({ method: 'GET' }).handler(
  async () => {
    return { siteKey: process.env.TURNSTILE_SITE_KEY ?? '' }
  },
)

export const verifyTurnstileToken = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ token: z.string().min(1).max(2048) }).parse(input),
  )
  .handler(async ({ data }) => {
    const secret = process.env.TURNSTILE_SECRET_KEY
    if (!secret) {
      // No secret configured — treat as pass-through so dev still works.
      return { success: true as const }
    }
    const ip =
      getRequestHeader('cf-connecting-ip') ??
      getRequestHeader('x-forwarded-for')?.split(',')[0].trim() ??
      ''
    const form = new URLSearchParams()
    form.append('secret', secret)
    form.append('response', data.token)
    if (ip) form.append('remoteip', ip)
    try {
      const res = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        { method: 'POST', body: form },
      )
      const json = (await res.json()) as {
        success: boolean
        ['error-codes']?: string[]
      }
      if (!json.success) {
        return {
          success: false as const,
          error: "We couldn't confirm you're human. Please try the security check again.",
        }
      }
      return { success: true as const }
    } catch {
      return {
        success: false as const,
        error: "We're having trouble verifying the security check. Please try again in a moment.",
      }
    }
  })