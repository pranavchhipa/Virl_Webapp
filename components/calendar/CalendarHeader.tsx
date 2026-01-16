'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Filter,
    Search,
    Settings,
    BarChart3,
    Plus,
    Users,
    X,
    Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLATFORMS, PLATFORM_METADATA, Platform } from '@/lib/calendar/platforms'
import { FilterPresets } from './FilterPresets'
import { CalendarFilters } from '@/lib/calendar/use-calendar-filters'
import { format, addMonths, subMonths } from 'date-fns'

interface CalendarHeaderProps {
    currentDate: Date
    view: 'month' | 'week' | 'day'
    selectedPlatform?: Platform | 'all'
    selectedStatus?: string
    selectedMember?: string | 'all'
    dateRange?: { start: Date; end: Date } | null
    teamMembers?: { id: string; name: string }[]
    currentFilters?: CalendarFilters
    onDateChange: (date: Date) => void
    onViewChange: (view: 'month' | 'week' | 'day') => void
    onPlatformChange: (platform: Platform | 'all') => void
    onStatusChange: (status: string) => void
    onMemberChange?: (memberId: string | 'all') => void
    onDateRangeChange?: (range: { start: Date; end: Date } | null) => void
    onSearchChange?: (query: string) => void
    onClearFilters?: () => void
    onApplyPreset?: (filters: Partial<CalendarFilters>) => void
    hasActiveFilters?: boolean
    activeFilterCount?: number
    onShowAnalytics?: () => void
    onShowSettings?: () => void
    onCreatePost?: () => void
    onBulkSchedule?: () => void
    projectCount?: number
    statsCount?: {
        total: number
        pending: number
        approved: number
        conflicts: number
    }
}

