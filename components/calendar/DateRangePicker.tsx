'use client'

import { useState } from 'react'
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DateRange {
    start: Date
    end: Date
}

interface DateRangePickerProps {
    value: DateRange | null
    onChange: (range: DateRange | null) => void
    className?: string
}

const PRESETS = [
    {
        label: 'Today',
        getValue: () => {
            const today = new Date()
            return { start: today, end: today }
        }
    },
    {
        label: 'This Week',
        getValue: () => ({
            start: startOfWeek(new Date(), { weekStartsOn: 1 }),
            end: endOfWeek(new Date(), { weekStartsOn: 1 })
        })
    },
    {
        label: 'This Month',
        getValue: () => ({
            start: startOfMonth(new Date()),
            end: endOfMonth(new Date())
        })
    },
    {
        label: 'Next 7 Days',
        getValue: () => ({
            start: new Date(),
            end: addDays(new Date(), 7)
        })
    },
    {
        label: 'Next 30 Days',
        getValue: () => ({
            start: new Date(),
            end: addDays(new Date(), 30)
        })
    }
]

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
    const [open, setOpen] = useState(false)
    const [selecting, setSelecting] = useState<'start' | 'end'>('start')
    const [tempStart, setTempStart] = useState<Date | undefined>(value?.start)
    const [tempEnd, setTempEnd] = useState<Date | undefined>(value?.end)

    const handleSelect = (date: Date | undefined) => {
        if (!date) return

        if (selecting === 'start') {
            setTempStart(date)
            setSelecting('end')
        } else {
            // Ensure end is after start
            if (tempStart && date < tempStart) {
                setTempEnd(tempStart)
                setTempStart(date)
            } else {
                setTempEnd(date)
            }

            // Apply the range
            if (tempStart) {
                const finalEnd = date < tempStart ? tempStart : date
                const finalStart = date < tempStart ? date : tempStart
                onChange({ start: finalStart, end: finalEnd })
            }
            setSelecting('start')
        }
    }

    const handlePreset = (preset: typeof PRESETS[0]) => {
        const range = preset.getValue()
        setTempStart(range.start)
        setTempEnd(range.end)
        onChange(range)
        setOpen(false)
    }

    const handleClear = () => {
        setTempStart(undefined)
        setTempEnd(undefined)
        onChange(null)
        setOpen(false)
    }

    const formatRange = () => {
        if (!value) return 'Select dates'
        const { start, end } = value
        if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
            return format(start, 'MMM d, yyyy')
        }
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'justify-between text-left font-normal border-slate-200',
                        !value && 'text-muted-foreground',
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="flex-1 truncate">{formatRange()}</span>
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                    {/* Presets */}
                    <div className="border-r p-2 space-y-1 min-w-[140px]">
                        <p className="text-xs font-medium text-muted-foreground px-2 py-1">Quick Select</p>
                        {PRESETS.map((preset) => (
                            <Button
                                key={preset.label}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-sm"
                                onClick={() => handlePreset(preset)}
                            >
                                {preset.label}
                            </Button>
                        ))}
                        <hr className="my-2" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleClear}
                        >
                            Clear
                        </Button>
                    </div>

                    {/* Calendar */}
                    <div className="p-3">
                        <div className="text-xs text-center mb-2 text-muted-foreground">
                            {selecting === 'start' ? 'Select start date' : 'Select end date'}
                        </div>
                        <Calendar
                            mode="single"
                            selected={selecting === 'start' ? tempStart : tempEnd}
                            onSelect={handleSelect}
                            numberOfMonths={2}
                            className="rounded-md border-0"
                            modifiers={{
                                range: tempStart && tempEnd ? { from: tempStart, to: tempEnd } : undefined,
                                rangeStart: tempStart ? tempStart : undefined,
                                rangeEnd: tempEnd ? tempEnd : undefined,
                            }}
                            modifiersClassNames={{
                                range: 'bg-violet-100',
                                rangeStart: 'bg-violet-600 text-white rounded-l-md',
                                rangeEnd: 'bg-violet-600 text-white rounded-r-md',
                            }}
                        />
                        {tempStart && tempEnd && (
                            <div className="text-center text-xs text-muted-foreground mt-2">
                                {format(tempStart, 'MMM d')} - {format(tempEnd, 'MMM d, yyyy')}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
