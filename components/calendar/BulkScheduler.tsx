'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, Sparkles, Loader2, X } from 'lucide-react'
import { PLATFORMS, PLATFORM_METADATA, Platform, CalendarAsset } from '@/lib/calendar/platforms'
import { addDays, format } from 'date-fns'
import { toast } from 'sonner'

interface BulkSchedulerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    assets: CalendarAsset[]
    onSchedule: (schedules: { assetId: string; date: Date; time: string }[]) => Promise<void>
}

type SchedulePattern = 'daily' | 'mwf' | 'weekly' | 'custom'

export function BulkScheduler({ open, onOpenChange, assets, onSchedule }: BulkSchedulerProps) {
    const [selectedAssets, setSelectedAssets] = useState<string[]>([])
    const [platform, setPlatform] = useState<Platform>('instagram')
    const [pattern, setPattern] = useState<SchedulePattern>('daily')
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [time, setTime] = useState('10:00')
    const [autoOptimize, setAutoOptimize] = useState(true)
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<{ asset: CalendarAsset; date: Date; time: string }[]>([])

    const platformInfo = PLATFORM_METADATA[platform]
    const unscheduledAssets = assets.filter(a => !a.scheduled_date)

    // Toggle asset selection
    const toggleAsset = (assetId: string) => {
        setSelectedAssets(prev =>
            prev.includes(assetId)
                ? prev.filter(id => id !== assetId)
                : [...prev, assetId]
        )
    }

    // Select all
    const selectAll = () => {
        setSelectedAssets(unscheduledAssets.map(a => a.id))
    }

    // Clear selection
    const clearSelection = () => {
        setSelectedAssets([])
    }

    // Generate preview
    const generatePreview = () => {
        const selected = unscheduledAssets.filter(a => selectedAssets.includes(a.id))
        const schedules: { asset: CalendarAsset; date: Date; time: string }[] = []

        // Parse startDate safely to avoid timezone issues
        const [year, month, day] = startDate.split('-').map(Number)
        let currentDate = new Date(year, month - 1, day) // month is 0-indexed
        let postIndex = 0

        selected.forEach((asset, index) => {
            // Get optimal time if auto-optimize is enabled
            const scheduleTime = autoOptimize
                ? platformInfo.defaultTimes[index % platformInfo.defaultTimes.length]
                : time

            // Calculate date based on pattern - use the parsed base date to avoid timezone issues
            const baseDate = new Date(year, month - 1, day)
            if (pattern === 'daily') {
                currentDate = addDays(baseDate, postIndex)
            } else if (pattern === 'mwf') {
                currentDate = addDays(baseDate, postIndex)
                // Skip weekends and non MWF days
                while (currentDate.getDay() === 0 || currentDate.getDay() === 6 ||
                    ![1, 3, 5].includes(currentDate.getDay())) {
                    currentDate = addDays(currentDate, 1)
                }
            } else if (pattern === 'weekly') {
                currentDate = addDays(baseDate, postIndex * 7)
            }

            schedules.push({
                asset,
                date: currentDate,
                time: scheduleTime,
            })

            postIndex++
        })

        setPreview(schedules)
    }

    // Apply schedule
    const applySchedule = async () => {
        if (preview.length === 0) {
            toast.error('Please generate a preview first')
            return
        }

        setLoading(true)
        try {
            const schedules = preview.map(p => ({
                assetId: p.asset.id,
                date: p.date,
                time: p.time,
            }))

            await onSchedule(schedules)

            toast.success(`Scheduled ${preview.length} posts!`, {
                description: 'Your content is ready to go',
            })

            onOpenChange(false)
            resetForm()
        } catch (error) {
            toast.error('Failed to schedule posts')
            console.error('Bulk schedule error:', error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setSelectedAssets([])
        setPreview([])
        setAutoOptimize(true)
        setPlatform('instagram')
        setPattern('daily')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Bulk Schedule Posts
                    </DialogTitle>
                    <DialogDescription>
                        Schedule multiple posts with automated timing optimization
                    </DialogDescription>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6 py-4">
                    {/* Left: Configuration */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-3">Select Posts</h3>
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline">
                                    {selectedAssets.length} of {unscheduledAssets.length} selected
                                </Badge>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={selectAll}>
                                        Select All
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                                        Clear
                                    </Button>
                                </div>
                            </div>
                            <div className="max-h-[200px] overflow-auto space-y-2 border rounded-lg p-3">
                                {unscheduledAssets.map((asset) => (
                                    <label
                                        key={asset.id}
                                        className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedAssets.includes(asset.id)}
                                            onChange={() => toggleAsset(asset.id)}
                                            className="rounded"
                                        />
                                        <span className="text-sm flex-1 truncate">{asset.file_name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <Label>Platform</Label>
                                <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(PLATFORM_METADATA).map(([key, meta]) => (
                                            <SelectItem key={key} value={key}>
                                                {meta.icon} {meta.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Schedule Pattern</Label>
                                <Select value={pattern} onValueChange={(v) => setPattern(v as SchedulePattern)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily (1 post/day)</SelectItem>
                                        <SelectItem value="mwf">MWF (Mon/Wed/Fri)</SelectItem>
                                        <SelectItem value="weekly">Weekly (Same day each week)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Start Date</Label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <Label>Auto-optimize Times</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Use best posting times for {platformInfo.name}
                                    </p>
                                    {autoOptimize && (
                                        <div className="flex gap-1 mt-1">
                                            {platformInfo.defaultTimes.map((t) => (
                                                <Badge key={t} variant="secondary" className="text-xs">
                                                    {t}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Switch checked={autoOptimize} onCheckedChange={setAutoOptimize} />
                            </div>

                            {!autoOptimize && (
                                <div>
                                    <Label>Default Time</Label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                            )}

                            <Button
                                onClick={generatePreview}
                                disabled={selectedAssets.length === 0}
                                className="w-full"
                                variant="outline"
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate Preview
                            </Button>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div>
                        <h3 className="font-semibold mb-3">Schedule Preview</h3>
                        {preview.length === 0 ? (
                            <div className="border rounded-lg p-8 text-center text-muted-foreground">
                                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Generate a preview to see the schedule</p>
                            </div>
                        ) : (
                            <div className="border rounded-lg max-h-[400px] overflow-auto">
                                <div className="divide-y">
                                    {preview.map((item, index) => (
                                        <div key={item.asset.id} className="p-3 flex items-center justify-between hover:bg-muted">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{item.asset.file_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(item.date, 'MMM dd, yyyy')} at {item.time}
                                                </p>
                                            </div>
                                            <Badge variant="outline">{platformInfo.icon}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={applySchedule}
                        disabled={preview.length === 0 || loading}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                    >
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Schedule {preview.length} Posts
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
