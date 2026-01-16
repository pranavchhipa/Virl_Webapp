-- Feature #2: Visual Content Calendar
-- Migration: content_calendar

-- 1. Add scheduling columns to assets table
alter table public.assets add column if not exists scheduled_date date;
alter table public.assets add column if not exists scheduled_time time;
alter table public.assets add column if not exists platform text; -- 'instagram', 'tiktok', 'youtube', 'twitter', 'linkedin'
alter table public.assets add column if not exists platform_specific jsonb default '{}'::jsonb;
alter table public.assets add column if not exists thumbnail_url text;
alter table public.assets add column if not exists posting_notes text;
alter table public.assets add column if not exists is_recurring boolean default false;
alter table public.assets add column if not exists recurrence_rule jsonb; -- RRULE format for recurring posts
alter table public.assets add column if not exists external_post_id text; -- ID from platform after posting
alter table public.assets add column if not exists posted_at timestamp with time zone; -- Actual posting time

-- 2. Platform configurations per project (optimal times, limits, etc)
create table public.platform_configs (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  platform text not null check (platform in ('instagram', 'tiktok', 'youtube', 'twitter', 'linkedin')),
  optimal_posting_times time[], -- Array of best times (e.g., ['10:00', '14:00', '19:00'])
  daily_post_limit integer default 3,
  auto_schedule boolean default false,
  settings jsonb default '{}'::jsonb, -- Platform-specific settings
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(project_id, platform)
);

