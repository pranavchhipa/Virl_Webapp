'use client'

import { useEffect, useState } from 'react'
import { getAllWorkspaces, getWorkspaceDetails, deleteWorkspace } from '@/app/actions/admin'
import { Search, Loader2, ChevronLeft, ChevronRight, Users, FolderKanban, Calendar, Eye, Trash2, X, AlertTriangle, User, Crown, Zap } from 'lucide-react'
import { VixiSparksIcon } from '@/components/icons/vixi-sparks-icon'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface Workspace {
    id: string
    name: string
    created_at: string
    plan_tier: 'basic' | 'pro' | 'custom'
    owner: { id: string; email: string; full_name: string | null } | null
    member_count: { count: number }[]
    project_count: { count: number }[]
}

interface WorkspaceDetails {
    workspace: Workspace
    members: Array<{ user: any; role: string; joined_at?: string }>
    projects: Array<{ id: string; name: string; status: string; created_at: string }>
}

export default function WorkspacesPage() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceDetails | null>(null)
    const [modalLoading, setModalLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    useEffect(() => { loadWorkspaces() }, [page])

    async function loadWorkspaces(searchTerm?: string) {
        setLoading(true)
        try {
            const data = await getAllWorkspaces(page, 20, searchTerm || search)
            setWorkspaces(data.workspaces)
            setTotalPages(data.totalPages)
            setTotal(data.total)
        } catch (error) {
            toast.error('Failed to load workspaces')
        } finally { setLoading(false) }
    }

    async function viewWorkspace(id: string) {
        setModalLoading(true)
        try {
            const data = await getWorkspaceDetails(id)
            setSelectedWorkspace(data as WorkspaceDetails)
        } catch (error) {
            toast.error('Failed to load workspace details')
        } finally { setModalLoading(false) }
    }

    async function handleDelete(id: string) {
        setDeleteLoading(true)
        try {
            await deleteWorkspace(id)
            toast.success('Workspace deleted')
            setShowDeleteConfirm(null)
            setSelectedWorkspace(null)
            loadWorkspaces()
        } catch (error) {
            toast.error('Failed to delete workspace')
        } finally { setDeleteLoading(false) }
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
                    <p className="text-gray-500 mt-1">{total.toLocaleString()} total workspaces</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setPage(1); loadWorkspaces(search) }} className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search workspaces..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-72 border-gray-300" />
                    </div>
                    <Button type="submit" className="bg-violet-600 hover:bg-violet-700">Search</Button>
                </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Workspace</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Owner</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Members</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Projects</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={7} className="px-6 py-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-violet-600 mx-auto" /></td></tr>
                        ) : workspaces.length === 0 ? (
                            <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No workspaces found</td></tr>
                        ) : (
                            workspaces.map((ws) => (
                                <tr key={ws.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-semibold">{ws.name[0].toUpperCase()}</div>
                                            <span className="font-medium text-gray-900">{ws.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {ws.plan_tier === 'pro' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                                <Crown className="h-3 w-3" /> PRO
                                            </span>
                                        )}
                                        {ws.plan_tier === 'custom' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                                <VixiSparksIcon className="h-3 w-3" /> CUSTOM
                                            </span>
                                        )}
                                        {(!ws.plan_tier || ws.plan_tier === 'basic') && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                <Zap className="h-3 w-3" /> BASIC
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{ws.owner?.full_name || ws.owner?.email || 'Unknown'}</td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-gray-600"><Users className="h-4 w-4" />{ws.member_count?.[0]?.count || 0}</div></td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-gray-600"><FolderKanban className="h-4 w-4" />{ws.project_count?.[0]?.count || 0}</div></td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-gray-500 text-sm"><Calendar className="h-4 w-4" />{format(new Date(ws.created_at), 'MMM dd, yyyy')}</div></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => viewWorkspace(ws.id)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-violet-600"><Eye className="h-4 w-4" /></button>
                                            <button onClick={() => setShowDeleteConfirm(ws.id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
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

            {/* Workspace Modal */}
            {(selectedWorkspace || modalLoading) && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-auto shadow-2xl">
                        {modalLoading ? (
                            <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
                        ) : selectedWorkspace && (
                            <>
                                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-xl font-bold">{selectedWorkspace.workspace.name[0].toUpperCase()}</div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{selectedWorkspace.workspace.name}</h2>
                                            <p className="text-gray-500">Owner: {(selectedWorkspace.workspace.owner as any)?.full_name || (selectedWorkspace.workspace.owner as any)?.email || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedWorkspace(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-lg border"><p className="text-sm text-gray-500">Created</p><p className="text-gray-900 font-medium">{formatDistanceToNow(new Date(selectedWorkspace.workspace.created_at), { addSuffix: true })}</p></div>
                                        <div className="p-4 bg-gray-50 rounded-lg border"><p className="text-sm text-gray-500">Members</p><p className="text-gray-900 font-medium">{selectedWorkspace.members.length}</p></div>
                                        <div className="p-4 bg-gray-50 rounded-lg border"><p className="text-sm text-gray-500">Projects</p><p className="text-gray-900 font-medium">{selectedWorkspace.projects.length}</p></div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-3"><User className="h-5 w-5 text-blue-600" /><h3 className="font-semibold text-gray-900">Members</h3></div>
                                        {selectedWorkspace.members.length > 0 ? (
                                            <div className="space-y-2">{selectedWorkspace.members.map((m: any) => (<div key={m.user.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">{(m.user.full_name?.[0] || m.user.email[0]).toUpperCase()}</div><span className="text-gray-900">{m.user.full_name || m.user.email}</span></div><span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">{m.role}</span></div>))}</div>
                                        ) : <p className="text-gray-400 text-sm">No members</p>}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-3"><FolderKanban className="h-5 w-5 text-violet-600" /><h3 className="font-semibold text-gray-900">Projects</h3></div>
                                        {selectedWorkspace.projects.length > 0 ? (
                                            <div className="space-y-2">{selectedWorkspace.projects.slice(0, 5).map((p: any) => (<div key={p.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between"><span className="text-gray-900">{p.name}</span><span className={`px-2 py-1 text-xs rounded-full ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span></div>))}</div>
                                        ) : <p className="text-gray-400 text-sm">No projects</p>}
                                    </div>
                                </div>
                                <div className="p-6 border-t border-gray-200 flex justify-between bg-gray-50">
                                    <Button variant="outline" onClick={() => setShowDeleteConfirm(selectedWorkspace.workspace.id)} className="border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-2" />Delete Workspace</Button>
                                    <Button onClick={() => setSelectedWorkspace(null)} variant="outline">Close</Button>
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
                            <div><h3 className="text-lg font-bold text-gray-900">Delete Workspace</h3><p className="text-gray-500 text-sm">This will delete all projects and assets!</p></div>
                        </div>
                        <p className="text-gray-600 mb-6">Are you sure? This cannot be undone.</p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
                            <Button onClick={() => handleDelete(showDeleteConfirm)} disabled={deleteLoading} className="bg-red-600 hover:bg-red-700 text-white">
                                {deleteLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</> : <><Trash2 className="h-4 w-4 mr-2" /> Delete</>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
