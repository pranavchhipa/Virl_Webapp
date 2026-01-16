-- Fix RLS policy for client_feedback to allow anonymous inserts
-- The policy needs to allow inserts from API route (using service role or anon key)

-- Drop existing insert policy
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.client_feedback;

-- Create new insert policy that allows all inserts (public feedback)
CREATE POLICY "Public can submit feedback"
  ON public.client_feedback FOR INSERT
  WITH CHECK (true);

-- Also ensure anon can select for the response
DROP POLICY IF EXISTS "Public can view feedback" ON public.client_feedback;

CREATE POLICY "Public can view feedback"
  ON public.client_feedback FOR SELECT
  USING (true);
