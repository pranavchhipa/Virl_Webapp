"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { workspaceEvents } from './workspace-events'

interface WorkspaceContextType {
    selectedWorkspaceId: string | null
    setSelectedWorkspaceId: (id: string) => void
    workspaces: any[]
    isLoading: boolean
    refreshWorkspaces: () => Promise<void>
    updateWorkspaceName: (id: string, newName: string) => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children, userId }: { children: ReactNode, userId?: string }) {
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
    const [workspaces, setWorkspaces] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    const fetchWorkspaces = useCallback(async () => {
        if (!userId) {
            setIsLoading(false)
            return
        }

        // Get user's workspaces
        const { data: members } = await supabase
            .from('workspace_members')
            .select('workspace_id, workspaces(id, name)')
            .eq('user_id', userId)

        const { data: owned } = await supabase
            .from('workspaces')
            .select('id, name')
            .eq('owner_id', userId)

        // Merge and deduplicate
        const wsList = members?.map((m: any) => m.workspaces).filter(Boolean) || []
        const allWorkspaces = [...wsList, ...(owned || [])]
        const unique = Array.from(new Map(allWorkspaces.map(item => [item.id, item])).values())

        setWorkspaces(unique)

        // Load from localStorage or set first workspace
        const stored = localStorage.getItem('selectedWorkspaceId')
        if (stored && unique.some(w => w.id === stored)) {
            setSelectedWorkspaceId(stored)
        } else if (unique.length > 0) {
            setSelectedWorkspaceId(unique[0].id)
        }

        setIsLoading(false)
    }, [userId, supabase])

    // Optimistic update for workspace name
    const updateWorkspaceName = useCallback((id: string, newName: string) => {
        setWorkspaces(prev => prev.map(w =>
            w.id === id ? { ...w, name: newName } : w
        ))
    }, [])

    // Public refresh method
    const refreshWorkspaces = useCallback(async () => {
        await fetchWorkspaces()
    }, [fetchWorkspaces])

    // Initial fetch
    useEffect(() => {
        fetchWorkspaces()
    }, [fetchWorkspaces])

    // Listen for workspace update events
    useEffect(() => {
        const unsubUpdate = workspaceEvents.on('workspace-updated', (data) => {
            if (data?.id && data?.name) {
                updateWorkspaceName(data.id, data.name)
            } else {
                refreshWorkspaces()
            }
        })

        return unsubUpdate
    }, [refreshWorkspaces, updateWorkspaceName])

    // Persist selection to localStorage (NO router.refresh!)
    useEffect(() => {
        if (selectedWorkspaceId) {
            localStorage.setItem('selectedWorkspaceId', selectedWorkspaceId)
            // Emit event for other components to react
            workspaceEvents.emit('workspace-switched', { workspaceId: selectedWorkspaceId })
        }
    }, [selectedWorkspaceId])

    return (
        <WorkspaceContext.Provider value={{
            selectedWorkspaceId,
            setSelectedWorkspaceId,
            workspaces,
            isLoading,
            refreshWorkspaces,
            updateWorkspaceName
        }}>
            {children}
        </WorkspaceContext.Provider>
    )
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext)
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider')
    }
    return context
}
