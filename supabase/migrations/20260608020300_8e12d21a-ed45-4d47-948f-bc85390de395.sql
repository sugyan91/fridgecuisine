-- abuse_alert_state: allow service role to manage cooldown state
CREATE POLICY "Service role manages abuse alert state"
  ON public.abuse_alert_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- anonymous_ai_usage: make admin/service intent explicit
ALTER TABLE public.anonymous_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read anonymous usage"
  ON public.anonymous_ai_usage
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages anonymous usage"
  ON public.anonymous_ai_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);