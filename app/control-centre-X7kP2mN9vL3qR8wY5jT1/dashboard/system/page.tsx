'use client'

import { useEffect, useState } from 'react'
import { getAllWorkspaces, getAllProjects, getActivityLogs } from '@/app/actions/admin'
import { Loader2, Building2, FolderKanban, RefreshCw, Clock, User, FileImage } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, formatDistanceToNow } from 'date-fns'

export default function SystemPage() {
    const [workspaces, setWorkspaces] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'workspaces' | 'projects' | 'logs'>('workspaces')

    useEffect(() => { loadData() }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [wsData, projData, logsData] = await Promise.all([
                getAllWorkspaces(1, 50),
                getAllProjects(1, 50),
                getActivityLogs(),
            ])
            setWorkspaces(wsData.workspaces)
            setProjects(projData.projects)
            setLogs(logsData)
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally { setLoading(false) }
    }

    const typeConfig: any = {
        signup: { icon: User, color: 'bg-blue-500', label: 'Signup' },
        project: { icon: FolderKanban, color: 'bg-violet-500', label: 'Project' },
        asset: { icon: FileImage, color: 'bg-emerald-500', label: 'Asset' }
    }

    return (
        <div className="p-8 bg-gray-50 min-h-full">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System</h1>
                    <p className="text-gray-500 mt-1">Platform-wide data management</p>
                </div>
                <Button onClick={loadData} variant="outline" disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
                {[
                    { key: 'workspaces', label: 'Workspaces', icon: Building2, count: workspaces.length },
                    { key: 'projects', label: 'Projects', icon: FolderKanban, count: projects.length },
                    { key: 'logs', label: 'Activity Logs', icon: Clock, count: logs.length },
                ].map((tab: any) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                            ? 'border-violet-600 text-violet-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{tab.count}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                </div>
            ) : (
                <>
                    {/* Workspaces Tab */}
                    {activeTab === 'workspaces' && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {workspaces.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">No workspaces found</div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Workspace</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Owner</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Members</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {workspaces.map((ws) => {
                                            // Extract count from nested object if needed
                                            const memberCount = Array.isArray(ws.member_count)
                                                ? ws.member_count[0]?.count || 0
                                                : (typeof ws.member_count === 'object' ? ws.member_count?.count : ws.member_count) || 0
                                            return (
                                                <tr key={ws.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                                                                <Building2 className="h-5 w-5 text-violet-600" />
                                                            </div>
                                                            <span className="font-medium text-gray-900">{ws.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500">{ws.owner?.email || '-'}</td>
                                                    <td className="px-6 py-4 text-gray-500">{memberCount}</td>
                                                    <td className="px-6 py-4 text-gray-500 text-sm">{format(new Date(ws.created_at), 'MMM dd, yyyy')}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Projects Tab */}
                    {activeTab === 'projects' && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Project</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Workspace</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {projects.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                        <FolderKanban className="h-5 w-5 text-emerald-600" />
                                                    </div>
                                                    <span className="font-medium text-gray-900">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{p.workspace?.name || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{format(new Date(p.created_at), 'MMM dd, yyyy')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Activity Logs Tab */}
                    {activeTab === 'logs' && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="divide-y divide-gray-100">
                                {logs.map((log) => {
                                    const config = typeConfig[log.type] || typeConfig.signup
                                    const Icon = config.icon
                                    return (
                                        <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                                            <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                                                <Icon className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{log.title}</p>
                                                <p className="text-sm text-gray-500">{log.subtitle}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color} text-white`}>{config.label}</span>
                                            <span className="text-sm text-gray-400">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
