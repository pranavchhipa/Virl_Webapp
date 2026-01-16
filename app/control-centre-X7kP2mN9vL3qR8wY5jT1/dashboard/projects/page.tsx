'use client'

import { useEffect, useState } from 'react'
import { getAllProjects, getProjectDetails, deleteProject } from '@/app/actions/admin'
import { Search, Loader2, ChevronLeft, ChevronRight, Users, FileImage, Calendar, Building2, Eye, Trash2, X, AlertTriangle, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface Project {
    id: string
    name: string
    status: string
    created_at: string
    workspace: { id: string; name: string } | null
    asset_count: { count: number }[]
    member_count: { count: number }[]
}

interface ProjectDetails {
    project: Project & { description?: string }
    members: Array<{ user: any; role: string; joined_at?: string }>
    assets: Array<{ id: string; file_name: string; file_type: string; status: string; created_at: string }>
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [selectedProject, setSelectedProject] = useState<ProjectDetails | null>(null)
    const [modalLoading, setModalLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    useEffect(() => { loadProjects() }, [page])

    async function loadProjects(searchTerm?: string) {
        setLoading(true)
        try {
            const data = await getAllProjects(page, 20, searchTerm || search)
            setProjects(data.projects)
            setTotalPages(data.totalPages)
            setTotal(data.total)
        } catch (error) {
            toast.error('Failed to load projects')
        } finally { setLoading(false) }
    }

    async function viewProject(id: string) {
        setModalLoading(true)
        try {
            const data = await getProjectDetails(id)
            setSelectedProject(data as ProjectDetails)
        } catch (error) {
            toast.error('Failed to load project details')
        } finally { setModalLoading(false) }
    }

    async function handleDelete(id: string) {
        setDeleteLoading(true)
        try {
            await deleteProject(id)
            toast.success('Project deleted')
            setShowDeleteConfirm(null)
            setSelectedProject(null)
            loadProjects()
        } catch (error) {
            toast.error('Failed to delete project')
        } finally { setDeleteLoading(false) }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700'
            case 'completed': return 'bg-blue-100 text-blue-700'
            default: return 'bg-gray-100 text-gray-600'
        }
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-500 mt-1">{total.toLocaleString()} total projects</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setPage(1); loadProjects(search) }} className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-72 border-gray-300" />
                    </div>
                    <Button type="submit" className="bg-violet-600 hover:bg-violet-700">Search</Button>
                </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Project</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Workspace</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Members</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Assets</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={7} className="px-6 py-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-violet-600 mx-auto" /></td></tr>
                        ) : projects.length === 0 ? (
                            <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No projects found</td></tr>
                        ) : (
                            projects.map((project) => (
                                <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-semibold">{project.name[0].toUpperCase()}</div>
                                            <span className="font-medium text-gray-900">{project.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-gray-600"><Building2 className="h-4 w-4" />{project.workspace?.name || 'Unknown'}</div></td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(project.status)}`}>{project.status}</span></td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-gray-600"><Users className="h-4 w-4" />{project.member_count?.[0]?.count || 0}</div></td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-gray-600"><FileImage className="h-4 w-4" />{project.asset_count?.[0]?.count || 0}</div></td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-gray-500 text-sm"><Calendar className="h-4 w-4" />{format(new Date(project.created_at), 'MMM dd, yyyy')}</div></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => viewProject(project.id)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-violet-600"><Eye className="h-4 w-4" /></button>
                                            <button onClick={() => setShowDeleteConfirm(project.id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
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

            {/* Project Modal */}
            {(selectedProject || modalLoading) && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-auto shadow-2xl">
                        {modalLoading ? (
                            <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
                        ) : selectedProject && (
                            <>
                                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold">{selectedProject.project.name[0].toUpperCase()}</div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{selectedProject.project.name}</h2>
                                            <p className="text-gray-500">Workspace: {selectedProject.project.workspace?.name || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedProject(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-lg border"><p className="text-sm text-gray-500">Status</p><p className={`mt-1 px-2 py-1 inline-block text-xs rounded-full ${getStatusColor(selectedProject.project.status)}`}>{selectedProject.project.status}</p></div>
                                        <div className="p-4 bg-gray-50 rounded-lg border"><p className="text-sm text-gray-500">Created</p><p className="text-gray-900 font-medium">{formatDistanceToNow(new Date(selectedProject.project.created_at), { addSuffix: true })}</p></div>
                                        <div className="p-4 bg-gray-50 rounded-lg border"><p className="text-sm text-gray-500">Members</p><p className="text-gray-900 font-medium">{selectedProject.members.length}</p></div>
                                        <div className="p-4 bg-gray-50 rounded-lg border"><p className="text-sm text-gray-500">Assets</p><p className="text-gray-900 font-medium">{selectedProject.assets.length}</p></div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-3"><User className="h-5 w-5 text-blue-600" /><h3 className="font-semibold text-gray-900">Team Members</h3></div>
                                        {selectedProject.members.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2">{selectedProject.members.map((m: any) => (<div key={m.user.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">{(m.user.full_name?.[0] || m.user.email[0]).toUpperCase()}</div><span className="text-gray-900 text-sm">{m.user.full_name || m.user.email}</span></div><span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">{m.role}</span></div>))}</div>
                                        ) : <p className="text-gray-400 text-sm">No members</p>}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-3"><FileImage className="h-5 w-5 text-emerald-600" /><h3 className="font-semibold text-gray-900">Assets</h3></div>
                                        {selectedProject.assets.length > 0 ? (
                                            <div className="space-y-2 max-h-48 overflow-auto">{selectedProject.assets.map((a: any) => (<div key={a.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-xl">{a.file_type?.includes('video') ? '🎬' : a.file_type?.includes('image') ? '🖼️' : '📄'}</span><div><span className="text-gray-900 text-sm block truncate max-w-[300px]">{a.file_name}</span><span className="text-xs text-gray-400">{format(new Date(a.created_at), 'MMM dd, yyyy')}</span></div></div><span className={`px-2 py-1 text-xs rounded-full ${a.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : a.status === 'in-review' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{a.status}</span></div>))}</div>
                                        ) : <p className="text-gray-400 text-sm">No assets</p>}
                                    </div>
                                </div>
                                <div className="p-6 border-t border-gray-200 flex justify-between bg-gray-50">
                                    <Button variant="outline" onClick={() => setShowDeleteConfirm(selectedProject.project.id)} className="border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-2" />Delete Project</Button>
                                    <Button onClick={() => setSelectedProject(null)} variant="outline">Close</Button>
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
                            <div><h3 className="text-lg font-bold text-gray-900">Delete Project</h3><p className="text-gray-500 text-sm">This will delete all assets!</p></div>
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
