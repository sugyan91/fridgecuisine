import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Mail, Send, Loader2, RefreshCw } from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { SiteFooter } from '@/components/landing/SiteFooter'
import { getTurnstileSiteKey } from '@/lib/turnstile.functions'
import logoAsset from '@/assets/fridge-cuisine-logo.png.asset.json'

const REASONS = [
  { value: 'support', label: 'Help & support', inbox: 'support@fridgecuisine.com', blurb: "Bugs, account issues, can't log in, recipes broken." },
  { value: 'billing', label: 'Billing', inbox: 'main@fridgecuisine.com', blurb: 'Subscription, payments, refunds, invoices.' },
  { value: 'feedback', label: 'Feedback or ideas', inbox: 'main@fridgecuisine.com', blurb: 'Suggestions, partnerships, press, anything else.' },
] as const

type Reason = (typeof REASONS)[number]['value']

const Schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your full name')
    .max(100, 'Name must be under 100 characters')
    .regex(
      /^[a-zA-Z\s'-]{2,100}$/,
      'Name can only contain letters, spaces, hyphens, and apostrophes',
    ),
  email: z
    .string()
    .trim()
    .min(5, 'Email is required')
    .max(255, 'Email must be under 255 characters')
    .email('Please use a valid email'),
  reason: z.enum(['support', 'billing', 'feedback']),
  message: z
    .string()
    .trim()
    .min(20, 'Please write at least 20 characters')
    .max(4000, 'Message must be under 4000 characters')
    .regex(
      /^(?![\s\S]*<script|javascript:|on\w+=|data:text\/html)[\s\S]*$/i,
      'Message contains blocked content',
    ),
})

export const Route = createFileRoute('/contact')({
  loader: () => getTurnstileSiteKey(),
  head: () => ({
    meta: [
      { title: 'Contact — FridgeCuisine' },
      {
        name: 'description',
        content:
          "Reach the FridgeCuisine team for billing, support, or feedback. Real humans, fast replies.",
      },
      { property: 'og:title', content: 'Contact FridgeCuisine' },
      {
        property: 'og:description',
        content: 'Pick a topic and we route your message to the right person.',
      },
    ],
  }),
  component: ContactPage,
})

