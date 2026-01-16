'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'default' | 'destructive'
    onConfirm: () => void
    onCancel?: () => void
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm()
        onOpenChange(false)
    }

    const handleCancel = () => {
        onCancel?.()
        onOpenChange(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel}>
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={
                            variant === 'destructive'
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
                                : ''
                        }
                    >
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// Preset confirmation dialogs for common use cases
export const CONFIRM_PRESETS = {
    unschedule: {
        title: 'Unschedule Post',
        description: 'Are you sure you want to remove this post from the calendar? The file will remain in your assets.',
        confirmLabel: 'Unschedule',
        variant: 'destructive' as const,
    },
    reschedule: {
        title: 'Reschedule Post',
        description: 'This will change the scheduled date and time for this post.',
        confirmLabel: 'Reschedule',
        variant: 'default' as const,
    },
    bulkSchedule: {
        title: 'Bulk Schedule',
        description: 'You are about to schedule multiple posts. This action cannot be easily undone.',
        confirmLabel: 'Schedule All',
        variant: 'default' as const,
    },
    clearFilters: {
        title: 'Clear All Filters',
        description: 'This will reset all your filter selections.',
        confirmLabel: 'Clear Filters',
        variant: 'default' as const,
    },
    delete: {
        title: 'Delete Post',
        description: 'Are you sure you want to delete this post? This action cannot be undone.',
        confirmLabel: 'Delete',
        variant: 'destructive' as const,
    },
}
