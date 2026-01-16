"use client"

import { Calendar } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface ProjectCardProps {
    id: string
    title: string
    client?: string
    status: string
    team: string[]
    startDate?: string
    dueDate?: string
    priority?: string // 'low', 'medium', 'high'
    description?: string
}

export function ProjectCard({ id, title, status, team, startDate, dueDate, priority = 'medium', description }: ProjectCardProps) {

    // Status styling - text color only
    const getStatusStyle = (s: string) => {
        switch (s.toLowerCase()) {
            case 'scripting': return 'text-purple-600';
            case 'shooting': return 'text-blue-600';
            case 'editing': return 'text-amber-600';
            case 'review': return 'text-orange-600';
            case 'done': return 'text-green-600';
            case 'active': return 'text-emerald-600';
            default: return 'text-indigo-600';
        }
    };

    // Priority badge styling
    const getPriorityStyle = (p: string) => {
        switch (p.toLowerCase()) {
            case 'high':
                return 'bg-red-100 text-red-600 border-red-200';
            case 'medium':
                return 'bg-orange-100 text-orange-600 border-orange-200';
            default: // low
                return 'bg-blue-100 text-blue-600 border-blue-200';
        }
    };

    // Date Logic
    const start = startDate ? new Date(startDate) : null;
    const end = dueDate ? new Date(dueDate) : null;

    // Format: "Starts Jan 2" or "Jan 16 - Jan 22"
    const dateLabel = start && end
        ? `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`
        : start ? `Starts ${format(start, 'MMM d')}`
            : end ? `Due ${format(end, 'MMM d')}`
                : null;

    return (
        <Link href={`/projects/${id}`}>
            <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="group flex flex-col bg-white rounded-xl border border-slate-200 p-5 h-[200px] transition-all duration-300 hover:shadow-lg hover:border-slate-300"
            >
                {/* Header: Status & Priority Badges */}
                <div className="flex items-center gap-2 mb-3">
                    {/* Status - Text only */}
                    <span className={cn(
                        "text-xs font-semibold capitalize",
                        getStatusStyle(status)
                    )}>
                        {status || 'Active'}
                    </span>

                    {/* Priority Badge */}
                    <span className={cn(
                        "px-2 py-0.5 text-xs font-semibold capitalize rounded border",
                        getPriorityStyle(priority || 'medium')
                    )}>
                        {priority || 'Medium'}
                    </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-1 mb-2">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 flex-1">
                    {description || "No description provided for this project."}
                </p>

                {/* Footer: Date */}
                {dateLabel && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-auto pt-3">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{dateLabel}</span>
                    </div>
                )}
            </motion.div>
        </Link>
    )
}
