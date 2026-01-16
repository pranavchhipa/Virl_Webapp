-- Add assigned_to column to tasks table if it doesn't exist
-- This column is used for assigning tasks to team members in the Kanban board

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'assigned_to'
    ) THEN
        ALTER TABLE public.tasks 
        ADD COLUMN assigned_to uuid REFERENCES public.profiles(id);
        
        RAISE NOTICE 'Added assigned_to column to tasks table';
    ELSE
        RAISE NOTICE 'assigned_to column already exists';
    END IF;
END
$$;
