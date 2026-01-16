-- Add screenshot_url column to feedback table
alter table feedback
add column if not exists screenshot_url text;

-- Create storage bucket for feedback attachments
insert into storage.buckets (id, name, public)
values ('feedback-attachments', 'feedback-attachments', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Feedback attachments are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'feedback-attachments' );

create policy "Users can upload feedback attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'feedback-attachments' 
    and auth.role() = 'authenticated'
  );
