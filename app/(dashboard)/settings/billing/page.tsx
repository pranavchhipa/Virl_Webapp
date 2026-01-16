'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, differenceInDays } from 'date-fns'
import { getWorkspaceStorage } from '@/app/actions/storage'
import { getVixiUsage } from '@/app/actions/vixi-usage'
import { PLAN_LIMITS, PLAN_PRICING, PlanTier } from '@/lib/plan-limits'
import {
    Crown, HardDrive, ArrowUpRight,
    Check, Loader2, AlertCircle, Users, FolderKanban
} from 'lucide-react'
import { VixiSparksIcon } from '@/components/icons/vixi-sparks-icon'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface UsageData {
    sparks: { count: number; limit: number }
    storage: { used: number; limit: number; usedFormatted: string; limitFormatted: string }
    members: number
    workspaces: number
    planTier: PlanTier
    renewalDate: string | null
}

// ... existing helper functions ...

// Inside loadData:


function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    if (bytes === Infinity) return 'Unlimited'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function UsageBar({ current, max, label, icon: Icon, color }: {
    current: number
    max: number
    label: string
    icon: any
    color: 'purple' | 'blue' | 'amber'
}) {
    const percentage = max === Infinity ? 0 : Math.min(100, (current / max) * 100)
    const isUnlimited = max === Infinity

    const colorClasses = {
        purple: 'bg-purple-500',
        blue: 'bg-blue-500',
        amber: 'bg-amber-500'
    }

    return (
        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon className={cn("h-6 w-6", color === 'purple' ? 'text-purple-500' : color === 'blue' ? 'text-blue-500' : 'text-amber-500')} size="lg" />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                    {current} / {isUnlimited ? '∞' : max}
                </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all", colorClasses[color])}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {!isUnlimited && percentage >= 80 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {percentage >= 100 ? 'Limit reached!' : 'Approaching limit'}
                </p>
            )}
        </div>
    )
}

import { requestEnterprisePlan } from '@/app/actions/billing'

import { useRouter } from 'next/navigation'

