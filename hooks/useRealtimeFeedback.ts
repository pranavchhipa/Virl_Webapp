'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface RealtimeFeedbackHookOptions {
    reviewLinkId?: string
    projectId?: string
    onFeedbackReceived?: (feedback: any) => void
}

/**
 * Custom hook for real-time feedback updates
 * Subscribes to client_feedback table changes
 */
export function useRealtimeFeedback({
    reviewLinkId,
    projectId,
    onFeedbackReceived
}: RealtimeFeedbackHookOptions) {
    const [newFeedbackCount, setNewFeedbackCount] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        if (!reviewLinkId && !projectId) return

        // Subscribe to client_feedback inserts
        const channel = supabase
            .channel('feedback-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'client_feedback',
                    ...(reviewLinkId && {
                        filter: `review_link_id=eq.${reviewLinkId}`
                    })
                },
                (payload) => {
                    console.log('🔔 New feedback received:', payload)

                    // Increment notification count
                    setNewFeedbackCount(prev => prev + 1)

                    // Show toast notification
                    const feedback = payload.new as any
                    toast.success(
                        feedback.status === 'approved'
                            ? '✅ Content Approved!'
                            : '📝 Changes Requested',
                        {
                            description: `${feedback.client_name || 'Client'} submitted feedback`
                        }
                    )

                    // Call custom callback
                    if (onFeedbackReceived) {
                        onFeedbackReceived(payload.new)
                    }
                }
            )
            .subscribe()

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel)
        }
    }, [reviewLinkId, projectId, supabase, onFeedbackReceived])

    const clearNotifications = () => {
        setNewFeedbackCount(0)
    }

    return {
        newFeedbackCount,
        clearNotifications
    }
}

/**
 * Hook for monitoring review link views
 * Updates when view_count changes
 */
export function useReviewLinkViews(reviewLinkId: string) {
    const [viewCount, setViewCount] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        if (!reviewLinkId) return

        // Fetch initial view count
        const fetchViews = async () => {
            const { data } = await supabase
                .from('review_links')
                .select('view_count')
                .eq('id', reviewLinkId)
                .single()

            if (data) {
                setViewCount(data.view_count || 0)
            }
        }

        fetchViews()

        // Subscribe to view count updates
        const channel = supabase
            .channel('view-count-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'review_links',
                    filter: `id=eq.${reviewLinkId}`
                },
                (payload) => {
                    const updated = payload.new as any
                    setViewCount(updated.view_count || 0)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [reviewLinkId, supabase])

    return viewCount
}

/**
 * Hook for listing all feedback for a project
 * Auto-refreshes on new feedback
 */
export function useProjectFeedback(projectId: string) {
    const [feedback, setFeedback] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!projectId) return

        const fetchFeedback = async () => {
            const { data, error } = await supabase
                .from('client_feedback')
                .select(`
          *,
          review_links!inner (
            id,
            project_id,
            assets (
              id,
              file_name
            )
          )
        `)
                .eq('review_links.project_id', projectId)
                .order('created_at', { ascending: false })

            if (!error && data) {
                setFeedback(data)
            }
            setLoading(false)
        }

        fetchFeedback()

        // Subscribe to new feedback
        const channel = supabase
            .channel('project-feedback')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'client_feedback'
                },
                () => {
                    // Re-fetch all feedback when new one arrives
                    fetchFeedback()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [projectId, supabase])

    return {
        feedback, loading, refresh: async () => {
            setLoading(true)
            // Re-fetch logic here
        }
    }
}
