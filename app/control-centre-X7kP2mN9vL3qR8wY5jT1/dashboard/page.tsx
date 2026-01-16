'use client'

import { useEffect, useState } from 'react'
import { getAdminStats } from '@/app/actions/admin'
import Link from 'next/link'
import {
    Users,
    Building2,
    FolderKanban,
    HardDrive,
    TrendingUp,
    Clock,
    Loader2,
    ArrowRight,
    BarChart3,
    Activity,
    RefreshCw,
    AlertTriangle,
    Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { CONTROL_CENTRE_PATH } from '@/lib/admin-guard'
import { Button } from '@/components/ui/button'

interface AdminStats {
    totalUsers: number
    totalWorkspaces: number
    totalProjects: number
    totalAssets: number
    planDistribution: { basic: number; pro: number; custom: number }
    activeUsers: number
    activeUsersPercent: number
    storage: { totalBytes: number; formatted: string; assetCount: number }
    recentUsers: Array<{ id: string; email: string; full_name: string | null; created_at: string; plan_tier?: string }>
    signupChart: Array<{ date: string; count: number }>
}

function StatCard({ title, value, icon: Icon, color, href, subtitle }: {
    title: string; value: number | string; icon: React.ElementType; color: string; href: string; subtitle?: string
}) {
    return (
        <Link href={href} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-violet-300 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
            </div>
        </Link>
    )
}

function PlanDistribution({ data }: { data: { basic: number; pro: number; custom: number } }) {
    const total = data.basic + data.pro + data.custom
    if (total === 0) return null

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Basic (Free)</span>
                <span className="font-semibold text-gray-900">{data.basic}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Pro</span>
                <span className="font-semibold text-gray-900">{data.pro}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Custom</span>
                <span className="font-semibold text-gray-900">{data.custom}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex mt-2">
                <div className="bg-slate-400 transition-all" style={{ width: `${data.basic / total * 100}%` }} />
                <div className="bg-blue-500 transition-all" style={{ width: `${data.pro / total * 100}%` }} />
                <div className="bg-purple-500 transition-all" style={{ width: `${data.custom / total * 100}%` }} />
            </div>
        </div>
    )
}

function MiniChart({ data }: { data: Array<{ date: string; count: number }> }) {
    const maxCount = Math.max(...data.map(d => d.count), 1)
    return (
        <div className="flex items-end gap-1.5 h-16">
            {data.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center">
                    <div
                        className="w-full bg-gradient-to-t from-violet-600 to-purple-500 rounded-sm transition-all hover:opacity-80"
                        style={{ height: `${Math.max((d.count / maxCount) * 100, 10)}%` }}
                        title={`${d.count} signups`}
                    />
                </div>
            ))}
        </div>
    )
}

export default function ControlCentreDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)

    const basePath = `${CONTROL_CENTRE_PATH}/dashboard`

    async function loadStats() {
        setLoading(true)
        try {
            const data = await getAdminStats()
            setStats(data)
        } catch (error) {
            console.error('Failed to load stats:', error)
        } finally { setLoading(false) }
    }

    useEffect(() => { loadStats() }, [])

    if (loading && !stats) {
        return (
            <div className="min-h-full bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        )
    }

    const weeklySignups = stats?.signupChart?.reduce((acc, d) => acc + d.count, 0) || 0

    return (
        <div className="p-8 bg-gray-50 min-h-full">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Platform overview</p>
                </div>
                <Button onClick={loadStats} variant="outline" disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Pro Customers Highlight */}
            {stats && stats.planDistribution && stats.planDistribution.pro > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-blue-800">{stats.planDistribution.pro} Pro customers</p>
                        <p className="text-sm text-blue-600">Generating recurring revenue</p>
                    </div>
                    <Link href={`${basePath}/customers`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        View Customers
                    </Link>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard title="Customers" value={stats?.totalUsers || 0} icon={Users} color="bg-blue-600" href={`${basePath}/customers`} subtitle={`${stats?.activeUsers || 0} active`} />
                <StatCard title="Workspaces" value={stats?.totalWorkspaces || 0} icon={Building2} color="bg-violet-600" href={`${basePath}/system`} />
                <StatCard title="Projects" value={stats?.totalProjects || 0} icon={FolderKanban} color="bg-emerald-600" href={`${basePath}/system`} />
                <StatCard title="Storage" value={stats?.storage.formatted || '0 MB'} icon={HardDrive} color="bg-orange-500" href={`${basePath}/storage`} subtitle={`${stats?.storage.assetCount} assets`} />
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                {/* Plan Distribution */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-violet-600" />
                            <h2 className="font-semibold text-gray-900">Plan Distribution</h2>
                        </div>
                    </div>
                    {stats && stats.planDistribution && <PlanDistribution data={stats.planDistribution} />}
                </div>

                {/* Weekly Signups */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            <h2 className="font-semibold text-gray-900">Weekly Signups</h2>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{weeklySignups}</span>
                    </div>
                    {stats?.signupChart && <MiniChart data={stats.signupChart} />}
                    <p className="text-xs text-gray-400 mt-2 text-center">Last 7 days</p>
                </div>

                {/* Active Rate */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="h-5 w-5 text-emerald-600" />
                        <h2 className="font-semibold text-gray-900">Active Rate</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-4xl font-bold text-gray-900">{stats?.activeUsersPercent || 0}%</p>
                            <p className="text-sm text-gray-500 mt-1">{stats?.activeUsers || 0} of {stats?.totalUsers || 0}</p>
                        </div>
                        <div className="flex-1">
                            <svg viewBox="0 0 100 100" className="w-20 h-20">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                                <circle
                                    cx="50" cy="50" r="40"
                                    fill="none"
                                    stroke="url(#activeGradient)"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(stats?.activeUsersPercent || 0) * 2.51} 251`}
                                    transform="rotate(-90 50 50)"
                                />
                                <defs>
                                    <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Signups */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-violet-600" />
                        <h2 className="font-semibold text-gray-900">Recent Signups</h2>
                    </div>
                    <Link href={`${basePath}/customers`} className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1">
                        View all <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                <div className="divide-y divide-gray-100">
                    {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                        stats.recentUsers.slice(0, 5).map((user) => (
                            <Link
                                key={user.id}
                                href={`${basePath}/customers/${user.id}`}
                                className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                                        {(user.full_name?.[0] || user.email[0]).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{user.full_name || 'No name'}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Clock className="h-4 w-4" />
                                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="px-5 py-8 text-center text-gray-400">No recent signups</div>
                    )}
                </div>
            </div>
        </div>
    )
}
