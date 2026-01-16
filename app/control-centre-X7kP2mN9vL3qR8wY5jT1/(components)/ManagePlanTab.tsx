'use client'

import { useState, useEffect } from 'react'
import { Check, Crown, Loader2, Sparkles, User, Zap, AlertTriangle, Save, RefreshCw } from 'lucide-react'
import { updateCustomerPlan, updateCustomerLimitOverrides } from '@/app/actions/admin'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PlanLimitOverrides } from '@/lib/plan-limits'

type PlanTier = 'basic' | 'pro' | 'custom'

interface ManagePlanTabProps {
    userId: string
    currentPlan: PlanTier
    initialOverrides: PlanLimitOverrides
    onUpdate: () => void
}

const plans = [
    { id: 'basic', label: 'Basic', icon: User, color: 'text-slate-500 bg-slate-100 border-slate-200' },
    { id: 'pro', label: 'Pro', icon: Crown, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'custom', label: 'Custom', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200' },
]

export function ManagePlanTab({ userId, currentPlan, initialOverrides, onUpdate }: ManagePlanTabProps) {
    const [selectedPlan, setSelectedPlan] = useState<PlanTier>(currentPlan)
    const [loading, setLoading] = useState(false)

    // Granular Limits State
    const [useCustomLimits, setUseCustomLimits] = useState(!!initialOverrides.custom_storage_limit)
    const [limits, setLimits] = useState<{
        storageGB: string
        members: string
        workspaces: string
        sparks: string
    }>({
        storageGB: initialOverrides.custom_storage_limit ? (initialOverrides.custom_storage_limit / (1024 * 1024 * 1024)).toString() : '',
        members: initialOverrides.custom_member_limit?.toString() || '',
        workspaces: initialOverrides.custom_workspace_limit?.toString() || '',
        sparks: initialOverrides.custom_vixi_spark_limit?.toString() || '',
    })

    useEffect(() => {
        // Reset local state if props change (re-fetch)
        setSelectedPlan(currentPlan)
        setLimits({
            storageGB: initialOverrides.custom_storage_limit ? (initialOverrides.custom_storage_limit / (1024 * 1024 * 1024)).toString() : '',
            members: initialOverrides.custom_member_limit?.toString() || '',
            workspaces: initialOverrides.custom_workspace_limit?.toString() || '',
            sparks: initialOverrides.custom_vixi_spark_limit?.toString() || '',
        })
        setUseCustomLimits(Object.values(initialOverrides).some(v => v !== null))
    }, [currentPlan, initialOverrides])

    async function handleSaveChanges() {
        setLoading(true)
        try {
            // 1. Update Plan Tier if changed
            if (selectedPlan !== currentPlan) {
                await updateCustomerPlan(userId, selectedPlan)
            }

            // 2. Update Custom Limits
            // Convert inputs to numbers or null
            const overrides: PlanLimitOverrides = {
                custom_storage_limit: limits.storageGB ? parseFloat(limits.storageGB) * 1024 * 1024 * 1024 : null,
                custom_member_limit: limits.members ? parseInt(limits.members) : null,
                custom_workspace_limit: limits.workspaces ? parseInt(limits.workspaces) : null,
                custom_vixi_spark_limit: limits.sparks ? parseInt(limits.sparks) : null,
            }

            // If not on Custom plan, force reset limits to defaults (null)
            if (selectedPlan !== 'custom') {
                overrides.custom_storage_limit = null
                overrides.custom_member_limit = null
                overrides.custom_workspace_limit = null
                overrides.custom_vixi_spark_limit = null
            }

            await updateCustomerLimitOverrides(userId, overrides)

            toast.success('Plan and limits updated successfully')
            onUpdate()
        } catch (error) {
            console.error(error)
            toast.error('Failed to update settings')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Plan Tier Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-violet-600" />
                    Subscription Tier
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPlan(p.id as PlanTier)}
                            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${selectedPlan === p.id
                                ? `border-violet-600 bg-violet-50 ring-1 ring-violet-600/20`
                                : 'border-gray-100 hover:border-violet-200 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`p-3 rounded-full mb-3 ${p.color} bg-white`}>
                                <p.icon className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-gray-900">{p.label}</span>
                            {selectedPlan === p.id && <Check className="w-5 h-5 text-violet-600 mt-2" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Granular Limits Configuration - Only for Custom Plan */}
            {selectedPlan === 'custom' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" />
                                Custom Resource Limits
                            </h3>
                            <p className="text-sm text-gray-500">Override default plan limits for this user</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Storage */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Storage Limit (GB)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={limits.storageGB}
                                    onChange={(e) => setLimits({ ...limits, storageGB: e.target.value })}
                                    placeholder="Default"
                                    className="w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                                />
                                <span className="absolute right-3 top-2.5 text-gray-400 text-sm">GB</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Leave empty to use plan default</p>
                        </div>

                        {/* Vixi Sparks */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vixi Sparks / Month</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={limits.sparks}
                                    onChange={(e) => setLimits({ ...limits, sparks: e.target.value })}
                                    placeholder="Default"
                                    className="w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                                />
                                <span className="absolute right-3 top-2.5 text-gray-400 text-sm">⚡</span>
                            </div>
                        </div>

                        {/* Workspaces */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Workspaces</label>
                            <input
                                type="number"
                                value={limits.workspaces}
                                onChange={(e) => setLimits({ ...limits, workspaces: e.target.value })}
                                placeholder="Default"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                            />
                        </div>

                        {/* Members */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Members / Workspace</label>
                            <input
                                type="number"
                                value={limits.members}
                                onChange={(e) => setLimits({ ...limits, members: e.target.value })}
                                placeholder="Default"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-amber-800">Global Account Override</h4>
                            <p className="text-xs text-amber-700 mt-1">
                                These limits will apply to <b>ALL workspaces</b> owned by this user.
                                <br />
                                Specific values (e.g. 100 GB) take precedence over the Plan Tier defaults.
                                Clear a field to revert to the Plan Tier's default value.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <Button
                    onClick={handleSaveChanges}
                    disabled={loading}
                    className="bg-violet-600 hover:bg-violet-700 text-white min-w-[140px]"
                >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>

                {/* Reset Button (Optional, for now just use Clear fields) */}
            </div>
        </div>
    )
}
