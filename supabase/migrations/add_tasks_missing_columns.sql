-- Add all missing columns to tasks table
-- This migration adds columns required for the Kanban board functionality

-- Add description column
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS description text;

-- Add position column for ordering tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- Add assigned_to column for task assignment
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id);

-- Add due_date column
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public';
