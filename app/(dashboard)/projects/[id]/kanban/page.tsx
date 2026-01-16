'use client'

import { use } from "react"
import { TaskBoard } from "@/components/kanban/task-board"

export default function KanbanPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)

    return (
        <div className="flex flex-col h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20">
            <div className="flex-1 overflow-hidden p-4">
                <TaskBoard projectId={id} />
            </div>
        </div>
    )
}

