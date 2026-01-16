'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarIcon, Clock, Send, Sparkles, X, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Asset } from "@/components/assets/asset-card"
import { PLATFORMS, PLATFORM_METADATA, Platform } from "@/lib/calendar/platforms"

interface ScheduleDialogProps {
    asset: Asset | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSchedule: (date: Date, time: string, platform: string) => Promise<void>
}

export function ScheduleDialog({ asset, open, onOpenChange, onSchedule }: ScheduleDialogProps) {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [time, setTime] = useState("09:00")
    const [platform, setPlatform] = useState<Platform>(PLATFORMS.INSTAGRAM)
    const [loading, setLoading] = useState(false)

    // Generate time slots (15 min intervals)
    const timeSlots = Array.from({ length: 24 * 4 }).map((_, i) => {
        const totalMinutes = i * 15
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        return formatted
    })

    const handleSchedule = async () => {
        if (!date) {
            toast.error("Please select a date")
            return
        }

        try {
            setLoading(true)
            await onSchedule(date, time, platform)
            onOpenChange(false)
            toast.success("Post scheduled message!", {
                description: `Scheduled for ${format(date, 'MMMM do')} at ${time}`
            })
        } catch (error) {
            toast.error("Failed to schedule post")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (!asset) return null

    const platformInfo = PLATFORM_METADATA[platform]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-none shadow-2xl gap-0">
                <div className="grid md:grid-cols-[300px_1fr] h-[600px]">

                    {/* Left Panel: Asset Preview & Info */}
                    <div className="bg-slate-50/50 p-6 flex flex-col border-r border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />

                        <div className="mb-6 z-10">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                Content Preview
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Review your content before scheduling</p>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm p-4 relative group hover:shadow-md transition-all duration-300">
                            <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                            <div className="relative z-10 flex flex-col items-center text-center w-full">
                                <div className={cn(
                                    "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-inner",
                                    asset.file_type === 'video' ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600"
                                )}>
                                    {asset.file_type === 'video' ? '🎥' : '🖼️'}
                                </div>
                                <h4 className="font-medium text-slate-900 line-clamp-2 px-2 w-full break-words">{asset.file_name}</h4>
                                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mt-2 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {asset.file_type}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 z-10">
                            <div className="flex items-center justify-between text-sm p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <span className="text-slate-500">Status</span>
                                <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">Ready</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Scheduling Controls */}
                    <div className="p-8 flex flex-col h-full bg-white relative">
                        {/* Note: DialogContent usually has a default close button. If we want a custom one, we should hide the default via CSS in globals or simple remove this one if duplicate. 
                           User said "two close buttons", implying the default one is there. So I will simply NOT render a custom one here. */}

                        <div className="mb-6">
                            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                                Schedule Post
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 mt-1">
                                Choose the perfect time for your audience
                            </DialogDescription>
                        </div>

                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {/* Platform Select */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Platform</Label>
                                <div className="flex items-center gap-3">
                                    <Select value={platform} onValueChange={(val) => setPlatform(val as Platform)}>
                                        <SelectTrigger className="flex-1 h-11 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-indigo-300 transition-all focus:ring-indigo-500/20">
                                            <SelectValue placeholder="Select platform" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="instagram">Instagram</SelectItem>
                                            <SelectItem value="facebook">Facebook</SelectItem>
                                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                                            <SelectItem value="twitter">Twitter</SelectItem>
                                            <SelectItem value="youtube">YouTube</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {platformInfo && (
                                        <span className={cn(
                                            "inline-flex items-center text-[10px] px-3 py-1 rounded-full font-medium border bg-opacity-10 h-11 pointer-events-none select-none",
                                            `text-${platformInfo.color} border-${platformInfo.color}`
                                        )} style={{ color: platformInfo.color, borderColor: platformInfo.color, backgroundColor: `${platformInfo.color}10` }}>
                                            Best time: {platformInfo.defaultTimes[0]}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-[1.2fr,0.8fr] gap-6 items-start">
                                {/* Date Picker - Made more compact */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Date</Label>
                                    <div className="border rounded-xl p-2 bg-white shadow-sm overflow-hidden flex justify-center">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                            className="rounded-md border-0 w-auto p-0"
                                            classNames={{
                                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                                month: "space-y-3",
                                                caption: "flex justify-center pt-1 relative items-center mb-2",
                                                caption_label: "text-sm font-medium text-slate-700",
                                                nav: "space-x-1 flex items-center",
                                                nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-slate-100 rounded-full",
                                                table: "w-full border-collapse space-y-1",
                                                head_row: "flex",
                                                head_cell: "text-slate-400 rounded-md w-8 font-normal text-[0.75rem]",
                                                row: "flex w-full mt-1",
                                                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-lg transition-colors text-sm text-slate-600 data-[selected=true]:bg-indigo-600 data-[selected=true]:text-white",
                                                selected: "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white rounded-lg shadow-md shadow-indigo-200",
                                                today: "bg-slate-100 text-slate-900 font-semibold",
                                                outside: "text-slate-300 opacity-50",
                                                disabled: "text-slate-200 opacity-50 cursor-not-allowed",
                                                range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                                hidden: "invisible",
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Time Picker - Replaced with Select */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Time</Label>
                                    <Select value={time} onValueChange={setTime}>
                                        <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 focus:ring-indigo-500/20">
                                            <div className="flex items-center gap-2 text-slate-700 w-full">
                                                <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                <SelectValue placeholder="Select time" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="h-[200px]">
                                            {timeSlots.map((slot) => (
                                                <SelectItem key={slot} value={slot}>
                                                    {slot}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="text-[10px] text-slate-400 px-1 pt-1">
                                        Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 mt-auto border-t border-slate-100 flex items-center justify-end gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl px-6"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSchedule}
                                disabled={loading}
                                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl px-8 shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>Scheduling...</>
                                ) : (
                                    <>
                                        Schedule Post <ChevronRight className="ml-2 h-4 w-4 opacity-70" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
