"use client"

import { useState, useEffect } from 'react'
import { ChevronDown, Building2, Plus, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { workspaceEvents } from '@/lib/workspace-events'
import { WorkspaceBadge } from '@/components/ui/workspace-badge'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Workspace {
    id: string
    name: string
    description?: string
    owner_id: string
    owner_name?: string
    member_role?: string
}

interface WorkspaceSelectorProps {
    collapsed?: boolean
}

export function WorkspaceSelector({ collapsed }: WorkspaceSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isOpen, setIsOpen] = useState(false)
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        loadWorkspaces()
    }, [])

    async function loadWorkspaces() {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setCurrentUserId(user.id)

            const res = await fetch('/api/workspaces')
            const workspacesData = await res.json()

            const enrichedWorkspaces = await Promise.all(
                (workspacesData || []).map(async (workspace: any) => {
                    const { data: ownerProfile } = await supabase
                        .from('profiles')
                        .select('full_name, email')
                        .eq('id', workspace.owner_id)
                        .single()

                    const { data: memberData } = await supabase
                        .from('workspace_members')
                        .select('role')
                        .eq('workspace_id', workspace.id)
                        .eq('user_id', user?.id)
                        .single()

                    return {
                        ...workspace,
                        owner_name: ownerProfile?.full_name || ownerProfile?.email?.split('@')[0],
                        member_role: memberData?.role
                    }
                })
            )

            setWorkspaces(enrichedWorkspaces)

            // PRIORITY: URL Param > LocalStorage > Default
            const urlWorkspaceId = searchParams.get('workspace')
            const savedId = localStorage.getItem('selectedWorkspaceId')

            const targetId = urlWorkspaceId || savedId

            const selected = enrichedWorkspaces.find((w: Workspace) => w.id === targetId) || enrichedWorkspaces[0]
            setSelectedWorkspace(selected)

            if (selected) {
                workspaceEvents.emit('workspace-switched', { workspaceId: selected.id })
            }
        } catch (error) {
            console.error('Error loading workspaces:', error)
        } finally {
            setLoading(false)
        }
    }

    function selectWorkspace(workspace: Workspace) {
        setSelectedWorkspace(workspace)
        localStorage.setItem('selectedWorkspaceId', workspace.id)
        workspaceEvents.emit('workspace-switched', { workspaceId: workspace.id })
        setIsOpen(false)

        // Update URL to persist workspace selection for server components
        const params = new URLSearchParams(window.location.search)
        params.set('workspace', workspace.id)
        router.push(`${window.location.pathname}?${params.toString()}`)

        // Force page refresh to reload server-side data for new workspace
        router.refresh()
    }

    const isOwner = (workspace: Workspace) => workspace.owner_id === currentUserId

    if (collapsed) {
        return (
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-xl bg-[#1E293B] hover:bg-[#2A3649] transition-colors flex items-center justify-center border border-slate-700 mx-auto"
            >
                <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center overflow-hidden">
                    {/* Placeholder icon */}
                    <span className="font-bold text-[#0B0F19] text-xs">
                        {selectedWorkspace?.name?.charAt(0).toUpperCase()}
                    </span>
                </div>
            </button>
        )
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2.5 rounded-2xl bg-[#131722] hover:bg-slate-800 transition-all duration-200 flex items-center gap-3 border border-slate-800/60 group shadow-sm"
            >
                {/* Logo Placeholder - White Box */}
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                    <span className="font-extrabold text-[#0B0F19] text-lg">
                        {selectedWorkspace?.name?.substring(0, 1).toUpperCase() || 'W'}
                    </span>
                </div>

                <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                        <p className="font-bold text-white text-sm truncate pr-2">
                            {loading ? 'Loading...' : (selectedWorkspace?.name || 'Select Workspace')}
                        </p>
                        <ChevronDown className={cn(
                            "w-3.5 h-3.5 text-slate-500 transition-transform duration-200",
                            isOpen && "rotate-180"
                        )} />
                    </div>
                    {/* Badge */}
                    {selectedWorkspace && !loading && (
                        <div className="mt-0.5 flex">
                            <WorkspaceBadge
                                isOwner={isOwner(selectedWorkspace)}
                                role={selectedWorkspace.member_role}
                                className="text-[10px] py-0.5 px-2 h-auto font-bold bg-[#EAB308]/10 text-[#EAB308] border-none rounded-md"
                            />
                        </div>
                    )}
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#131722] rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-50 p-1.5"
                    >
                        <div className="max-h-64 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
                            {workspaces.map((workspace) => (
                                <button
                                    key={workspace.id}
                                    onClick={() => selectWorkspace(workspace)}
                                    className={cn(
                                        "w-full p-2 rounded-lg flex items-center gap-3 transition-colors",
                                        selectedWorkspace?.id === workspace.id
                                            ? "bg-slate-800"
                                            : "hover:bg-slate-800/50"
                                    )}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-200 text-xs font-bold border border-slate-600">
                                        {workspace.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="font-medium text-slate-200 text-sm truncate">{workspace.name}</p>
                                    </div>
                                    {selectedWorkspace?.id === workspace.id && (
                                        <Check className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="border-t border-slate-700/50 mt-1.5 pt-1.5">
                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    router.push('/workspaces/new')
                                }}
                                className="w-full p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-xs font-medium"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Create New Workspace
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
