'use client'

import { useEffect, useState } from 'react'
import { getAllUsers, getUserDetails, deleteUser, suspendUser, exportUserData } from '@/app/actions/admin'
import {
    Search, Loader2, ChevronLeft, ChevronRight, Mail, Calendar, Eye, Trash2, X,
    Building2, FolderKanban, AlertTriangle, Download, Ban, UserCheck, FileImage,
    HardDrive, Activity, Clock, TrendingUp, MoreVertical, ExternalLink
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface User {
    id: string
    email: string
    full_name: string | null
    role: string
    created_at: string
    suspended?: boolean
}

interface UserStats {
    workspacesOwned: number
    workspacesMember: number
    totalProjects: number
    activeProjects: number
    totalAssets: number
    storageUsedMB: number
    storageUsedFormatted: string
    daysSinceSignup: number
    daysSinceActivity: number
    healthScore: number
    healthStatus: 'healthy' | 'at_risk' | 'critical'
}

interface UserDetails {
    user: User
    stats: UserStats
    ownedWorkspaces: Array<{ id: string; name: string; memberCount: number; projectCount: number }>
    memberWorkspaces: Array<{ id: string; name: string; role: string }>
    projects: Array<{ id: string; name: string; status: string; role: string }>
    recentAssets: Array<{ id: string; file_name: string; file_type: string; created_at: string }>
}

function HealthBadge({ score, status }: { score: number; status: string }) {
    const colors = {
        healthy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        at_risk: 'bg-amber-100 text-amber-700 border-amber-200',
        critical: 'bg-red-100 text-red-700 border-red-200',
    }
    const icons = { healthy: '💚', at_risk: '⚠️', critical: '🔴' }

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${colors[status as keyof typeof colors]}`}>
            <span>{icons[status as keyof typeof icons]}</span>
            <span className="font-semibold">{score}</span>
        </div>
    )
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null)
    const [modalLoading, setModalLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    useEffect(() => { loadUsers() }, [page])

    async function loadUsers(searchTerm?: string) {
        setLoading(true)
        try {
            const data = await getAllUsers(page, 20, searchTerm || search)
            setUsers(data.users)
            setTotalPages(data.totalPages)
            setTotal(data.total)
        } catch (error) {
            toast.error('Failed to load users')
        } finally { setLoading(false) }
    }

    async function viewUser(userId: string) {
        setModalLoading(true)
        try {
            const data = await getUserDetails(userId)
            setSelectedUser(data)
        } catch (error) {
            toast.error('Failed to load user details')
        } finally { setModalLoading(false) }
    }

    async function handleDelete(userId: string) {
        setActionLoading('delete')
        try {
            await deleteUser(userId)
            toast.success('User deleted successfully')
            setShowDeleteConfirm(null)
            setSelectedUser(null)
            loadUsers()
        } catch (error) {
            toast.error('Failed to delete user')
        } finally { setActionLoading(null) }
    }

    async function handleSuspend(userId: string, suspend: boolean) {
        setActionLoading('suspend')
        try {
            await suspendUser(userId, suspend)
            toast.success(suspend ? 'User suspended' : 'User reactivated')
            viewUser(userId) // Refresh
            loadUsers()
        } catch (error) {
            toast.error('Failed to update user status')
        } finally { setActionLoading(null) }
    }

    async function handleExport(userId: string) {
        setActionLoading('export')
        try {
            const data = await exportUserData(userId)
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `user-export-${userId}.json`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('User data exported')
        } catch (error) {
            toast.error('Failed to export user data')
        } finally { setActionLoading(null) }
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                    <p className="text-gray-500 mt-1">{total.toLocaleString()} registered users</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setPage(1); loadUsers(search) }} className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-72 border-gray-300" />
                    </div>
                    <Button type="submit" className="bg-violet-600 hover:bg-violet-700">Search</Button>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-violet-600 mx-auto" /></td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No users found</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${user.suspended ? 'opacity-60' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-semibold">{(user.full_name?.[0] || user.email[0]).toUpperCase()}</div>
                                            <div>
                                                <span className="font-medium text-gray-900">{user.full_name || 'No name'}</span>
                                                {user.suspended && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Suspended</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4" />{user.email}</div></td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${user.suspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{user.suspended ? 'Suspended' : 'Active'}</span></td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-gray-500 text-sm"><Calendar className="h-4 w-4" />{format(new Date(user.created_at), 'MMM dd, yyyy')}</div></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => viewUser(user.id)} className="p-2 rounded-lg text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-colors" title="View details"><Eye className="h-4 w-4" /></button>
                                            <button onClick={() => handleExport(user.id)} className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Export data"><Download className="h-4 w-4" /></button>
                                            <button onClick={() => setShowDeleteConfirm(user.id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                        <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced User Detail Modal */}
            {(selectedUser || modalLoading) && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-auto shadow-2xl">
                        {modalLoading ? (
                            <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
                        ) : selectedUser && (
                            <>
                                {/* Header */}
                                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                            {(selectedUser.user.full_name?.[0] || selectedUser.user.email[0]).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-xl font-bold text-gray-900">{selectedUser.user.full_name || 'No name'}</h2>
                                                <HealthBadge score={selectedUser.stats.healthScore} status={selectedUser.stats.healthStatus} />
                                            </div>
                                            <p className="text-gray-500">{selectedUser.user.email}</p>
                                            <p className="text-sm text-gray-400">Member for {selectedUser.stats.daysSinceSignup} days</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedUser(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
                                </div>

                                {/* Quick Stats */}
                                <div className="p-6 grid grid-cols-6 gap-4 border-b border-gray-200 bg-gray-50">
                                    <div className="text-center p-3 bg-white rounded-lg border">
                                        <Building2 className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                                        <p className="text-2xl font-bold text-gray-900">{selectedUser.stats.workspacesOwned}</p>
                                        <p className="text-xs text-gray-500">Owned</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg border">
                                        <Building2 className="h-5 w-5 text-violet-600 mx-auto mb-1" />
                                        <p className="text-2xl font-bold text-gray-900">{selectedUser.stats.workspacesMember}</p>
                                        <p className="text-xs text-gray-500">Member Of</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg border">
                                        <FolderKanban className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                                        <p className="text-2xl font-bold text-gray-900">{selectedUser.stats.totalProjects}</p>
                                        <p className="text-xs text-gray-500">Projects</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg border">
                                        <FileImage className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                                        <p className="text-2xl font-bold text-gray-900">{selectedUser.stats.totalAssets}</p>
                                        <p className="text-xs text-gray-500">Assets</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg border">
                                        <HardDrive className="h-5 w-5 text-pink-600 mx-auto mb-1" />
                                        <p className="text-2xl font-bold text-gray-900">{selectedUser.stats.storageUsedFormatted}</p>
                                        <p className="text-xs text-gray-500">Storage</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg border">
                                        <Activity className="h-5 w-5 text-cyan-600 mx-auto mb-1" />
                                        <p className="text-2xl font-bold text-gray-900">{selectedUser.stats.daysSinceActivity}d</p>
                                        <p className="text-xs text-gray-500">Last Active</p>
                                    </div>
                                </div>

                                {/* Content Sections */}
                                <div className="p-6 grid grid-cols-2 gap-6">
                                    {/* Owned Workspaces */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-blue-600" />
                                            Owned Workspaces ({selectedUser.ownedWorkspaces.length})
                                        </h3>
                                        {selectedUser.ownedWorkspaces.length > 0 ? (
                                            <div className="space-y-2 max-h-40 overflow-auto">
                                                {selectedUser.ownedWorkspaces.map((ws: any) => (
                                                    <div key={ws.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                                                        <span className="text-gray-900 font-medium">{ws.name}</span>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <span>{ws.memberCount} members</span>
                                                            <span>•</span>
                                                            <span>{ws.projectCount} projects</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-gray-400 text-sm">No owned workspaces</p>}
                                    </div>

                                    {/* Projects */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <FolderKanban className="h-5 w-5 text-violet-600" />
                                            Projects ({selectedUser.projects.length})
                                        </h3>
                                        {selectedUser.projects.length > 0 ? (
                                            <div className="space-y-2 max-h-40 overflow-auto">
                                                {selectedUser.projects.slice(0, 5).map((p: any) => (
                                                    <div key={p.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                                                        <span className="text-gray-900">{p.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">{p.role}</span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {selectedUser.projects.length > 5 && <p className="text-xs text-gray-400 text-center">+{selectedUser.projects.length - 5} more</p>}
                                            </div>
                                        ) : <p className="text-gray-400 text-sm">No projects</p>}
                                    </div>

                                    {/* Recent Assets */}
                                    <div className="col-span-2">
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <FileImage className="h-5 w-5 text-orange-500" />
                                            Recent Assets ({selectedUser.recentAssets.length})
                                        </h3>
                                        {selectedUser.recentAssets.length > 0 ? (
                                            <div className="grid grid-cols-5 gap-2">
                                                {selectedUser.recentAssets.slice(0, 10).map((a: any) => (
                                                    <div key={a.id} className="p-2 bg-gray-50 rounded-lg border text-center">
                                                        <span className="text-2xl">{a.file_type?.includes('video') ? '🎬' : a.file_type?.includes('image') ? '🖼️' : '📄'}</span>
                                                        <p className="text-xs text-gray-600 truncate mt-1">{a.file_name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-gray-400 text-sm">No assets uploaded</p>}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleSuspend(selectedUser.user.id, !selectedUser.user.suspended)}
                                            disabled={actionLoading === 'suspend'}
                                            className={selectedUser.user.suspended ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-amber-200 text-amber-600 hover:bg-amber-50'}
                                        >
                                            {actionLoading === 'suspend' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : selectedUser.user.suspended ? <UserCheck className="h-4 w-4 mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
                                            {selectedUser.user.suspended ? 'Reactivate' : 'Suspend'}
                                        </Button>
                                        <Button variant="outline" onClick={() => handleExport(selectedUser.user.id)} disabled={actionLoading === 'export'} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                                            {actionLoading === 'export' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                            Export Data
                                        </Button>
                                        <Button variant="outline" onClick={() => window.open(`mailto:${selectedUser.user.email}`)} className="border-gray-200 text-gray-600 hover:bg-gray-100">
                                            <Mail className="h-4 w-4 mr-2" />
                                            Send Email
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setShowDeleteConfirm(selectedUser.user.id)} className="border-red-200 text-red-600 hover:bg-red-50">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete User
                                        </Button>
                                        <Button onClick={() => setSelectedUser(null)} variant="outline">Close</Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
                            <div><h3 className="text-lg font-bold text-gray-900">Delete User</h3><p className="text-gray-500 text-sm">This action cannot be undone</p></div>
                        </div>
                        <p className="text-gray-600 mb-6">Are you sure? All data including workspaces, projects, and assets will be permanently removed.</p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
                            <Button onClick={() => handleDelete(showDeleteConfirm)} disabled={actionLoading === 'delete'} className="bg-red-600 hover:bg-red-700 text-white">
                                {actionLoading === 'delete' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</> : <><Trash2 className="h-4 w-4 mr-2" /> Delete</>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
