'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Bookmark, Plus, Trash2, Check } from 'lucide-react'
import { CalendarFilters } from '@/lib/calendar/use-calendar-filters'
import { toast } from 'sonner'

interface FilterPreset {
    id: string
    name: string
    filters: Partial<CalendarFilters>
    createdAt: string
}

interface FilterPresetsProps {
    currentFilters: CalendarFilters
    onApplyPreset: (filters: Partial<CalendarFilters>) => void
}

const STORAGE_KEY = 'virl-filter-presets'

export function FilterPresets({ currentFilters, onApplyPreset }: FilterPresetsProps) {
    const [presets, setPresets] = useState<FilterPreset[]>([])
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [newPresetName, setNewPresetName] = useState('')
    const [isOpen, setIsOpen] = useState(false)

    // Load presets from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                setPresets(JSON.parse(saved))
            }
        } catch (e) {
            console.error('Failed to load filter presets:', e)
        }
    }, [])

    // Save presets to localStorage
    const savePresets = (newPresets: FilterPreset[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets))
            setPresets(newPresets)
        } catch (e) {
            console.error('Failed to save filter presets:', e)
        }
    }

    const handleSavePreset = () => {
        if (!newPresetName.trim()) {
            toast.error('Please enter a preset name')
            return
        }

        const newPreset: FilterPreset = {
            id: Date.now().toString(),
            name: newPresetName.trim(),
            filters: {
                platform: currentFilters.platform,
                status: currentFilters.status,
                memberId: currentFilters.memberId,
                // Don't save search query or date range as they're often temporary
            },
            createdAt: new Date().toISOString(),
        }

        savePresets([...presets, newPreset])
        setNewPresetName('')
        setShowSaveDialog(false)
        toast.success(`Saved preset "${newPreset.name}"`)
    }

    const handleDeletePreset = (id: string) => {
        const preset = presets.find(p => p.id === id)
        savePresets(presets.filter(p => p.id !== id))
        toast.success(`Deleted preset "${preset?.name}"`)
    }

    const handleApplyPreset = (preset: FilterPreset) => {
        onApplyPreset(preset.filters)
        setIsOpen(false)
        toast.success(`Applied preset "${preset.name}"`)
    }

    const hasActiveFilters =
        currentFilters.platform !== 'all' ||
        currentFilters.status !== 'all' ||
        currentFilters.memberId !== 'all'

    return (
        <>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="border-slate-200 gap-2">
                        <Bookmark className="h-4 w-4" />
                        Presets
                        {presets.length > 0 && (
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs">
                                {presets.length}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="end">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-2 py-1">
                            <span className="text-sm font-medium">Filter Presets</span>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs gap-1"
                                    onClick={() => setShowSaveDialog(true)}
                                >
                                    <Plus className="h-3 w-3" />
                                    Save Current
                                </Button>
                            )}
                        </div>

                        {presets.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                                <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No saved presets</p>
                                <p className="text-xs mt-1">Apply filters and save them for quick access</p>
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-60 overflow-y-auto">
                                {presets.map((preset) => (
                                    <div
                                        key={preset.id}
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 group cursor-pointer"
                                        onClick={() => handleApplyPreset(preset)}
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{preset.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {[
                                                    preset.filters.platform !== 'all' && preset.filters.platform,
                                                    preset.filters.status !== 'all' && preset.filters.status,
                                                    preset.filters.memberId !== 'all' && 'Team member',
                                                ].filter(Boolean).join(' • ') || 'All posts'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleApplyPreset(preset)
                                                }}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeletePreset(preset.id)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Save Preset Dialog */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Save Filter Preset</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Preset Name</label>
                            <Input
                                placeholder="e.g., Instagram Pending Posts"
                                value={newPresetName}
                                onChange={(e) => setNewPresetName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                            />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium mb-1">Filters to save:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {currentFilters.platform !== 'all' && (
                                    <li>Platform: {currentFilters.platform}</li>
                                )}
                                {currentFilters.status !== 'all' && (
                                    <li>Status: {currentFilters.status}</li>
                                )}
                                {currentFilters.memberId !== 'all' && (
                                    <li>Team member filter active</li>
                                )}
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSavePreset}>
                            Save Preset
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