function ContactPage() {
  const { siteKey } = Route.useLoaderData()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState<Reason>('support')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaStatus, setCaptchaStatus] = useState<
    'ready' | 'expired' | 'error'
  >('ready')
  const mountTimeRef = useRef(Date.now())
  const widgetContainerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!siteKey) return
    const SCRIPT_ID = 'cf-turnstile-script'
    const renderWidget = () => {
      // @ts-expect-error global injected by Turnstile script
      const ts = window.turnstile
      if (!ts || !widgetContainerRef.current || widgetIdRef.current) return
      widgetIdRef.current = ts.render(widgetContainerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          setCaptchaToken(token)
          setCaptchaStatus('ready')
        },
        'expired-callback': () => {
          setCaptchaToken('')
          setCaptchaStatus('expired')
        },
        'error-callback': () => {
          setCaptchaToken('')
          setCaptchaStatus('error')
        },
        theme: 'auto',
      })
    }
    if (document.getElementById(SCRIPT_ID)) {
      renderWidget()
    } else {
      const s = document.createElement('script')
      s.id = SCRIPT_ID
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      s.async = true
      s.defer = true
      s.onload = renderWidget
      document.head.appendChild(s)
    }
    return () => {
      // @ts-expect-error global injected by Turnstile script
      const ts = window.turnstile
      if (ts && widgetIdRef.current) {
        try { ts.remove(widgetIdRef.current) } catch { /* noop */ }
        widgetIdRef.current = null
      }
    }
  }, [siteKey, done])

  const activeReason = REASONS.find((r) => r.value === reason)!

  const retryCaptcha = () => {
    // @ts-expect-error global injected by Turnstile script
    const ts = window.turnstile
    if (ts && widgetIdRef.current) {
      try {
        ts.reset(widgetIdRef.current)
      } catch {
        // Fallback: remove and re-render if reset fails
        try {
          ts.remove(widgetIdRef.current)
        } catch { /* noop */ }
        widgetIdRef.current = null
        if (widgetContainerRef.current) {
          widgetIdRef.current = ts.render(widgetContainerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              setCaptchaToken(token)
              setCaptchaStatus('ready')
            },
            'expired-callback': () => {
              setCaptchaToken('')
              setCaptchaStatus('expired')
            },
            'error-callback': () => {
              setCaptchaToken('')
              setCaptchaStatus('error')
            },
            theme: 'auto',
          })
        }
      }
    }
    setCaptchaStatus('ready')
    setCaptchaToken('')
  }


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const elapsed = Date.now() - mountTimeRef.current
    if (elapsed < 3000) {
      toast.error('Please take a moment to fill out the form before sending.')
      return
    }
    const parsed = Schema.safeParse({ name, email, reason, message })
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      toast.error(first?.message ?? 'Please check your entries.')
      return
    }
    if (siteKey && !captchaToken) {
      if (captchaStatus === 'expired') {
        toast.error(
          'Your security check expired. Please verify again before sending.',
        )
      } else if (captchaStatus === 'error') {
        toast.error(
          "We couldn't load the security check. Please refresh the page and try again.",
        )
      } else {
        toast.error('Please complete the security check before sending.')
      }
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsed.data,
          website,
          timestamp: mountTimeRef.current,
          captchaToken,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string
        }
        const friendly =
          data.error ?? "Couldn't send your message. Please try again."
        toast.error(friendly)
        // Reset CAPTCHA so user can retry
        // @ts-expect-error global injected by Turnstile script
        const ts = window.turnstile
        if (ts && widgetIdRef.current) ts.reset(widgetIdRef.current)
        setCaptchaToken('')
        setCaptchaStatus('ready')
        return
      }
      setDone(true)
      toast.success('Message sent! Check your inbox for confirmation.')
      setName('')
      setEmail('')
      setMessage('')
      setCaptchaToken('')
      setCaptchaStatus('ready')
    } catch {
      toast.error("Couldn't reach the kitchen. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Toaster />
      <main className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 md:px-8 py-4">
            <Link to="/" className="flex items-center gap-2.5 min-w-0">
              <img
                src={logoAsset.url}
                alt="Fridge Cuisine"
                className="h-8 md:h-9 w-auto rounded-lg bg-background"
              />
              <div className="min-w-0">
                <h1 className="font-display tracking-tight text-foreground leading-none text-lg md:text-xl lowercase whitespace-nowrap font-semibold">
                  fridge cuisine<span className="text-primary">.</span>
                </h1>
                <p className="hidden sm:block text-[10px] sm:text-xs text-foreground/60 leading-tight mt-0.5 font-bold">
                  Your own AI powered personal chef
                </p>
              </div>
            </Link>
            <Link
              to="/"
              className="text-sm font-medium text-foreground/80 hover:text-foreground px-3 py-2 rounded-full hover:bg-secondary transition-colors"
            >
              ← Back home
            </Link>
          </div>
        </header>

        <section className="max-w-3xl mx-auto px-4 md:px-8 pt-12 md:pt-16 pb-8">
          <p className="font-display text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3">
            Contact
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
            Talk to a real human.
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl">
            Pick a topic and we'll route your note to the right inbox. We reply
            within one business day — usually much sooner.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a
              href="mailto:support@fridgecuisine.com"
              className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <Mail size={14} /> support@fridgecuisine.com
            </a>
            <a
              href="mailto:main@fridgecuisine.com"
              className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <Mail size={14} /> main@fridgecuisine.com
            </a>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 md:px-8 pb-16">
          {done ? (
            <div className="rounded-2xl border border-border bg-card p-8 md:p-10 text-center">
              <div className="mx-auto inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 text-primary mb-4">
                <Send size={24} />
              </div>
              <h3 className="font-display text-2xl font-semibold text-foreground">
                Message sent
              </h3>
              <p className="mt-2 text-muted-foreground">
                We've routed your note and emailed you a confirmation. Reply to
                that email any time to add more context.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDone(false)
                    mountTimeRef.current = Date.now()
                  }}
                  className="px-4 py-2 rounded-full text-sm font-medium border border-border hover:bg-secondary transition-colors"
                >
                  Send another
                </button>
                <Link
                  to="/"
                  className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all"
                >
                  Back to cooking
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6"
            >
              {/* Reason picker */}
              <fieldset>
                <legend className="text-sm font-semibold text-foreground mb-3">
                  What's this about?
                </legend>
                <div className="grid sm:grid-cols-3 gap-2">
                  {REASONS.map((r) => {
                    const active = reason === r.value
                    return (
                      <button
                        type="button"
                        key={r.value}
                        onClick={() => setReason(r.value)}
                        className={`text-left rounded-xl border px-4 py-3 transition-all ${
                          active
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-foreground/30 hover:bg-secondary/50'
                        }`}
                        aria-pressed={active}
                      >
                        <div className="text-sm font-semibold text-foreground">
                          {r.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 leading-snug">
                          {r.blurb}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-foreground">
                    Your name
                  </span>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Jane Cook"
                    autoComplete="name"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-foreground">
                    Your email
                  </span>
                  <input
                    type="email"
                    required
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="jane@example.com"
                    autoComplete="email"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-foreground">
                  Message
                </span>
                <textarea
                  required
                  minLength={20}
                  maxLength={4000}
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                  placeholder="Tell us what's going on — the more detail the better."
                />
                <span className="mt-1 block text-xs text-muted-foreground text-right">
                  {message.length} / 4000
                </span>
              </label>

              {/* Honeypot — hidden from real users */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              {siteKey ? (
                <div className="space-y-2">
                  <div
                    ref={widgetContainerRef}
                    className="flex justify-center"
                  />
                  {captchaStatus === 'expired' && (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-center text-sm text-amber-600 dark:text-amber-400">
                        This check expired. Please verify again.
                      </p>
                      <button
                        type="button"
                        onClick={retryCaptcha}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <RefreshCw size={14} />
                        Try verification again
                      </button>
                    </div>
                  )}
                  {captchaStatus === 'error' && (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-center text-sm text-destructive">
                        Something went wrong loading the security check.
                      </p>
                      <button
                        type="button"
                        onClick={retryCaptcha}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <RefreshCw size={14} />
                        Try verification again
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-xs text-muted-foreground">
                  By sending you agree to be emailed back at the address above.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send message
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </section>

        <SiteFooter />
      </main>
    </>
  )
}