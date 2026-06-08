import * as React from 'react'
import { Heading, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { EmailShell, h1, muted, text, brand } from './_shell'

interface AbuseSpikeAlertProps {
  eventCount?: number
  windowMinutes?: number
  threshold?: number
  breakdown?: Record<string, number>
  topFingerprints?: { fingerprint: string; count: number }[]
  dashboardUrl?: string
  detectedAt?: string
}

const AbuseSpikeAlertEmail = ({
  eventCount = 0,
  windowMinutes = 15,
  threshold = 10,
  breakdown = {},
  topFingerprints = [],
  dashboardUrl = 'https://fridgecuisine.com/admin/abuse',
  detectedAt,
}: AbuseSpikeAlertProps) => (
  <EmailShell preview={`Abuse spike: ${eventCount} events in ${windowMinutes} min`}>
    <Heading as="h1" style={h1}>
      Abuse spike detected
    </Heading>
    <Text style={text}>
      <strong style={{ color: brand.terracotta }}>{eventCount}</strong> abuse events
      were recorded in the last <strong>{windowMinutes} minutes</strong> — above the
      configured threshold of {threshold}.
    </Text>
    {detectedAt && (
      <Text style={muted}>Detected at {detectedAt} (UTC)</Text>
    )}

    {Object.keys(breakdown).length > 0 && (
      <Text style={{ ...text, backgroundColor: brand.cream, border: `1px solid ${brand.border}`, borderRadius: 10, padding: '14px 16px' }}>
        <strong>By signal type:</strong>
        <br />
        {Object.entries(breakdown).map(([k, v]) => (
          <React.Fragment key={k}>
            • {k}: {v}
            <br />
          </React.Fragment>
        ))}
      </Text>
    )}

    {topFingerprints.length > 0 && (
      <Text style={{ ...text, backgroundColor: brand.cream, border: `1px solid ${brand.border}`, borderRadius: 10, padding: '14px 16px' }}>
        <strong>Top fingerprints:</strong>
        <br />
        {topFingerprints.map((f) => (
          <React.Fragment key={f.fingerprint}>
            • {f.fingerprint.slice(0, 12)}… — {f.count} events
            <br />
          </React.Fragment>
        ))}
      </Text>
    )}

    <Text style={text}>
      Review the full activity in the{' '}
      <a href={dashboardUrl} style={{ color: brand.terracotta }}>
        abuse dashboard
      </a>
      .
    </Text>
    <Text style={muted}>
      You won't be re-notified about this spike for at least 1 hour.
    </Text>
  </EmailShell>
)

export const template = {
  component: AbuseSpikeAlertEmail,
  subject: (data: Record<string, any>) =>
    `[FridgeCuisine] Abuse spike: ${data?.eventCount ?? '?'} events in ${data?.windowMinutes ?? 15}m`,
  displayName: 'Abuse spike alert (internal)',
  previewData: {
    eventCount: 14,
    windowMinutes: 15,
    threshold: 10,
    breakdown: { anon_rapid_request: 9, anon_ip_change: 5 },
    topFingerprints: [
      { fingerprint: 'abc123def4567890', count: 7 },
      { fingerprint: 'ff00112233445566', count: 4 },
    ],
    dashboardUrl: 'https://fridgecuisine.com/admin/abuse',
    detectedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry