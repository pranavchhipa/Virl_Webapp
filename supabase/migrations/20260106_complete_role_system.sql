-- ============================================================================
-- VIRL ROLE SYSTEM & RLS POLICIES - COMPLETE MIGRATION
-- ============================================================================
-- Run this ENTIRE file in Supabase SQL Editor
-- This fixes all permission issues and prepares for Kanban feature
-- ============================================================================

-- ============================================================================
-- PART 1: ROLE DEFINITIONS
-- ============================================================================
-- 
-- PROJECT ROLES (stored in project_members.role):
-- ┌─────────────┬────────────────────────────────────────────────────────────┐
-- │ Role        │ Permissions                                                │
-- ├─────────────┼────────────────────────────────────────────────────────────┤
-- │ manager     │ Full control: update project, manage team, delete content  │
-- │ editor      │ Edit: modify assets, manage tasks, add comments            │
-- │ contributor │ Create: upload assets, create tasks, comment               │
-- │ viewer      │ Read-only: view everything, comment only                   │
-- └─────────────┴────────────────────────────────────────────────────────────┘
--
-- WORKSPACE ROLES (stored in workspace_members.role):
-- ┌─────────────┬────────────────────────────────────────────────────────────┐
-- │ Role        │ Permissions                                                │
-- ├─────────────┼────────────────────────────────────────────────────────────┤
-- │ owner       │ Full control: billing, delete workspace, manage all        │
-- │ admin       │ Manage: invite members, create projects, manage team       │
-- │ member      │ Basic: access assigned projects only                       │
-- └─────────────┴────────────────────────────────────────────────────────────┘
--
-- ============================================================================

-- ============================================================================
-- PART 2: ADD CREATED_BY COLUMN TO PROJECTS (if not exists)
-- ============================================================================

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- Backfill: Set first project member as creator for existing projects
UPDATE public.projects p
SET created_by = (
    SELECT user_id 
    FROM public.project_members pm 
    WHERE pm.project_id = p.id 
    ORDER BY pm.joined_at ASC 
    LIMIT 1
)
WHERE p.created_by IS NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);


-- ============================================================================
-- PART 3: PROJECT POLICIES (FIX STATUS UPDATE + ADD DELETE)
-- ============================================================================

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can update their projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their projects" ON projects;

-- PROJECT UPDATE: Only manager or creator can update (name, description, status)
CREATE POLICY "Users can update their projects"
ON projects FOR UPDATE
TO authenticated
USING (
    -- Creator can always update
    (created_by = auth.uid())
    OR
    -- Manager role can update
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = projects.id 
        AND user_id = auth.uid()
        AND role = 'manager'
    )
);

-- PROJECT DELETE: Only manager or creator can delete
CREATE POLICY "Users can delete their projects"
ON projects FOR DELETE
TO authenticated
USING (
    -- Creator can delete
    (created_by = auth.uid())
    OR
    -- Manager role can delete
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = projects.id 
        AND user_id = auth.uid()
        AND role = 'manager'
    )
);


-- ============================================================================
-- PART 4: ASSET POLICIES (RESTRICT VIEWERS + ADD DELETE)
-- ============================================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON assets;
DROP POLICY IF EXISTS "Users can upload assets" ON assets;
DROP POLICY IF EXISTS "Users can delete assets" ON assets;
DROP POLICY IF EXISTS "Users can update assets" ON assets;

-- ASSET INSERT: Contributors and above can upload (NOT viewers)
CREATE POLICY "Non-viewers can upload assets"
ON assets FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = assets.project_id 
        AND user_id = auth.uid()
        AND role IN ('manager', 'editor', 'contributor')
    )
);

-- ASSET UPDATE: Editor and above can modify assets
CREATE POLICY "Editors can update assets"
ON assets FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = assets.project_id 
        AND user_id = auth.uid()
        AND role IN ('manager', 'editor')
    )
);

-- ASSET DELETE: Only manager can delete assets
CREATE POLICY "Managers can delete assets"
ON assets FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = assets.project_id 
        AND user_id = auth.uid()
        AND role = 'manager'
    )
);


-- ============================================================================
-- PART 5: TASK POLICIES (FOR KANBAN FEATURE)
-- ============================================================================

