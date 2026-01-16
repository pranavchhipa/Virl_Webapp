'use client'

import { CALENDAR_SHORTCUTS } from '@/lib/calendar/use-keyboard-shortcuts'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Keyboard, X } from 'lucide-react'

interface KeyboardShortcutsHelpProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
}

export function KeyboardShortcutsHelp({
    open,
    onOpenChange,
    trigger
}: KeyboardShortcutsHelpProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            <Keyboard className="h-5 w-5" />
                            Keyboard Shortcuts
                        </DialogTitle>
                        {onOpenChange && (
                            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-full">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </DialogHeader>
                <div className="grid gap-2 py-4">
                    {CALENDAR_SHORTCUTS.map((shortcut) => (
                        <div
                            key={shortcut.key}
                            className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50"
                        >
                            <span className="text-sm text-muted-foreground">
                                {shortcut.description}
                            </span>
                            <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded">
                                {shortcut.key}
                            </kbd>
                        </div>
                    ))}
                </div>
                <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    Press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-xs">?</kbd> to show this dialog
                </div>
            </DialogContent>
        </Dialog>
    )
}
