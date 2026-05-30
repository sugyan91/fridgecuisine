import * as React from 'react'
import { Button, Heading, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { EmailShell, button, h1, muted, text } from './_shell'

interface RecipeSavedProps {
  recipeTitle?: string
  cuisine?: string
  cookbookUrl?: string
}

const RecipeSavedEmail = ({
  recipeTitle = 'your recipe',
  cuisine,
  cookbookUrl = 'https://fridgecuisine.com/cookbook',
}: RecipeSavedProps) => (
  <EmailShell preview={`${recipeTitle} is in your cookbook`}>
    <Heading as="h1" style={h1}>Saved to your cookbook 📒</Heading>
    <Text style={text}>
      <strong>{recipeTitle}</strong>
      {cuisine ? <> ({cuisine})</> : null} is waiting for you in your
      FridgeCuisine cookbook. Pull it up whenever you're ready to cook —
      ingredients, steps, and timings all in one place.
    </Text>
    <Button style={button} href={cookbookUrl}>
      Open my cookbook
    </Button>
    <Text style={muted}>
      Tip: tap the heart on any recipe to add it to your cookbook from the app.
    </Text>
  </EmailShell>
)

export const template = {
  component: RecipeSavedEmail,
  subject: (data: Record<string, any>) =>
    `Saved: ${data?.recipeTitle ?? 'your recipe'}`,
  displayName: 'Recipe saved',
  previewData: {
    recipeTitle: 'One-Pan Lemon Garlic Chicken',
    cuisine: 'Mediterranean',
    cookbookUrl: 'https://fridgecuisine.com/cookbook',
  },
} satisfies TemplateEntry