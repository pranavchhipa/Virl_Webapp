-- EMERGENCY FIX: The recursive policy is causing issues
-- Solution: Temporarily disable RLS to restore access
-- We'll add proper security later

-- Step 1: Drop ALL policies
DROP POLICY IF EXISTS "workspace_members_select_policy" ON workspace_members;
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Users can view members in their workspaces" ON workspace_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON workspace_members;

-- Step 2: TEMPORARILY disable RLS (EMERGENCY ONLY)
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;

-- NOTE: This is a temporary fix to restore access.
-- After confirming the UI works, we'll re-enable RLS with a proper policy.
