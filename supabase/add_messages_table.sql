-- Add MESSAGES table (for Team Chat)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Messages
alter table messages enable row level security;

create policy "Users can view messages in their projects" on messages
  for select using (
    exists (
      select 1 from projects 
      join workspace_members on projects.workspace_id = workspace_members.workspace_id
      where projects.id = messages.project_id and workspace_members.user_id = auth.uid()
    )
  );

create policy "Users can insert messages in their projects" on messages
  for insert with check (
    exists (
      select 1 from projects 
      join workspace_members on projects.workspace_id = workspace_members.workspace_id
      where projects.id = messages.project_id and workspace_members.user_id = auth.uid()
    )
  );

-- Enable Realtime
alter publication supabase_realtime add table messages;
