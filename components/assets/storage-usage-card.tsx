"use client"

import { cn } from "@/lib/utils"
import { HardDrive, TrendingUp, AlertTriangle } from "lucide-react"

interface StorageUsageCardProps {
    usedBytes: number
    limitBytes: number
    className?: string
    size?: 'sm' | 'md'
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function StorageUsageCard({ usedBytes, limitBytes, className, size = 'md' }: StorageUsageCardProps) {
    const percentage = limitBytes > 0 ? Math.min((usedBytes / limitBytes) * 100, 100) : 0
    const roundedPercentage = Math.round(percentage)

    // Sizing config
    const config = size === 'sm' ? {
        width: 70,
        radius: 28,
        stroke: 6,
        textSize: 'text-xl',
        gap: 'gap-3',
        padding: 'p-4'
    } : {
        width: 100,
        radius: 40,
        stroke: 8,
        textSize: 'text-2xl',
        gap: 'gap-5',
        padding: 'p-5'
    }
    const center = config.width / 2

    // Color coding based on usage
    const getColorScheme = () => {
        if (percentage >= 90) return {
            ring: 'stroke-red-500',
            bg: 'bg-red-50',
            text: 'text-red-600',
            accent: 'from-red-500 to-orange-500',
            icon: AlertTriangle
        }
        if (percentage >= 70) return {
            ring: 'stroke-amber-500',
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            accent: 'from-amber-500 to-yellow-500',
            icon: TrendingUp
        }
        return {
            ring: 'stroke-emerald-500',
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            accent: 'from-emerald-500 to-teal-500',
            icon: HardDrive
        }
    }

    const colors = getColorScheme()
    const Icon = colors.icon

    const circumference = 2 * Math.PI * config.radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300",
            config.padding,
            className
        )}>
            {/* Gradient accent */}
            <div className={cn(
                "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
                colors.accent
            )} />

            <div className={cn("flex items-center", config.gap)}>
                {/* Circular Progress */}
                <div className="relative flex-shrink-0">
                    <svg width={config.width} height={config.width} className="-rotate-90">
                        {/* Background circle */}
                        <circle
                            cx={center}
                            cy={center}
                            r={config.radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={config.stroke}
                            className="text-slate-100"
                        />
                        {/* Progress circle */}
                        <circle
                            cx={center}
                            cy={center}
                            r={config.radius}
                            fill="none"
                            strokeWidth={config.stroke}
                            strokeLinecap="round"
                            className={cn("transition-all duration-700 ease-out", colors.ring)}
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: strokeDashoffset
                            }}
                        />
                    </svg>
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={cn("font-bold", config.textSize, colors.text)}>
                            {roundedPercentage}%
                        </span>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Icon className={cn("h-4 w-4", colors.text)} />
                        <h3 className="font-semibold text-slate-900">Storage Used</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">
                        <span className="font-semibold text-slate-900">{formatBytes(usedBytes)}</span>
                        {" "}of{" "}
                        <span className="font-medium">{formatBytes(limitBytes)}</span>
                    </p>

                    {/* Progress bar (secondary visual) */}
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
                                colors.accent
                            )}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                    {/* Warning message (Only show on md size or high urgency) */}
                    {size === 'md' && percentage >= 80 && (
                        <p className={cn("text-xs mt-2 font-medium", colors.text)}>
                            {percentage >= 90
                                ? "⚠️ Storage almost full! Consider upgrading."
                                : "📊 Storage usage is getting high."
                            }
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
