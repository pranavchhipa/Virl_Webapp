-- Migration: support_facebook_platform
-- Description: Update check constraints on all platform columns to include 'facebook'

-- 1. Update platform_configs check constraint
ALTER TABLE public.platform_configs 
DROP CONSTRAINT IF EXISTS platform_configs_platform_check;

ALTER TABLE public.platform_configs 
ADD CONSTRAINT platform_configs_platform_check 
CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'linkedin'));

-- 2. Update content_templates check constraint
ALTER TABLE public.content_templates 
DROP CONSTRAINT IF EXISTS content_templates_platform_check;

ALTER TABLE public.content_templates 
ADD CONSTRAINT content_templates_platform_check 
CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'linkedin'));

-- 3. Update calendar_stats check constraint
ALTER TABLE public.calendar_stats 
DROP CONSTRAINT IF EXISTS calendar_stats_platform_check;

ALTER TABLE public.calendar_stats 
ADD CONSTRAINT calendar_stats_platform_check 
CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'linkedin'));

-- Note: 'assets' table platform column is type text without a check constraint in the migration file, 
-- but if one was added manually or by another migration, it's safer to try to drop/add it.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'assets_platform_check'
    ) THEN
        ALTER TABLE public.assets DROP CONSTRAINT assets_platform_check;
        ALTER TABLE public.assets ADD CONSTRAINT assets_platform_check 
        CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'linkedin'));
    END IF;
END $$;
