-- Migration: Add last_active_at column to profiles table
-- This column tracks when users last logged in or were active
-- Used for customer health scoring in Control Centre

-- Add the column with default value of now() so existing users are marked as "just active"
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Update all existing profiles to have a last_active_at value (if they don't have one)
UPDATE public.profiles 
SET last_active_at = created_at 
WHERE last_active_at IS NULL;

-- Add suspended column if it doesn't exist (for health tracking)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false;
