"use client"

import { useState, useEffect, useRef } from "react"
import { ChatSidebar } from "@/components/projects/chat-sidebar"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { workspaceEvents } from "@/lib/workspace-events"

interface ProjectLayoutClientProps {
    children: React.ReactNode
    projectId: string
    title: string
    status: string
    members: any[]
}

import { ProjectHeader } from "@/components/project-header"

export function ProjectLayoutClient({ children, projectId, title, status, members }: ProjectLayoutClientProps) {
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [currentTitle, setCurrentTitle] = useState(title)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const supabase = createClient()

    // Update currentTitle when prop changes
    useEffect(() => {
        setCurrentTitle(title)
    }, [title])

    // Listen for project-updated events
    useEffect(() => {
        const unsubscribe = workspaceEvents.on('project-updated', (data) => {
            if (data?.id === projectId && data?.name) {
                setCurrentTitle(data.name)
            }
        })
        return unsubscribe
    }, [projectId])

    useEffect(() => {
        // Reset count when chat opens
        if (isChatOpen) {
            setUnreadCount(0)
        }
    }, [isChatOpen])

    useEffect(() => {
        const channel = supabase
            .channel(`project_layout_chat:${projectId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `project_id=eq.${projectId}`
                },
                (payload) => {
                    if (!isChatOpen) {
                        setUnreadCount((prev) => prev + 1)
                        // Optional: Play sound or show toast
                        // toast("New team message")
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [projectId, isChatOpen, supabase])

    return (
        <div className="flex flex-col h-full">
            <ProjectHeader
                projectId={projectId}
                title={currentTitle}
                status={status}
                members={members}
                onChatToggle={() => setIsChatOpen(!isChatOpen)}
                unreadCount={unreadCount}
            />
            <div className="flex flex-1 overflow-hidden relative bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto px-6 pb-6 pt-2">
                        {children}
                    </div>
                </main>
                <ChatSidebar
                    projectId={projectId}
                    open={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                />
            </div>
        </div>
    )
}

