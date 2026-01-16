'use client'

import { useState, useEffect, useCallback } from 'react'
import { Platform } from '@/lib/calendar/platforms'

export interface CalendarFilters {
    platform: Platform | 'all'
    status: 'all' | 'scheduled' | 'pending' | 'approved'
    memberId: string | 'all'
    searchQuery: string
    dateRange: { start: Date; end: Date } | null
}

const DEFAULT_FILTERS: CalendarFilters = {
    platform: 'all',
    status: 'all',
    memberId: 'all',
    searchQuery: '',
    dateRange: null,
}

const STORAGE_KEY = 'virl-calendar-filters'

export function useCalendarFilters() {
    const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_FILTERS)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load filters from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    // Convert date strings back to Date objects
                    if (parsed.dateRange) {
                        parsed.dateRange = {
                            start: new Date(parsed.dateRange.start),
                            end: new Date(parsed.dateRange.end),
                        }
                    }
                    setFilters({ ...DEFAULT_FILTERS, ...parsed })
                }
            } catch (e) {
                console.error('Failed to load calendar filters:', e)
            }
            setIsLoaded(true)
        }
    }, [])

    // Save filters to localStorage when they change
    useEffect(() => {
        if (isLoaded && typeof window !== 'undefined') {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
            } catch (e) {
                console.error('Failed to save calendar filters:', e)
            }
        }
    }, [filters, isLoaded])

    // Individual setters
    const setPlatform = useCallback((platform: Platform | 'all') => {
        setFilters(prev => ({ ...prev, platform }))
    }, [])

    const setStatus = useCallback((status: CalendarFilters['status']) => {
        setFilters(prev => ({ ...prev, status }))
    }, [])

    const setMemberId = useCallback((memberId: string | 'all') => {
        setFilters(prev => ({ ...prev, memberId }))
    }, [])

    const setSearchQuery = useCallback((searchQuery: string) => {
        setFilters(prev => ({ ...prev, searchQuery }))
    }, [])

    const setDateRange = useCallback((dateRange: CalendarFilters['dateRange']) => {
        setFilters(prev => ({ ...prev, dateRange }))
    }, [])

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS)
    }, [])

    // Apply multiple filters at once (for presets)
    const applyFilters = useCallback((newFilters: Partial<CalendarFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }))
    }, [])

    // Check if any filter is active
    const hasActiveFilters =
        filters.platform !== 'all' ||
        filters.status !== 'all' ||
        filters.memberId !== 'all' ||
        filters.searchQuery !== '' ||
        filters.dateRange !== null

    // Count active filters
    const activeFilterCount = [
        filters.platform !== 'all',
        filters.status !== 'all',
        filters.memberId !== 'all',
        filters.searchQuery !== '',
        filters.dateRange !== null,
    ].filter(Boolean).length

    return {
        filters,
        setPlatform,
        setStatus,
        setMemberId,
        setSearchQuery,
        setDateRange,
        clearFilters,
        applyFilters,
        hasActiveFilters,
        activeFilterCount,
        isLoaded,
    }
}

// Filter function to apply all filters to assets
export function filterAssets<T extends {
    platform?: string | null
    status?: string | null
    uploader_id?: string | null
    file_name?: string | null
    scheduled_date?: string | null
}>(assets: T[], filters: CalendarFilters): T[] {
    return assets.filter(asset => {
        // Platform filter
        if (filters.platform !== 'all' && asset.platform !== filters.platform) {
            return false
        }

        // Status filter
        if (filters.status !== 'all') {
            const assetStatus = asset.status || 'pending'
            if (assetStatus !== filters.status) {
                return false
            }
        }

        // Member filter
        if (filters.memberId !== 'all' && asset.uploader_id !== filters.memberId) {
            return false
        }

        // Search filter (case-insensitive)
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase()
            const fileName = (asset.file_name || '').toLowerCase()
            if (!fileName.includes(query)) {
                return false
            }
        }

        // Date range filter
        if (filters.dateRange && asset.scheduled_date) {
            const assetDate = new Date(asset.scheduled_date)
            if (assetDate < filters.dateRange.start || assetDate > filters.dateRange.end) {
                return false
            }
        }

        return true
    })
}
