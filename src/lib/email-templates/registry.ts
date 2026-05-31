import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as welcomeTemplate } from './welcome'
import { template as purchaseReceiptTemplate } from './purchase-receipt'
import { template as recipeSavedTemplate } from './recipe-saved'
import { template as contactConfirmationTemplate } from './contact-confirmation'
import { template as contactNotificationTemplate } from './contact-notification'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome': welcomeTemplate,
  'purchase-receipt': purchaseReceiptTemplate,
  'recipe-saved': recipeSavedTemplate,
  'contact-confirmation': contactConfirmationTemplate,
  'contact-notification': contactNotificationTemplate,
}
