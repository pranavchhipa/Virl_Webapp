'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getPlanLimits, PlanTier, checkSubscriptionStatus } from '@/lib/plan-limits'

export async function createWorkspaceAction({
    name,
    description
}: {
    name: string
    description?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Check workspace limit based on user's highest plan tier
    const { data: userWorkspaces } = await supabase
        .from('workspaces')
        .select('id, plan_tier, subscription_end_date')
        .eq('owner_id', user.id)

    const workspaceCount = userWorkspaces?.length || 0

    // Get the highest plan tier among all workspaces (use that for limit calculation)
    let highestTier: PlanTier = 'basic'
    if (userWorkspaces && userWorkspaces.length > 0) {
        const tiers = userWorkspaces.map(w => {
            const rawTier = (w.plan_tier as PlanTier) || 'basic'
            return checkSubscriptionStatus(rawTier, w.subscription_end_date)
        })
        if (tiers.includes('custom')) highestTier = 'custom'
        else if (tiers.includes('pro')) highestTier = 'pro'
    }

    const limits = getPlanLimits(highestTier)

    if (limits.workspaces !== Infinity && workspaceCount >= limits.workspaces) {
        return {
            error: `Workspace limit reached (${workspaceCount}/${limits.workspaces}). Upgrade to Pro for more workspaces!`,
            limitReached: true,
            currentWorkspaces: workspaceCount,
            workspaceLimit: limits.workspaces
        }
    }

    // Create workspace
    // Inherit plan: If user has a Pro/Custom workspace, new one should match (User-level subscription)
    const newWorkspacePlan = (highestTier === 'pro' || highestTier === 'custom') ? highestTier : 'basic'

    const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
            name,
            owner_id: user.id,
            plan_tier: newWorkspacePlan
        })
        .select()
        .single()

    if (workspaceError) {
        console.error('Workspace creation error:', workspaceError)
        return { error: 'Failed to create workspace' }
    }

    // Add user as owner
    const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
            workspace_id: workspace.id,
            user_id: user.id,
            role: 'owner'
        })

    if (memberError) {
        console.error('Member insert error:', memberError)
        // Rollback workspace creation
        await supabase.from('workspaces').delete().eq('id', workspace.id)
        return { error: 'Failed to set workspace owner' }
    }

    revalidatePath('/dashboard')
    return { workspaceId: workspace.id }
}
