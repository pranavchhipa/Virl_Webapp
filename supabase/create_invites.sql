-- Create WORKSPACE INVITES table
create table public.workspace_invites (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  email text not null,
  role text default 'member',
  invited_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(workspace_id, email)
);

-- Enable RLS
alter table workspace_invites enable row level security;

-- Policies
create policy "Workspace members can view invites" on workspace_invites
  for select using (
    exists (
      select 1 from workspace_members
      where workspace_id = workspace_invites.workspace_id
      and user_id = auth.uid()
    )
  );

create policy "Admins/Owners can create invites" on workspace_invites
  for insert with check (
    exists (
      select 1 from workspace_members
      where workspace_id = workspace_invites.workspace_id
      and user_id = auth.uid()
      and role in ('owner', 'admin') -- Only admins/owners can invite
    )
  );

create policy "Admins/Owners can delete invites" on workspace_invites
  for delete using (
    exists (
      select 1 from workspace_members
      where workspace_id = workspace_invites.workspace_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- Function to handle accepting invites on signup
create or replace function public.handle_new_user_invite()
returns trigger as $$
declare
  invite record;
begin
  -- Check for any invites for this email
  for invite in select * from public.workspace_invites where email = new.email
  loop
    -- Add to workspace
    insert into public.workspace_members (workspace_id, user_id, role)
    values (invite.workspace_id, new.id, invite.role)
    on conflict (workspace_id, user_id) do nothing;
    
    -- Delete the invite
    delete from public.workspace_invites where id = invite.id;
  end loop;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run AFTER the profile is created (which happens after auth.users insert)
-- Actually, let's attach it to public.profiles since that's where we finalized the user creation in our previous trigger.
-- Or better, we can attach it to auth.users but run it as a separate trigger.
create trigger on_auth_user_created_check_invites
  after insert on auth.users
  for each row execute procedure public.handle_new_user_invite();
