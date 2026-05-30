import * as React from 'react'
import { Button, Heading, Text } from '@react-email/components'
import { EmailShell, button, h1, muted, text } from './_shell'

interface RecoveryEmailProps {
  siteName?: string
  confirmationUrl?: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <EmailShell preview="Reset your FridgeCuisine password">
    <Heading as="h1" style={h1}>Reset your password</Heading>
    <Text style={text}>
      We got a request to reset the password on your FridgeCuisine account.
      Click below to choose a new one — the link expires in 1 hour.
    </Text>
    {confirmationUrl ? (
      <Button style={button} href={confirmationUrl}>
        Choose a new password
      </Button>
    ) : null}
    <Text style={muted}>
      Didn't ask for this? You can safely ignore this email — your password
      will stay exactly as it is.
    </Text>
  </EmailShell>
)

export default RecoveryEmail
