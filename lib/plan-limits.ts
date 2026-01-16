/**
 * Plan Limits Configuration
 * Defines resource limits for each subscription tier
 */

export type PlanTier = 'basic' | 'pro' | 'custom';

export interface PlanLimits {
    workspaces: number;
    members: number;
    storageGB: number;
    vixiSparksPerMonth: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
    basic: {
        workspaces: 1,
        members: 3, // Creator + 2 invites
        storageGB: 5,
        vixiSparksPerMonth: 30,
    },
    pro: {
        workspaces: 3,
        members: 10, // Creator + 9 invites
        storageGB: 50,
        vixiSparksPerMonth: 300,
    },
    custom: {
        workspaces: Infinity,
        members: Infinity,
        storageGB: Infinity,
        vixiSparksPerMonth: Infinity,
    },
};

/**
 * Pricing in INR (for display purposes)
 */
export const PLAN_PRICING = {
    basic: {
        monthly: 0, // Free for limited time
        originalPrice: 249, // Shown with strikethrough
        currency: 'INR',
    },
    pro: {
        monthly: 799,
        currency: 'INR',
    },
    custom: {
        monthly: null, // Contact Sales
        currency: 'INR',
    },
};

/**
 * Helper to get limits for a plan tier
 */
export function getPlanLimits(tier: PlanTier): PlanLimits {
    return PLAN_LIMITS[tier] || PLAN_LIMITS.basic;
}

/**
 * Check if subscription is active based on end date.
 * If expired, downgrades to basic.
 */
export function checkSubscriptionStatus(tier: PlanTier, endDate: string | null): PlanTier {
    if (tier === 'basic') return 'basic';
    if (!endDate) return 'basic'; // No end date on paid plan = invalid/expired (unless custom logic changes)

    // Exception: If end date is null but tier is Pro/Custom, arguably it might be infinite?
    // User context: "Lazy check".
    // For now, if paid plan has NO date, we assume it's valid (legacy) OR invalid?
    // Actually, in previous steps I set it to 30 days.
    // If it's null, safe to assume it's NOT expired (lifetme?) or incomplete. 
    // BUT user had issue with null date. 
    // Let's rely on date validation mainly. 

    if (new Date(endDate) < new Date()) {
        return 'basic';
    }
    return tier;
}

/**
 * Check if a value exceeds the plan limit
 */
export function isOverLimit(
    tier: PlanTier,
    metric: keyof PlanLimits,
    currentValue: number
): boolean {
    const limits = getPlanLimits(tier);
    const limit = limits[metric];
    if (limit === Infinity) return false;
    return currentValue >= limit;
}

/**
 * Get remaining quota for a metric
 */
export function getRemainingQuota(
    tier: PlanTier,
    metric: keyof PlanLimits,
    currentValue: number
): number {
    const limits = getPlanLimits(tier);
    const limit = limits[metric];
    if (limit === Infinity) return Infinity;
    return Math.max(0, limit - currentValue);
}

/**
 * Limit Overrides from Database (workspaces table)
 */
export interface PlanLimitOverrides {
    custom_storage_limit?: number | null; // Bytes
    custom_member_limit?: number | null;
    custom_workspace_limit?: number | null;
    custom_vixi_spark_limit?: number | null;
}

/**
 * Calculate effective limits merging Tier defaults + Overrides
 */
export function getEffectiveLimits(tier: PlanTier, overrides?: PlanLimitOverrides): PlanLimits {
    const base = getPlanLimits(tier);
    if (!overrides) return base;

    return {
        workspaces: overrides.custom_workspace_limit ?? base.workspaces,
        members: overrides.custom_member_limit ?? base.members,
        // Convert Bytes override to GB for consistency. 
        storageGB: overrides.custom_storage_limit
            ? overrides.custom_storage_limit / (1024 * 1024 * 1024)
            : base.storageGB,
        vixiSparksPerMonth: overrides.custom_vixi_spark_limit ?? base.vixiSparksPerMonth,
    };
}
