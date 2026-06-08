// Real-time spike detection for anonymous abuse events.
//
// Trigger: any anon_* abuse event recorded via logAbuseEvent.
// Rule: if >= ALERT_THRESHOLD anon_* events occurred in the last
//       ALERT_WINDOW_MINUTES, and we haven't already alerted in the last
//       COOLDOWN_MINUTES, enqueue an admin email + record an alert-severity
//       abuse_event so the dashboard surfaces it too.
import * as React from 'react'
import { render } from '@react-email/components'
import { TEMPLATES } from '@/lib/email-templates/registry'

const ALERT_THRESHOLD = 10
const ALERT_WINDOW_MINUTES = 15
const COOLDOWN_MINUTES = 60

const SENDER_DOMAIN = 'notify.fridgecuisine.com'
const FROM_DOMAIN = 'fridgecuisine.com'
const DASHBOARD_URL = 'https://fridgecuisine.com/admin/abuse'

const ANON_EVENT_TYPES = ['anon_rapid_request', 'anon_ip_change', 'anon_quota_hit']

/**
 * Check for a spike in anonymous abuse signals and, if found, email the
 * configured admin address. Best-effort — never throws.
 */
export async function maybeFireAbuseSpikeAlert(): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL
    if (!adminEmail) {
      // Alerts not configured — stay silent.
      return
    }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const windowStart = new Date(Date.now() - ALERT_WINDOW_MINUTES * 60_000).toISOString()

    // 1. Count anon events in the window
    const { data: recent, error: countErr } = await supabaseAdmin
      .from('abuse_events')
      .select('event_type, fingerprint')
      .in('event_type', ANON_EVENT_TYPES)
      .gte('created_at', windowStart)
      .limit(500)

    if (countErr) {
      console.error('[abuse-alert] count query failed', countErr)
      return
    }

    const total = recent?.length ?? 0
    if (total < ALERT_THRESHOLD) return

    // 2. Atomically claim the cooldown slot — only one process sends the alert.
    // Cast to any: abuse_alert_state was just added and isn't in generated types yet.
    const cooldownCutoff = new Date(Date.now() - COOLDOWN_MINUTES * 60_000).toISOString()
    const { data: claimed, error: claimErr } = await (supabaseAdmin as any)
      .from('abuse_alert_state')
      .update({
        last_alert_sent_at: new Date().toISOString(),
        last_event_count: total,
        last_window_minutes: ALERT_WINDOW_MINUTES,
        updated_at: new Date().toISOString(),
      })
      .eq('id', true)
      .or(`last_alert_sent_at.is.null,last_alert_sent_at.lt.${cooldownCutoff}`)
      .select('id')

    if (claimErr) {
      console.error('[abuse-alert] cooldown claim failed', claimErr)
      return
    }
    if (!claimed || claimed.length === 0) {
      // Still in cooldown — another worker already alerted.
      return
    }

    // 3. Build breakdown + top fingerprints
    const breakdown: Record<string, number> = {}
    const fpCounts: Record<string, number> = {}
    for (const r of recent ?? []) {
      breakdown[r.event_type] = (breakdown[r.event_type] ?? 0) + 1
      if (r.fingerprint) fpCounts[r.fingerprint] = (fpCounts[r.fingerprint] ?? 0) + 1
    }
    const topFingerprints = Object.entries(fpCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([fingerprint, count]) => ({ fingerprint, count }))

    const templateData = {
      eventCount: total,
      windowMinutes: ALERT_WINDOW_MINUTES,
      threshold: ALERT_THRESHOLD,
      breakdown,
      topFingerprints,
      dashboardUrl: DASHBOARD_URL,
      detectedAt: new Date().toISOString(),
    }

    // 4. Render template + enqueue via pgmq (bypasses the user-auth send route).
    const entry = TEMPLATES['abuse-spike-alert']
    if (!entry) {
      console.error('[abuse-alert] template missing')
      return
    }
    const element = React.createElement(entry.component, templateData)
    const html = await render(element)
    const text = await render(element, { plainText: true })
    const subject =
      typeof entry.subject === 'function' ? entry.subject(templateData) : entry.subject

    const messageId = `abuse-spike-${Date.now()}`
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'abuse-spike-alert',
      recipient_email: adminEmail,
      status: 'pending',
    })

    const { error: enqueueErr } = await supabaseAdmin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: adminEmail,
        from: `FridgeCuisine Alerts <info@${FROM_DOMAIN}>`,
        reply_to: `info@${FROM_DOMAIN}`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: 'transactional',
        label: 'abuse-spike-alert',
        queued_at: new Date().toISOString(),
      },
    })

    if (enqueueErr) {
      console.error('[abuse-alert] enqueue failed', enqueueErr)
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'abuse-spike-alert',
        recipient_email: adminEmail,
        status: 'failed',
        error_message: 'enqueue_email failed',
      })
      return
    }

    // 5. Record an alert-severity abuse_event so the admin dashboard reflects it.
    await supabaseAdmin.from('abuse_events').insert({
      event_type: 'anon_rapid_request',
      severity: 'alert',
      metadata: {
        kind: 'spike_alert_fired',
        eventCount: total,
        windowMinutes: ALERT_WINDOW_MINUTES,
        threshold: ALERT_THRESHOLD,
        breakdown,
      } as never,
    })

    console.warn('[ABUSE:ALERT] spike email enqueued', {
      total,
      windowMinutes: ALERT_WINDOW_MINUTES,
      breakdown,
    })
  } catch (err) {
    console.error('[abuse-alert] unexpected failure', err)
  }
}