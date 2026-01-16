"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileText, HardDrive, Users, Clock, Upload, Bot, Settings as SettingsIcon, Pencil, Check, User, CheckCircle, UserPlus, Edit3, FileUp, Cog, FolderOpen } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { formatDistanceToNow, format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { workspaceEvents } from "@/lib/workspace-events"
import { cn } from "@/lib/utils"

interface ProjectOverviewProps {
    project: any
    fileCount: number
    memberCount: number
    recentActivity: any[]
    creatorName?: string
    storageGB?: string
}

const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'active': return 'bg-emerald-500 text-white';
        case 'scripting': return 'bg-purple-500 text-white';
        case 'shooting': return 'bg-blue-500 text-white';
        case 'editing': return 'bg-amber-500 text-white';
        case 'review': return 'bg-orange-500 text-white';
        case 'done': return 'bg-green-500 text-white';
        case 'archived': return 'bg-slate-500 text-white';
        default: return 'bg-emerald-500 text-white';
    }
}

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'upload': return { icon: Upload, color: 'bg-blue-100 text-blue-600' };
        case 'status': return { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' };
        case 'member': return { icon: UserPlus, color: 'bg-purple-100 text-purple-600' };
        case 'edit': return { icon: Edit3, color: 'bg-slate-100 text-slate-600' };
        default: return { icon: Upload, color: 'bg-blue-100 text-blue-600' };
    }
}

const TAG_COLORS = [
    'bg-blue-50 text-blue-600 border-blue-100',
    'bg-purple-50 text-purple-600 border-purple-100',
    'bg-orange-50 text-orange-600 border-orange-100',
    'bg-emerald-50 text-emerald-600 border-emerald-100',
    'bg-rose-50 text-rose-600 border-rose-100',
    'bg-cyan-50 text-cyan-600 border-cyan-100',
    'bg-amber-50 text-amber-600 border-amber-100',
]

