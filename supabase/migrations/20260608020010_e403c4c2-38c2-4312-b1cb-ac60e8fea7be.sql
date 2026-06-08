CREATE TABLE IF NOT EXISTS public.abuse_alert_state (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  last_alert_sent_at timestamptz,
  last_event_count integer NOT NULL DEFAULT 0,
  last_window_minutes integer NOT NULL DEFAULT 15,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.abuse_alert_state TO authenticated;
GRANT ALL ON public.abuse_alert_state TO service_role;

ALTER TABLE public.abuse_alert_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read abuse alert state"
  ON public.abuse_alert_state
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.abuse_alert_state (id) VALUES (true) ON CONFLICT (id) DO NOTHING;