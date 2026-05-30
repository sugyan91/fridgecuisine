import * as React from 'react'
import { Button, Heading, Text } from '@react-email/components'
import { EmailShell, brand, button, h1, muted, text } from './_shell'

interface EmailChangeEmailProps {
  siteName?: string
  oldEmail?: string
  email?: string
  newEmail?: string
  confirmationUrl?: string
}

export const EmailChangeEmail = ({
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <EmailShell preview="Confirm your new email on FridgeCuisine">
    <Heading as="h1" style={h1}>Confirm your email change</Heading>
    <Text style={text}>
      You asked to change the email on your FridgeCuisine account
      {oldEmail ? <> from <strong>{oldEmail}</strong></> : null}
      {newEmail ? <> to <strong style={{ color: brand.terracotta }}>{newEmail}</strong></> : null}.
      Tap the button below to confirm.
    </Text>
    {confirmationUrl ? (
      <Button style={button} href={confirmationUrl}>
        Confirm email change
      </Button>
    ) : null}
    <Text style={muted}>
      Didn't request this? Please secure your account by resetting your
      password immediately.
    </Text>
  </EmailShell>
)

export default EmailChangeEmail
