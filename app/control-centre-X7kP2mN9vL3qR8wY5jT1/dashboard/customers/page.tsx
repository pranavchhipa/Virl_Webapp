'use client'

import { useEffect, useState, useMemo } from 'react'
import { getAllUsers, updateCustomerPlan } from '@/app/actions/admin'
import { Search, Loader2, ChevronRight, Users, Crown, Sparkles, User, Zap, AlertTriangle, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner' // Added toast
import { CONTROL_CENTRE_PATH } from '@/lib/admin-guard'
import { VixiSparksIcon } from '@/components/icons/vixi-sparks-icon'

interface UserWithPlan {
    id: string
    email: string
    full_name: string | null
    created_at: string
    suspended?: boolean
    plan_tier?: 'basic' | 'pro' | 'custom'
    workspace_count?: number
}

const planFilters = [
    { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700', icon: Users },
    { key: 'basic', label: 'Basic (Free)', color: 'bg-slate-100 text-slate-700', icon: User },
    { key: 'pro', label: 'Pro', color: 'bg-blue-100 text-blue-700', icon: Crown },
    { key: 'custom', label: 'Custom', color: 'bg-purple-100 text-purple-700', icon: Sparkles },
]

const planBadges = {
    basic: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', label: 'Basic' },
    pro: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', label: 'Pro' },
    custom: { bg: 'bg-gradient-to-r from-purple-50 to-violet-50', border: 'border-purple-200', text: 'text-purple-600', label: 'Custom' },
}

export default function CustomersPage() {
    const [users, setUsers] = useState<UserWithPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [activeFilter, setActiveFilter] = useState('all')
    const [upgrading, setUpgrading] = useState<string | null>(null)

    // Modal State
    const [showPlanModal, setShowPlanModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserWithPlan | null>(null)
    const [targetPlan, setTargetPlan] = useState<'basic' | 'pro' | 'custom'>('basic')

    const basePath = `${CONTROL_CENTRE_PATH}/dashboard`

    useEffect(() => { loadUsers() }, [page])

    async function loadUsers(searchTerm?: string) {
        setLoading(true)
        try {
            const data = await getAllUsers(page, 100, searchTerm || search)
            // Map plan_tier: prefer owned workspace, fallback to member workspace
            const mappedUsers = data.users.map((u: any) => {
                // First check owned workspaces
                let planTier = u.owned_workspaces?.[0]?.plan_tier

                // If no owned workspaces, check member workspaces
                if (!planTier && u.member_workspaces?.length > 0) {
                    const memberWs = u.member_workspaces[0]?.workspace
                    planTier = memberWs?.plan_tier
                }

                return {
                    ...u,
                    plan_tier: planTier || 'basic'
                }
            })
            setUsers(mappedUsers)
            setTotalPages(data.totalPages)
            setTotal(data.total)
        } catch (error) {
            console.error('Failed to load users:', error)
        } finally { setLoading(false) }
    }

    // Trigger modal
    function convertPlan(userId: string, plan: string) {
        const user = users.find(u => u.id === userId)
        if (!user) return
        setSelectedUser(user)
        setTargetPlan(plan as any)
        setShowPlanModal(true)
    }

    // Execute plan change
    async function confirmPlanChange() {
        if (!selectedUser) return

        setUpgrading(selectedUser.id)
        setShowPlanModal(false) // Close modal immediately

        try {
            await updateCustomerPlan(selectedUser.id, targetPlan)
            toast.success(`Account plan updated to ${targetPlan} (all workspaces)`)
            await loadUsers()
        } catch (error) {
            toast.error('Failed to update plan')
            console.error('Failed to update plan:', error)
        } finally {
            setUpgrading(null)
            setSelectedUser(null)
        }
    }

    // Filter users based on selected plan
    const filteredUsers = useMemo(() => {
        if (activeFilter === 'all') return users
        return users.filter(user => (user.plan_tier || 'basic') === activeFilter)
    }, [users, activeFilter])

    // Get counts for each filter
    const filterCounts = useMemo(() => {
        const counts = { all: users.length, basic: 0, pro: 0, custom: 0 }
        users.forEach(user => {
            const plan = user.plan_tier || 'basic'
            counts[plan as keyof typeof counts]++
        })
        return counts
    }, [users])

    return (
        <div className="p-8 bg-gray-50 min-h-full">
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Users className="h-4 w-4" />
                    <span>Customer Management</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                <p className="text-gray-500 mt-1">{total} total customers</p>
            </div>

            {/* Plan Distribution Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Basic (Free)</p>
                            <p className="text-2xl font-bold text-slate-700">{filterCounts.basic}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-slate-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pro</p>
                            <p className="text-2xl font-bold text-blue-700">{filterCounts.pro}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Crown className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Custom</p>
                            <p className="text-2xl font-bold text-purple-700">{filterCounts.custom}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <VixiSparksIcon size="sm" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <form onSubmit={(e) => { e.preventDefault(); setPage(1); loadUsers(search) }} className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 border-gray-200"
                            />
                        </div>
                        <Button type="submit" className="bg-violet-600 hover:bg-violet-700">Search</Button>
                    </form>
                </div>

                {/* Plan Filters */}
                <div className="flex items-center gap-2 mt-4">
                    {planFilters.map((filter) => {
                        const Icon = filter.icon
                        const count = filterCounts[filter.key as keyof typeof filterCounts]
                        return (
                            <button
                                key={filter.key}
                                onClick={() => setActiveFilter(filter.key)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeFilter === filter.key
                                    ? filter.color + ' ring-2 ring-offset-1 ring-violet-400'
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {filter.label}
                                <span className="text-xs opacity-70">({count})</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Customer List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        {activeFilter === 'all' ? 'No customers found' : `No ${activeFilter} customers`}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredUsers.map((user) => {
                            const plan = user.plan_tier || 'basic'
                            const badge = planBadges[plan]

                            return (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
                                >
                                    <Link
                                        href={`${basePath}/customers/${user.id}`}
                                        className="flex items-center gap-4 flex-1"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                            {(user.full_name?.[0] || user.email[0]).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-900">{user.full_name || 'No name'}</p>
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.border} ${badge.text} font-medium flex items-center gap-1`}>
                                                    {plan === 'custom' && <Zap className="h-3 w-3" />}
                                                    {badge.label}
                                                </span>
                                                {user.suspended && (
                                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Suspended</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </Link>

                                    {/* Quick Plan Actions */}
                                    <div className="flex items-center gap-2">
                                        <div className="text-right mr-4">
                                            <p className="text-sm text-gray-500">Joined</p>
                                            <p className="text-sm font-medium text-gray-700">
                                                {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                                            </p>
                                        </div>

                                        {/* Plan Change Dropdown Triggers Modal */}
                                        <select
                                            value={plan}
                                            onChange={(e) => convertPlan(user.id, e.target.value)}
                                            disabled={upgrading === user.id}
                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                                        >
                                            <option value="basic">Basic</option>
                                            <option value="pro">Pro</option>
                                            <option value="custom">Custom</option>
                                        </select>

                                        <Link href={`${basePath}/customers/${user.id}`}>
                                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-violet-500 transition-colors" />
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                        <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            {/* Plan Confirmation Modal */}
            {showPlanModal && selectedUser && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                                <Crown className="h-6 w-6 text-violet-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Change Plan</h3>
                                <p className="text-sm text-gray-500">Update workspace subscription</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
                            <p className="text-sm text-gray-600 mb-1">Customer</p>
                            <p className="font-semibold text-gray-900 mb-3">{selectedUser.full_name || selectedUser.email}</p>

                            <div className="flex items-center gap-3 text-sm">
                                <span className="text-gray-500">New Plan:</span>
                                <span className="font-bold text-violet-600 capitalize">{targetPlan}</span>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">
                                This will update the plan for <b>ALL workspaces</b> owned by this user. A notification email will be sent.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowPlanModal(false)}>Cancel</Button>
                            <Button onClick={confirmPlanChange} className="bg-violet-600 hover:bg-violet-700 text-white">
                                <Zap className="h-4 w-4 mr-2" />
                                Confirm Change
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
