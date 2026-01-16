-- Fix workspace_members RLS policy to allow viewing all workspace members
-- Problem: Current policy only lets users see their own membership row
-- Solution: Allow users to see all members in workspaces they belong to

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view their own memberships" ON workspace_members;

-- Create a new policy that allows viewing all members in user's workspaces
CREATE POLICY "Users can view members in their workspaces" ON workspace_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM workspace_members AS my_membership
            WHERE my_membership.workspace_id = workspace_members.workspace_id
            AND my_membership.user_id = auth.uid()
        )
    );
