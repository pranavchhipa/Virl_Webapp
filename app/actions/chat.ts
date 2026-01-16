'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteMessagesAction(messageIds: string[], projectId: string) {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: "Unauthorized" }
        }

        // 1. Verify Permission (Check once for the user)
        let hasPermission = false

        // Check Workspace Role
        const { data: project } = await supabase
            .from('projects')
            .select('workspace_id, created_by') // Also check project creator
            .eq('id', projectId)
            .single()

        if (project) {
            if (project.created_by === user.id) {
                hasPermission = true
            } else {
                const { data: wsMember } = await supabase
                    .from('workspace_members')
                    .select('role')
                    .eq('workspace_id', project.workspace_id)
                    .eq('user_id', user.id)
                    .single()

                if (wsMember?.role === 'owner' || wsMember?.role === 'admin') {
                    hasPermission = true
                }
            }
        }

        // Check Project Role if not already approved
        if (!hasPermission) {
            const { data: projMember } = await supabase
                .from('project_members')
                .select('role')
                .eq('project_id', projectId)
                .eq('user_id', user.id)
                .single()

            if (projMember?.role === 'manager' || projMember?.role === 'lead') {
                hasPermission = true
            }
        }

        // 2. Filter IDs allowed to delete
        // If hasPermission (Admin/Manager), can delete ALL.
        // If not, can ONLY delete OWN messages.

        let finalIdsToDelete: string[] = []

        if (hasPermission) {
            finalIdsToDelete = messageIds
        } else {
            // Fetch messages to verify ownership
            const { data: messages } = await supabase
                .from('messages')
                .select('id, user_id')
                .in('id', messageIds)

            if (messages) {
                finalIdsToDelete = messages
                    .filter(m => m.user_id === user.id)
                    .map(m => m.id)
            }
        }

        if (finalIdsToDelete.length === 0) {
            return { success: false, error: "No messages to delete or permission denied" }
        }

        // 3. Perform Delete using Service Role (Bypass RLS)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        const { error } = await supabaseAdmin
            .from('messages')
            .delete()
            .in('id', finalIdsToDelete)

        if (error) throw error

        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Delete message error:", error)
        return { success: false, error: error.message }
    }
}
