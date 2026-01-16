-- Create subscription_history table
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_tier text NOT NULL, -- 'basic', 'pro', 'custom'
    change_type text NOT NULL, -- 'upgrade', 'downgrade', 'renewal', 'cancellation', 'manual_adjustment'
    amount decimal(10, 2), -- Can be null for free changes
    currency text DEFAULT 'INR',
    payment_method text, -- 'razorpay', 'manual', 'system'
    transaction_id text, -- e.g. pay_xxxxx
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for faster lookups by user
CREATE INDEX idx_subscription_history_user_id ON public.subscription_history(user_id);
CREATE INDEX idx_subscription_history_created_at ON public.subscription_history(created_at DESC);

-- RLS Policies (Admin read only, System insert)
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all history
CREATE POLICY "Admins can read all subscription history"
    ON public.subscription_history
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Allow users to read their own history (optional, for future User Billing page)
CREATE POLICY "Users can read own subscription history"
    ON public.subscription_history
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
