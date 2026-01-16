'use client'

import { useState, useMemo, useRef } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable } from '@dnd-kit/core'
import { CalendarHeader } from './CalendarHeader'
import { PostCard } from './PostCard'
import { WeekView } from './WeekView'
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp'
import { ConfirmDialog } from './ConfirmDialog'
import { CalendarAsset, Platform } from '@/lib/calendar/platforms'
import { CalendarFilters } from '@/lib/calendar/use-calendar-filters'
import { useCalendarKeyboardShortcuts } from '@/lib/calendar/use-keyboard-shortcuts'
import { toast } from 'sonner'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

interface CalendarViewProps {
    projectId: string
    assets: CalendarAsset[]
    onUpdateSchedule: (assetId: string, date: Date, time?: string) => Promise<void>
    onCreatePost?: () => void
    onShowAnalytics?: () => void
    onBulkSchedule?: () => void
    // Filter props (optional for backward compatibility)
    filters?: CalendarFilters
    onPlatformChange?: (platform: Platform | 'all') => void
    onStatusChange?: (status: CalendarFilters['status']) => void
    onMemberChange?: (memberId: string | 'all') => void
    onSearchChange?: (query: string) => void
    onDateRangeChange?: (range: CalendarFilters['dateRange']) => void
    onClearFilters?: () => void
    onApplyPreset?: (filters: Partial<CalendarFilters>) => void
    hasActiveFilters?: boolean
    activeFilterCount?: number
    teamMembers?: { id: string; name: string }[]
    projectCount?: number
    onUnschedule?: (assetId: string) => void
    onDelete?: (assetId: string) => void
}

