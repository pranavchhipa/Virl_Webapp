'use client'

import { useMemo } from 'react'
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns'
import { PostCard } from './PostCard'
import { CalendarAsset } from '@/lib/calendar/platforms'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface WeekViewProps {
    currentDate: Date
    assets: CalendarAsset[]
    onExpand?: (asset: CalendarAsset) => void
    onUnschedule?: (assetId: string) => void
    onDelete?: (assetId: string) => void
}

function DayColumn({
    date,
    assets,
    onExpand,
    onUnschedule,
    onDelete
}: {
    date: Date
    assets: CalendarAsset[]
    onExpand?: (asset: CalendarAsset) => void
    onUnschedule?: (assetId: string) => void
    onDelete?: (assetId: string) => void
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: `week-day-${format(date, 'yyyy-MM-dd')}`,
        data: { date },
    })

    const dayAssets = assets
        .filter(a => a.scheduled_date && isSameDay(new Date(a.scheduled_date), date))
        .sort((a, b) => {
            if (!a.scheduled_time || !b.scheduled_time) return 0
            return a.scheduled_time.localeCompare(b.scheduled_time)
        })

    const isCurrentDay = isToday(date)

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex-1 min-w-0 border-r border-slate-200 last:border-r-0",
                isOver && "bg-blue-50",
                isCurrentDay && "bg-green-50/50"
            )}
        >
            {/* Day Header */}
            <div className={cn(
                "sticky top-0 z-10 px-3 py-3 border-b border-slate-200 bg-white",
                isCurrentDay && "bg-green-50"
            )}>
                <div className="text-xs font-medium text-slate-500 uppercase">
                    {format(date, 'EEE')}
                </div>
                <div className={cn(
                    "text-lg font-semibold",
                    isCurrentDay ? "text-blue-600" : "text-slate-800"
                )}>
                    {format(date, 'd')}
                </div>
            </div>

            {/* Posts */}
            <div className="p-2 space-y-2 min-h-[400px]">
                {dayAssets.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                        No posts
                    </div>
                ) : (
                    dayAssets.map(asset => (
                        <PostCard
                            key={asset.id}
                            asset={asset}
                            isCompact={true}
                            showTime={true}
                            onExpand={() => onExpand?.(asset)}
                            onUnschedule={() => onUnschedule?.(asset.id)}
                            onDelete={() => onDelete?.(asset.id)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

export function WeekView({
    currentDate,
    assets,
    onExpand,
    onUnschedule,
    onDelete
}: WeekViewProps) {
    // Get start of week (Monday)
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    }, [weekStart])

    return (
        <div className="flex h-full bg-white rounded-lg border border-slate-200 overflow-hidden">
            {weekDays.map(day => (
                <DayColumn
                    key={day.toISOString()}
                    date={day}
                    assets={assets}
                    onExpand={onExpand}
                    onUnschedule={onUnschedule}
                    onDelete={onDelete}
                />
            ))}
        </div>
    )
}
