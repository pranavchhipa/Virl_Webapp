'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { SUPER_ADMIN_PIN } from '@/lib/admin-guard'
import { revalidatePath } from 'next/cache'

// Verify admin access - uses service role client to bypass RLS
// PIN auth is handled client-side via sessionStorage
function verifyAdmin() {
    const supabase = createAdminClient()
    return { supabase }
}

// ==========================================
// DASHBOARD STATS
// ==========================================
export async function getAdminStats() {
    const { supabase } = await verifyAdmin()

    // Basic counts
    const [users, workspaces, projects, assets] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('workspaces').select('id, plan_tier', { count: 'exact' }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('assets').select('id, file_size', { count: 'exact' }),
    ])

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Parallel fetch for more stats
    const [recentUsersRes, allUsersForActive] = await Promise.all([
        // Recent signups
        supabase
            .from('profiles')
            .select('id, email, full_name, created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(10),

        // All users with last_active_at for active calculation
        supabase
            .from('profiles')
            .select('id, created_at, last_active_at'),
    ])

    // Get plan distribution from USERS (Customer-centric view)
    // We need to fetch all users and their owned workspaces to determine their "effective" plan
    const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, workspaces(plan_tier)')

    let basicCount = 0
    let proCount = 0
    let customCount = 0

    const profiles = allProfiles || []
    profiles.forEach((profile: any) => {
        // specific logic: User is PRO if they own ANY pro workspace
        // User is CUSTOM if they own ANY custom workspace (Custom > Pro > Basic)
        const workspaces = profile.workspaces || []
        const plans = workspaces.map((w: any) => w.plan_tier)

        if (plans.includes('custom')) customCount++
        else if (plans.includes('pro')) proCount++
        else basicCount++
    })

    // Active users = users who logged in last 7 days
    const allUsersData = allUsersForActive.data || []
    const activeUsersCount = allUsersData.filter((u: any) => {
        const lastActive = u.last_active_at || u.created_at
        const daysSinceActive = Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24))
        return daysSinceActive <= 7
    }).length


    // Calculate total storage (using actual file_size)
    const totalStorageBytes = assets.data?.reduce((acc, a) => acc + (a.file_size || 0), 0) || 0
    const totalStorageMB = totalStorageBytes / (1024 * 1024)
    const totalStorageFormatted = totalStorageMB > 1024
        ? `${(totalStorageMB / 1024).toFixed(2)} GB`
        : `${totalStorageMB.toFixed(2)} MB`

    // Get signup stats for last 7 days (for chart)
    const { data: dailySignups } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString())

    const signupsByDay: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const key = date.toISOString().split('T')[0]
        signupsByDay[key] = 0
    }
    dailySignups?.forEach(u => {
        const key = new Date(u.created_at).toISOString().split('T')[0]
        if (signupsByDay[key] !== undefined) signupsByDay[key]++
    })

    return {
        // Basic counts
        totalUsers: users.count || 0,
        totalWorkspaces: workspaces.count || 0,
        totalProjects: projects.count || 0,
        totalAssets: assets.count || 0,

        // Plan distribution (from workspaces)
        planDistribution: {
            basic: basicCount,
            pro: proCount,
            custom: customCount,
        },

        // Activity metrics
        activeUsers: activeUsersCount,
        activeUsersPercent: allUsersData.length > 0 ? Math.round((activeUsersCount / allUsersData.length) * 100) : 0,

        // Storage
        storage: {
            totalBytes: totalStorageBytes,
            formatted: totalStorageFormatted,
            assetCount: assets.count || 0,
        },

        // Recent signups
        recentUsers: recentUsersRes.data || [],
        signupChart: Object.entries(signupsByDay).map(([date, count]) => ({ date, count })),
    }
}

