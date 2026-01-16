-- Enable DELETE for messages table

-- Policy: Users can delete their OWN messages
create policy "Users can delete their own messages" on messages
  for delete using (
    auth.uid() = user_id
  );

-- Policy: Project Leads and Managers can delete ANY message in their project
create policy "Project leads can delete any message" on messages
  for delete using (
    exists (
      select 1 from project_members 
      where project_id = messages.project_id 
      and user_id = auth.uid()
      and role in ('lead', 'manager', 'owner') -- Including 'owner' just in case, though schema says 'lead'/'editor'/'viewer' mostly
    )
    OR
    exists (
      select 1 from projects 
      where id = messages.project_id 
      and created_by = auth.uid()
    )
  );
