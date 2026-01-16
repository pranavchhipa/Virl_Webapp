-- EMERGENCY FIX: Remove all broken policies and create simple working one
-- First, drop ALL existing policies on workspace_members
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Users can view members in their workspaces" ON workspace_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON workspace_members;

-- Create a simple, working policy using a lateral join approach
CREATE POLICY "workspace_members_select_policy" ON workspace_members
    FOR SELECT
    USING (
        -- Allow if user is a member of the same workspace
        EXISTS (
            SELECT 1 
            FROM workspace_members wm2
            WHERE wm2.workspace_id = workspace_members.workspace_id
              AND wm2.user_id = auth.uid()
        )
    );

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'workspace_members';
