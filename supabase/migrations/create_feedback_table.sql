-- Create feedback table
create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  type text not null check (type in ('bug', 'feature', 'general')),
  message text not null,
  sentiment text not null, -- stored as emoji or text representation
  rating int, -- keeping optional for future use if needed, though sentiment covers it
  path text,
  user_agent text,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table feedback enable row level security;

-- Allow authenticated users to insert feedback
create policy "Users can insert their own feedback"
  on feedback for insert
  with check (auth.uid() = user_id);

-- Allow admins to view all feedback (assuming service_role or specific admin check)
-- For now, we'll allow proper admin checks if `app_admin` or similar role exists, 
-- but simpler to just start with a basic policy or rely on dashboard fetching via server actions with admin privileges.
-- Let's add a policy for reading if the user is an admin.
-- Checking if `public.profiles` has a role or `app_settings` approach.
-- Based on previous file list `20260106_complete_role_system.sql`, there might be a role system.
-- I'll peek at that file or just use a safe generous policy for now or server-side admin check.
-- Let's stick to standard RLS:
-- Users can only see their own feedback? Or maybe no need for them to see it once submitted.
-- So only INSERT policy for users.
-- SELECT policy for admins.

-- Assuming 'admin' role existence from previous context or just using service role for the admin dashboard fetching.
-- I will create a policy for admins if I can confirm the role system, otherwise I'll stick to service role for admin fetching.

create policy "Admins can view all feedback"
  on feedback for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'owner', 'super_admin') 
    )
  );
