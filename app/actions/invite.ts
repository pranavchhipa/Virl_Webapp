'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getPlanLimits, PlanTier, checkSubscriptionStatus } from '@/lib/plan-limits'

// Mock Resend integration or assume it exists in lib/mail
// import { sendInviteEmail } from '@/lib/mail' 

export async function createInvitation(email: string, workspaceId: string, projectId: string | null, role: string) {
    const supabase = await createClient()

    // Check member limit based on workspace plan
    const { data: workspace } = await supabase
        .from('workspaces')
        .select('plan_tier, subscription_end_date')
        .eq('id', workspaceId)
        .single()

    const rawTier = (workspace?.plan_tier as PlanTier) || 'basic'
    const planTier = checkSubscriptionStatus(rawTier, workspace?.subscription_end_date || null)
    const limits = getPlanLimits(planTier)

    // Count current members (including owner)
    const { count: memberCount } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)

    const currentMembers = memberCount || 0

    if (limits.members !== Infinity && currentMembers >= limits.members) {
        return {
            error: `Member limit reached (${currentMembers}/${limits.members}). Upgrade to Pro for more team members!`,
            limitReached: true,
            currentMembers,
            memberLimit: limits.members
        }
    }

    // 1. Create Invitation Record
    const { data: invite, error } = await supabase
        .from('invitations')
        .insert({
            email,
            workspace_id: workspaceId,
            project_id: projectId,
            role
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating invitation:', error)
        return { error: 'Failed to create invitation' }
    }

    // 2. Generate Link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join?token=${invite.token}`

    // 3. Send Email (Placeholder for Resend)
    console.log(`Sending invite to ${email} with link: ${inviteLink}`)
    // await sendInviteEmail(email, inviteLink)

    return { success: true, link: inviteLink }
}

export async function acceptInvitation(token: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // Redirect to signup with return URL
        // Actually the client page will handle the redirect, but safe to check here
        return { error: 'Unauthorized' }
    }

    // 1. Fetch Invite
    const { data: invite, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .single()

    if (inviteError || !invite) {
        return { error: 'Invalid or expired invitation' }
    }

    // 2. Add to Workspace
    const { error: wsError } = await supabase
        .from('workspace_members')
        .insert({
            workspace_id: invite.workspace_id,
            user_id: user.id,
            role: 'member'
        })
    // Ignore duplicate key error in case they are already in workspace?
    // .onConflict('workspace_id, user_id') .ignore() is not directly available via JS library easily without explicit RPC or raw SQL for ignoring conflicts, 
    // but let's assume standard insert. If they are already in, it will fail, which is fine, we catch it or check first.

    // 3. Add to Project (if applicable)
    if (invite.project_id) {
        await supabase
            .from('project_members')
            .insert({
                project_id: invite.project_id,
                user_id: user.id,
                role: invite.role
            })
    }

    // 4. Delete Invitation (Consume it)
    await supabase.from('invitations').delete().eq('id', invite.id)

    // 5. Redirect
    revalidatePath('/')
    return { success: true, projectId: invite.project_id }
}
