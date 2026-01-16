-- App Settings table for storing app-wide configuration
-- This includes maintenance mode, feature flags, etc.

CREATE TABLE IF NOT EXISTS public.app_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (needed for middleware to check)
CREATE POLICY "Anyone can read app_settings"
  ON public.app_settings FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only service role can update (via server actions)
-- No insert/update/delete policies for regular users

-- Insert default maintenance mode setting (disabled by default)
INSERT INTO public.app_settings (key, value) 
VALUES ('maintenance_mode', '{"enabled": false, "message": "We are currently performing scheduled maintenance. Please check back soon!"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
