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