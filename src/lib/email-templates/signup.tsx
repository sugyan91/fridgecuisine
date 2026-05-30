import * as React from 'react'
import { Button, Heading, Text } from '@react-email/components'
import {
  EmailShell,
  button,
  h1,
  muted,
  text,
} from './_shell'

interface SignupEmailProps {
  siteName?: string
  siteUrl?: string
  recipient?: string
  confirmationUrl?: string
}

export const SignupEmail = ({
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <EmailShell preview="Confirm your email and start cooking with FridgeCuisine">
    <Heading as="h1" style={h1}>Welcome to the kitchen 🍳</Heading>
    <Text style={text}>
      Thanks for joining FridgeCuisine — your AI personal chef. Tap the button
      below to confirm{recipient ? ' ' : ''}
      {recipient ? <strong>{recipient}</strong> : 'your email'} and we'll get
      started on your first recipe.
    </Text>
    {confirmationUrl ? (
      <Button style={button} href={confirmationUrl}>
        Confirm my email
      </Button>
    ) : null}
    <Text style={muted}>
      Didn't create an account? You can safely ignore this email — nothing will
      happen.
    </Text>
  </EmailShell>
)

export default SignupEmail
