"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { HardDrive } from "lucide-react"
import { cn } from "@/lib/utils"

interface StorageLinearCardProps {
    usedBytes: number
    limitBytes: number
    className?: string
}

export function StorageLinearCard({ usedBytes, limitBytes, className }: StorageLinearCardProps) {
    const formatStorage = (bytes: number) => {
        return (bytes / (1024 * 1024 * 1024)).toFixed(2)
    }

    const percentage = limitBytes > 0 ? (usedBytes / limitBytes) * 100 : 0
    const limitGB = (limitBytes / (1024 * 1024 * 1024)).toFixed(2)

    return (
        <div className={cn("bg-white p-4 rounded-xl border border-slate-200 shadow-sm", className)}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-500">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Storage Usage</span>
                </div>
                <Link href="/settings" className="text-xs font-medium text-violet-600 hover:underline">
                    Upgrade
                </Link>
            </div>
            <div className="flex items-end gap-1 mb-2">
                <span className="text-2xl font-bold text-slate-900">{formatStorage(usedBytes)}</span>
                <span className="text-sm font-medium text-slate-500 mb-0.5">/ {limitGB} GB</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <motion.div
                    className="bg-violet-600 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(percentage, 3)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>
        </div>
    )
}
