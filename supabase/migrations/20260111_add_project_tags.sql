-- Add tags column to projects table
-- Tags are stored as a text array for flexibility
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add index for better tag search performance
CREATE INDEX IF NOT EXISTS idx_projects_tags ON public.projects USING GIN (tags);
