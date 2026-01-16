"use client";

import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragOverEvent, useSensor, useSensors, PointerSensor, TouchSensor } from "@dnd-kit/core";
import { BoardColumn } from "./board-column";
import { TaskCard, Task } from "./task-card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const COLUMNS = [
    { id: "idea", title: "Idea", color: "border-b-2 border-b-purple-500 text-purple-600" },
    { id: "scripting", title: "Scripting", color: "border-b-2 border-b-blue-500 text-blue-600" },
    { id: "filming", title: "Filming", color: "border-b-2 border-b-cyan-500 text-cyan-600" },
    { id: "editing", title: "Editing", color: "border-b-2 border-b-amber-500 text-amber-600" },
    { id: "review", title: "Review", color: "border-b-2 border-b-orange-500 text-orange-600" },
    { id: "posted", title: "Posted", color: "border-b-2 border-b-green-500 text-green-600" },
];

export function TaskBoard({ projectId }: { projectId: string }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [mounted, setMounted] = useState(false);
    const supabase = createClient();

    // Sensors for better drag experience
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor)
    );

    useEffect(() => {
        setMounted(true);
        fetchTasks();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel(`public:tasks:project_id=eq.${projectId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tasks',
                filter: `project_id=eq.${projectId}`
            }, fetchTasks)
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        }
    }, [projectId]);

    const fetchTasks = async () => {
        if (!projectId) return;
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                profiles:assigned_to (
                    full_name,
                    avatar_url
                )
            `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching tasks:', error);
        } else {
            const mappedTasks = data?.map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                projectId: t.project_id,
                assignee: t.profiles
            })) || [];
            setTasks(mappedTasks);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = tasks.find(t => t.id === active.id);
        if (task) {
            setActiveTask(task);
            setActiveColumnId(task.status);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        if (!over) return;

        // If dragging over a column directly
        if (COLUMNS.find(c => c.id === over.id)) {
            setActiveColumnId(over.id as string);
        } else {
            // If dragging over another task, find that task's column
            const overTask = tasks.find(t => t.id === over.id);
            if (overTask) {
                setActiveColumnId(overTask.status);
            }
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);
        setActiveColumnId(null);

        if (!over) return;

        const taskId = active.id as string;
        const newStatus = over.id as string;

        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        if (task.status === newStatus) return;

        // Optimistic Update
        setTasks((prev) =>
            prev.map((t) =>
                t.id === taskId ? { ...t, status: newStatus } : t
            )
        );

        // DB Update
        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', taskId);

        if (error) {
            toast.error("Failed to update task status");
            fetchTasks();
        }
    };

    const handleGenerateIdeas = async () => {
        setGenerating(true);

        try {
            const { data: project } = await supabase
                .from('projects')
                .select('name, description')
                .eq('id', projectId)
                .single();

            if (!project) throw new Error("Could not fetch project details");

            const response = await fetch('/api/generate-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    projectTitle: project.name,
                    projectDescription: project.description
                })
            });

            if (!response.ok) throw new Error("AI generation failed");

            const result = await response.json();
            fetchTasks();
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate ideas. Vixi is taking a nap.");
        } finally {
            setGenerating(false);
        }
    };

    const getTasksForColumn = (columnId: string) => {
        return tasks.filter((task) => task.status === columnId);
    };

    const handleTaskDelete = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    if (!mounted) return null;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full w-full gap-2 pb-2">
                {COLUMNS.map((col) => (
                    <BoardColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        color={col.color}
                        tasks={getTasksForColumn(col.id)}
                        projectId={projectId}
                        onTaskDelete={handleTaskDelete}
                        onTaskAdded={fetchTasks}
                    >
                        {col.id === 'idea' && (
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full mt-2 transition-all duration-300",
                                    generating
                                        ? "bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white border-0 animate-pulse"
                                        : "border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400"
                                )}
                                onClick={handleGenerateIdeas}
                                disabled={generating}
                            >
                                {generating ? (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2 animate-bounce" />
                                        Vixi is thinking...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate Ideas
                                    </>
                                )}
                            </Button>
                        )}
                    </BoardColumn>
                ))}
            </div>

            {createPortal(
                <DragOverlay>
                    {activeTask ? (
                        <div className="rotate-2 cursor-grabbing opacity-90 scale-105">
                            <TaskCard task={activeTask} status={activeColumnId || activeTask.status} />
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
