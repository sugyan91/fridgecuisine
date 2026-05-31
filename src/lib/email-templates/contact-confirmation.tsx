import * as React from 'react'
import { Heading, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { EmailShell, h1, muted, text } from './_shell'

interface ContactConfirmationProps {
  name?: string
  reason?: string
  message?: string
}

const REASON_LABELS: Record<string, string> = {
  billing: 'Billing',
  support: 'Support',
  feedback: 'Feedback',
}

const ContactConfirmationEmail = ({
  name,
  reason,
  message,
}: ContactConfirmationProps) => {
  const reasonLabel = reason ? REASON_LABELS[reason] ?? reason : null
  return (
    <EmailShell preview="We got your message — thanks for reaching out">
      <Heading as="h1" style={h1}>
        {name ? `Thanks, ${name} 👋` : 'Thanks for reaching out 👋'}
      </Heading>
      <Text style={text}>
        We've received your message and a real human will reply within one
        business day. If your note is urgent, just reply to this email — it
        goes straight to our team.
      </Text>
      {reasonLabel && (
        <Text style={muted}>
          <strong style={{ color: '#1A1A1A' }}>Topic:</strong> {reasonLabel}
        </Text>
      )}
      {message && (
        <Text
          style={{
            ...muted,
            backgroundColor: '#F5F3EE',
            border: '1px solid #E7E5E4',
            borderRadius: 10,
            padding: '14px 16px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {message}
        </Text>
      )}
      <Text style={muted}>
        — The FridgeCuisine team 🍅
      </Text>
    </EmailShell>
  )
}

export const template = {
  component: ContactConfirmationEmail,
  subject: "We got your message — FridgeCuisine",
  displayName: 'Contact confirmation',
  previewData: {
    name: 'Jane',
    reason: 'support',
    message: 'Hi! I can\'t find my saved recipes after logging in.',
  },
} satisfies TemplateEntry