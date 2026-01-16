-- Fix: Calendar Stats RLS Error
-- Description: The 'update_calendar_stats' trigger fails because RLS policies on 'calendar_stats' might strict.
-- Since triggers run with the permissions of the user, and 'calendar_stats' creation/update happens automatically,
-- we should either Update the RLS to allow it OR make the function SECURITY DEFINER to bypass RLS.

-- Approach: Make the trigger function SECURITY DEFINER so it runs as the table owner (system), bypassing RLS checks.
-- This is safer for auto-updating stats.

CREATE OR REPLACE FUNCTION update_calendar_stats()
RETURNS TRIGGER
SECURITY DEFINER -- Run as owner to bypass RLS on the stats table
AS $$
BEGIN
  -- Update stats when asset is scheduled/published
  INSERT INTO public.calendar_stats (
    project_id, 
    stat_date, 
    platform, 
    posts_scheduled, 
    posts_published
  )
  VALUES (
    NEW.project_id,
    NEW.scheduled_date,
    NEW.platform,
    1,
    CASE WHEN NEW.posted_at IS NOT NULL THEN 1 ELSE 0 END
  )
  ON CONFLICT (project_id, stat_date, platform)
  DO UPDATE SET
    posts_scheduled = calendar_stats.posts_scheduled + 1,
    posts_published = CASE WHEN NEW.posted_at IS NOT NULL 
      then calendar_stats.posts_published + 1 
      else calendar_stats.posts_published 
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
