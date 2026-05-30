import { supabase } from '@/integrations/supabase/client'

export interface SendTransactionalEmailParams {
  templateName: string
  recipientEmail: string
  idempotencyKey?: string
  templateData?: Record<string, unknown>
}

/**
 * Send a transactional email via the FridgeCuisine email pipeline.
 * Requires an authenticated Supabase session (the route validates the JWT).
 * Fails silently in the console — never throw into trigger UX flows.
 */
export async function sendTransactionalEmail(
  params: SendTransactionalEmailParams,
): Promise<{ ok: boolean }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      console.warn('[email] no session — skipping send', params.templateName)
      return { ok: false }
    }
    const res = await fetch('/lovable/email/transactional/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[email] send failed', res.status, body)
      return { ok: false }
    }
    return { ok: true }
  } catch (err) {
    console.error('[email] send threw', err)
    return { ok: false }
  }
}