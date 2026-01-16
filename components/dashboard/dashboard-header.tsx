"use client"

import { NotificationDropdown } from "@/components/notifications/notification-dropdown"

interface DashboardHeaderProps {
    title: string
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold leading-none tracking-tight text-slate-900">{title}</h1>
                <NotificationDropdown />
            </div>
        </header>
    )
}
