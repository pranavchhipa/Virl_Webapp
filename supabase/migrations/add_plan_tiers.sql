-- Migration: Add SaaS Plan Features
-- Adds plan_tier column to workspaces and creates monthly_vixi_usage table for Spark limits

-- 1. Create the plan_tier enum type (if not exists)
DO $$ BEGIN
    CREATE TYPE plan_tier AS ENUM ('basic', 'pro', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add plan_tier column to workspaces table
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS plan_tier plan_tier NOT NULL DEFAULT 'basic';

-- 3. Add Razorpay customer ID for payment tracking
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS razorpay_customer_id text;

-- 4. Create the monthly_vixi_usage table for Vixi Sparks rate limiting
CREATE TABLE IF NOT EXISTS public.monthly_vixi_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    usage_month date NOT NULL, -- First day of the month (e.g., 2026-01-01)
    spark_count int NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT monthly_vixi_usage_workspace_month_key UNIQUE (workspace_id, usage_month)
);

-- 5. Add RLS Policies for monthly_vixi_usage
ALTER TABLE public.monthly_vixi_usage ENABLE ROW LEVEL SECURITY;

-- Allow workspace members to view their workspace's usage
CREATE POLICY "Members can view workspace vixi usage" 
ON public.monthly_vixi_usage 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_members.workspace_id = monthly_vixi_usage.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.workspaces
        WHERE workspaces.id = monthly_vixi_usage.workspace_id
        AND workspaces.owner_id = auth.uid()
    )
);

-- Allow insert/update for authenticated users (controlled by server actions)
CREATE POLICY "Authenticated users can manage vixi usage"
ON public.monthly_vixi_usage
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_monthly_vixi_usage_workspace_month 
ON public.monthly_vixi_usage(workspace_id, usage_month);

-- 7. Add file_size column to assets if not exists (for storage limit calculation)
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS file_size bigint DEFAULT 0;
