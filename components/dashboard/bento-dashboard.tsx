"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Calendar, HardDrive, Users, Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { workspaceEvents } from "@/lib/workspace-events"
import { useState, useEffect } from "react"
import { useProjects } from "@/components/providers/projects-provider"

import { StorageUsageCard } from "@/components/assets/storage-usage-card"

interface BentoDashboardProps {
    projects: any[]
    user: any
    recentActivity: any[]
    stats: {
        storageUsed: number
        storageTotal: number
        teamMemberCount: number
        teamMembers: any[]
        pendingAssets: number
    }
}

export function BentoDashboard({ projects: initialProjects, user, recentActivity, stats }: BentoDashboardProps) {
    const searchParams = useSearchParams()
    const { projects } = useProjects()
    const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null)

    // Format bytes to GB
    const formatStorage = (bytes: number) => {
        return (bytes / (1024 * 1024 * 1024)).toFixed(2)
    }

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const storagePercentage = (stats.storageUsed / stats.storageTotal) * 100

    useEffect(() => {
        const workspaceId = searchParams?.get('workspace') ||
            (typeof window !== 'undefined' ? localStorage.getItem('selectedWorkspaceId') : null)
        setCurrentWorkspace(workspaceId)
    }, [searchParams])

    useEffect(() => {
        const unsubscribe = workspaceEvents.on('workspace-switched', (data) => {
            if (data?.workspaceId) {
                setCurrentWorkspace(data.workspaceId)
            }
        })
        return unsubscribe
    }, [])

    const workspaceProjects = currentWorkspace
        ? projects.filter(p => p.workspace_id === currentWorkspace)
        : projects

    const displayProjects = workspaceProjects.length > 0 ? workspaceProjects : projects
    const activeProjects = displayProjects.filter(p => p.status !== 'archived').slice(0, 3)

    // Status badge colors
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'in-progress':
            case 'active':
                return 'bg-amber-50 text-amber-700 border-amber-100'
            case 'planning':
            case 'scripting':
                return 'bg-blue-50 text-blue-700 border-blue-100'
            case 'review':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100'
            default:
                return 'bg-slate-50 text-slate-600 border-slate-200'
        }
    }

    // Priority badge colors
    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-50 text-red-700 border-red-100'
            case 'medium':
                return 'bg-orange-50 text-orange-600 border-orange-100'
            case 'low':
                return 'bg-slate-100 text-slate-600 border-slate-200'
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200'
        }
    }

    const formatStatusLabel = (status: string) => {
        if (!status) return 'Draft'
        return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Top Section: Focus Card + Stats - Using 12 column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Daily Focus Card - 8 columns */}
                <div className="lg:col-span-8">
                    <div className="h-full rounded-xl overflow-hidden shadow-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent" />
                        <div className="relative z-10 p-6 flex flex-col justify-between h-full min-h-[220px]">
                            <div>
                                {/* Daily Focus Badge */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 mb-3">
                                    <span className="text-yellow-300 text-sm">⚡</span>
                                    <span className="text-xs font-bold uppercase tracking-wide">Daily Focus</span>
                                </div>

                                <h2 className="text-2xl font-bold leading-tight mb-2">
                                    Review pending assets
                                </h2>
                                <p className="text-indigo-100 max-w-lg text-sm leading-relaxed opacity-90">
                                    You have {stats.pendingAssets || 4} new video assets from the creative team waiting for approval. Review them before the EOD meeting.
                                </p>
                            </div>

                            <div className="mt-4">
                                <Link href="/projects">
                                    <button className="bg-white text-violet-700 hover:bg-slate-50 transition-colors px-5 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 shadow-lg">
                                        Start Review
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Stats Column - 4 columns */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    {/* Storage Usage Card */}
                    {/* Storage Usage Card - Swapped to Circular */}
                    <StorageUsageCard
                        usedBytes={stats.storageUsed}
                        limitBytes={stats.storageTotal}
                        className="py-6"
                        size="sm"
                    />

                    {/* Team + Activity Row */}
                    <div className="grid grid-cols-2 gap-4 flex-1">
                        {/* Team Card */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="text-slate-500 flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Team</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-slate-900">{stats.teamMemberCount || 1}</span>
                                <div className="flex -space-x-2">
                                    {(stats.teamMembers.length > 0 ? stats.teamMembers.slice(0, 1) : [{ full_name: user?.user_metadata?.full_name || 'Me' }]).map((member, i) => (
                                        <Avatar key={i} className="h-8 w-8 ring-2 ring-white">
                                            <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-indigo-500 text-white font-bold">
                                                {member?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                    ))}
                                    <div className="h-8 w-8 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-xs font-medium text-slate-400">
                                        +
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Activity Card */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                            <div className="text-slate-500 mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider">Activity</span>
                            </div>
                            <div className="flex gap-2 items-start">
                                <div className="h-2 w-2 mt-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    <span className="font-semibold text-slate-900">You</span> uploaded{' '}
                                    <span className="italic">{recentActivity[0]?.file_name || 'changes_10.mp4'}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Projects Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">Active Projects</h3>
                    <CreateProjectDialog />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {activeProjects.map((project, index) => (
                        <Link key={project.id} href={`/projects/${project.id}`}>
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3 group cursor-pointer h-full">
                                {/* Status + Priority Badges */}
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-2">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded text-xs font-medium border",
                                            getStatusStyle(project.status)
                                        )}>
                                            {formatStatusLabel(project.status)}
                                        </span>
                                        {project.priority && (
                                            <span className={cn(
                                                "px-2.5 py-1 rounded text-xs font-medium border",
                                                getPriorityStyle(project.priority)
                                            )}>
                                                {project.priority?.charAt(0).toUpperCase() + project.priority?.slice(1)}
                                            </span>
                                        )}
                                    </div>
                                    <button className="text-slate-400 hover:text-violet-600 transition-colors">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Project Title & Description */}
                                <div>
                                    <h4 className="text-slate-900 font-bold text-lg mb-1 group-hover:text-violet-600 transition-colors">
                                        {project.name}
                                    </h4>
                                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                                        {project.description || 'No description provided.'}
                                    </p>
                                </div>

                                {/* Footer: Date */}
                                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" />
                                        <span>Starts {formatDate(project.start_date || project.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {activeProjects.length === 0 && (
                        <div className="col-span-full bg-white rounded-xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                <Plus className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500 mb-3">No active projects yet</p>
                            <CreateProjectDialog />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