// ==========================================
// USER MANAGEMENT
// ==========================================
export async function getAllUsers(page = 1, limit = 20, search?: string) {
    const { supabase } = await verifyAdmin()
    const offset = (page - 1) * limit

    let query = supabase
        .from('profiles')
        .select(`
            *,
            owned_workspaces:workspaces(id, plan_tier),
            member_workspaces:workspace_members(workspace:workspaces(id, plan_tier))
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    const { data, count, error } = await query
    if (error) throw error

    return {
        users: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
    }
}

export async function getUserDetails(userId: string) {
    const { supabase } = await verifyAdmin()

    // Parallel fetch all user data
    const [
        userRes,
        ownedWorkspacesRes,
        memberWorkspacesRes,
        projectMembersRes,
        lastActivityRes
    ] = await Promise.all([
        // User profile
        supabase.from('profiles').select('*').eq('id', userId).single(),

        // Workspaces user OWNS
        supabase.from('workspaces').select(`
            id, name, created_at, plan_tier, subscription_end_date,
            custom_storage_limit, custom_member_limit, custom_workspace_limit, custom_vixi_spark_limit,
            member_count:workspace_members(count),
            project_count:projects(count)
        `).eq('owner_id', userId),

        // Workspaces user is MEMBER of
        supabase.from('workspace_members').select(`
            role,
            workspace:workspaces(id, name, created_at)
        `).eq('user_id', userId),

        // Projects user is member of
        supabase.from('project_members').select(`
            role,
            project:projects(id, name, status, created_at, workspace_id)
        `).eq('user_id', userId),

        // Get last activity (most recent asset upload)
        supabase.from('assets')
            .select('created_at')
            .eq('uploaded_by', userId)
            .order('created_at', { ascending: false })
            .limit(1)
    ])

    if (userRes.error) throw userRes.error

    const user = userRes.data
    let ownedWorkspaces = ownedWorkspacesRes.data || []

    // Fallback: If detailed fetch failed (e.g. pending DB migration for custom limits), fetch basic data
    if (ownedWorkspacesRes.error) {
        console.warn('Workspace detailed fetch failed (likely missing columns), using fallback:', ownedWorkspacesRes.error)
        const { data: basicData } = await supabase.from('workspaces').select(`
            id, name, created_at, plan_tier, subscription_end_date,
            member_count:workspace_members(count),
            project_count:projects(count)
        `).eq('owner_id', userId)
        ownedWorkspaces = basicData?.map((ws: any) => ({
            ...ws,
            custom_storage_limit: null,
            custom_member_limit: null,
            custom_workspace_limit: null,
            custom_vixi_spark_limit: null
        })) || []
    }

    const memberWorkspaces = memberWorkspacesRes.data?.map(m => ({
        id: (m.workspace as any)?.id,
        name: (m.workspace as any)?.name,
        created_at: (m.workspace as any)?.created_at,
        role: m.role
    })).filter(w => w.id) || []
    const projects = projectMembersRes.data?.map(p => ({
        id: (p.project as any)?.id,
        name: (p.project as any)?.name,
        status: (p.project as any)?.status,
        created_at: (p.project as any)?.created_at,
        workspace_id: (p.project as any)?.workspace_id,
        role: p.role
    })).filter(pr => pr.id) || []

    // Get all workspace IDs the user owns
    const ownedWorkspaceIds = ownedWorkspaces.map((w: any) => w.id)

    // Fetch assets from workspaces the user owns (to show total storage)
    let assets: any[] = []
    let storageUsedBytes = 0

    if (ownedWorkspaceIds.length > 0) {
        // Get projects in owned workspaces
        const { data: ownedProjects } = await supabase
            .from('projects')
            .select('id')
            .in('workspace_id', ownedWorkspaceIds)

        const projectIds = ownedProjects?.map(p => p.id) || []

        if (projectIds.length > 0) {
            // Get all assets in those projects
            const { data: projectAssets } = await supabase
                .from('assets')
                .select('id, file_name, file_type, file_size, created_at')
                .in('project_id', projectIds)

            assets = projectAssets || []
            storageUsedBytes = assets.reduce((acc: number, a: any) => acc + (a.file_size || 0), 0)
        }
    }

    const storageUsedMB = (storageUsedBytes / (1024 * 1024)).toFixed(2)

    // Calculate health score (0-100)
    const daysSinceCreated = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    const lastActivity = lastActivityRes.data?.[0]?.created_at
    const daysSinceActivity = lastActivity
        ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceCreated

    let healthScore = 100
    // Reduce score based on inactivity
    if (daysSinceActivity > 30) healthScore -= 40
    else if (daysSinceActivity > 14) healthScore -= 25
    else if (daysSinceActivity > 7) healthScore -= 10

    // Boost for engagement
    if (ownedWorkspaces.length > 0) healthScore += 10
    if (projects.length > 2) healthScore += 10
    if (assets.length > 5) healthScore += 10

    // Clamp between 0-100
    healthScore = Math.max(0, Math.min(100, healthScore))

    // Determine health status
    let healthStatus: 'healthy' | 'at_risk' | 'critical' = 'healthy'
    if (healthScore < 40) healthStatus = 'critical'
    else if (healthScore < 70) healthStatus = 'at_risk'

    return {
        user,
        stats: {
            workspacesOwned: ownedWorkspaces.length,
            workspacesMember: memberWorkspaces.length,
            totalProjects: projects.length,
            activeProjects: projects.filter((p: any) => p.status === 'active').length,
            totalAssets: assets.length,
            storageUsedMB: parseFloat(storageUsedMB),
            storageUsedFormatted: parseFloat(storageUsedMB) > 1024
                ? `${(parseFloat(storageUsedMB) / 1024).toFixed(2)} GB`
                : `${storageUsedMB} MB`,
            daysSinceSignup: daysSinceCreated,
            daysSinceActivity,
            healthScore,
            healthStatus,
        },
        ownedWorkspaces: ownedWorkspaces.map((w: any) => ({
            ...w,
            memberCount: w.member_count?.[0]?.count || 0,
            projectCount: w.project_count?.[0]?.count || 0,
        })),
        memberWorkspaces,
        projects,
        recentAssets: assets.slice(0, 10),
    }
}

export async function deleteUser(userId: string) {
    const { supabase } = await verifyAdmin()

    // Delete user from profiles (will cascade)
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    if (error) throw error

    revalidatePath('/control-centre-X7kP2mN9vL3qR8wY5jT1/dashboard/users')
    return { success: true }
}

export async function suspendUser(userId: string, suspended: boolean) {
    const { supabase } = await verifyAdmin()

    // Update user's suspended status in profiles
    const { error } = await supabase
        .from('profiles')
        .update({ suspended, suspended_at: suspended ? new Date().toISOString() : null })
        .eq('id', userId)

    if (error) throw error

    revalidatePath('/control-centre-X7kP2mN9vL3qR8wY5jT1/dashboard/users')
    return { success: true, suspended }
}

export async function exportUserData(userId: string) {
    const { supabase } = await verifyAdmin()

    // Fetch all user data for export
    const [profile, workspaces, projects, assets] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('workspace_members').select(`
            workspace:workspaces(*)
        `).eq('user_id', userId),
        supabase.from('project_members').select(`
            project:projects(*)
        `).eq('user_id', userId),
        supabase.from('assets').select('*').eq('uploaded_by', userId),
    ])

    return {
        exportedAt: new Date().toISOString(),
        user: profile.data,
        workspaces: workspaces.data?.map(w => w.workspace) || [],
        projects: projects.data?.map(p => p.project) || [],
        assets: assets.data || [],
    }
}

// ==========================================
// WORKSPACE MANAGEMENT
// ==========================================
export async function getAllWorkspaces(page = 1, limit = 20, search?: string) {
    const { supabase } = await verifyAdmin()
    const offset = (page - 1) * limit

    let query = supabase
        .from('workspaces')
        .select(`
            *,
            owner:profiles!workspaces_owner_id_fkey(id, email, full_name),
            member_count:workspace_members(count),
            project_count:projects(count)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (search) {
        query = query.ilike('name', `%${search}%`)
    }

    const { data, count, error } = await query
    if (error) throw error

    return {
        workspaces: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
    }
}

export async function getWorkspaceDetails(workspaceId: string) {
    const { supabase } = await verifyAdmin()

    const [wsRes, membersRes, projectsRes] = await Promise.all([
        supabase.from('workspaces').select(`
            *,
            owner:profiles!workspaces_owner_id_fkey(id, email, full_name, avatar_url)
        `).eq('id', workspaceId).single(),
        supabase.from('workspace_members').select(`
            user:profiles(id, email, full_name, avatar_url),
            role,
            joined_at
        `).eq('workspace_id', workspaceId),
        supabase.from('projects').select('id, name, status, created_at').eq('workspace_id', workspaceId),
    ])

    if (wsRes.error) throw wsRes.error

    return {
        workspace: wsRes.data,
        members: membersRes.data || [],
        projects: projectsRes.data || [],
    }
}

export async function deleteWorkspace(workspaceId: string) {
    const { supabase } = await verifyAdmin()
    const { error } = await supabase.from('workspaces').delete().eq('id', workspaceId)
    if (error) throw error
    revalidatePath('/control-centre-X7kP2mN9vL3qR8wY5jT1/dashboard/workspaces')
    return { success: true }
}

/**
 * Update workspace plan tier (Admin Manual Override)
 */
export async function updateCustomerPlan(userId: string, planTier: 'basic' | 'pro' | 'custom') {
    const { supabase } = await verifyAdmin()

    // 1. Get user details and all owned workspaces
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single()

    if (userError || !user) throw new Error('User not found')

    const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('owner_id', userId)

    if (wsError) throw wsError

    const workspaceIds = workspaces.map(w => w.id)

    // 2. Update plan for ALL owned workspaces
    if (workspaceIds.length > 0) {
        const updatePayload: any = { plan_tier: planTier }

        // Update subscription end date base on plan
        if (planTier === 'basic') {
            updatePayload.subscription_end_date = null
        } else {
            // For Pro/Custom, default to 30 days from now for manual updates
            const date = new Date()
            date.setDate(date.getDate() + 30)
            updatePayload.subscription_end_date = date.toISOString()
        }

        const { error: updateError } = await supabase
            .from('workspaces')
            .update(updatePayload)
            .in('id', workspaceIds)

        if (updateError) throw updateError

        // Log to Subscription History (Manual)
        await supabase.from('subscription_history').insert({
            user_id: userId,
            plan_tier: planTier,
            change_type: 'manual_adjustment',
            amount: null,
            currency: 'INR',
            payment_method: 'manual',
            transaction_id: `admin_${new Date().getTime()}`,
            period_start: new Date().toISOString(),
            // If Basic, no end date. If Paid, use the one we just calculated
            period_end: updatePayload.subscription_end_date || null,
            metadata: { modified_by: 'admin' }
        })
    }

    // 3. Send SINGLE Email Notification
    if (process.env.RESEND_API_KEY) {
        try {
            const { Resend } = await import('resend')
            const resend = new Resend(process.env.RESEND_API_KEY)

            const workspaceNames = workspaces.map(w => w.name).join(', ')

            await resend.emails.send({
                from: process.env.MAIL_FROM || 'Virl <noreply@virl.in>',
                to: user.email,
                subject: `Plan Updated: Your account is now on ${planTier.charAt(0).toUpperCase() + planTier.slice(1)}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #6d28d9; margin: 0;">Plan Updated</h1>
                        </div>
                        <div style="background: #fdfbff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 24px;">
                            <p style="margin-top: 0;">Hello ${user.full_name || 'there'},</p>
                            <p>We've updated the subscription plan for your account. This change applies to <strong>all your workspaces</strong>.</p>
                            
                            <div style="background: #ffffff; border: 1px solid #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                                <span style="display: block; font-size: 14px; color: #6b7280; margin-bottom: 4px;">New Plan</span>
                                <span style="display: block; font-size: 24px; font-weight: bold; color: #111827; text-transform: capitalize;">${planTier}</span>
                            </div>

                            <p><strong>Updated Workspaces:</strong><br/>${workspaceNames || 'No active workspaces'}</p>

                            <p style="margin-top: 20px;">All features and limits associated with the <strong>${planTier}</strong> plan are now active across your account.</p>
                            
                            <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
                            <p style="font-size: 14px; color: #6b7280;">If you have any questions about this change, please contact support.</p>
                        </div>
                    </div>
                `
            })
        } catch (emailError) {
            console.error('Failed to send plan change email:', emailError)
        }
    }

    revalidatePath('/control-centre-X7kP2mN9vL3qR8wY5jT1/dashboard/workspaces')
    revalidatePath(`/control-centre-X7kP2mN9vL3qR8wY5jT1/dashboard/customers`)
    revalidatePath(`/control-centre-X7kP2mN9vL3qR8wY5jT1/dashboard/customers/${userId}`)
    return { success: true, planTier }
}

/**
 * Update granular limit overrides for a customer (Admin Manual Override)
 * This applies to ALL workspaces owned by the user to ensure consistency.
 */
export async function updateCustomerLimitOverrides(userId: string, overrides: import('@/lib/plan-limits').PlanLimitOverrides) {
    const { supabase } = await verifyAdmin()

    // 1. Get all owned workspaces
    const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', userId)

    if (wsError) throw wsError
    const workspaceIds = workspaces.map(w => w.id)

    if (workspaceIds.length === 0) return { success: true, message: 'No workspaces to update' }

    // 2. Update custom columns
    // We treat 'undefined' as 'no change', but the UI usually sends the whole usage object.
    // If null, it resets to plan default (which is what we want).
    const updatePayload: any = {}
    if (overrides.custom_storage_limit !== undefined) updatePayload.custom_storage_limit = overrides.custom_storage_limit
    if (overrides.custom_member_limit !== undefined) updatePayload.custom_member_limit = overrides.custom_member_limit
    if (overrides.custom_workspace_limit !== undefined) updatePayload.custom_workspace_limit = overrides.custom_workspace_limit
    if (overrides.custom_vixi_spark_limit !== undefined) updatePayload.custom_vixi_spark_limit = overrides.custom_vixi_spark_limit

    const { error: updateError } = await supabase
        .from('workspaces')
        .update(updatePayload)
        .in('id', workspaceIds)

    if (updateError) throw updateError

    // 3. Revalidate
    revalidatePath('/control-centre-X7kP2mN9vL3qR8wY5jT1/dashboard/workspaces')
    revalidatePath(`/control-centre-X7kP2mN9vL3qR8wY5jT1/dashboard/customers`)
    revalidatePath(`/control-centre-X7kP2mN9vL3qR8wY5jT1/dashboard/customers/${userId}`) // Important for the Manage Plan tab

    return { success: true }
}

// ==========================================
// PROJECT MANAGEMENT
// ==========================================
export async function getAllProjects(page = 1, limit = 20, search?: string) {
    const { supabase } = await verifyAdmin()
    const offset = (page - 1) * limit

    let query = supabase
        .from('projects')
        .select(`
            *,
            workspace:workspaces(id, name),
            asset_count:assets(count),
            member_count:project_members(count)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (search) {
        query = query.ilike('name', `%${search}%`)
    }

    const { data, count, error } = await query
    if (error) throw error

    return {
        projects: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
    }
}

export async function getProjectDetails(projectId: string) {
    const { supabase } = await verifyAdmin()

    const [projectRes, membersRes, assetsRes] = await Promise.all([
        supabase.from('projects').select(`
            *,
            workspace:workspaces(id, name)
        `).eq('id', projectId).single(),
        supabase.from('project_members').select(`
            user:profiles(id, email, full_name, avatar_url),
            role,
            joined_at
        `).eq('project_id', projectId),
        supabase.from('assets').select('id, file_name, file_type, status, created_at').eq('project_id', projectId).limit(50),
    ])

    if (projectRes.error) throw projectRes.error

    return {
        project: projectRes.data,
        members: membersRes.data || [],
        assets: assetsRes.data || [],
    }
}

export async function deleteProject(projectId: string) {
    const { supabase } = await verifyAdmin()
    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    if (error) throw error
    revalidatePath('/control-centre-X7kP2mN9vL3qR8wY5jT1/dashboard/projects')
    return { success: true }
}

// ==========================================
// ACTIVITY LOGS
// ==========================================
export async function getActivityLogs() {
    const { supabase } = await verifyAdmin()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [signups, projects, assets] = await Promise.all([
        supabase.from('profiles')
            .select('id, email, full_name, created_at')
            .order('created_at', { ascending: false })
            .limit(20),
        supabase.from('projects')
            .select('id, name, created_at, workspace:workspaces(name)')
            .order('created_at', { ascending: false })
            .limit(20),
        supabase.from('assets')
            .select('id, file_name, file_type, created_at, project:projects(name)')
            .order('created_at', { ascending: false })
            .limit(20),
    ])

    const logs: Array<{
        id: string
        type: 'signup' | 'project' | 'asset'
        title: string
        subtitle: string
        timestamp: string
    }> = []

    signups.data?.forEach(u => logs.push({
        id: `signup-${u.id}`,
        type: 'signup',
        title: u.full_name || u.email,
        subtitle: 'New user signup',
        timestamp: u.created_at,
    }))

    projects.data?.forEach(p => logs.push({
        id: `project-${p.id}`,
        type: 'project',
        title: p.name,
        subtitle: `Created in ${(p.workspace as any)?.name || 'Unknown workspace'}`,
        timestamp: p.created_at,
    }))

    assets.data?.forEach(a => logs.push({
        id: `asset-${a.id}`,
        type: 'asset',
        title: a.file_name,
        subtitle: `Uploaded to ${(a.project as any)?.name || 'Unknown project'}`,
        timestamp: a.created_at,
    }))

    // Sort by timestamp
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return logs.slice(0, 50)
}

// ==========================================
// SYSTEM SETTINGS
// ==========================================
export async function getSystemInfo() {
    const { supabase } = await verifyAdmin()

    // Get assets with file_size for real storage calculation
    const { data: assets, count: assetCount } = await supabase
        .from('assets')
        .select('file_size', { count: 'exact' })

    // Sum actual file sizes
    const totalStorageBytes = assets?.reduce((sum, a) => sum + (a.file_size || 0), 0) || 0

    return {
        currentPin: SUPER_ADMIN_PIN.slice(0, 2) + '****', // Masked PIN
        nodeEnv: process.env.NODE_ENV,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
        r2Configured: !!process.env.R2_ACCESS_KEY_ID,
        totalAssets: assetCount || 0,
        totalStorageBytes,
    }
}

// ==========================================
// ADMIN ACTIONS
// ==========================================

/**
 * Clear all server-side cache by revalidating paths
 */
export async function clearAllCache() {
    await verifyAdmin()

    // Revalidate major paths
    revalidatePath('/dashboard')
    revalidatePath('/projects')
    revalidatePath('/workspaces')
    revalidatePath('/control-centre-X7kP2mN9vL3qR8wY5jT1/dashboard')

    return { success: true, message: 'Cache cleared successfully' }
}

/**
 * Send test email to verify SMTP configuration
 */
export async function sendTestEmail(email?: string) {
    await verifyAdmin()

    const testEmail = email || 'pranavchhipa01@gmail.com'

    // Use existing notification system
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    try {
        await resend.emails.send({
            from: process.env.MAIL_FROM || 'Virl <noreply@virl.in>',
            to: testEmail,
            subject: '✅ Virl Control Centre - Test Email',
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>🎉 Test Email Successful!</h2>
                    <p>This confirms your email configuration is working correctly.</p>
                    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                    <p style="color: #666; font-size: 12px;">— Virl Control Centre</p>
                </div>
            `
        })
        return { success: true, message: `Test email sent to ${testEmail}` }
    } catch (error) {
        console.error('Test email failed:', error)
        return { success: false, message: 'Email sending failed - check RESEND_API_KEY' }
    }
}

