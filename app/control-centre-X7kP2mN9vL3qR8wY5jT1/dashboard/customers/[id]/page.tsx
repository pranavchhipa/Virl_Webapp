'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUserDetails, deleteUser, suspendUser, exportUserData, getUserSubscriptionHistory } from '@/app/actions/admin'
import { ManagePlanTab } from '@/app/control-centre-X7kP2mN9vL3qR8wY5jT1/(components)/ManagePlanTab'
import {
    ArrowLeft, Loader2, Building2, FolderKanban, FileImage, HardDrive, Activity, Settings,
    Ban, UserCheck, Download, Mail, Trash2, Clock, Calendar, AlertTriangle, ExternalLink,
    Crown, Sparkles, User, Check, ChevronDown, Zap // New icons
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { CONTROL_CENTRE_PATH } from '@/lib/admin-guard'

type TabKey = string

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'workspaces', label: 'Workspaces', icon: Building2 },
    { key: 'manage_plan', label: 'Manage Plan', icon: Zap },
    { key: 'history', label: 'History', icon: FileImage }, // Using FileImage as placeholder for Receipt/History
    { key: 'projects', label: 'Projects', icon: FolderKanban },
    { key: 'activity', label: 'Activity', icon: Clock },
    { key: 'account', label: 'Account', icon: Settings },
]

