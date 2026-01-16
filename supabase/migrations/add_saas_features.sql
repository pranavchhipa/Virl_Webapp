-- Create the plan_tier enum type
CREATE TYPE plan_tier AS ENUM ('basic', 'pro', 'custom');

-- Add SaaS columns to workspaces table
ALTER TABLE public.workspaces 
ADD COLUMN plan_tier plan_tier NOT NULL DEFAULT 'basic',
ADD COLUMN custom_logo_url text, -- For White-labeling
ADD COLUMN stripe_customer_id text, -- For future scalability (optional)
ADD COLUMN razorpay_customer_id text; -- For Razorpay

-- Create the daily_ai_usage table for rate limiting
CREATE TABLE public.daily_ai_usage (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL_REFERENCES public.workspaces(id) ON DELETE CASCADE,
    usage_date date NOT NULL DEFAULT CURRENT_DATE,
    post_generation_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    CONSTRAINT daily_ai_usage_pkey PRIMARY KEY (id),
    CONSTRAINT daily_ai_usage_workspace_date_key UNIQUE (workspace_id, usage_date)
);

-- Add RLS Policies for daily_ai_usage
ALTER TABLE public.daily_ai_usage ENABLE ROW LEVEL SECURITY;

-- Allow members to view their workspace's usage
CREATE POLICY "Members can view workspace usage" 
ON public.daily_ai_usage 
FOR SELECT 
USING (
    exists (
        select 1 from public.workspace_members
        where workspace_members.workspace_id = daily_ai_usage.workspace_id
        and workspace_members.user_id = auth.uid()
    )
);

-- Allow system/server actions to update usage (User triggers it via API, handled by Service Key usually, 
-- but for client-side safety we limit updates. Ideally usage increment happens via RPC or Edge Function.
-- For now, we will assume Server Actions usage with Service Role, so policies are for frontend read.)
