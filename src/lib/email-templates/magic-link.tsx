import * as React from 'react'
import { Button, Heading, Text } from '@react-email/components'
import { EmailShell, button, h1, muted, text } from './_shell'

interface MagicLinkEmailProps {
  siteName?: string
  confirmationUrl?: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <EmailShell preview="Your one-click sign-in link for FridgeCuisine">
    <Heading as="h1" style={h1}>Your sign-in link</Heading>
    <Text style={text}>
      Tap the button below to jump straight into FridgeCuisine. The link is
      single-use and expires shortly — no password required.
    </Text>
    {confirmationUrl ? (
      <Button style={button} href={confirmationUrl}>
        Sign me in
      </Button>
    ) : null}
    <Text style={muted}>
      Didn't ask for this link? You can safely ignore this email.
    </Text>
  </EmailShell>
)

export default MagicLinkEmail
