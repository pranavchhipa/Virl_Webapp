'use client'

import { useEffect, useState } from 'react'
import { getActivityLogs } from '@/app/actions/admin'
import { Loader2, User, FolderKanban, FileImage, Clock, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'

interface ActivityLog {
    id: string
    type: 'signup' | 'project' | 'asset'
    title: string
    subtitle: string
    timestamp: string
}

const typeConfig = {
    signup: { icon: User, color: 'bg-blue-500', label: 'Signup' },
    project: { icon: FolderKanban, color: 'bg-violet-500', label: 'Project' },
    asset: { icon: FileImage, color: 'bg-emerald-500', label: 'Asset' }
}

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'signup' | 'project' | 'asset'>('all')

    async function loadLogs() {
        setLoading(true)
        try {
            const data = await getActivityLogs()
            setLogs(data)
        } catch (error) {
            console.error('Failed to load logs:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadLogs() }, [])

    const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.type === filter)

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
                    <p className="text-gray-500 mt-1">Recent platform activity</p>
                </div>
                <Button onClick={loadLogs} variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-100">
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {(['all', 'signup', 'project', 'asset'] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === type
                                ? 'bg-violet-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {type === 'all' ? 'All Activity' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
                    </button>
                ))}
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No activity found</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredLogs.map((log) => {
                            const config = typeConfig[log.type]
                            const Icon = config.icon
                            return (
                                <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                    <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{log.title}</p>
                                        <p className="text-sm text-gray-500">{log.subtitle}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color} text-white`}>{config.label}</span>
                                    <div className="flex items-center gap-1 text-sm text-gray-400 flex-shrink-0">
                                        <Clock className="h-4 w-4" />
                                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
