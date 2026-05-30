import * as React from 'react'
import { Button, Heading, Text } from '@react-email/components'
import { EmailShell, button, h1, muted, text } from './_shell'

interface InviteEmailProps {
  siteName?: string
  siteUrl?: string
  confirmationUrl?: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <EmailShell preview="You've been invited to FridgeCuisine">
    <Heading as="h1" style={h1}>You're invited 🍴</Heading>
    <Text style={text}>
      You've been invited to join FridgeCuisine — turn whatever's in your
      fridge into restaurant-grade meals. Tap below to set up your account.
    </Text>
    {confirmationUrl ? (
      <Button style={button} href={confirmationUrl}>
        Accept invitation
      </Button>
    ) : null}
    <Text style={muted}>
      Not expecting this? You can safely ignore the email.
    </Text>
  </EmailShell>
)

export default InviteEmail
