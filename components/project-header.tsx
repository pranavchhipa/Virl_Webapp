"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    ChevronDown,
    MessageSquare,
    FolderOpen,
    LayoutDashboard,
    Files,
    Kanban,
    Bot,
    Settings,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { updateProjectStatus } from "@/app/actions/projects"
import { toast } from "sonner"
import { useState } from "react"

interface Member {
    id: string
    full_name: string
    avatar_url?: string
}

interface ProjectHeaderProps {
    projectId: string
    title: string
    status: string
    members?: Member[]
    onChatToggle?: () => void
    unreadCount?: number
}

export function ProjectHeader({ projectId, title, status: initialStatus, members = [], onChatToggle, unreadCount = 0 }: ProjectHeaderProps) {
    const pathname = usePathname()
    const [status, setStatus] = useState(initialStatus)

    const tabs = [
        { name: "Overview", href: `/projects/${projectId}`, exact: true, icon: LayoutDashboard },
        { name: "Assets", href: `/projects/${projectId}/assets`, icon: Files },
        { name: "Kanban", href: `/projects/${projectId}/kanban`, icon: Kanban },
        { name: "Vixi", href: `/projects/${projectId}/vixi`, icon: Bot },
        { name: "Manage Project", href: `/projects/${projectId}/settings`, icon: Settings },
    ]

    const isActive = (href: string, exact: boolean = false) => {
        if (exact) return pathname === href
        return pathname?.startsWith(href)
    }

    const handleStatusChange = async (newStatus: string) => {
        setStatus(newStatus) // Optimistic
        const res = await updateProjectStatus(projectId, newStatus)
        if (res.error) {
            toast.error("Failed to update status")
            setStatus(initialStatus) // Revert
        } else {
            toast.success("Status updated")
        }
    }

    const getStatusColor = (s: string) => {
        switch (s.toLowerCase()) {
            case 'active': return "bg-emerald-500";
            case 'scripting': return "bg-purple-500";
            case 'shooting': return "bg-blue-500";
            case 'editing': return "bg-amber-500";
            case 'review': return "bg-orange-500";
            case 'done': return "bg-green-500";
            default: return "bg-gray-500";
        }
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                {/* Left: Project Info */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="size-8 flex items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                            <FolderOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold leading-none tracking-tight text-slate-900">{title}</h1>
                            <p className="text-xs text-slate-500 mt-1">Managed Project</p>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                    {/* Status Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-normal hover:bg-slate-50 transition-colors">
                                <span className={cn("size-2 rounded-full", getStatusColor(status))} />
                                <span className="capitalize">{status}</span>
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {[
                                { value: 'active', label: 'Active' },
                                { value: 'scripting', label: 'Scripting' },
                                { value: 'shooting', label: 'Shooting' },
                                { value: 'editing', label: 'Editing' },
                                { value: 'review', label: 'Review' },
                                { value: 'done', label: 'Done' },
                            ].map(s => (
                                <DropdownMenuItem key={s.value} onClick={() => handleStatusChange(s.value)}>
                                    <span className={cn("size-2 rounded-full mr-2", getStatusColor(s.value))} />
                                    {s.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Right: Team & Chat */}
                <div className="flex items-center gap-6">
                    <div className="flex -space-x-3">
                        {members.slice(0, 3).map((member, i) => (
                            <Avatar key={member.id || i} className="h-9 w-9 border-2 border-white">
                                <AvatarImage src={member.avatar_url} />
                                <AvatarFallback className="text-xs bg-slate-100 text-slate-600 font-semibold">
                                    {member.full_name?.substring(0, 2).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        ))}
                        {members.length > 3 && (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-semibold text-slate-500">
                                +{members.length - 3}
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={onChatToggle}
                        className="relative gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm shadow-violet-300"
                    >
                        <MessageSquare className="h-4 w-4" />
                        Team Chat
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                {unreadCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="max-w-7xl mx-auto flex border-t border-slate-100 overflow-x-auto">
                {tabs.map((tab) => (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className={cn(
                            "relative flex items-center justify-center px-5 pb-3 pt-4 min-w-[80px] text-sm font-medium transition-colors gap-2",
                            isActive(tab.href, tab.exact)
                                ? "text-violet-600"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        )}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.name}
                        {isActive(tab.href, tab.exact) && (
                            <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-t-full bg-violet-600" />
                        )}
                    </Link>
                ))}
            </nav>
        </header>
    )
}
