"use client";

import { useDroppable } from "@dnd-kit/core";
import { TaskCard, Task } from "./task-card";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { createTask } from "@/app/actions/tasks";
import { toast } from "sonner";

interface BoardColumnProps {
    id: string;
    title: string;
    color: string;
    tasks: Task[];
    projectId: string;
    children?: React.ReactNode;
    onTaskDelete?: (taskId: string) => void;
    onTaskAdded?: () => void;
}

export function BoardColumn({ id, title, color, tasks, projectId, children, onTaskDelete, onTaskAdded }: BoardColumnProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const { setNodeRef, isOver } = useDroppable({
        id: id,
        data: {
            type: "Column",
        }
    });

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;

        setIsCreating(true);
        const result = await createTask(projectId, newTaskTitle, id, newTaskDescription);

        if (result.error) {
            toast.error(result.error);
        } else {
            setNewTaskTitle("");
            setNewTaskDescription("");
            setIsAdding(false);
            onTaskAdded?.(); // Refresh task list instantly
        }
        setIsCreating(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAddTask();
        if (e.key === 'Escape') {
            setIsAdding(false);
            setNewTaskTitle("");
        }
    };

    return (
        <div className="flex flex-col h-full flex-1 min-w-0 w-full hover:flex-[1.1] transition-all duration-300">
            {/* Colored Header */}
            <div className={cn(
                "flex items-center justify-between px-3 py-3 rounded-xl mb-3 transition-all duration-300 relative group/header bg-white/60 backdrop-blur-xl border-white/50 border shadow-sm hover:shadow-md",
                color
            )}>
                <div className="flex items-center gap-2.5">
                    <span className="font-bold text-[13px] tracking-wide opacity-90">{title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="bg-current/5 border border-current/10 text-current text-[11px] px-2 py-0.5 rounded-md font-bold min-w-[1.5rem] text-center">
                        {tasks.length}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-current opacity-70 hover:opacity-100 hover:bg-black/5"
                        onClick={() => setIsAdding(true)}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 rounded-xl p-2 transition-all duration-200 overflow-y-auto space-y-1.5",
                    "bg-slate-50/50 border border-slate-100",
                    isOver && "bg-slate-100 border-slate-200 scale-[1.02]",
                    "[&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
                )}
            >
                {/* Add Task Input */}
                {isAdding && (
                    <div className="p-3 bg-white rounded-xl border shadow-sm">
                        <Input
                            placeholder="Task title"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="mb-2 border-slate-200"
                        />
                        <textarea
                            placeholder="Add description (optional)"
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                            className="w-full mb-2 px-3 py-2 text-sm border border-slate-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            rows={2}
                        />
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleAddTask}
                                disabled={isCreating || !newTaskTitle.trim()}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                            >
                                {isCreating ? "Adding..." : "Add Task"}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setIsAdding(false);
                                    setNewTaskTitle("");
                                    setNewTaskDescription("");
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* Task Cards */}
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onDelete={onTaskDelete} />
                ))}

                {/* Empty State */}
                {tasks.length === 0 && !isAdding && (
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-sm text-slate-400">
                        Drop items here
                    </div>
                )}

                {/* Custom children (like Generate Ideas button) */}
                {children}
            </div>
        </div>
    );
}
