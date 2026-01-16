--  Fix Missing Project Creators in project_members Table
-- Run this in Supabase SQL Editor

-- Add project creators as managers to their projects if not already there
INSERT INTO project_members (project_id, user_id, role, joined_at)
SELECT 
    p.id as project_id,
    wm.user_id,
    'manager' as role,
    p.created_at as joined_at
FROM projects p
JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
WHERE wm.role = 'owner'
AND NOT EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = p.id AND pm.user_id = wm.user_id
)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Verify: Check if creators are now in project_members
SELECT 
    p.name as project_name,
    pm.role,
    profiles.email
FROM projects p
LEFT JOIN project_members pm ON pm.project_id = p.id
LEFT JOIN profiles ON profiles.id = pm.user_id
ORDER BY p.name, pm.role;
