import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { sendTransactionalEmailServer } from '@/lib/email/send.server'

/**
 * Send the welcome email exactly once per user. Safe to call on every
 * sign-in — the email_send_log uniqueness check prevents duplicates.
 */
export const sendWelcomeEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context

    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (!user?.email) return { ok: false, reason: 'no_email' }

    // Check by recipient email — one welcome per address ever.
    const { data: priorByEmail } = await supabaseAdmin
      .from('email_send_log')
      .select('id')
      .eq('template_name', 'welcome')
      .eq('recipient_email', user.email)
      .limit(1)
      .maybeSingle()
    if (priorByEmail) return { ok: false, reason: 'already_sent' }

    // Pull first name from profile if available
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .maybeSingle()
    const firstName = profile?.display_name
      ? String(profile.display_name).split(' ')[0]
      : undefined

    return sendTransactionalEmailServer({
      templateName: 'welcome',
      recipientEmail: user.email,
      idempotencyKey: `welcome-${userId}`,
      templateData: { firstName },
    })
  })