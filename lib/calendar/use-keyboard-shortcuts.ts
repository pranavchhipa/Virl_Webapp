'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcutsOptions {
    onNavigatePrev?: () => void
    onNavigateNext?: () => void
    onToday?: () => void
    onNewPost?: () => void
    onSearch?: () => void
    onMonthView?: () => void
    onWeekView?: () => void
    onDayView?: () => void
    onEscape?: () => void
    onBulkSchedule?: () => void
    enabled?: boolean
}

export function useCalendarKeyboardShortcuts({
    onNavigatePrev,
    onNavigateNext,
    onToday,
    onNewPost,
    onSearch,
    onMonthView,
    onWeekView,
    onDayView,
    onEscape,
    onBulkSchedule,
    enabled = true,
}: KeyboardShortcutsOptions) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return

        // Don't trigger shortcuts when typing in input fields
        const target = event.target as HTMLElement
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            // Allow Escape to still work
            if (event.key !== 'Escape') return
        }

        // Check for modifier keys
        const hasModifier = event.ctrlKey || event.metaKey || event.altKey

        switch (event.key) {
            case 'ArrowLeft':
                if (!hasModifier) {
                    event.preventDefault()
                    onNavigatePrev?.()
                }
                break
            case 'ArrowRight':
                if (!hasModifier) {
                    event.preventDefault()
                    onNavigateNext?.()
                }
                break
            case 't':
            case 'T':
                if (!hasModifier) {
                    event.preventDefault()
                    onToday?.()
                }
                break
            case 'n':
            case 'N':
                if (!hasModifier) {
                    event.preventDefault()
                    onNewPost?.()
                }
                break
            case '/':
            case 's':
            case 'S':
                if (!hasModifier && event.key !== 'S') {
                    event.preventDefault()
                    onSearch?.()
                }
                break
            case 'm':
            case 'M':
                if (!hasModifier) {
                    event.preventDefault()
                    onMonthView?.()
                }
                break
            case 'w':
            case 'W':
                if (!hasModifier) {
                    event.preventDefault()
                    onWeekView?.()
                }
                break
            case 'd':
            case 'D':
                if (!hasModifier) {
                    event.preventDefault()
                    onDayView?.()
                }
                break
            case 'b':
            case 'B':
                if (!hasModifier) {
                    event.preventDefault()
                    onBulkSchedule?.()
                }
                break
            case 'Escape':
                event.preventDefault()
                onEscape?.()
                break
            case '?':
                // Show keyboard shortcuts help (handled by parent)
                break
        }
    }, [
        enabled,
        onNavigatePrev,
        onNavigateNext,
        onToday,
        onNewPost,
        onSearch,
        onMonthView,
        onWeekView,
        onDayView,
        onEscape,
        onBulkSchedule,
    ])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])
}

// Keyboard shortcuts help data
export const CALENDAR_SHORTCUTS = [
    { key: '←', description: 'Previous period' },
    { key: '→', description: 'Next period' },
    { key: 'T', description: 'Go to today' },
    { key: 'M', description: 'Month view' },
    { key: 'W', description: 'Week view' },
    { key: 'D', description: 'Day view' },
    { key: 'N', description: 'New post' },
    { key: 'B', description: 'Bulk schedule' },
    { key: '/', description: 'Search' },
    { key: 'Esc', description: 'Close dialogs' },
]
