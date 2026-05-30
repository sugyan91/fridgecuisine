import * as React from 'react'
import { Heading, Text } from '@react-email/components'
import { EmailShell, h1, muted, text, tokenBox } from './_shell'

interface ReauthenticationEmailProps {
  token?: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EmailShell preview="Your FridgeCuisine verification code">
    <Heading as="h1" style={h1}>Verify it's you</Heading>
    <Text style={text}>
      Use the code below to confirm your identity on FridgeCuisine:
    </Text>
    <Text style={tokenBox}>{token || '••••••'}</Text>
    <Text style={muted}>
      The code expires in 10 minutes. Didn't ask for this? Ignore this email.
    </Text>
  </EmailShell>
)

export default ReauthenticationEmail
