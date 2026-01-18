-- RLS Policy for 'workspaces' table

-- Enable RLS on the table (Idempotent)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy:
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON workspaces;
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
DROP POLICY IF EXISTS "Only owners and admins can update workspace" ON workspaces;
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
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
CREATE POLICY "Users can create workspaces" 
ON workspaces FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- 4. DELETE Policy:
DROP POLICY IF EXISTS "Only owners can delete workspace" ON workspaces;
CREATE POLICY "Only owners can delete workspace" 
ON workspaces FOR DELETE 
USING (auth.uid() = owner_id);