export function CalendarView({
    projectId,
    assets,
    onUpdateSchedule,
    onCreatePost,
    onShowAnalytics,
    onBulkSchedule,
    filters,
    onPlatformChange,
    onStatusChange,
    onMemberChange,
    onSearchChange,
    onDateRangeChange,
    onClearFilters,
    onApplyPreset,
    hasActiveFilters,
    activeFilterCount,
    teamMembers,
    projectCount,
    onUnschedule,
    onDelete,
}: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState<'month' | 'week' | 'day'>('month')
    // Use external filters if provided, otherwise use local state for backward compatibility
    const [localPlatform, setLocalPlatform] = useState<Platform | 'all'>('all')
    const [localStatus, setLocalStatus] = useState('all')
    const [activeId, setActiveId] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
    const [confirmAction, setConfirmAction] = useState<{
        type: 'unschedule' | 'delete'
        assetId: string
        assetName: string
    } | null>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Use external filters if provided
    const selectedPlatform = filters?.platform ?? localPlatform
    const selectedStatus = filters?.status ?? localStatus

    // Keyboard shortcuts
    useCalendarKeyboardShortcuts({
        onNavigatePrev: () => {
            if (view === 'month') setCurrentDate(d => subMonths(d, 1))
            else if (view === 'week') setCurrentDate(d => subWeeks(d, 1))
            else setCurrentDate(d => subDays(d, 1))
        },
        onNavigateNext: () => {
            if (view === 'month') setCurrentDate(d => addMonths(d, 1))
            else if (view === 'week') setCurrentDate(d => addWeeks(d, 1))
            else setCurrentDate(d => addDays(d, 1))
        },
        onToday: () => setCurrentDate(new Date()),
        onMonthView: () => setView('month'),
        onWeekView: () => setView('week'),
        onDayView: () => setView('day'),
        onNewPost: onCreatePost,
        onBulkSchedule: onBulkSchedule,
        onSearch: () => {
            // Focus search input
            const searchInput = document.querySelector('input[placeholder="Search content..."]') as HTMLInputElement
            searchInput?.focus()
        },
        onEscape: () => setShowShortcutsHelp(false),
    })

    const filteredAssets = useMemo(() => {
        return assets.filter((asset) => {
            if (selectedPlatform !== 'all' && asset.platform !== selectedPlatform) {
                return false
            }
            if (selectedStatus !== 'all' && asset.status !== selectedStatus) {
                return false
            }
            return asset.scheduled_date != null
        })
    }, [assets, selectedPlatform, selectedStatus])

    const events = useMemo(() => {
        return filteredAssets.map((asset) => {
            const date = new Date(asset.scheduled_date)
            if (asset.scheduled_time) {
                const [hours, minutes] = asset.scheduled_time.split(':')
                date.setHours(parseInt(hours), parseInt(minutes))
            }

            return {
                id: asset.id,
                title: asset.file_name,
                start: date,
                end: date,
                resource: asset,
            }
        })
    }, [filteredAssets])

    const statsCount = useMemo(() => {
        return {
            total: filteredAssets.length,
            pending: filteredAssets.filter((a) => a.status === 'pending').length,
            approved: filteredAssets.filter((a) => a.status === 'approved').length,
            conflicts: 0,
        }
    }, [filteredAssets])

    const activeAsset = assets.find((a) => a.id === activeId)

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string)
        setIsDragging(true)
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveId(null)
        setIsDragging(false)

        if (!over) return

        const assetId = active.id as string
        const newDate = over.data.current?.date as Date

        if (!newDate) return

        try {
            const asset = assets.find((a) => a.id === assetId)
            if (!asset) return

            // Check if dropping on the same date - skip update and toast
            const currentDate = asset.scheduled_date ? new Date(asset.scheduled_date) : null
            if (currentDate && format(currentDate, 'yyyy-MM-dd') === format(newDate, 'yyyy-MM-dd')) {
                return // Same date, no need to update
            }

            await onUpdateSchedule(assetId, newDate, asset.scheduled_time)
            toast.success('Schedule updated!', {
                description: `Moved to ${format(newDate, 'MMM dd, yyyy')}`,
            })
        } catch (error) {
            toast.error('Failed to update schedule')
            console.error('Schedule update error:', error)
        }
    }

    const EventComponent = ({ event }: any) => {
        const asset = event.resource as CalendarAsset
        return (
            <div className="h-full">
                <PostCard
                    asset={asset}
                    isCompact
                    showTime={view === 'day'}
                    onExpand={() => {
                        // Open asset details - for now navigate to project
                        const projectId = (asset as any).project_id
                        if (projectId) {
                            window.open(`/projects/${projectId}/assets?asset=${asset.id}`, '_blank')
                        }
                    }}
                    onUnschedule={() => setConfirmAction({ type: 'unschedule', assetId: asset.id, assetName: asset.file_name })}
                    onDelete={() => setConfirmAction({ type: 'delete', assetId: asset.id, assetName: asset.file_name })}
                />
            </div>
        )
    }

    const DayWrapper = ({ children, value }: any) => {
        const { isOver, setNodeRef } = useDroppable({
            id: `day-${value?.toISOString?.() || 'unknown'}`,
            data: { date: value },
        })

        return (
            <div
                ref={setNodeRef}
                className={`rbc-day-bg relative group ${isOver ? 'bg-indigo-50' : ''}`}
                data-date={value}
                style={{
                    minHeight: view === 'month' ? '100px' : 'auto',
                }}
            >
                <div className={`absolute inset-0 transition-colors pointer-events-none ${isOver ? 'ring-2 ring-indigo-400 ring-inset' : 'group-hover:bg-slate-50/50'}`} />
                {children}
            </div>
        )
    }

    const TimeSlotWrapper = ({ children, value }: any) => {
        const { isOver, setNodeRef } = useDroppable({
            id: `timeslot-${value.toISOString()}`,
            data: { date: value },
        })

        return (
            <div
                ref={setNodeRef}
                className={`rbc-time-slot group relative ${isOver ? 'bg-indigo-50/50' : ''}`}
                style={{
                    flex: '1 0 0',
                }}
            >
                <div className={`absolute inset-0 transition-colors pointer-events-none ${isOver ? 'bg-indigo-500/10' : 'group-hover:bg-slate-50/50'
                    }`} />
                {children}
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <CalendarHeader
                currentDate={currentDate}
                view={view}
                selectedPlatform={selectedPlatform}
                selectedStatus={selectedStatus}
                onDateChange={setCurrentDate}
                onViewChange={setView}
                onPlatformChange={onPlatformChange ?? setLocalPlatform}
                onStatusChange={(status) => {
                    if (onStatusChange) {
                        onStatusChange(status as CalendarFilters['status'])
                    } else {
                        setLocalStatus(status)
                    }
                }}
                onDateRangeChange={onDateRangeChange}
                onSearchChange={onSearchChange}
                onClearFilters={onClearFilters}
                onApplyPreset={onApplyPreset}
                currentFilters={filters}
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={activeFilterCount}
                selectedMember={filters?.memberId ?? 'all'}
                dateRange={filters?.dateRange}
                teamMembers={teamMembers}
                onMemberChange={onMemberChange}
                // onDateRangeChange is already passed above
                onCreatePost={onCreatePost}
                onShowAnalytics={onShowAnalytics}
                onBulkSchedule={onBulkSchedule}
                projectCount={projectCount}
                statsCount={statsCount}
            />

            {/* Modern Calendar Container */}
            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                {/* Calendar Styling with Visible Grid Borders */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .rbc-calendar {
                        border: none !important;
                        font-family: inherit !important;
                        height: auto !important;
                    }
                    .rbc-month-view {
                        border: none !important;
                        flex: 1 !important;
                    }
                    .rbc-header {
                        background: #fff !important;
                        border: none !important;
                        border-bottom: 1px solid #f1f5f9 !important;
                        padding: 16px 4px !important;
                        font-size: 11px !important;
                        font-weight: 800 !important;
                        color: #94a3b8 !important;
                        text-transform: uppercase !important;
                        letter-spacing: 1px !important;
                    }
                    .rbc-day-bg {
                        background: #ffffff !important;
                        border-right: 1px solid #f1f5f9 !important;
                        border-bottom: 1px solid #f1f5f9 !important;
                    }
                    .rbc-day-bg:last-child {
                        border-right: none !important;
                    }
                    .rbc-month-row {
                        border: none !important;
                        min-height: 120px !important;
                    }
                    .rbc-month-row:last-child .rbc-day-bg {
                        border-bottom: none !important;
                    }
                    .rbc-today {
                        background: #fff !important;
                    }
                    .rbc-date-cell {
                        padding: 12px !important;
                        text-align: left !important;
                        position: relative !important;
                    }
                    .rbc-date-cell button {
                        font-size: 13px !important;
                        font-weight: 700 !important;
                        color: #64748b !important;
                        padding: 0 !important;
                        width: 28px !important;
                        height: 28px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        transition: all 0.2s !important;
                    }
                    .rbc-date-cell.rbc-now button {
                        background: #7C3AED !important;
                        color: white !important;
                        border-radius: 50% !important;
                        box-shadow: 0 4px 10px rgba(124, 58, 237, 0.3) !important;
                    }
                    .rbc-off-range-bg {
                        background: #fafafa !important;
                    }
                    .rbc-off-range .rbc-date-cell button {
                        color: #cbd5e1 !important;
                        opacity: 0.5 !important;
                    }
                    .rbc-event {
                        background: none !important;
                        border: none !important;
                        padding: 2px 4px !important;
                        margin: 0 !important;
                    }
                    .rbc-event-content {
                        overflow: visible !important;
                    }
                    .rbc-row-segment {
                        padding: 1px 4px !important;
                    }
                    .rbc-show-more {
                        background: #f1f5f9 !important;
                        color: #64748b !important;
                        font-size: 10px !important;
                        font-weight: 700 !important;
                        padding: 4px 8px !important;
                        border-radius: 6px !important;
                        margin: 4px !important;
                    }
                    .rbc-row-content {
                        z-index: 1 !important;
                    }
                `}} />

                {/* Show empty state OR calendar */}
                {filteredAssets.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[500px]">
                        <div className="text-center p-8 max-w-md">
                            <div className="mb-4 text-6xl">📅</div>
                            <h3 className="text-xl font-semibold text-slate-800 mb-2">No scheduled content yet</h3>
                            <p className="text-slate-500 mb-6">
                                {selectedPlatform !== 'all' || selectedStatus !== 'all'
                                    ? 'Try adjusting your filters to see more content'
                                    : 'Start scheduling your first post to see it appear on the calendar'}
                            </p>
                            {onCreatePost && (
                                <button
                                    onClick={onCreatePost}
                                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-violet-500/30"
                                >
                                    + Schedule Your First Post
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        {view === 'week' ? (
                            <WeekView
                                currentDate={currentDate}
                                assets={filteredAssets}
                                onExpand={(asset) => console.log('Expand asset:', asset)}
                                onUnschedule={(assetId) => {
                                    const asset = filteredAssets.find(a => a.id === assetId)
                                    if (asset) {
                                        setConfirmAction({ type: 'unschedule', assetId, assetName: asset.file_name })
                                    }
                                }}
                                onDelete={(assetId) => {
                                    const asset = filteredAssets.find(a => a.id === assetId)
                                    if (asset) {
                                        setConfirmAction({ type: 'delete', assetId, assetName: asset.file_name })
                                    }
                                }}
                            />
                        ) : (
                            <BigCalendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                view={view as View}
                                onView={(newView: View) => setView(newView as 'month' | 'week' | 'day')}
                                date={currentDate}
                                onNavigate={setCurrentDate}
                                style={{ height: '600px' }}
                                components={{
                                    event: EventComponent,
                                    dateCellWrapper: DayWrapper,
                                    timeSlotWrapper: TimeSlotWrapper,
                                }}
                                popup
                                selectable
                                onSelectSlot={(slotInfo: any) => {
                                    console.log('Selected slot:', slotInfo)
                                }}
                                eventPropGetter={(event: any) => {
                                    return {
                                        className: `cursor-pointer ${isDragging ? 'pointer-events-none' : ''}`,
                                        style: {},
                                    }
                                }}
                            />
                        )}

                        <DragOverlay>
                            {activeAsset ? (
                                <div className="opacity-95 scale-90" style={{ maxWidth: '160px' }}>
                                    <PostCard asset={activeAsset} isCompact={true} />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}
            </div>

            {/* Keyboard Shortcuts Help Dialog */}
            <KeyboardShortcutsHelp
                open={showShortcutsHelp}
                onOpenChange={setShowShortcutsHelp}
            />

            <ConfirmDialog
                open={!!confirmAction}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                title={confirmAction?.type === 'unschedule' ? 'Unschedule Post?' : 'Delete Post?'}
                description={
                    confirmAction?.type === 'unschedule'
                        ? `Are you sure you want to remove "${confirmAction?.assetName}" from the calendar? It will be moved back to the unscheduled list.`
                        : `Are you sure you want to delete "${confirmAction?.assetName}"? This action cannot be undone.`
                }
                confirmLabel={confirmAction?.type === 'unschedule' ? 'Unschedule' : 'Delete'}
                variant={confirmAction?.type === 'unschedule' ? 'default' : 'destructive'}
                onConfirm={() => {
                    if (confirmAction) {
                        if (confirmAction.type === 'unschedule') {
                            onUnschedule?.(confirmAction.assetId)
                        } else {
                            onDelete?.(confirmAction.assetId)
                        }
                        setConfirmAction(null)
                    }
                }}
            />
        </div>
    )
}
