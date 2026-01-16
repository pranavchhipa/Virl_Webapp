"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { workspaceEvents } from "@/lib/workspace-events"
import { DashboardProject } from "@/app/actions/dashboard"
import { createClient } from "@/lib/supabase/client"

interface ProjectsContextType {
    projects: DashboardProject[]
    setProjects: (projects: DashboardProject[]) => void
    refreshProjects: () => void
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined)

export function ProjectsProvider({
    children,
    initialProjects = []
}: {
    children: React.ReactNode
    initialProjects: DashboardProject[]
}) {
    const [projects, setProjects] = useState<DashboardProject[]>(initialProjects)

    const supabase = createClient()

    // Update state if initialProjects changes (e.g. on hard navigation)
    useEffect(() => {
        setProjects(initialProjects)
    }, [initialProjects])

    // Real-time subscription to projects table
    useEffect(() => {
        const channel = supabase
            .channel('global-projects-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'projects'
                },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        const updated = payload.new as DashboardProject
                        setProjects(prev => prev.map(p =>
                            p.id === updated.id ? { ...p, ...updated } : p
                        ))
                    } else if (payload.eventType === 'INSERT') {
                        const newProject = payload.new as DashboardProject
                        setProjects(prev => [newProject, ...prev])
                    } else if (payload.eventType === 'DELETE') {
                        const deleted = payload.old as { id: string }
                        setProjects(prev => prev.filter(p => p.id !== deleted.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    useEffect(() => {
        // Handle updates
        const unsubscribeUpdate = workspaceEvents.on('project-updated', (data) => {
            if (data?.id) {
                setProjects(prev => prev.map(p =>
                    p.id === data.id
                        ? { ...p, ...data }
                        : p
                ))
            }
        })

        // Handle creation (optional, but good for UX)
        // Ideally we'd fetch the full project, but we might not have all data in the event.
        // For now, we'll rely on revalidation for creation, or handle if we send full object.

        // Handle deletion
        const unsubscribeDelete = workspaceEvents.on('project-deleted', (data) => {
            if (data?.id) {
                setProjects(prev => prev.filter(p => p.id !== data.id))
            }
        })

        return () => {
            unsubscribeUpdate()
            unsubscribeDelete()
        }
    }, [])

    const refreshProjects = () => {
        // Placeholder for re-fetching if needed, 
        // currently we rely on server action revalidation triggering a layout update
    }

    return (
        <ProjectsContext.Provider value={{ projects, setProjects, refreshProjects }}>
            {children}
        </ProjectsContext.Provider>
    )
}

export function useProjects() {
    const context = useContext(ProjectsContext)
    if (context === undefined) {
        throw new Error("useProjects must be used within a ProjectsProvider")
    }
    return context
}
