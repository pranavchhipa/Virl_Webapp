-- Re-enable RLS with a working policy
-- This policy allows users to see all members in workspaces they belong to

-- First, clean up any existing policies
DROP POLICY IF EXISTS "workspace_members_select_policy" ON workspace_members;
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Users can view members in their workspaces" ON workspace_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON workspace_members;

-- Re-enable RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Create a working SELECT policy
-- This allows users to view all members in their workspaces
CREATE POLICY "Users can view workspace team members" ON workspace_members
    FOR SELECT
    USING (
        -- Check if current user is in the same workspace
        workspace_id IN (
            SELECT workspace_id 
            FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Verify the policy was created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'workspace_members';
