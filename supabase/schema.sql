-- 1. Create PROFILES table (Linked to Supabase Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'editor', -- 'admin', 'manager', 'editor', 'creator'
  notification_preferences jsonb default '{"workspace_invites": true, "new_assets": true, "mentions": true, "project_assignment": true}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table profiles enable row level security;

-- All authenticated users can view all profiles (needed for mentions, member lists)
create policy "Anyone can view profiles"
  on profiles for select
  to authenticated
  using (true);

-- Users can update only their own profile
create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- 2. Create WORKSPACES table
create table public.workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create WORKSPACE MEMBERS table (Many-to-Many)
create table public.workspace_members (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(workspace_id, user_id)
);

-- 4. Create PROJECTS table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  description text,
  status text default 'active', -- 'active', 'archived', 'completed'
  start_date timestamp with time zone default now(),
  due_date timestamp with time zone,
  created_by uuid references public.profiles(id), -- Track who created the project
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create ASSETS table (Files uploaded to Storage)
create table public.assets (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  uploader_id uuid references public.profiles(id) not null,
  assigned_to uuid references public.profiles(id), -- The next person in the workflow
  file_name text not null,
  file_path text not null, -- Path in Supabase Storage
  file_type text, -- 'video', 'image', etc.
  status text default 'pending', -- 'pending', 'in-review', 'approved'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create COMMENTS table (For Team Chat & Asset Feedback)
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  asset_id uuid references public.assets(id) on delete cascade, -- Nullable: If null, it's a general project chat
  user_id uuid references public.profiles(id) not null,
  content text not null,
  timestamp integer, -- Video timestamp in seconds
  tagged_users uuid[], -- Array of user IDs mentioned
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Create AI_CHATS table (To save Virl.ai history)
create table public.ai_chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  project_id uuid references public.projects(id) on delete cascade,
  title text,
  history jsonb default '[]'::jsonb, -- Stores the conversation array
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table projects enable row level security;
alter table assets enable row level security;
alter table comments enable row level security;
alter table ai_chats enable row level security;

-- RLS POLICIES (Simplified for MVP)

-- Profiles: Everyone can read profiles (needed to see team names), User can edit own.
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Workspaces: Visible if you are the owner or a member.
create policy "Users can view workspaces they belong to" on workspaces
  for select using (
    auth.uid() = owner_id or 
    exists (select 1 from workspace_members where workspace_id = workspaces.id and user_id = auth.uid())
  );

-- 3b. Create PROJECT MEMBERS table (Granular RBAC)
create table public.project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'viewer', -- 'lead', 'editor', 'viewer'
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, user_id)
);

alter table project_members enable row level security;

-- Projects: Visible ONLY if you are explicitly a member of the project
create policy "Users can view projects they are assigned to" on projects
  for select using (
    exists (
      select 1 from project_members 
      where project_id = projects.id and user_id = auth.uid()
    )
  );

-- Workspace Members: Critical for the above checks to work (Unchanged)
create policy "Users can view their own memberships" on workspace_members
  for select using (user_id = auth.uid());
  
-- Project Members: Users can see who is on their projects
create policy "Users can view members of their projects" on project_members
  for select using (
    exists (
      select 1 from project_members members_check
      where members_check.project_id = project_members.project_id 
      and members_check.user_id = auth.uid()
    )
  );

-- Assets/Comments/AI: Visible if you have access to the project (via project_members).
create policy "Users can view assets in their projects" on assets
  for all using (
    exists (
      select 1 from project_members 
      where project_id = assets.project_id and user_id = auth.uid()
    )
  );

create policy "Users can view comments in their projects" on comments
  for all using (
    exists (
      select 1 from project_members 
      where project_id = comments.project_id and user_id = auth.uid()
    )
  );

create policy "Users can manage their own AI chats" on ai_chats
  for all using (auth.uid() = user_id);

-- TRIGGER: Handle New User Signup
-- This automatically adds a row to public.profiles when a user signs up via Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Realtime for Chat
alter publication supabase_realtime add table comments;

-- 10. Create MESSAGES table (Real-time Project Chat)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table messages enable row level security;

create policy "Users can view messages in their projects" on messages
  for select using (
    exists (
      select 1 from project_members 
      where project_id = messages.project_id and user_id = auth.uid()
    )
  );

create policy "Users can send messages in their projects" on messages
  for insert with check (
    exists (
      select 1 from project_members 
      where project_id = messages.project_id and user_id = auth.uid()
    )
  );

-- Enable Realtime for Messages
alter publication supabase_realtime add table messages;