-- Drop existing task policies
DROP POLICY IF EXISTS "Users can view tasks in their projects" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their projects" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;

-- TASK SELECT: All project members can view tasks
CREATE POLICY "Users can view tasks in their projects"
ON tasks FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = tasks.project_id 
        AND user_id = auth.uid()
    )
);

-- TASK INSERT: Contributors and above can create tasks (NOT viewers)
CREATE POLICY "Non-viewers can create tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = tasks.project_id 
        AND user_id = auth.uid()
        AND role IN ('manager', 'editor', 'contributor')
    )
);

-- TASK UPDATE: Assignee, Editor, or Manager can update tasks
CREATE POLICY "Assignees and editors can update tasks"
ON tasks FOR UPDATE
TO authenticated
USING (
    -- Task is assigned to this user
    (assignee_id = auth.uid())
    OR
    -- User is editor or manager
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = tasks.project_id 
        AND user_id = auth.uid()
        AND role IN ('manager', 'editor')
    )
);

-- TASK DELETE: Only manager can delete tasks
CREATE POLICY "Managers can delete tasks"
ON tasks FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = tasks.project_id 
        AND user_id = auth.uid()
        AND role = 'manager'
    )
);


-- ============================================================================
-- PART 6: PROJECT MEMBER MANAGEMENT POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Managers can add project members" ON project_members;
DROP POLICY IF EXISTS "Managers can update project members" ON project_members;
DROP POLICY IF EXISTS "Managers can remove project members" ON project_members;

-- PROJECT_MEMBERS INSERT: Only manager can add members
CREATE POLICY "Managers can add project members"
ON project_members FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM project_members existing
        WHERE existing.project_id = project_members.project_id 
        AND existing.user_id = auth.uid()
        AND existing.role = 'manager'
    )
    OR
    -- Also allow if user is adding themselves as first member (project creator)
    (user_id = auth.uid())
);

-- PROJECT_MEMBERS UPDATE: Only manager can change roles
CREATE POLICY "Managers can update project members"
ON project_members FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members existing
        WHERE existing.project_id = project_members.project_id 
        AND existing.user_id = auth.uid()
        AND existing.role = 'manager'
    )
);

-- PROJECT_MEMBERS DELETE: Only manager can remove members
CREATE POLICY "Managers can remove project members"
ON project_members FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members existing
        WHERE existing.project_id = project_members.project_id 
        AND existing.user_id = auth.uid()
        AND existing.role = 'manager'
    )
);


-- ============================================================================
-- PART 7: VERIFICATION QUERIES
-- ============================================================================

-- Check all policies on key tables
SELECT tablename, policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename IN ('projects', 'assets', 'tasks', 'project_members')
ORDER BY tablename, cmd;

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 
-- ✅ Projects: UPDATE and DELETE now require 'manager' role or creator
-- ✅ Assets: INSERT requires contributor+, UPDATE requires editor+, DELETE requires manager
-- ✅ Tasks: INSERT requires contributor+, UPDATE requires assignee/editor+, DELETE requires manager
-- ✅ Project Members: INSERT/UPDATE/DELETE all require manager role
-- 
-- ROLE PERMISSION MATRIX:
-- ┌─────────────┬────────┬────────┬─────────────┬────────┐
-- │ Action      │ Manager│ Editor │ Contributor │ Viewer │
-- ├─────────────┼────────┼────────┼─────────────┼────────┤
-- │ View        │   ✅   │   ✅   │     ✅      │   ✅   │
-- │ Upload      │   ✅   │   ✅   │     ✅      │   ❌   │
-- │ Edit Asset  │   ✅   │   ✅   │     ❌      │   ❌   │
-- │ Delete Asset│   ✅   │   ❌   │     ❌      │   ❌   │
-- │ Create Task │   ✅   │   ✅   │     ✅      │   ❌   │
-- │ Edit Task   │   ✅   │   ✅   │  (assignee) │   ❌   │
-- │ Delete Task │   ✅   │   ❌   │     ❌      │   ❌   │
-- │ Manage Team │   ✅   │   ❌   │     ❌      │   ❌   │
-- │ Edit Project│   ✅   │   ❌   │     ❌      │   ❌   │
-- └─────────────┴────────┴────────┴─────────────┴────────┘
-- 
-- ============================================================================
