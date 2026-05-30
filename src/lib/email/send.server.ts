import * as React from 'react'
import { render } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'FridgeCuisine'
const SENDER_DOMAIN = 'notify.fridgecuisine.com'
const FROM_DOMAIN = 'fridgecuisine.com'
const FROM_LOCAL = 'info'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface ServerSendParams {
  templateName: string
  recipientEmail: string
  idempotencyKey?: string
  templateData?: Record<string, unknown>
}

/**
 * Server-side transactional email send. Use from server functions, server
 * routes (webhooks), and any non-user-initiated trigger. Mirrors the public
 * /lovable/email/transactional/send route but skips the user-JWT check.
 * Never throws — failures are logged so callers can ignore the result.
 */
export async function sendTransactionalEmailServer(
  params: ServerSendParams,
): Promise<{ ok: boolean; reason?: string }> {
  const { templateName, recipientEmail, idempotencyKey, templateData = {} } = params
  try {
    const template = TEMPLATES[templateName]
    if (!template) {
      console.error('[email.server] template not found', templateName)
      return { ok: false, reason: 'template_not_found' }
    }
    const effectiveRecipient = template.to || recipientEmail
    if (!effectiveRecipient) return { ok: false, reason: 'no_recipient' }
    const normalizedEmail = effectiveRecipient.toLowerCase()
    const messageId = crypto.randomUUID()

    // Suppression check
    const { data: suppressed } = await supabaseAdmin
      .from('suppressed_emails')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()
    if (suppressed) {
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: 'suppressed',
      })
      return { ok: false, reason: 'suppressed' }
    }

    // Get/create unsubscribe token
    let unsubscribeToken: string
    const { data: existing } = await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .select('token, used_at')
      .eq('email', normalizedEmail)
      .maybeSingle()
    if (existing && !existing.used_at) {
      unsubscribeToken = existing.token
    } else if (!existing) {
      unsubscribeToken = generateToken()
      await supabaseAdmin
        .from('email_unsubscribe_tokens')
        .upsert(
          { token: unsubscribeToken, email: normalizedEmail },
          { onConflict: 'email', ignoreDuplicates: true },
        )
      const { data: stored } = await supabaseAdmin
        .from('email_unsubscribe_tokens')
        .select('token')
        .eq('email', normalizedEmail)
        .maybeSingle()
      if (stored?.token) unsubscribeToken = stored.token
    } else {
      return { ok: false, reason: 'suppressed' }
    }

    // Render
    const element = React.createElement(template.component, templateData)
    const html = await render(element)
    const text = await render(element, { plainText: true })
    const subject =
      typeof template.subject === 'function'
        ? template.subject(templateData)
        : template.subject

    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'pending',
    })

    const { error: enqueueError } = await supabaseAdmin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: effectiveRecipient,
        from: `${SITE_NAME} <${FROM_LOCAL}@${FROM_DOMAIN}>`,
        reply_to: `${FROM_LOCAL}@${FROM_DOMAIN}`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: 'transactional',
        label: templateName,
        idempotency_key: idempotencyKey || messageId,
        unsubscribe_token: unsubscribeToken!,
        queued_at: new Date().toISOString(),
      },
    })
    if (enqueueError) {
      console.error('[email.server] enqueue failed', enqueueError)
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: 'failed',
        error_message: 'Failed to enqueue email',
      })
      return { ok: false, reason: 'enqueue_failed' }
    }
    return { ok: true }
  } catch (err) {
    console.error('[email.server] threw', err)
    return { ok: false, reason: 'exception' }
  }
}