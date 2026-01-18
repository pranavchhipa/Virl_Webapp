-- RLS Policy for 'workspaces' table

-- Enable RLS on the table
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy:
-- Users can see a workspace if they are the owner OR they are a member
CREATE POLICY "Users can view workspaces they belong to" 
ON workspaces FOR SELECT 
USING (
  auth.uid() = owner_id 
  OR 
  EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_members.workspace_id = workspaces.id 
    AND workspace_members.user_id = auth.uid()
  )
);

-- 2. UPDATE Policy:
-- Only Owners (and potentially 'admin' members) can update workspace details (like name)
CREATE POLICY "Only owners and admins can update workspace" 
ON workspaces FOR UPDATE 
USING (
  auth.uid() = owner_id 
  OR 
  EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_members.workspace_id = workspaces.id 
    AND workspace_members.user_id = auth.uid()
    AND (workspace_members.role = 'owner' OR workspace_members.role = 'admin')
  )
);

-- 3. INSERT Policy:
-- Authenticated users can create workspaces
CREATE POLICY "Users can create workspaces" 
ON workspaces FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- 4. DELETE Policy:
-- Only Owner can delete the workspace
CREATE POLICY "Only owners can delete workspace" 
ON workspaces FOR DELETE 
USING (auth.uid() = owner_id);
