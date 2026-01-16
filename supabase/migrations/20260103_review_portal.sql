-- Feature #1: Public Client Review Portal
-- Migration: review_portal_tables

-- 1. Create review_links table
create table public.review_links (
  id uuid default gen_random_uuid() primary key,
  asset_id uuid references public.assets(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  token text unique not null, -- Secure public token (nanoid)
  created_by uuid references public.profiles(id) not null,
  expires_at timestamp with time zone,
  is_active boolean default true,
  allow_comments boolean default true,
  password_protected boolean default false,
  password_hash text, -- Hashed password if protected
  view_count integer default 0,
  created_at timestamp with time zone default now() not null
);

-- 2. Create client_feedback table
create table public.client_feedback (
  id uuid default gen_random_uuid() primary key,
  review_link_id uuid references public.review_links(id) on delete cascade not null,
  client_name text,
  client_email text,
  status text not null check (status in ('approved', 'changes_requested')), 
  feedback_text text,
  timestamp integer, -- Video timestamp in seconds (for specific comments)
  created_at timestamp with time zone default now() not null
);

-- 3. Enable Row Level Security
alter table review_links enable row level security;
alter table client_feedback enable row level security;

-- 4. RLS Policies for review_links

-- Authenticated users can view their own review links
create policy "Users can view review links for their projects"
  on review_links for select
  to authenticated
  using (
    exists (
      select 1 from project_members
      where project_id = review_links.project_id
      and user_id = auth.uid()
    )
  );

-- Authenticated users can create review links for their projects
create policy "Users can create review links for their projects"
  on review_links for insert
  to authenticated
  with check (
    exists (
      select 1 from project_members
      where project_id = review_links.project_id
      and user_id = auth.uid()
    )
  );

-- Users can update their own review links
create policy "Users can update their own review links"
  on review_links for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- PUBLIC ACCESS: Anyone can view active, non-expired review links by token
create policy "Public can view active review links"
  on review_links for select
  to anon
  using (
    is_active = true 
    and (expires_at is null or expires_at > now())
  );

-- 5. RLS Policies for client_feedback

-- Authenticated users can view feedback for their projects
create policy "Users can view feedback for their projects"
  on client_feedback for select
  to authenticated
  using (
    exists (
      select 1 from review_links rl
      join project_members pm on pm.project_id = rl.project_id
      where rl.id = client_feedback.review_link_id
      and pm.user_id = auth.uid()
    )
  );

-- PUBLIC ACCESS: Anyone can submit feedback (anonymous clients)
create policy "Anyone can submit feedback"
  on client_feedback for insert
  to anon
  with check (true);

-- 6. Create indexes for performance
create index idx_review_links_token on public.review_links(token);
create index idx_review_links_asset on public.review_links(asset_id);
create index idx_review_links_active on public.review_links(is_active, expires_at);
create index idx_client_feedback_review_link on public.client_feedback(review_link_id);

-- 7. Enable Realtime for client_feedback (for live updates)
alter publication supabase_realtime add table client_feedback;

-- 8. Helper function to increment view count
create or replace function increment_review_link_views(link_token text)
returns void as $$
begin
  update review_links
  set view_count = view_count + 1
  where token = link_token;
end;
$$ language plpgsql security definer;
