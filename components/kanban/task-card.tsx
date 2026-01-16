"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { GripVertical, Trash2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    projectId: string;
    assignee?: {
        full_name: string;
        avatar_url: string;
    };
}

interface TaskCardProps {
    task: Task;
    onDelete?: (taskId: string) => void;
    status?: string; // Optional override for drag preview
}

const statusStyles = {
    idea: "bg-gradient-to-br from-purple-500 to-purple-600 border-t border-t-white/30 border-b border-b-purple-700/50 shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 ring-1 ring-white/10 text-white",
    scripting: "bg-gradient-to-br from-blue-500 to-blue-600 border-t border-t-white/30 border-b border-b-blue-700/50 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 ring-1 ring-white/10 text-white",
    filming: "bg-gradient-to-br from-cyan-500 to-cyan-600 border-t border-t-white/30 border-b border-b-cyan-700/50 shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 ring-1 ring-white/10 text-white",
    editing: "bg-gradient-to-br from-amber-500 to-amber-600 border-t border-t-white/30 border-b border-b-amber-700/50 shadow-lg shadow-amber-500/40 hover:shadow-amber-500/60 ring-1 ring-white/10 text-white",
    review: "bg-gradient-to-br from-orange-500 to-orange-600 border-t border-t-white/30 border-b border-b-orange-700/50 shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60 ring-1 ring-white/10 text-white",
    posted: "bg-gradient-to-br from-green-500 to-green-600 border-t border-t-white/30 border-b border-b-green-700/50 shadow-lg shadow-green-500/40 hover:shadow-green-500/60 ring-1 ring-white/10 text-white",
} as const;

export function TaskCard({ task, onDelete, status }: TaskCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const supabase = createClient();

    const currentStatus = (status || task.status) as keyof typeof statusStyles;
    const variantClass = statusStyles[currentStatus] || "bg-white border-slate-100";
    const isColored = !!statusStyles[currentStatus];

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: {
            task,
            type: "Task",
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (deleting) return;

        setDeleting(true);
        setIsRemoving(true);

        setTimeout(async () => {
            const { error } = await supabase.from('tasks').delete().eq('id', task.id);

            if (error) {
                toast.error("Failed to delete task");
                setDeleting(false);
                setIsRemoving(false);
            } else {
                toast.success("Task deleted");
                onDelete?.(task.id);
            }
        }, 200);
    };

    const isVixi = !task.assignee;

    if (isRemoving) {
        return (
            <div className="animate-[fadeOut_0.2s_ease-out_forwards] origin-top scale-y-0 opacity-0 h-0 overflow-hidden" />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "cursor-grab active:cursor-grabbing transition-all duration-300",
                isDragging && "opacity-50 z-50 scale-105"
            )}
        >
            <div className={cn(
                "rounded-xl p-3 shadow-sm border transition-all duration-300 overflow-hidden",
                "hover:shadow-md backdrop-blur-sm",
                "group relative",
                variantClass
            )}>
                {/* Gloss Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50 pointer-events-none" />

                {/* Vixi badge - bottom right */}
                {isVixi && (
                    <span className={cn(
                        "absolute bottom-2 right-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium z-10 shadow-sm",
                        isColored
                            ? "bg-white/20 text-white backdrop-blur-md border border-white/30"
                            : "bg-gradient-to-r from-violet-500 to-indigo-500 text-white"
                    )}>
                        <Sparkles className="h-2.5 w-2.5" />
                        Vixi
                    </span>
                )}

                {/* Delete button */}
                <button
                    onClick={handleDelete}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={deleting}
                    className={cn(
                        "absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10",
                        isColored
                            ? "hover:bg-white/20 text-white/50 hover:text-white"
                            : "hover:bg-black/5 text-slate-400 hover:text-red-500"
                    )}
                >
                    <Trash2 className="h-3 w-3" />
                </button>

                {/* Header */}
                <div className="flex items-start justify-between gap-2 pr-6">
                    <h4 className={cn(
                        "font-semibold text-[13px] leading-snug flex-1",
                        isColored ? "text-white" : "text-slate-800"
                    )}>
                        {task.title}
                    </h4>
                    <GripVertical className={cn(
                        "h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
                        isColored ? "text-white/50" : "text-slate-300"
                    )} />
                </div>

                {/* Description - expandable */}
                {task.description && (
                    <div className="mt-2">
                        <p className={cn(
                            "text-[11px] leading-relaxed font-medium",
                            !expanded && "line-clamp-2",
                            isColored ? "text-white/80" : "text-slate-500"
                        )}>
                            {task.description}
                        </p>
                        {task.description.length > 60 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className={cn(
                                    "text-[10px] mt-1 font-semibold flex items-center gap-0.5 transition-colors",
                                    isColored ? "text-white/90 hover:text-white" : "text-indigo-600/80 hover:text-indigo-700"
                                )}
                            >
                                {expanded ? <><ChevronUp className="h-2.5 w-2.5" /> Less</> : <><ChevronDown className="h-2.5 w-2.5" /> More</>}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
