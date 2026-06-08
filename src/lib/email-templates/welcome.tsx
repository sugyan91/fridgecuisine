import * as React from 'react'
import { Button, Heading, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { EmailShell, button, h1, muted, text } from './_shell'

interface WelcomeEmailProps {
  firstName?: string
}

const WelcomeEmail = ({ firstName }: WelcomeEmailProps) => (
  <EmailShell preview="Welcome to FridgeCuisine — let's cook something tonight">
    <Heading as="h1" style={h1}>
      {firstName ? `Welcome, ${firstName} 🍳` : 'Welcome to FridgeCuisine 🍳'}
    </Heading>
    <Text style={text}>
      You just unlocked your AI powered personal Chef. Snap a photo of your fridge —
      or type a few ingredients — and we'll turn them into real, step-by-step
      recipes in seconds. Any cuisine, any diet, any skill level.
    </Text>
    <Text style={text}>
      A few favourites to try first:
    </Text>
    <Text style={text}>
      🥘 <strong>"chicken, lemon, garlic"</strong> → 20-minute Italian dinner<br />
      🌶️ <strong>"tofu, rice, soy sauce"</strong> → Korean-inspired bowl<br />
      🥑 <strong>"avocado, eggs, sourdough"</strong> → café-style brunch
    </Text>
    <Button style={button} href="https://fridgecuisine.com/">
      Cook something now
    </Button>
    <Text style={muted}>
      Save recipes to your cookbook, share them with friends, and discover
      premium recipes from world-class chefs. Happy cooking 🍅
    </Text>
  </EmailShell>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to FridgeCuisine 🍳',
  displayName: 'Welcome',
  previewData: { firstName: 'Alex' },
} satisfies TemplateEntry