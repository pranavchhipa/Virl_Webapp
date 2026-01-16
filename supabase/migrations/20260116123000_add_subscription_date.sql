-- Add subscription_end_date to workspaces table

ALTER TABLE public.workspaces 
ADD COLUMN subscription_end_date TIMESTAMPTZ;

-- Optional: Add an index if we plan to query expiring subscriptions often
CREATE INDEX idx_workspaces_subscription_end_date ON public.workspaces(subscription_end_date);
