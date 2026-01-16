ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"workspace_invites": true, "new_assets": true, "mentions": true, "project_assignment": true}'::jsonb;
