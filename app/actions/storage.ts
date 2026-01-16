'use server'

import { createClient } from '@/lib/supabase/server'
import { getPlanLimits, PlanTier, checkSubscriptionStatus } from '@/lib/plan-limits'

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    if (bytes === Infinity) return 'Unlimited'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Get workspace's plan tier
 */
export async function getWorkspacePlanTier(workspaceId: string): Promise<PlanTier> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('workspaces')
        .select('plan_tier, subscription_end_date')
        .eq('id', workspaceId)
        .single()

    if (error || !data) {
        console.error('Error fetching workspace plan:', error)
        return 'basic' // Default to basic if error
    }

    const tier = (data.plan_tier as PlanTier) || 'basic'
    return checkSubscriptionStatus(tier, data.subscription_end_date)
}

/**
 * Get storage usage for a specific workspace (LOCAL ONLY - Internal Helper)
 */
async function _calculateWorkspaceLocalUsage(workspaceId: string): Promise<number> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('assets')
        .select('file_size, project:projects!inner(workspace_id)')
        .eq('project.workspace_id', workspaceId)

    return data?.reduce((sum, a) => sum + (a.file_size || 0), 0) || 0
}

/**
 * Get storage usage for a specific workspace (Returns GLOBAL ACCOUNT usage)
 * used = Total Account Usage
 * limit = Account Limit
 */
export async function getWorkspaceStorage(workspaceId: string): Promise<{
    used: number
    limit: number
    usedFormatted: string
    limitFormatted: string
    percentUsed: number
    planTier: PlanTier
}> {
    const supabase = await createClient()

    // 1. Get workspace details to find owner
    const { data: workspace, error } = await supabase
        .from('workspaces')
        .select('owner_id, plan_tier, subscription_end_date')
        .eq('id', workspaceId)
        .single()

    if (error || !workspace) {
        console.error('Error fetching workspace:', error)
        return {
            used: 0,
            limit: 0,
            usedFormatted: '0 Bytes',
            limitFormatted: '0 Bytes',
            percentUsed: 0,
            planTier: 'basic'
        }
    }

    const rawTier = (workspace.plan_tier as PlanTier) || 'basic'
    const planTier = checkSubscriptionStatus(rawTier, workspace.subscription_end_date)

    // 2. Get GLOBAL usage for this owner
    const userStorage = await getUserStorage(workspace.owner_id)

    // 3. Get Plan Limits (Single limit for the account)
    const limits = getPlanLimits(planTier)
    const limitBytes = limits.storageGB === Infinity ? Infinity : limits.storageGB * 1024 * 1024 * 1024

    return {
        used: userStorage.used,
        limit: limitBytes,
        usedFormatted: formatBytes(userStorage.used),
        limitFormatted: formatBytes(limitBytes),
        percentUsed: limitBytes === Infinity ? 0 : Math.round((userStorage.used / limitBytes) * 100),
        planTier
    }
}

/**
 * Check if a new upload would exceed the workspace's storage limit based on plan
 */
export async function checkStorageLimit(projectId: string, newFileSize: number): Promise<{
    allowed: boolean
    currentUsed: number
    limit: number
    wouldUse: number
    planTier: PlanTier
    message?: string
}> {
    const supabase = await createClient()

    // 1. Get workspace and OWNER from project
    const { data: project } = await supabase
        .from('projects')
        .select('workspace:workspaces(id, owner_id, plan_tier, subscription_end_date)')
        .eq('id', projectId)
        .single()

    if (!project || !project.workspace) {
        return { allowed: false, currentUsed: 0, limit: 0, wouldUse: 0, planTier: 'basic', message: 'Project or workspace not found' }
    }

    // Fix TS error: explicit cast or check array
    const workspaceData = project.workspace
    const workspace = Array.isArray(workspaceData) ? workspaceData[0] : workspaceData

    if (!workspace) return { allowed: false, currentUsed: 0, limit: 0, wouldUse: 0, planTier: 'basic', message: 'Workspace not found' }

    const ownerId = workspace.owner_id
    const rawTier = (workspace.plan_tier as PlanTier) || 'basic'
    const planTier = checkSubscriptionStatus(rawTier, workspace.subscription_end_date)

    // 2. Get GLOBAL usage for this owner
    const userStorage = await getUserStorage(ownerId)
    const globalUsed = userStorage.used

    // 3. Get GLOBAL limit
    const limits = getPlanLimits(planTier)
    const globalLimit = limits.storageGB === Infinity ? Infinity : limits.storageGB * 1024 * 1024 * 1024

    const wouldUse = globalUsed + newFileSize

    if (globalLimit === Infinity) {
        return {
            allowed: true,
            currentUsed: globalUsed,
            limit: globalLimit,
            wouldUse,
            planTier
        }
    }

    if (wouldUse > globalLimit) {
        return {
            allowed: false,
            currentUsed: globalUsed,
            limit: globalLimit,
            wouldUse,
            planTier,
            message: `Account storage limit exceeded. Your account uses ${formatBytes(globalUsed)} of ${formatBytes(globalLimit)}. Upgrade to Custom for more!`
        }
    }

    return {
        allowed: true,
        currentUsed: globalUsed,
        limit: globalLimit,
        wouldUse,
        planTier
    }
}

/**
 * Get user's total storage usage across all workspaces they own (for dashboard display)
 */
export async function getUserStorage(userId: string): Promise<{
    used: number
    limit: number
    usedFormatted: string
    limitFormatted: string
    percentUsed: number
}> {
    const supabase = await createClient()
    const { getEffectiveLimits, checkSubscriptionStatus } = await import('@/lib/plan-limits')

    // Get all workspaces owned by this user
    const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id, plan_tier, subscription_end_date, custom_storage_limit')
        .eq('owner_id', userId)

    if (!workspaces || workspaces.length === 0) {
        const basicLimit = 5 * 1024 * 1024 * 1024 // 5GB
        return {
            used: 0,
            limit: basicLimit,
            usedFormatted: '0 Bytes',
            limitFormatted: formatBytes(basicLimit),
            percentUsed: 0
        }
    }

    // Sum storage usage
    let totalUsed = 0
    for (const ws of workspaces) {
        const usage = await _calculateWorkspaceLocalUsage(ws.id)
        totalUsed += usage
    }

    // Determine Effective Limit: MAX of any workspace's effective limit
    // (If a user has 3 workspaces: Basic, Pro, Custom(1TB) -> Limit is 1TB)
    let maxLimitBytes = 0

    workspaces.forEach(ws => {
        const rawTier = (ws.plan_tier as PlanTier) || 'basic'
        const tier = checkSubscriptionStatus(rawTier, ws.subscription_end_date)
        // Pass overrides if they exist
        const overrides = ws.custom_storage_limit !== null ? { custom_storage_limit: ws.custom_storage_limit } : undefined

        const limits = getEffectiveLimits(tier, overrides)
        const limitBytes = limits.storageGB === Infinity ? Infinity : limits.storageGB * 1024 * 1024 * 1024

        if (limitBytes === Infinity) {
            maxLimitBytes = Infinity
        } else if (maxLimitBytes !== Infinity && limitBytes > maxLimitBytes) {
            maxLimitBytes = limitBytes
        }
    })

    return {
        used: totalUsed,
        limit: maxLimitBytes,
        usedFormatted: formatBytes(totalUsed),
        limitFormatted: formatBytes(maxLimitBytes),
        percentUsed: maxLimitBytes === Infinity ? 0 : (maxLimitBytes === 0 ? 100 : Math.round((totalUsed / maxLimitBytes) * 100))
    }
}

