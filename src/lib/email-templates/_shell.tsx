import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

// FridgeCuisine brand tokens (hex equivalents of the app's oklch palette)
export const brand = {
  ink: '#1A1A1A',
  paper: '#FDFCFB',
  cream: '#F5F3EE',
  border: '#E7E5E4',
  terracotta: '#BC4749',
  muted: '#78716C',
  gold: '#C9A24B',
}

export const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily: '"Inter", -apple-system, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: '32px 0',
  color: brand.ink,
}

export const container: React.CSSProperties = {
  margin: '0 auto',
  maxWidth: '560px',
  padding: '0 24px',
}

export const card: React.CSSProperties = {
  border: `1px solid ${brand.border}`,
  borderRadius: '16px',
  backgroundColor: '#ffffff',
  overflow: 'hidden',
}

export const headerSection: React.CSSProperties = {
  backgroundColor: brand.cream,
  padding: '28px 32px 22px',
  borderBottom: `1px solid ${brand.border}`,
}

export const wordmark: React.CSSProperties = {
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '22px',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: brand.ink,
  margin: 0,
}

export const wordmarkAccent: React.CSSProperties = {
  color: brand.terracotta,
  fontStyle: 'italic',
}

export const tagline: React.CSSProperties = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: brand.muted,
  margin: '6px 0 0',
}

export const bodySection: React.CSSProperties = {
  padding: '32px 32px 28px',
}

export const h1: React.CSSProperties = {
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '26px',
  fontWeight: 600,
  lineHeight: 1.2,
  color: brand.ink,
  margin: '0 0 16px',
  letterSpacing: '-0.01em',
}

export const text: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.6,
  color: brand.ink,
  margin: '0 0 16px',
}

export const muted: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: 1.6,
  color: brand.muted,
  margin: '0 0 12px',
}

export const button: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: brand.terracotta,
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '0.02em',
  borderRadius: '999px',
  padding: '14px 28px',
  textDecoration: 'none',
  margin: '8px 0 20px',
}

export const tokenBox: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: brand.cream,
  border: `1px solid ${brand.border}`,
  borderRadius: '10px',
  padding: '14px 22px',
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  fontSize: '22px',
  fontWeight: 600,
  letterSpacing: '0.18em',
  color: brand.ink,
  margin: '4px 0 20px',
}

export const divider: React.CSSProperties = {
  borderTop: `1px solid ${brand.border}`,
  margin: '24px 0 18px',
}

export const footerSection: React.CSSProperties = {
  padding: '20px 32px 24px',
  backgroundColor: brand.cream,
  borderTop: `1px solid ${brand.border}`,
}

export const footerText: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: 1.6,
  color: brand.muted,
  margin: 0,
}

interface ShellProps {
  preview: string
  children: React.ReactNode
}

export const EmailShell = ({ preview, children }: ShellProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={card}>
          <Section style={headerSection}>
            <Heading as="h2" style={wordmark}>
              Fridge<span style={wordmarkAccent}>Cuisine</span>
            </Heading>
            <Text style={tagline}>Your AI powered personal Chef</Text>
          </Section>
          <Section style={bodySection}>{children}</Section>
          <Section style={footerSection}>
            <Text style={footerText}>
              Sent by FridgeCuisine · Replies go to info@fridgecuisine.com
            </Text>
          </Section>
        </div>
      </Container>
    </Body>
  </Html>
)