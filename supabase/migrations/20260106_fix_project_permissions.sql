-- FINAL FIX: Project Status Update Permission
-- Run ONLY this in Supabase SQL Editor

-- Step 1: Check current project members and their roles (debug)
-- SELECT pm.user_id, pm.role, pm.project_id, p.name, p.created_by
-- FROM project_members pm
-- JOIN projects p ON p.id = pm.project_id
-- WHERE pm.user_id = auth.uid();

-- Step 2: Drop the old policy completely
DROP POLICY IF EXISTS "Users can update their projects" ON projects;

-- Step 3: Create new UPDATE policy with correct lowercase roles
-- Project roles are: 'manager', 'editor', 'contributor', 'viewer'
CREATE POLICY "Users can update their projects"
ON projects FOR UPDATE
TO authenticated
USING (
    -- User is the creator (if set)
    (created_by IS NOT NULL AND created_by = auth.uid())
    OR
    -- User is a manager on the project (lowercase role from project_members)
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = projects.id 
        AND user_id = auth.uid()
        AND role = 'manager'
    )
);

-- Step 4: Verify the policy
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'projects' AND cmd = 'UPDATE';