/**
 * Purge users inactive for more than specified days
 */
export async function purgeInactiveUsers(inactiveDays: number = 90) {
    const { supabase } = await verifyAdmin()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays)

    // Find users with no recent assets uploaded (as activity indicator)
    const { data: activeUserIds } = await supabase
        .from('assets')
        .select('uploaded_by')
        .gte('created_at', cutoffDate.toISOString())

    const activeIds = new Set(activeUserIds?.map(a => a.uploaded_by) || [])

    // Get all users
    const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .lt('created_at', cutoffDate.toISOString())

    // Filter those not in active list
    const inactiveUsers = allUsers?.filter(u => !activeIds.has(u.id)) || []

    // For safety, just return the list - actual deletion requires confirmation
    return {
        success: true,
        inactiveCount: inactiveUsers.length,
        message: `Found ${inactiveUsers.length} inactive users (no activity in ${inactiveDays} days)`,
        users: inactiveUsers.slice(0, 10) // Return first 10 for preview
    }
}

/**
 * Export all platform data as JSON
 */
export async function exportAllData() {
    const { supabase } = await verifyAdmin()

    const [users, workspaces, projects, assets] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('workspaces').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('assets').select('*'),
    ])

    const exportData = {
        exportedAt: new Date().toISOString(),
        users: users.data || [],
        workspaces: workspaces.data || [],
        projects: projects.data || [],
        assets: assets.data || [],
        stats: {
            totalUsers: users.data?.length || 0,
            totalWorkspaces: workspaces.data?.length || 0,
            totalProjects: projects.data?.length || 0,
            totalAssets: assets.data?.length || 0,
        }
    }

    return {
        success: true,
        data: exportData,
        message: 'Export generated successfully'
    }
}

/**
 * Get full subscription history for a user
 */
export async function getUserSubscriptionHistory(userId: string) {
    const { supabase } = await verifyAdmin()

    const { data, error } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}