export default function BillingPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [contactLoading, setContactLoading] = useState(false)
    const [usage, setUsage] = useState<UsageData | null>(null)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)
    const [isOwner, setIsOwner] = useState(false)

    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                setUser(user)

                // Get user's primary workspace (first owned workspace)
                const { data: workspaces } = await supabase
                    .from('workspaces')
                    .select('id, plan_tier, owner_id')
                    .eq('owner_id', user.id)
                    .limit(1)

                if (!workspaces || workspaces.length === 0) {
                    // User doesn't own any workspace - Set View to BASIC
                    setUsage({
                        sparks: { count: 0, limit: PLAN_LIMITS['basic'].vixiSparksPerMonth },
                        storage: {
                            used: 0,
                            limit: PLAN_LIMITS['basic'].storageGB * 1024 * 1024 * 1024,
                            usedFormatted: '0 B',
                            limitFormatted: formatBytes(PLAN_LIMITS['basic'].storageGB * 1024 * 1024 * 1024)
                        },
                        members: 0,
                        workspaces: 0,
                        planTier: 'basic',
                        renewalDate: null
                    })
                    setIsOwner(true) // User owns their account
                    setWorkspaceId(null)
                } else {
                    const ws = workspaces[0]
                    setWorkspaceId(ws.id)
                    setIsOwner(true)

                    // Get member count
                    const { count: memberCount } = await supabase
                        .from('workspace_members')
                        .select('*', { count: 'exact', head: true })
                        .eq('workspace_id', ws.id)

                    // Get owned workspace count
                    const { count: wsCount } = await supabase
                        .from('workspaces')
                        .select('*', { count: 'exact', head: true })
                        .eq('owner_id', user.id)

                    // Load usage
                    const [storage, sparks] = await Promise.all([
                        getWorkspaceStorage(ws.id),
                        getVixiUsage(ws.id)
                    ])

                    // Fetch full workspace details to get subscription date
                    const { data: fullWs } = await supabase
                        .from('workspaces')
                        .select('subscription_end_date')
                        .eq('id', ws.id)
                        .single()

                    setUsage({
                        sparks: { count: sparks.sparkCount, limit: sparks.limit },
                        storage: {
                            used: storage.used,
                            limit: storage.limit,
                            usedFormatted: storage.usedFormatted,
                            limitFormatted: storage.limitFormatted
                        },
                        members: memberCount || 0,
                        workspaces: wsCount || 0,
                        planTier: storage.planTier,
                        renewalDate: fullWs?.subscription_end_date
                    })
                }
            } catch (error) {
                console.error('Error loading billing data:', error)
                toast.error('Failed to load billing data')
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [supabase])

    const loadScript = (src: string) => {
        return new Promise((resolve) => {
            const script = document.createElement('script')
            script.src = src
            script.onload = () => resolve(true)
            script.onerror = () => resolve(false)
            document.body.appendChild(script)
        })
    }

    async function handleUpgrade() {
        if (!workspaceId) {
            toast.error('You need to create a workspace first to upgrade.')
            router.push('/workspaces/new')
            return
        }

        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
            toast.error('Razorpay is not configured (Missing Key ID)')
            return
        }

        const toastId = toast.loading('Initializing payment...')
        try {
            const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js')
            if (!res) {
                toast.error('Razorpay SDK failed to load. Are you online?')
                return
            }

            // Create Order
            const orderRaw = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                body: JSON.stringify({ planId: 'pro' })
            })
            const order = await orderRaw.json()

            if (order.error) throw new Error(order.error)

            const options = {
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                name: "Virl SaaS",
                description: "Upgrade to Pro Plan",
                order_id: order.orderId,
                handler: async function (response: any) {
                    toast.dismiss(toastId)
                    toast.loading('Verifying payment...')

                    const verifyRaw = await fetch('/api/razorpay/verify', {
                        method: 'POST',
                        body: JSON.stringify({
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                            planId: 'pro'
                        })
                    })
                    const verifyJson = await verifyRaw.json()

                    if (verifyJson.success) {
                        toast.success('Plan Upgraded Successfully! 🎉')
                        window.location.reload()
                    } else {
                        toast.error('Payment verification failed')
                    }
                },
                prefill: {
                    name: user?.user_metadata?.full_name || user?.email || "",
                    email: user?.email || "",
                },
                theme: {
                    color: "#7c3aed"
                }
            }

            const paymentObject = new (window as any).Razorpay(options)
            paymentObject.open()
            toast.dismiss(toastId)

        } catch (err: any) {
            console.error(err)
            toast.dismiss(toastId)
            toast.error(err.message || 'Payment initiation failed')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        )
    }

    if (!usage) {
        return (
            <div className="text-center py-20 text-gray-500">
                <p>No workspace found. Create a workspace to see billing details.</p>
            </div>
        )
    }

    const planLimits = PLAN_LIMITS[usage.planTier]
    const isPro = usage.planTier === 'pro'
    const isCustom = usage.planTier === 'custom'

    return (
        <div className="space-y-8">
            {/* Current Plan Card */}
            <div className={cn(
                "rounded-2xl p-6 border",
                isPro ? "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200" :
                    isCustom ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200" :
                        "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200"
            )}>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            {isPro && <Crown className="h-5 w-5 text-purple-600" />}
                            {isCustom && <VixiSparksIcon className="h-5 w-5 text-amber-600" />}
                            {!isPro && !isCustom && <VixiSparksIcon className="h-5 w-5 text-gray-600" />}
                            <span className={cn(
                                "text-sm font-semibold uppercase tracking-wide",
                                isPro ? "text-purple-600" : isCustom ? "text-amber-600" : "text-gray-600"
                            )}>
                                Current Plan
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-1">
                            {isPro ? 'Pro' : isCustom ? 'Custom' : 'Basic'}
                        </h2>
                        <p className="text-gray-600">
                            {isPro ? '₹799/month' : isCustom ? 'Custom pricing' :
                                <span><s className="text-gray-400">₹249</s> <span className="text-emerald-600 font-semibold">FREE</span> (Limited Time)</span>
                            }
                            {usage.renewalDate && (
                                <span className="block text-xs text-gray-500 mt-1 font-medium">
                                    Ends on {format(new Date(usage.renewalDate), 'dd/MM/yyyy')}
                                </span>
                            )}
                        </p>
                    </div>

                    {!isPro && !isCustom && isOwner && (
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
                            onClick={handleUpgrade}
                        >
                            <Crown className="h-4 w-4 mr-2" />
                            Upgrade to Pro
                            <ArrowUpRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Usage Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage This Month</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <UsageBar
                        current={usage.sparks.count}
                        max={usage.sparks.limit}
                        label="Vixi Sparks"
                        icon={VixiSparksIcon}
                        color="purple"
                    />
                    <UsageBar
                        current={Math.round(usage.storage.used / (1024 * 1024 * 1024) * 100) / 100}
                        max={usage.storage.limit === Infinity ? Infinity : usage.storage.limit / (1024 * 1024 * 1024)}
                        label={`Storage (${usage.storage.usedFormatted} / ${usage.storage.limitFormatted})`}
                        icon={HardDrive}
                        color="blue"
                    />
                </div>
            </div>

            {/* Plan Limits */}
            {isOwner && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Plan Limits</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <FolderKanban className="h-4 w-4" />
                                <span className="text-sm">Workspaces</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                                {usage.workspaces} / {planLimits.workspaces === Infinity ? '∞' : planLimits.workspaces}
                            </p>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <Users className="h-4 w-4" />
                                <span className="text-sm">Team Members</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                                {usage.members} / {planLimits.members === Infinity ? '∞' : planLimits.members}
                            </p>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <VixiSparksIcon className="h-6 w-6" size="lg" />
                                <span className="text-sm">Vixi Sparks</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                                {planLimits.vixiSparksPerMonth === Infinity ? '∞' : planLimits.vixiSparksPerMonth} / month
                            </p>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <HardDrive className="h-4 w-4" />
                                <span className="text-sm">Storage</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                                {planLimits.storageGB === Infinity ? '∞' : `${planLimits.storageGB} GB`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Non-owner message */}
            {!isOwner && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-amber-800 text-sm">
                        <AlertCircle className="h-4 w-4 inline mr-2" />
                        Contact your Workspace Owner to manage billing and upgrade the plan.
                    </p>
                </div>
            )}

            {/* Plan Comparison - For all owners (Basic & Pro) */}
            {isOwner && !isCustom && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Basic */}
                        <div className="p-6 bg-white rounded-2xl border border-gray-200 flex flex-col">
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-2">Basic</h4>
                                <p className="text-2xl font-bold text-gray-900 mb-4"><s className="text-gray-400 text-lg">₹249</s> FREE</p>
                                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> 1 Workspace</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> 3 Team Members</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> 5 GB Storage</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> 30 Vixi Sparks/month</li>
                                </ul>
                            </div>

                            {!isPro ? (
                                <Button disabled className="w-full bg-gray-100 text-gray-500 hover:bg-gray-100">
                                    Current Plan
                                </Button>
                            ) : (
                                <div className="h-10"></div> // Spacer to keep card height consistent
                            )}
                        </div>

                        {/* Pro */}
                        <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-300 relative flex flex-col">
                            <div className="absolute -top-3 left-4 px-2 py-0.5 bg-purple-600 text-white text-xs font-semibold rounded-full">
                                RECOMMENDED
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-purple-900 mb-2">Pro</h4>
                                <p className="text-2xl font-bold text-purple-900 mb-4">₹799<span className="text-sm font-normal text-purple-600">/month</span></p>
                                <ul className="space-y-2 text-sm text-purple-800 mb-6">
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-600" /> 3 Workspaces</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-600" /> 10 Team Members</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-600" /> 50 GB Storage</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-600" /> 300 Vixi Sparks/month</li>
                                </ul>
                            </div>

                            {isPro ? (
                                <Button disabled className="w-full bg-purple-100 text-purple-700 hover:bg-purple-100 border border-purple-200">
                                    Current Plan (Active)
                                </Button>
                            ) : (
                                <Button
                                    className="w-full bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20"
                                    onClick={handleUpgrade}
                                >
                                    Upgrade Now
                                </Button>
                            )}
                        </div>

                        {/* Power/Custom */}
                        <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 flex flex-col">
                            <div className="flex-1">
                                <h4 className="font-semibold text-amber-900 mb-2">Enterprise</h4>
                                <p className="text-2xl font-bold text-amber-900 mb-4">Custom</p>
                                <ul className="space-y-2 text-sm text-amber-800 mb-6">
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-600" /> Unlimited Workspaces</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-600" /> Unlimited Team Members</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-600" /> 1 TB+ Storage</li>
                                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-600" /> Dedicated Support</li>
                                </ul>
                            </div>
                            <Button
                                disabled={contactLoading}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={async () => {
                                    setContactLoading(true)
                                    try {
                                        const res = await requestEnterprisePlan()
                                        if (res.success) {
                                            toast.success('Enquiry Sent! Sales team will contact you.')
                                        } else {
                                            toast.error('Failed to send enquiry. Please try again.')
                                        }
                                    } catch {
                                        toast.error('Something went wrong')
                                    } finally {
                                        setContactLoading(false)
                                    }
                                }}
                            >
                                {contactLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Contact Sales
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Support Section */}
            <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="font-semibold text-gray-900">Billing Support</h4>
                        <p className="text-sm text-gray-500 mt-1">
                            Having issues with payments or have questions about your plan?
                        </p>
                    </div>
                    <a href="mailto:support@virl.in" className="shrink-0 text-violet-600 hover:text-violet-700 font-medium">
                        support@virl.in
                    </a>
                </div>
            </div>
        </div>
    )
}
