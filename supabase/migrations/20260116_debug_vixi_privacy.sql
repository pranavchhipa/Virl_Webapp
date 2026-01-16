-- DEBUG: Check if the policy exists and what user_ids are in the messages
-- Run these queries to diagnose the issue

-- 1. Check what policies exist on vixi_messages
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'vixi_messages';

-- 2. Check the user_id of existing messages
SELECT id, project_id, user_id, role, LEFT(content, 50) as content_preview, created_at
FROM vixi_messages
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check current authenticated user
SELECT auth.uid();

-- If the policy exists but messages still show, the issue is likely:
-- - Frontend cache (need hard refresh)
-- - Messages were created with the same user_id as current user
