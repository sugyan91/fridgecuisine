import { createServerFn } from '@tanstack/react-start'

export const getTurnstileSiteKey = createServerFn({ method: 'GET' }).handler(
  async () => {
    return { siteKey: process.env.TURNSTILE_SITE_KEY ?? '' }
  },
)