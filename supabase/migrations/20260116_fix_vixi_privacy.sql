-- FIX: Make Vixi chats private per user
-- Problem: Current policy shows ALL messages in a project to ALL project members
-- Solution: Only show messages where user_id matches the current user

-- Drop the old shared policy
DROP POLICY IF EXISTS "Users can view vixi messages in their projects" ON vixi_messages;

-- Create new private policy
CREATE POLICY "Users can view their own vixi messages" ON vixi_messages
    FOR SELECT
    USING (
        user_id = auth.uid()
    );

-- Keep insert/delete policies as-is (they're fine)