const plans = [
    { id: 'basic', label: 'Basic', icon: User, color: 'text-slate-500 bg-slate-100 border-slate-200' },
    { id: 'pro', label: 'Pro', icon: Crown, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'custom', label: 'Custom', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200' },
]

function PlanBadge({ plan }: { plan: string }) {
    const p = plans.find(x => x.id === plan) || plans[0]
    const Icon = p.icon
    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border text-sm font-semibold capitalize ${p.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {p.label}
        </div>
    )
}

export default function CustomerDetailPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.id as string
    const basePath = `${CONTROL_CENTRE_PATH}/dashboard`

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    useEffect(() => { loadCustomer() }, [userId])

    async function loadCustomer() {
        setLoading(true)
        try {
            const result = await getUserDetails(userId)
            const history = await getUserSubscriptionHistory(userId)
            setData({ ...result, history })
        } catch (error) {
            toast.error('Failed to load customer')
        } finally { setLoading(false) }
    }

    async function handleSuspend() {
        setActionLoading('suspend')
        try {
            await suspendUser(userId, !data.user.suspended)
            toast.success(data.user.suspended ? 'Customer reactivated' : 'Customer suspended')
            loadCustomer()
        } catch { toast.error('Action failed') }
        finally { setActionLoading(null) }
    }

    async function handleExport() {
        setActionLoading('export')
        try {
            const exportData = await exportUserData(userId)
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `customer-${userId}.json`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Data exported')
        } catch { toast.error('Export failed') }
        finally { setActionLoading(null) }
    }

    async function handleDelete() {
        setActionLoading('delete')
        try {
            await deleteUser(userId)
            toast.success('Customer deleted')
            router.push(`${basePath}/customers`)
        } catch { toast.error('Delete failed') }
        finally { setActionLoading(null) }
    }


    if (loading) {
        return (
            <div className="min-h-full bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        )
    }

    if (!data) {
        return (
            <div className="min-h-full bg-gray-50 p-8">
                <p className="text-gray-500">Customer not found</p>
            </div>
        )
    }

    const { user, stats, ownedWorkspaces, memberWorkspaces, projects } = data

    // Build activity timeline from user data
    const activityItems: { type: string; title: string; subtitle: string; date: Date }[] = []

    // Account creation
    activityItems.push({
        type: 'signup',
        title: 'Account created',
        subtitle: user.email,
        date: new Date(user.created_at)
    })

    // Workspace creations
    ownedWorkspaces.forEach((ws: any) => {
        activityItems.push({
            type: 'workspace',
            title: `Created workspace "${ws.name}"`,
            subtitle: `${ws.memberCount || 0} members`,
            date: new Date(ws.created_at || user.created_at)
        })
    })

    // Project creations/memberships
    projects.forEach((p: any) => {
        activityItems.push({
            type: 'project',
            title: `Joined project "${p.name}"`,
            subtitle: `Role: ${p.role}`,
            date: new Date(p.created_at || user.created_at)
        })
    })

    // Sort by date (newest first)
    activityItems.sort((a, b) => b.date.getTime() - a.date.getTime())

    return (
        <div className="min-h-full bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-200 px-8 py-3">
                <Link href={`${basePath}/customers`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Customers / <span className="text-gray-900 font-medium">{user.full_name || user.email}</span>
                </Link>
            </div>

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {(user.full_name?.[0] || user.email[0]).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-900">{user.full_name || 'No name'}</h1>
                                {ownedWorkspaces.length > 0 && <PlanBadge plan={ownedWorkspaces[0].plan_tier || 'basic'} />}
                                {ownedWorkspaces[0]?.subscription_end_date && (
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Ends {format(new Date(ownedWorkspaces[0].subscription_end_date), 'MMM dd, yyyy')}
                                    </span>
                                )}
                                {user.suspended && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">Suspended</span>}
                            </div>
                            <p className="text-gray-500">{user.email}</p>
                            <div className="flex items-center gap-4 mt-2">
                                <p className="text-sm text-gray-400">
                                    <Calendar className="h-3.5 w-3.5 inline mr-1" />
                                    Member since {format(new Date(user.created_at), 'MMM dd, yyyy')}
                                </p>
                                {ownedWorkspaces.length > 0 && (
                                    <button
                                        onClick={() => setActiveTab('manage_plan')}
                                        className="text-sm font-medium text-violet-600 hover:text-violet-700 hover:underline flex items-center gap-1"
                                    >
                                        <Zap className="w-3.5 h-3.5" /> Manage Plan
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleSuspend} disabled={actionLoading === 'suspend'} className={user.suspended ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-amber-200 text-amber-600 hover:bg-amber-50'}>
                            {actionLoading === 'suspend' ? <Loader2 className="h-4 w-4 animate-spin" /> : user.suspended ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                            <span className="ml-2">{user.suspended ? 'Reactivate' : 'Suspend'}</span>
                        </Button>
                        <Button variant="outline" onClick={handleExport} disabled={actionLoading === 'export'}>
                            {actionLoading === 'export' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            <span className="ml-2">Export</span>
                        </Button>
                        <Button variant="outline" onClick={() => window.open(`mailto:${user.email}`)}>
                            <Mail className="h-4 w-4" /><span className="ml-2">Email</span>
                        </Button>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="border-red-200 text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" /><span className="ml-2">Delete</span>
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mt-6 border-b border-gray-100 -mb-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                    ? 'border-violet-600 text-violet-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="p-8">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-3 gap-6">
                        {/* Stats Grid */}
                        <div className="col-span-2 grid grid-cols-3 gap-4">
                            {[
                                { label: 'Workspaces Owned', value: stats.workspacesOwned, icon: Building2, color: 'bg-blue-50 text-blue-600' },
                                { label: 'Member Of', value: stats.workspacesMember, icon: Building2, color: 'bg-violet-50 text-violet-600' },
                                { label: 'Total Projects', value: stats.totalProjects, icon: FolderKanban, color: 'bg-emerald-50 text-emerald-600' },
                                { label: 'Active Projects', value: stats.activeProjects, icon: FolderKanban, color: 'bg-cyan-50 text-cyan-600' },
                                { label: 'Storage', value: stats.storageUsedFormatted, icon: HardDrive, color: 'bg-pink-50 text-pink-600' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                                    <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-sm text-gray-500">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Activity Timeline */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
                            {activityItems.length > 0 ? (
                                <div className="space-y-4">
                                    {activityItems.slice(0, 5).map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className={`w-2 h-2 rounded-full mt-2 ${item.type === 'signup' ? 'bg-blue-500' : item.type === 'workspace' ? 'bg-violet-500' : 'bg-emerald-500'}`} />
                                            <div>
                                                <p className="text-sm text-gray-900">{item.title}</p>
                                                <p className="text-xs text-gray-400">{formatDistanceToNow(item.date, { addSuffix: true })}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">No recent activity</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'workspaces' && (
                    <div className="space-y-6">
                        {/* Owned Workspaces */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Owned Workspaces ({ownedWorkspaces.length})</h3>
                            {ownedWorkspaces.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {ownedWorkspaces.map((ws: any) => (
                                        <div key={ws.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-violet-300 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
                                                    <Building2 className="h-6 w-6 text-violet-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900">{ws.name}</p>
                                                    <p className="text-sm text-gray-500">{ws.memberCount} members • {ws.projectCount} projects</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400">No owned workspaces</p>
                            )}
                        </div>

                        {/* Member Of */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Member Of ({memberWorkspaces.length})</h3>
                            {memberWorkspaces.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {memberWorkspaces.map((ws: any) => (
                                        <div key={ws.id} className="bg-white rounded-xl border border-gray-200 p-5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                        <Building2 className="h-5 w-5 text-gray-600" />
                                                    </div>
                                                    <p className="font-medium text-gray-900">{ws.name}</p>
                                                </div>
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">{ws.role}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400">Not a member of any other workspaces</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'manage_plan' && (
                    ownedWorkspaces.length > 0 ? (
                        <ManagePlanTab
                            userId={user.id}
                            currentPlan={ownedWorkspaces[0].plan_tier || 'basic'}
                            initialOverrides={{
                                custom_storage_limit: ownedWorkspaces[0].custom_storage_limit,
                                custom_member_limit: ownedWorkspaces[0].custom_member_limit,
                                custom_workspace_limit: ownedWorkspaces[0].custom_workspace_limit,
                                custom_vixi_spark_limit: ownedWorkspaces[0].custom_vixi_spark_limit
                            }}
                            onUpdate={loadCustomer}
                        />
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                            This user does not own any workspaces, so plans cannot be managed.
                        </div>
                    )
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Subscription History</h3>
                        </div>

                        {(data.history && data.history.length > 0) ? (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Event</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.history.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-gray-900 capitalize">{item.change_type?.replace('_', ' ') || 'Update'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <PlanBadge plan={item.plan_tier} />
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {item.amount ? `₹${item.amount.toLocaleString()}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs text-gray-400 font-mono">
                                                    {item.transaction_id || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <FileImage className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-gray-900 font-medium mb-1">No History Recorded</h3>
                                <p className="text-gray-500 text-sm">Subscription changes and payments will appear here.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'projects' && (
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Projects ({projects.length})</h3>
                        {projects.length > 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Project</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {projects.map((p: any) => (
                                            <tr key={p.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{p.role}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-400">No projects</p>
                        )}
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Activity Timeline ({activityItems.length} events)</h3>
                        {activityItems.length > 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="space-y-6">
                                    {activityItems.map((item, i) => (
                                        <div key={i} className="flex items-start gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${item.type === 'signup' ? 'bg-blue-500' : item.type === 'workspace' ? 'bg-violet-500' : 'bg-emerald-500'}`} />
                                                {i < activityItems.length - 1 && <div className="w-0.5 h-12 bg-gray-200 mt-1" />}
                                            </div>
                                            <div className="flex-1 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.type === 'signup' ? 'bg-blue-100 text-blue-600' : item.type === 'workspace' ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        {item.type === 'signup' ? 'Signup' : item.type === 'workspace' ? 'Workspace' : 'Project'}
                                                    </span>
                                                </div>
                                                <p className="font-medium text-gray-900 mt-1">{item.title}</p>
                                                <p className="text-sm text-gray-500">{item.subtitle}</p>
                                                <p className="text-xs text-gray-400 mt-1">{format(item.date, 'MMM dd, yyyy HH:mm')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400">No activity recorded</p>
                        )}
                    </div>
                )}

                {activeTab === 'account' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
                            <dl className="space-y-4">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <dt className="text-gray-500">Email</dt>
                                    <dd className="text-gray-900 font-medium">{user.email}</dd>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <dt className="text-gray-500">Full Name</dt>
                                    <dd className="text-gray-900 font-medium">{user.full_name || '-'}</dd>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <dt className="text-gray-500">Role</dt>
                                    <dd className="text-gray-900 font-medium capitalize">{user.role || 'user'}</dd>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <dt className="text-gray-500">Status</dt>
                                    <dd>{user.suspended ? <span className="text-red-600 font-medium">Suspended</span> : <span className="text-emerald-600 font-medium">Active</span>}</dd>
                                </div>
                                <div className="flex justify-between py-2">
                                    <dt className="text-gray-500">Created</dt>
                                    <dd className="text-gray-900 font-medium">{format(new Date(user.created_at), 'MMMM dd, yyyy')}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                            <h3 className="font-semibold text-red-800 mb-2">Danger Zone</h3>
                            <p className="text-sm text-red-600 mb-4">Permanently delete this customer and all their data.</p>
                            <Button onClick={() => setShowDeleteConfirm(true)} className="bg-red-600 hover:bg-red-700 text-white">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Customer
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Delete Customer</h3>
                                <p className="text-gray-500 text-sm">This cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6">All data including workspaces, projects, and assets will be permanently removed.</p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                            <Button onClick={handleDelete} disabled={actionLoading === 'delete'} className="bg-red-600 hover:bg-red-700 text-white">
                                {actionLoading === 'delete' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
