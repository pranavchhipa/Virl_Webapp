-- HOTFIX: The previous policy had a self-referencing issue
-- Drop the broken policy
DROP POLICY IF EXISTS "Users can view members in their workspaces" ON workspace_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON workspace_members;

-- Create a working policy that checks workspace ownership OR membership via workspaces table
CREATE POLICY "Users can view workspace members" ON workspace_members
    FOR SELECT
    USING (
        -- User is the workspace owner
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
        OR
        -- User is a member of this workspace (check via user_id match)
        workspace_id IN (
            SELECT wm.workspace_id 
            FROM workspace_members wm 
            WHERE wm.user_id = auth.uid()
        )
    );
