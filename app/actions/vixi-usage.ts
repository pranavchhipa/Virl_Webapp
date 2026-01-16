'use server';

import { createClient } from '@/lib/supabase/server';
import { getPlanLimits, PlanTier, checkSubscriptionStatus } from '@/lib/plan-limits';

/**
 * Get the current month's first day for usage tracking
 */
function getCurrentMonthStart(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Get the workspace's owner ID and plan tier
 */
export async function getWorkspaceDetails(workspaceId: string): Promise<{ ownerId: string, planTier: PlanTier, subscriptionEndDate: string | null }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('workspaces')
        .select('owner_id, plan_tier, subscription_end_date')
        .eq('id', workspaceId)
        .single();

    if (error || !data) {
        console.error('Error fetching workspace details:', error);
        return { ownerId: '', planTier: 'basic', subscriptionEndDate: null };
    }

    return {
        ownerId: data.owner_id,
        planTier: (data.plan_tier as PlanTier) || 'basic',
        subscriptionEndDate: data.subscription_end_date
    };
}

/**
 * Get TOTAL Vixi Sparks usage for a USER across ALL their workspaces
 */
export async function getUserVixiUsage(userId: string): Promise<{ totalUsage: number }> {
    const supabase = await createClient();
    const usageMonth = getCurrentMonthStart();

    // 1. Get all workspaces owned by user
    const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', userId);

    if (!workspaces || workspaces.length === 0) return { totalUsage: 0 };

    const workspaceIds = workspaces.map(w => w.id);

    // 2. Sum usage for all these workspaces
    const { data: usageData } = await supabase
        .from('monthly_vixi_usage')
        .select('spark_count')
        .in('workspace_id', workspaceIds)
        .eq('usage_month', usageMonth);

    const totalUsage = usageData?.reduce((sum, row) => sum + (row.spark_count || 0), 0) || 0;
    return { totalUsage };
}

/**
 * Get the current Vixi Sparks usage for a workspace (GLOBAL ACCOUNT USAGE)
 */
export async function getVixiUsage(workspaceId: string): Promise<{
    sparkCount: number;
    limit: number;
    remaining: number;
    planTier: PlanTier;
    usedByWorkspace: number; // Usage specific to this workspace
}> {
    const supabase = await createClient();
    const { getEffectiveLimits } = await import('@/lib/plan-limits');
    const usageMonth = getCurrentMonthStart();

    // Get owner and plan
    const { ownerId, planTier: rawCurrentTier, subscriptionEndDate } = await getWorkspaceDetails(workspaceId);
    // Determine effective plan for current workspace (for display)
    const planTier = checkSubscriptionStatus(rawCurrentTier, subscriptionEndDate);

    // Get ALL workspaces for this owner to determine Global Effective Limit
    const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id, plan_tier, subscription_end_date, custom_vixi_spark_limit')
        .eq('owner_id', ownerId);

    let maxLimit = 0;
    if (workspaces && workspaces.length > 0) {
        workspaces.forEach(ws => {
            const rawTier = (ws.plan_tier as PlanTier) || 'basic';
            const tier = checkSubscriptionStatus(rawTier, ws.subscription_end_date);
            const overrides = ws.custom_vixi_spark_limit !== null ? { custom_vixi_spark_limit: ws.custom_vixi_spark_limit } : undefined;
            const limits = getEffectiveLimits(tier, overrides);
            if (limits.vixiSparksPerMonth === Infinity) {
                maxLimit = Infinity;
            } else if (maxLimit !== Infinity && limits.vixiSparksPerMonth > maxLimit) {
                maxLimit = limits.vixiSparksPerMonth;
            }
        });
    } else {
        maxLimit = getPlanLimits('basic').vixiSparksPerMonth;
    }

    // Get GLOBAL usage
    const { totalUsage: globalUsage } = await getUserVixiUsage(ownerId);

    // Get LOCAL usage (just for display/info)
    const { data: localData } = await supabase
        .from('monthly_vixi_usage')
        .select('spark_count')
        .eq('workspace_id', workspaceId)
        .eq('usage_month', usageMonth)
        .single();
    const localUsage = localData?.spark_count || 0;

    const remaining = maxLimit === Infinity ? Infinity : Math.max(0, maxLimit - globalUsage);

    return {
        sparkCount: globalUsage, // Return GLOBAL usage as the primary metric
        limit: maxLimit,
        remaining,
        planTier,
        usedByWorkspace: localUsage
    };
}

/**
 * Check if workspace check use Vixi Spark (GLOBAL CHECK)
 */
export async function canUseVixiSpark(workspaceId: string): Promise<{
    allowed: boolean;
    sparkCount: number;
    limit: number;
    message?: string;
}> {
    // getVixiUsage now returns global usage
    const usage = await getVixiUsage(workspaceId);

    if (usage.limit === Infinity) {
        return { allowed: true, sparkCount: usage.sparkCount, limit: usage.limit };
    }

    if (usage.sparkCount >= usage.limit) {
        return {
            allowed: false,
            sparkCount: usage.sparkCount,
            limit: usage.limit,
            message: `Account limit reached. You've used all ${usage.limit} Vixi Sparks across your workspaces. Upgrade to Custom for unlimited!`,
        };
    }

    return { allowed: true, sparkCount: usage.sparkCount, limit: usage.limit };
}

/**
 * Increment Vixi Spark usage (after successful generation)
 */
export async function incrementVixiSpark(workspaceId: string): Promise<{
    success: boolean;
    newCount: number;
    limit: number;
}> {
    const supabase = await createClient();
    const usageMonth = getCurrentMonthStart();

    const { ownerId, planTier: rawTier, subscriptionEndDate } = await getWorkspaceDetails(workspaceId);
    const planTier = checkSubscriptionStatus(rawTier, subscriptionEndDate);
    const limits = getPlanLimits(planTier);

    // Upsert usage record for THIS workspace (we still track per workspace DB rows)
    const { data: existingRow } = await supabase
        .from('monthly_vixi_usage')
        .select('id, spark_count')
        .eq('workspace_id', workspaceId)
        .eq('usage_month', usageMonth)
        .single();

    if (existingRow) {
        await supabase
            .from('monthly_vixi_usage')
            .update({ spark_count: existingRow.spark_count + 1, updated_at: new Date().toISOString() })
            .eq('id', existingRow.id);
    } else {
        await supabase
            .from('monthly_vixi_usage')
            .insert({ workspace_id: workspaceId, usage_month: usageMonth, spark_count: 1 });
    }

    // Return new GLOBAL count
    const { totalUsage } = await getUserVixiUsage(ownerId);

    return {
        success: true,
        newCount: totalUsage,
        limit: limits.vixiSparksPerMonth,
    };
}