-- 8. Create TASKS table (For Kanban Board)
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'idea', -- 'idea', 'scripting', 'filming', 'editing', 'review', 'posted'
  assigned_to uuid references public.profiles(id),
  due_date timestamp with time zone,
  position integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for tasks
alter table tasks enable row level security;

create policy "Users can view tasks in their projects" on tasks
  for all using (
    exists (
      select 1 from project_members 
      where project_id = tasks.project_id and user_id = auth.uid()
    )
  );

-- Enable Realtime for Tasks
alter publication supabase_realtime add table tasks;

-- 9. INSERT Policies (Added for Project Creation)

-- Allow Authenticated Users to Create Projects
create policy "Users can create projects"
on projects for insert
to authenticated
with check (true);

-- Allow Users to Update Projects they have access to
-- Only lead, manager, or the project creator can update
create policy "Users can update their projects"
on projects for update
to authenticated
using (
  -- User is the creator
  created_by = auth.uid()
  OR
  -- User is a lead or manager on the project
  exists (
    select 1 from project_members 
    where project_id = projects.id and user_id = auth.uid()
    and role in ('lead', 'manager')
  )
);

-- Allow Users to Create Tasks (Assignment)
create policy "Users can create tasks in their projects"
on tasks for insert
to authenticated
with check (
  exists (
    select 1 from project_members 
    where project_id = tasks.project_id and user_id = auth.uid()
  )
);

-- Allow Users to Upload Assets
-- Allow Users to Upload Assets (Permissive Policy for Client-Side Uploads)
drop policy if exists "Users can upload assets" on assets;
drop policy if exists "Enable insert for authenticated users" on assets;

create policy "Enable insert for authenticated users"
on assets for insert
to authenticated
with check (true);

-- MIGRATION: Add date columns to projects
alter table public.projects add column if not exists start_date timestamp with time zone default now();
alter table public.projects add column if not exists due_date timestamp with time zone;

-- 11. Create INVITATIONS table
create table public.invitations (
    id uuid default gen_random_uuid() primary key,
    email text not null,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    project_id uuid references public.projects(id) on delete cascade,
    role text default 'editor',
    token uuid default gen_random_uuid() unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table invitations enable row level security;

-- Allow public read of invitations via token (for validation)
create policy "Public can view invitations by token" 
on invitations for select 
using (true);

-- Allow authenticated users (Admins/Owners) to insert invitations
create policy "Users can create invitations" 
on invitations for insert 
to authenticated 
with check (true);

-- 12. Create ASSET_COMMENTS table (Dedicated for Asset Feedback)
create table public.asset_comments (
  id uuid default gen_random_uuid() primary key,
  asset_id uuid references public.assets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  timestamp integer, -- Optional video timestamp
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.asset_comments enable row level security;

-- RLS: Select (Visible if user is a member of the project via asset -> project)
create policy "Users can view comments on assets they have access to"
on public.asset_comments for select
using (
  exists (
    select 1
    from public.assets a
    join public.project_members pm on a.project_id = pm.project_id
    where a.id = asset_comments.asset_id
    and pm.user_id = auth.uid()
  )
);

-- RLS: Insert (Allow if user is a member of the project)
create policy "Users can comment on assets they have access to"
on public.asset_comments for insert
with check (
  exists (
    select 1
    from public.assets a
    join public.project_members pm on a.project_id = pm.project_id
    where a.id = asset_id
    and pm.user_id = auth.uid()
  )
);

-- Enable Realtime
alter publication supabase_realtime add table asset_comments;

-- 13. Create VIXI_MESSAGES table (Chat history for Premium AI)
create table public.vixi_messages (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  type text default 'text', -- 'text', 'image', 'card'
  metadata jsonb default '{}'::jsonb, -- For storing choices, chip selections, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vixi_messages enable row level security;

-- Vixi Messages Policies
create policy "Users can view vixi messages in their projects" on vixi_messages
  for select using (
    exists (
      select 1 from project_members 
      where project_id = vixi_messages.project_id and user_id = auth.uid()
    )
  );

create policy "Users can insert vixi messages in their projects" on vixi_messages
  for insert with check (
    exists (
      select 1 from project_members 
      where project_id = vixi_messages.project_id and user_id = auth.uid()
    )
  );

create policy "Users can delete vixi messages in their projects" on vixi_messages
  for delete using (
    exists (
      select 1 from project_members 
      where project_id = vixi_messages.project_id and user_id = auth.uid()
    )
    OR
    exists (
      select 1 from projects 
      where id = vixi_messages.project_id and created_by = auth.uid()
    )
  );

-- Enable Realtime
alter publication supabase_realtime add table vixi_messages;