export function CalendarHeader({
    currentDate,
    view,
    selectedPlatform = 'all',
    selectedStatus = 'all',
    selectedMember = 'all',
    dateRange,
    teamMembers = [],
    currentFilters,
    onDateChange,
    onViewChange,
    onPlatformChange,
    onStatusChange,
    onMemberChange,
    onDateRangeChange,
    onSearchChange,
    onClearFilters,
    onApplyPreset,
    hasActiveFilters,
    activeFilterCount,
    onShowAnalytics,
    onShowSettings,
    onCreatePost,
    onBulkSchedule,
    projectCount,
    statsCount,
}: CalendarHeaderProps) {
    const [searchQuery, setSearchQuery] = useState('')

    const handlePrevious = () => {
        if (view === 'month') {
            onDateChange(subMonths(currentDate, 1))
        } else if (view === 'week') {
            onDateChange(new Date(currentDate.setDate(currentDate.getDate() - 7)))
        } else {
            onDateChange(new Date(currentDate.setDate(currentDate.getDate() - 1)))
        }
    }

    const handleNext = () => {
        if (view === 'month') {
            onDateChange(addMonths(currentDate, 1))
        } else if (view === 'week') {
            onDateChange(new Date(currentDate.setDate(currentDate.getDate() + 7)))
        } else {
            onDateChange(new Date(currentDate.setDate(currentDate.getDate() + 1)))
        }
    }

    const formatHeaderDate = () => {
        if (view === 'month') {
            return format(currentDate, 'MMMM yyyy')
        } else if (view === 'week') {
            return format(currentDate, 'MMM dd, yyyy')
        } else {
            return format(currentDate, 'EEEE, MMMM dd, yyyy')
        }
    }

    return (
        <div className="space-y-6 mb-8">
            {/* Title & Stats & Banner Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-1.5">
                    <h1 className="text-3xl font-extrabold text-[#1A1A2E] tracking-tight">
                        My Content Calendar
                    </h1>
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-slate-500">
                            View and schedule content for your video projects.
                        </p>
                        {statsCount && (
                            <p className="text-xs font-semibold text-slate-400">
                                {teamMembers.length > 0 ? `${teamMembers.length} members • ` : ''}
                                {projectCount ?? 0} projects • {statsCount.pending + statsCount.approved} scheduled posts
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex-1 max-w-xl">
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#EEF2FF] rounded-2xl text-sm text-[#4338CA] border border-[#E0E7FF]">
                        <Info className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">You can only see and schedule content for projects you are a member of.</span>
                    </div>
                </div>
            </div>

            {/* Control Bar: Nav | View Toggles | Actions */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-2 bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50">
                <div className="flex items-center gap-6 pl-2">
                    {/* Date Navigation */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePrevious}
                            className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-full"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>

                        <h2 className="text-base font-bold text-[#1A1A2E] min-w-[120px] text-center">
                            {formatHeaderDate()}
                        </h2>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNext}
                            className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-full"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="h-6 w-px bg-slate-100 hidden sm:block" />

                    <Button
                        variant="ghost"
                        onClick={() => onDateChange(new Date())}
                        className="text-sm font-bold text-slate-500 hover:text-[#7C3AED] transition-colors"
                    >
                        Today
                    </Button>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Switcher Pills */}
                    <div className="flex items-center bg-white rounded-full p-1 border border-slate-100 shadow-sm">
                        {['day', 'week', 'month'].map((v) => (
                            <Button
                                key={v}
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewChange(v as any)}
                                className={cn(
                                    "px-5 h-8 rounded-full text-xs font-bold transition-all",
                                    view === v
                                        ? "bg-[#7C3AED] text-white shadow-md shadow-violet-200"
                                        : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </Button>
                        ))}
                    </div>

                    <div className="h-10 w-px bg-slate-100 hidden lg:block mx-1" />

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 pr-1">
                        {onBulkSchedule && (
                            <Button variant="ghost" size="sm" onClick={onBulkSchedule} className="h-10 text-slate-600 font-bold gap-2 px-3 rounded-2xl hover:bg-slate-50">
                                <Calendar className="h-4.5 w-4.5" />
                                <span>Bulk Schedule</span>
                            </Button>
                        )}

                        {onShowAnalytics && (
                            <Button variant="ghost" size="sm" onClick={onShowAnalytics} className="h-10 text-slate-600 font-bold gap-2 px-3 rounded-2xl hover:bg-slate-50">
                                <BarChart3 className="h-4.5 w-4.5" />
                                <span>Analytics</span>
                            </Button>
                        )}

                        {onCreatePost && (
                            <Button onClick={onCreatePost} className="h-10 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-2xl px-5 shadow-lg shadow-violet-200 gap-2 transition-transform active:scale-95 ml-2">
                                <Plus className="h-4 w-4" />
                                <span>New Post</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Second Row: Filters & Stats Summary */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Platform Filter */}
                    <Select value={selectedPlatform} onValueChange={(value) => onPlatformChange(value as Platform | 'all')}>
                        <SelectTrigger className="w-[160px] h-10 rounded-full border-slate-100 !bg-white text-xs font-bold text-slate-600 shadow-sm hover:border-slate-300">
                            <SelectValue placeholder="All Platforms" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
                            <SelectItem value="all" className="rounded-xl">All Platforms</SelectItem>
                            {Object.entries(PLATFORM_METADATA).map(([key, meta]) => (
                                <SelectItem key={key} value={key} className="rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <span>{meta.icon}</span>
                                        {meta.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={selectedStatus} onValueChange={onStatusChange}>
                        <SelectTrigger className="w-[140px] h-10 rounded-full border-slate-100 !bg-white text-xs font-bold text-slate-600 shadow-sm hover:border-slate-300">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
                            <SelectItem value="all" className="rounded-xl">All Status</SelectItem>
                            <SelectItem value="pending" className="rounded-xl">Pending</SelectItem>
                            <SelectItem value="in-review" className="rounded-xl">In Review</SelectItem>
                            <SelectItem value="approved" className="rounded-xl">Approved</SelectItem>
                            <SelectItem value="rejected" className="rounded-xl">Rejected</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Team Member Filter */}
                    {teamMembers.length > 0 && onMemberChange && (
                        <Select value={selectedMember} onValueChange={onMemberChange}>
                            <SelectTrigger className="w-[150px] h-10 rounded-full border-slate-100 !bg-white text-xs font-bold text-slate-600 shadow-sm hover:border-slate-300">
                                <SelectValue placeholder="All Members" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-1">
                                <SelectItem value="all" className="rounded-xl">All Members</SelectItem>
                                {teamMembers.map((member) => (
                                    <SelectItem key={member.id} value={member.id} className="rounded-xl">
                                        {member.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Search Icon/Trigger (Optional placeholder for search) */}
                    <div className="relative hidden xl:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search content..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                onSearchChange?.(e.target.value)
                            }}
                            className="w-[200px] h-10 pl-9 rounded-full border-slate-100 !bg-white text-xs font-bold text-slate-600 shadow-sm focus:ring-[#7C3AED]"
                        />
                    </div>
                </div>

                {/* Stats Summary - Stitch UI Dots */}
                {statsCount && (
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total:</span>
                            <span className="text-sm font-extrabold text-[#1A1A2E] bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{statsCount.total}</span>
                        </div>
                        <div className="w-px h-4 bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-[#EAB308]" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending:</span>
                            <span className="text-sm font-extrabold text-[#854D0E] bg-[#FEF9C3] px-2 py-0.5 rounded-md border border-[#FEF08A]">{statsCount.pending}</span>
                        </div>
                        {statsCount.approved > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="size-1.5 rounded-full bg-[#10B981]" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved:</span>
                                <span className="text-sm font-extrabold text-[#065F46] bg-[#D1FAE5] px-2 py-0.5 rounded-md border border-[#A7F3D0]">{statsCount.approved}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
