import * as React from 'react'
import { Heading, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { EmailShell, h1, muted, text } from './_shell'

interface ContactNotificationProps {
  name?: string
  email?: string
  reason?: string
  message?: string
  submissionId?: string
}

const REASON_LABELS: Record<string, string> = {
  billing: 'Billing',
  support: 'Support',
  feedback: 'Feedback',
}

const ContactNotificationEmail = ({
  name,
  email,
  reason,
  message,
  submissionId,
}: ContactNotificationProps) => {
  const reasonLabel = reason ? REASON_LABELS[reason] ?? reason : 'General'
  return (
    <EmailShell preview={`New ${reasonLabel.toLowerCase()} message from ${name ?? 'a visitor'}`}>
      <Heading as="h1" style={h1}>
        New {reasonLabel.toLowerCase()} message
      </Heading>
      <Text style={muted}>
        <strong style={{ color: '#1A1A1A' }}>From:</strong> {name ?? '—'}
        {email ? ` <${email}>` : ''}
        <br />
        <strong style={{ color: '#1A1A1A' }}>Topic:</strong> {reasonLabel}
        {submissionId && (
          <>
            <br />
            <strong style={{ color: '#1A1A1A' }}>Ref:</strong> {submissionId}
          </>
        )}
      </Text>
      <Text
        style={{
          ...text,
          backgroundColor: '#F5F3EE',
          border: '1px solid #E7E5E4',
          borderRadius: 10,
          padding: '16px 18px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {message ?? '(no message)'}
      </Text>
      <Text style={muted}>
        Hit reply to respond — the user's address is set as the reply-to.
      </Text>
    </EmailShell>
  )
}

export const template = {
  component: ContactNotificationEmail,
  subject: (data: Record<string, any>) => {
    const reason = (data?.reason as string) || 'general'
    const label = REASON_LABELS[reason] ?? 'General'
    const name = (data?.name as string) || 'visitor'
    return `[${label}] New message from ${name}`
  },
  displayName: 'Contact notification (internal)',
  previewData: {
    name: 'Jane Cook',
    email: 'jane@example.com',
    reason: 'support',
    message: 'My saved recipes disappeared after I signed in.',
    submissionId: 'demo-1234',
  },
} satisfies TemplateEntry