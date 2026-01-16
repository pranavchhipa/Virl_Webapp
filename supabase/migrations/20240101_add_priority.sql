-- Add priority column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium'; -- 'high', 'medium', 'low'