-- 3. Content templates for recurring posts
create table public.content_templates (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  template_type text, -- 'weekly_series', 'monthly_recap', 'daily_quote', etc.
  platform text check (platform in ('instagram', 'tiktok', 'youtube', 'twitter', 'linkedin')),
  recurrence_rule jsonb, -- RRULE: {freq: 'WEEKLY', byweekday: ['MO'], time: '10:00'}
  default_caption text,
  default_hashtags text[],
  thumbnail_template_url text,
  created_by uuid references public.profiles(id),
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. Schedule conflicts tracking
create table public.schedule_conflicts (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  conflict_date date not null,
  conflict_time time,
  asset_ids uuid[] not null, -- Array of conflicting asset IDs
  conflict_type text not null, -- 'same_time', 'daily_limit', 'team_capacity'
  severity text not null check (severity in ('info', 'warning', 'error')),
  resolved boolean default false,
  resolved_at timestamp with time zone,
  resolved_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- 5. Calendar analytics and performance tracking
create table public.calendar_stats (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  stat_date date not null,
  platform text check (platform in ('instagram', 'tiktok', 'youtube', 'twitter', 'linkedin')),
  posts_scheduled integer default 0,
  posts_published integer default 0,
  posts_approved integer default 0,
  avg_approval_time_hours numeric,
  team_capacity_used numeric, -- Percentage (0-100)
  best_performing_time time,
  engagement_rate numeric,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(project_id, stat_date, platform)
);

-- 6. Posting performance metrics (for AI suggestions)
create table public.post_performance (
  id uuid default gen_random_uuid() primary key,
  asset_id uuid references public.assets(id) on delete cascade not null,
  platform text not null,
  posted_time time not null,
  posted_day_of_week integer not null, -- 0-6 (Sunday-Saturday)
  views integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  engagement_rate numeric, -- (likes + comments + shares) / views
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table platform_configs enable row level security;
alter table content_templates enable row level security;
alter table schedule_conflicts enable row level security;
alter table calendar_stats enable row level security;
alter table post_performance enable row level security;

-- RLS Policies for platform_configs
create policy "Users can view platform configs for their projects"
  on platform_configs for select
  to authenticated
  using (
    exists (
      select 1 from project_members
      where project_id = platform_configs.project_id
      and user_id = auth.uid()
    )
  );

create policy "Users can create platform configs for their projects"
  on platform_configs for insert
  to authenticated
  with check (
    exists (
      select 1 from project_members
      where project_id = platform_configs.project_id
      and user_id = auth.uid()
      and role in ('lead', 'editor')
    )
  );

create policy "Users can update platform configs for their projects"
  on platform_configs for update
  to authenticated
  using (
    exists (
      select 1 from project_members
      where project_id = platform_configs.project_id
      and user_id = auth.uid()
      and role in ('lead', 'editor')
    )
  );

-- RLS Policies for content_templates
create policy "Users can view templates for their projects"
  on content_templates for select
  to authenticated
  using (
    exists (
      select 1 from project_members
      where project_id = content_templates.project_id
      and user_id = auth.uid()
    )
  );

create policy "Users can create templates for their projects"
  on content_templates for insert
  to authenticated
  with check (
    exists (
      select 1 from project_members
      where project_id = content_templates.project_id
      and user_id = auth.uid()
    )
  );

create policy "Users can update their own templates"
  on content_templates for update
  to authenticated
  using (created_by = auth.uid());

-- RLS Policies for schedule_conflicts
create policy "Users can view conflicts for their projects"
  on schedule_conflicts for select
  to authenticated
  using (
    exists (
      select 1 from project_members
      where project_id = schedule_conflicts.project_id
      and user_id = auth.uid()
    )
  );

create policy "System can create conflicts"
  on schedule_conflicts for insert
  to authenticated
  with check (true);

create policy "Users can resolve conflicts"
  on schedule_conflicts for update
  to authenticated
  using (
    exists (
      select 1 from project_members
      where project_id = schedule_conflicts.project_id
      and user_id = auth.uid()
    )
  );

-- RLS Policies for calendar_stats
create policy "Users can view stats for their projects"
  on calendar_stats for select
  to authenticated
  using (
    exists (
      select 1 from project_members
      where project_id = calendar_stats.project_id
      and user_id = auth.uid()
    )
  );

-- RLS Policies for post_performance
create policy "Users can view performance for project assets"
  on post_performance for select
  to authenticated
  using (
    exists (
      select 1 from assets a
      join project_members pm on pm.project_id = a.project_id
      where a.id = post_performance.asset_id
      and pm.user_id = auth.uid()
    )
  );

-- 7. Create indexes for performance
create index idx_assets_scheduled_date on public.assets(scheduled_date) where scheduled_date is not null;
create index idx_assets_scheduled_date_time on public.assets(scheduled_date, scheduled_time) where scheduled_date is not null;
create index idx_assets_platform on public.assets(platform) where platform is not null;
create index idx_assets_recurring on public.assets(is_recurring) where is_recurring = true;
create index idx_assets_project_scheduled on public.assets(project_id, scheduled_date) where scheduled_date is not null;

create index idx_platform_configs_project on public.platform_configs(project_id);
create index idx_content_templates_project on public.content_templates(project_id);
create index idx_content_templates_active on public.content_templates(is_active) where is_active = true;
create index idx_schedule_conflicts_project_date on public.schedule_conflicts(project_id, conflict_date);
create index idx_schedule_conflicts_unresolved on public.schedule_conflicts(resolved) where resolved = false;
create index idx_calendar_stats_project_date on public.calendar_stats(project_id, stat_date);
create index idx_post_performance_asset on public.post_performance(asset_id);
create index idx_post_performance_platform_time on public.post_performance(platform, posted_time);

-- 8. Helper function: Get optimal posting times for a platform
create or replace function get_optimal_times(
  p_project_id uuid,
  p_platform text
) returns time[] as $$
declare
  optimal_times time[];
begin
  -- Get from platform_configs if exists
  select optimal_posting_times into optimal_times
  from platform_configs
  where project_id = p_project_id
  and platform = p_platform;
  
  -- If not configured, return platform defaults
  if optimal_times is null then
    optimal_times := case p_platform
      when 'instagram' then ARRAY['10:00'::time, '14:00'::time, '19:00'::time]
      when 'tiktok' then ARRAY['18:00'::time, '21:00'::time]
      when 'youtube' then ARRAY['14:00'::time, '16:00'::time, '20:00'::time]
      when 'twitter' then ARRAY['09:00'::time, '12:00'::time, '17:00'::time]
      when 'linkedin' then ARRAY['08:00'::time, '12:00'::time, '17:00'::time]
      else ARRAY['12:00'::time]
    end;
  end if;
  
  return optimal_times;
end;
$$ language plpgsql;

-- 9. Helper function: Detect scheduling conflicts
create or replace function detect_conflicts(
  p_asset_id uuid,
  p_scheduled_date date,
  p_scheduled_time time,
  p_platform text,
  p_project_id uuid
) returns jsonb as $$
declare
  conflicts jsonb := '[]'::jsonb;
  same_time_count integer;
  daily_limit integer;
  daily_count integer;
begin
  -- Check for same time/platform conflicts
  select count(*) into same_time_count
  from assets
  where project_id = p_project_id
  and platform = p_platform
  and scheduled_date = p_scheduled_date
  and scheduled_time = p_scheduled_time
  and id != p_asset_id
  and status != 'archived';
  
  if same_time_count > 0 then
    conflicts := conflicts || jsonb_build_object(
      'type', 'same_time',
      'severity', 'error',
      'message', format('%s posts already scheduled at %s on %s', same_time_count, p_scheduled_time, p_platform),
      'count', same_time_count
    );
  end if;
  
  -- Check daily post limit
  select daily_post_limit into daily_limit
  from platform_configs
  where project_id = p_project_id
  and platform = p_platform;
  
  if daily_limit is not null then
    select count(*) into daily_count
    from assets
    where project_id = p_project_id
    and platform = p_platform
    and scheduled_date = p_scheduled_date
    and status != 'archived';
    
    if daily_count >= daily_limit then
      conflicts := conflicts || jsonb_build_object(
        'type', 'daily_limit',
        'severity', 'warning',
        'message', format('Daily limit of %s posts reached for %s', daily_limit, p_platform),
        'current', daily_count,
        'limit', daily_limit
      );
    end if;
  end if;
  
  return conflicts;
end;
$$ language plpgsql;

-- 10. Enable Realtime for collaborative scheduling
alter publication supabase_realtime add table schedule_conflicts;
alter publication supabase_realtime add table calendar_stats;

-- 11. Create trigger to auto-update calendar stats
create or replace function update_calendar_stats()
returns trigger as $$
begin
  -- Update stats when asset is scheduled/published
  insert into calendar_stats (
    project_id, 
    stat_date, 
    platform, 
    posts_scheduled, 
    posts_published
  )
  values (
    NEW.project_id,
    NEW.scheduled_date,
    NEW.platform,
    1,
    case when NEW.posted_at is not null then 1 else 0 end
  )
  on conflict (project_id, stat_date, platform)
  do update set
    posts_scheduled = calendar_stats.posts_scheduled + 1,
    posts_published = case when NEW.posted_at is not null 
      then calendar_stats.posts_published + 1 
      else calendar_stats.posts_published 
    end,
    updated_at = now();
  
  return NEW;
end;
$$ language plpgsql;

create trigger on_asset_scheduled
  after insert or update of scheduled_date, posted_at on assets
  for each row
  when (NEW.scheduled_date is not null)
  execute function update_calendar_stats();
