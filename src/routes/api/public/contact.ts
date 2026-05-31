import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { sendTransactionalEmailServer } from '@/lib/email/send.server'

const ReasonSchema = z.enum(['billing', 'support', 'feedback'])

const ContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name is required')
    .max(100)
    .regex(
      /^[a-zA-Z\s'-]{2,100}$/,
      'Name contains invalid characters',
    ),
  email: z.string().trim().min(5).max(255).email('Invalid email'),
  reason: ReasonSchema,
  message: z
    .string()
    .trim()
    .min(20, 'Message too short')
    .max(4000)
    .regex(
      /^(?![\s\S]*<script|javascript:|on\w+=|data:text\/html)[\s\S]*$/i,
      'Message contains blocked content',
    ),
  // honeypot — must be empty
  website: z.string().max(0).optional(),
  // page-load timestamp — must be at least 3 seconds old and not stale
  timestamp: z.number().int().min(1),
  // Cloudflare Turnstile token
  captchaToken: z.string().min(1).max(2048).optional(),
})

const INBOX_BY_REASON: Record<z.infer<typeof ReasonSchema>, string> = {
  billing: 'main@fridgecuisine.com',
  support: 'support@fridgecuisine.com',
  feedback: 'main@fridgecuisine.com',
}

export const Route = createFileRoute('/api/public/contact')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed
        try {
          const json = await request.json()
          parsed = ContactSchema.safeParse(json)
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }
        if (!parsed.success) {
          return Response.json(
            { error: 'Validation failed', issues: parsed.error.flatten() },
            { status: 400 },
          )
        }
        // Minimum time-to-submit check (3 seconds)
        const elapsed = Date.now() - parsed.data.timestamp
        if (elapsed < 3000) {
          return Response.json(
            { error: 'Submission too fast. Please wait a moment before sending.' },
            { status: 400 },
          )
        }
        if (elapsed > 3600000) {
          return Response.json(
            { error: 'Session expired. Please refresh the page and try again.' },
            { status: 400 },
          )
        }

        // Verify Cloudflare Turnstile CAPTCHA
        const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
        if (turnstileSecret) {
          if (!parsed.data.captchaToken) {
            return Response.json(
              { error: 'CAPTCHA verification required.' },
              { status: 400 },
            )
          }
          const ip =
            request.headers.get('cf-connecting-ip') ??
            request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
            ''
          const form = new URLSearchParams()
          form.append('secret', turnstileSecret)
          form.append('response', parsed.data.captchaToken)
          if (ip) form.append('remoteip', ip)
          try {
            const verifyRes = await fetch(
              'https://challenges.cloudflare.com/turnstile/v0/siteverify',
              { method: 'POST', body: form },
            )
            const verifyJson = (await verifyRes.json()) as { success: boolean }
            if (!verifyJson.success) {
              return Response.json(
                { error: 'CAPTCHA verification failed. Please try again.' },
                { status: 400 },
              )
            }
          } catch {
            return Response.json(
              { error: 'Could not verify CAPTCHA. Please try again.' },
              { status: 500 },
            )
          }
        }

        // Honeypot tripped — pretend success.
        if (parsed.data.website) {
          return Response.json({ ok: true })
        }

        const { name, email, reason, message } = parsed.data
        const submissionId = crypto.randomUUID()
        const inbox = INBOX_BY_REASON[reason]

        // 1. Notify staff inbox (cannot await suppression block — fire both)
        await sendTransactionalEmailServer({
          templateName: 'contact-notification',
          recipientEmail: inbox,
          idempotencyKey: `contact-notify-${submissionId}`,
          templateData: { name, email, reason, message, submissionId },
        })

        // 2. Confirmation to the submitter
        await sendTransactionalEmailServer({
          templateName: 'contact-confirmation',
          recipientEmail: email,
          idempotencyKey: `contact-confirm-${submissionId}`,
          templateData: { name, reason, message },
        })

        return Response.json({ ok: true, submissionId })
      },
    },
  },
})