
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

import Link from "next/link"

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
    href?: string
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, href }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center h-64 md:h-96 p-8 text-center bg-gray-50 dark:bg-gray-900 border-2 border-dashed rounded-lg">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-full mb-4 shadow-sm">
                <Icon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
            {actionLabel && (
                href ? (
                    <Button asChild>
                        <Link href={href}>{actionLabel}</Link>
                    </Button>
                ) : onAction ? (
                    <Button onClick={onAction}>
                        {actionLabel}
                    </Button>
                ) : null
            )}
        </div>
    )
}