export function ProjectOverviewClient({ project, fileCount, memberCount, recentActivity, creatorName, storageGB = '0' }: ProjectOverviewProps) {
    const [localProject, setLocalProject] = useState(project)
    const [brief, setBrief] = useState(project.description || "")
    const [isEditingBrief, setIsEditingBrief] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [tags, setTags] = useState<string[]>(project.tags || [])
    const supabase = createClient()

    // Update local state when prop changes
    useEffect(() => {
        setLocalProject(project)
        setBrief(project.description || "")
    }, [project])

    // Listen for project-updated events
    useEffect(() => {
        const unsubscribe = workspaceEvents.on('project-updated', (data) => {
            if (data?.id === project.id) {
                setLocalProject((prev: any) => ({
                    ...prev,
                    name: data.name ?? prev.name,
                    description: data.description ?? prev.description
                }))
                if (data.description !== undefined) {
                    setBrief(data.description)
                }
            }
        })
        return unsubscribe
    }, [project.id])

    const saveBrief = async () => {
        setIsSaving(true)

        // Use centralized server action that handles description update + tag generation
        const response = await fetch('/api/generate-tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: brief, projectName: localProject.name })
        })

        // Update description in database
        const { error } = await supabase
            .from('projects')
            .update({ description: brief })
            .eq('id', project.id)

        if (error) {
            toast.error("Failed to save brief")
        } else {
            toast.success("Brief updated")
            setIsEditingBrief(false)

            // Update tags from AI response
            if (response.ok && brief.trim().length >= 20) {
                try {
                    const { tags: generatedTags } = await response.json()
                    if (generatedTags && generatedTags.length > 0) {
                        await supabase
                            .from('projects')
                            .update({ tags: generatedTags })
                            .eq('id', project.id)
                        setTags(generatedTags)
                    }
                } catch (e) {
                    console.error('Tag generation failed:', e)
                }
            }
        }
        setIsSaving(false)
    }

    const daysLeft = project.due_date
        ? Math.ceil((new Date(project.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null

    return (
        <div className="space-y-5">
            {/* Hero Section - Purple Gradient */}
            <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 p-6 text-white shadow-lg">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-3">
                        {/* Status Badge */}
                        <span className={cn(
                            "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide border backdrop-blur-sm",
                            "bg-emerald-500/20 text-emerald-100 border-emerald-500/30"
                        )}>
                            Active Project
                        </span>

                        {/* Project Title */}
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight mb-1">{localProject.name}</h2>
                            <p className="text-white/80 text-sm font-normal flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Created by {creatorName || 'Unknown'} • {format(new Date(localProject.created_at), 'MMM d, yyyy')}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <Link href={`/projects/${project.id}/assets`} className="flex-1 md:flex-none">
                            <Button className="w-full bg-white text-violet-700 hover:bg-slate-50 border-0 shadow-sm font-semibold gap-2">
                                <div className="bg-violet-100 p-1.5 rounded-lg">
                                    <FileUp className="h-4 w-4 text-violet-600" />
                                </div>
                                Upload File
                            </Button>
                        </Link>
                        <Link href={`/projects/${project.id}/vixi`} className="flex-1 md:flex-none">
                            <Button variant="outline" className="w-full bg-white/20 border-white/10 text-white hover:bg-white/30 backdrop-blur-sm font-semibold">
                                <Bot className="mr-2 h-4 w-4" />
                                Open Vixi
                            </Button>
                        </Link>
                        <Link href={`/projects/${project.id}/settings`}>
                            <div className="size-11 bg-violet-500/40 hover:bg-violet-500/60 backdrop-blur-md rounded-2xl flex items-center justify-center cursor-pointer transition-all border border-white/20 shadow-lg">
                                <Cog className="h-6 w-6 text-white" />
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Grid - 4 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    label="Total Assets"
                    value={fileCount.toString()}
                    icon={FolderOpen}
                />
                <StatCard
                    label="Storage Used"
                    value={storageGB === '0.00' ? '--' : storageGB}
                    subValue="GB"
                    icon={HardDrive}
                />
                <StatCard
                    label="Team Size"
                    value={memberCount.toString()}
                    icon={Users}
                />
                <StatCard
                    label="Days Left"
                    value={daysLeft !== null ? daysLeft.toString() : '∞'}
                    icon={Clock}
                />
            </div >

            {/* Main Grid: Project Brief + Recent Activity */}
            < div className="grid grid-cols-1 lg:grid-cols-5 gap-5" >
                {/* Project Brief - 3 columns */}
                < Card className="lg:col-span-3 bg-white border border-slate-200 shadow-sm overflow-hidden" >
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-violet-600" />
                            <h3 className="font-semibold text-slate-900">Project Brief</h3>
                        </div>
                        <button
                            onClick={() => isEditingBrief ? saveBrief() : setIsEditingBrief(true)}
                            disabled={isSaving}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            {isEditingBrief ? <Check className="h-4 w-4 text-green-600" /> : <Pencil className="h-4 w-4" />}
                        </button>
                    </div>
                    <div className="p-6">
                        {isEditingBrief ? (
                            <Textarea
                                className="min-h-[200px] resize-none border-0 focus-visible:ring-0 p-0 text-sm leading-relaxed bg-transparent text-slate-600"
                                placeholder="Describe the project goals, target audience, and key deliverables..."
                                value={brief}
                                onChange={(e) => setBrief(e.target.value)}
                            />
                        ) : brief ? (
                            <div className="space-y-4">
                                <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                                    {brief}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-center">
                                <p className="text-sm text-slate-400 mb-2">No brief defined yet.</p>
                                <Button variant="link" size="sm" onClick={() => setIsEditingBrief(true)} className="text-violet-600">
                                    Write a brief
                                </Button>
                            </div>
                        )}

                        {!isEditingBrief && tags.length > 0 && (
                            <div className="mt-6 pt-5 border-t border-slate-100">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Associated Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag, i) => (
                                        <span
                                            key={tag}
                                            className={cn(
                                                "px-2.5 py-1 rounded-md text-xs font-semibold border",
                                                TAG_COLORS[i % TAG_COLORS.length]
                                            )}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Card >

                {/* Recent Activity - 2 columns */}
                < Card className="lg:col-span-2 bg-white border border-slate-200 shadow-sm overflow-hidden" >
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-violet-600" />
                            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
                        </div>
                        <Link href={`/projects/${project.id}/assets`} className="text-xs font-semibold text-violet-600 hover:text-violet-700">
                            View All
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentActivity.length === 0 ? (
                            <div className="p-6 text-center text-sm text-slate-400">
                                No activity recorded yet.
                            </div>
                        ) : (
                            recentActivity.slice(0, 4).map((item, index) => (
                                <div key={item.id} className="flex gap-4 p-5 hover:bg-slate-50 transition-colors group">
                                    <div className="relative shrink-0">
                                        <div className="size-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <Upload className="h-4 w-4" />
                                        </div>
                                        {index < recentActivity.length - 1 && index < 3 && (
                                            <div className="absolute top-8 left-1/2 -ml-px h-full w-0.5 bg-slate-100" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-slate-700">
                                            <span className="font-semibold text-slate-900">{item.uploader?.full_name || 'User'}</span>
                                            {' '}uploaded{' '}
                                            <span className="text-violet-600 font-normal">{item.file_name}</span>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card >
            </div >
        </div >
    )
}

function StatCard({ label, value, subValue, icon: Icon }: { label: string, value: string, subValue?: string, icon: any }) {
    return (
        <div className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm flex items-start justify-between group hover:border-violet-200 transition-colors">
            <div>
                <p className="text-sm font-normal text-slate-500 mb-1">{label}</p>
                <div className="flex items-end gap-1">
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    {subValue && <span className="text-sm font-normal text-slate-400 mb-0.5">{subValue}</span>}
                </div>
            </div>
            <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-violet-600 group-hover:bg-violet-50 transition-colors">
                <Icon className="h-5 w-5" />
            </div>
        </div>
    )
}
