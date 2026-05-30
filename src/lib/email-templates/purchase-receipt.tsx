import * as React from 'react'
import { Button, Heading, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import {
  EmailShell,
  brand,
  button,
  divider,
  h1,
  muted,
  text,
} from './_shell'

interface PurchaseReceiptProps {
  recipeTitle?: string
  chefName?: string
  amount?: string
  currency?: string
  orderId?: string
  recipeUrl?: string
}

const PurchaseReceiptEmail = ({
  recipeTitle = 'your recipe',
  chefName,
  amount = '0.00',
  currency = 'USD',
  orderId,
  recipeUrl = 'https://fridgecuisine.com/cookbook',
}: PurchaseReceiptProps) => (
  <EmailShell preview={`Receipt for ${recipeTitle}`}>
    <Heading as="h1" style={h1}>You're all set 🧾</Heading>
    <Text style={text}>
      Thanks for your purchase — <strong>{recipeTitle}</strong>
      {chefName ? <> by <strong>{chefName}</strong></> : null} is now in your
      cookbook, ready whenever you are.
    </Text>
    <Button style={button} href={recipeUrl}>
      Open the recipe
    </Button>
    <div style={divider} />
    <Text style={{ ...muted, color: brand.ink, fontSize: 14 }}>
      <strong>Order summary</strong>
    </Text>
    <Text style={muted}>
      Item: {recipeTitle}<br />
      Amount: {currency.toUpperCase()} {amount}
      {orderId ? <><br />Order ID: <code>{orderId}</code></> : null}
    </Text>
    <Text style={muted}>
      Questions about your order? Just reply to this email — we'll be in
      touch within one business day.
    </Text>
  </EmailShell>
)

export const template = {
  component: PurchaseReceiptEmail,
  subject: (data: Record<string, any>) =>
    `Your receipt for ${data?.recipeTitle ?? 'FridgeCuisine'}`,
  displayName: 'Purchase receipt',
  previewData: {
    recipeTitle: 'Miso-Glazed Black Cod',
    chefName: 'Chef Hana',
    amount: '4.99',
    currency: 'USD',
    orderId: 'ord_1234',
    recipeUrl: 'https://fridgecuisine.com/cookbook',
  },
} satisfies TemplateEntry