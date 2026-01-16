"use client"

import { cn } from "@/lib/utils"

interface PageWrapperProps {
    children: React.ReactNode
    className?: string
    maxWidth?: boolean
}

export function PageWrapper({ children, className, maxWidth = true }: PageWrapperProps) {
    return (
        <div className="flex flex-col h-full">
            <div className={cn("flex-1 bg-[#f9f8fc]", className)}>
                <div className={cn(
                    "px-6 py-6",
                    maxWidth && "max-w-7xl mx-auto"
                )}>
                    {children}
                </div>
            </div>
        </div>
    )
}
