-- Make service-role write access to abuse_events explicit and auditable.
-- Writes already work today because supabaseAdmin bypasses RLS, but an
-- explicit policy documents intent and avoids silent blocks if anything
-- ever attempts to write under a non-service role.
CREATE POLICY "Service role manages abuse events"
ON public.abuse_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);