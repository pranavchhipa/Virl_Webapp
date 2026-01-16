'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { BarChart3, TrendingUp, Clock, Calendar, Download, ChevronDown, CheckCircle, AlertCircle, X, Users, Instagram, Youtube, Twitter } from 'lucide-react'
import { CalendarAsset, PLATFORM_METADATA } from '@/lib/calendar/platforms'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getHours, isToday, isSameDay, startOfMonth, endOfMonth } from 'date-fns'

interface CalendarAnalyticsProps {
    assets: CalendarAsset[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CalendarAnalytics({ assets, open, onOpenChange }: CalendarAnalyticsProps) {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month')

    // Filter assets by time range
    const filteredAssets = useMemo(() => {
        const now = new Date()
        return assets.filter(asset => {
            if (!asset.scheduled_date) return false
            const date = new Date(asset.scheduled_date)

            if (timeRange === 'week') {
                const weekStart = startOfWeek(now, { weekStartsOn: 1 })
                const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
                return date >= weekStart && date <= weekEnd
            } else if (timeRange === 'month') {
                const monthStart = startOfMonth(now)
                const monthEnd = endOfMonth(now)
                return date >= monthStart && date <= monthEnd
            }
            return true
        })
    }, [assets, timeRange])

    // Calculate stats
    const stats = useMemo(() => {
        const total = filteredAssets.length
        const pending = filteredAssets.filter(a => a.status === 'pending').length
        const approved = filteredAssets.filter(a => a.status === 'approved').length
        const inReview = filteredAssets.filter(a => a.status === 'in-review').length

        return { total, pending, approved, inReview }
    }, [filteredAssets])

    // Platform breakdown
    const platformStats = useMemo(() => {
        const counts: Record<string, number> = {}
        filteredAssets.forEach(asset => {
            const platform = asset.platform || 'unassigned'
            counts[platform] = (counts[platform] || 0) + 1
        })
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([platform, count]) => ({
                platform,
                count,
                percentage: stats.total > 0 ? Math.round((count / stats.total) * 100) : 0,
                meta: PLATFORM_METADATA[platform as keyof typeof PLATFORM_METADATA]
            }))
    }, [filteredAssets, stats.total])

    // Best posting times (hour distribution)
    const timeDistribution = useMemo(() => {
        const hours: Record<number, number> = {}
        for (let i = 0; i < 24; i++) hours[i] = 0

        filteredAssets.forEach(asset => {
            if (asset.scheduled_time) {
                const hour = parseInt(asset.scheduled_time.split(':')[0])
                hours[hour] = (hours[hour] || 0) + 1
            }
        })

        return Object.entries(hours)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }))
            .filter(h => h.count > 0)
            .sort((a, b) => b.count - a.count)
    }, [filteredAssets])

    // Weekly heatmap data
    const weeklyHeatmap = useMemo(() => {
        const now = new Date()
        const weekStart = startOfWeek(now, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

        return days.map(day => {
            const dayAssets = filteredAssets.filter(a =>
                a.scheduled_date && isSameDay(new Date(a.scheduled_date), day)
            )
            return {
                day: format(day, 'EEE'),
                date: day,
                count: dayAssets.length,
                isToday: isToday(day)
            }
        })
    }, [filteredAssets])

    // Export to CSV
    const handleExportCSV = () => {
        const headers = ['Title', 'Platform', 'Status', 'Scheduled Date', 'Scheduled Time', 'Project']
        const rows = filteredAssets.map(a => [
            a.file_name,
            a.platform || 'N/A',
            a.status || 'pending',
            a.scheduled_date || 'N/A',
            a.scheduled_time || 'N/A',
            (a as any).projects?.name || 'N/A'
        ])

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `calendar-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const maxHeatmapCount = Math.max(...weeklyHeatmap.map(d => d.count), 1)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl bg-white border-slate-200 shadow-2xl p-6">

                {/* Compact Header */}
                <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-100">
                            <BarChart3 className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-slate-900">
                                Content Analytics
                            </DialogTitle>
                            <p className="text-xs text-slate-500">Performance insights</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                            <SelectTrigger className="w-28 h-8 text-xs bg-white border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-8 text-xs bg-white border-slate-200">
                            <Download className="h-3 w-3 mr-1" />
                            CSV
                        </Button>
                    </div>
                </DialogHeader>

                {/* Main Content - 3 Column Grid */}
                <div className="grid grid-cols-3 gap-4 mt-4">

                    {/* Column 1: Stats */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overview</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                                <div className="text-2xl font-bold text-violet-600">{stats.total}</div>
                                <div className="text-[10px] text-violet-600/70 font-medium">Scheduled</div>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
                                <div className="text-[10px] text-emerald-600/70 font-medium">Approved</div>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                                <div className="text-[10px] text-amber-600/70 font-medium">Pending</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="text-2xl font-bold text-blue-600">{stats.inReview}</div>
                                <div className="text-[10px] text-blue-600/70 font-medium">In Review</div>
                            </div>
                        </div>

                        {/* Best Posting Times */}
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-3 w-3 text-violet-600" />
                                <span className="text-xs font-semibold text-slate-700">Best Times</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {timeDistribution.length === 0 ? (
                                    <span className="text-[10px] text-slate-400">No data</span>
                                ) : (
                                    timeDistribution.slice(0, 4).map(({ hour, count }) => (
                                        <Badge key={hour} variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200">
                                            {format(new Date().setHours(hour, 0), 'ha')}
                                            <span className="ml-0.5 opacity-60">•{count}</span>
                                        </Badge>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Platform Distribution */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Platforms
                        </h4>
                        <div className="space-y-2">
                            {platformStats.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">No posts</p>
                            ) : (
                                platformStats.slice(0, 5).map(({ platform, count, percentage, meta }) => (
                                    <div key={platform} className="flex items-center gap-2">
                                        <span className="text-sm">{meta?.icon || '📱'}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between text-xs mb-0.5">
                                                <span className="font-medium text-slate-700 capitalize">{meta?.name || platform}</span>
                                                <span className="text-slate-500">{count}</span>
                                            </div>
                                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${percentage}%`, backgroundColor: meta?.color || '#8b5cf6' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Column 3: Weekly Heatmap */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Users className="h-3 w-3" /> This Week
                        </h4>
                        <div className="flex items-end justify-between gap-1 h-28 p-2 bg-slate-50 rounded-lg border border-slate-100">
                            {weeklyHeatmap.map(({ day, count, isToday }) => (
                                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full rounded-t transition-all"
                                        style={{
                                            height: `${Math.max((count / maxHeatmapCount) * 100, 8)}%`,
                                            backgroundColor: isToday ? '#8b5cf6' : count === 0 ? '#e2e8f0' : `rgba(139, 92, 246, ${0.3 + (count / maxHeatmapCount) * 0.7})`
                                        }}
                                    />
                                    <span className={`text-[9px] font-medium ${isToday ? 'text-violet-600' : 'text-slate-400'}`}>
                                        {day.slice(0, 2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="text-[10px] text-slate-500 text-center">
                            {weeklyHeatmap.reduce((acc, d) => acc + d.count, 0)} posts this week
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function StatCard({ label, value, icon: Icon, color, description }: {
    label: string
    value: number
    icon: any
    color: 'violet' | 'green' | 'amber' | 'blue'
    description: string
}) {
    const colors = {
        violet: 'bg-violet-50 text-violet-600',
        green: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        blue: 'bg-blue-50 text-blue-600',
    }

    return (
        <Card className="p-4 border border-slate-200 shadow-sm bg-white hover:border-violet-200 transition-colors cursor-default">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
                    <div className="text-xs text-slate-500 font-medium">{label}</div>
                </div>
            </div>
        </Card>
    )
}
