'use client'

import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
import { useRealtimeFeedback } from '@/hooks/useRealtimeFeedback'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FeedbackNotificationBadgeProps {
    projectId: string
}

export function FeedbackNotificationBadge({ projectId }: FeedbackNotificationBadgeProps) {
    const [recentFeedback, setRecentFeedback] = useState<any[]>([])
    const supabase = createClient()

    const { newFeedbackCount, clearNotifications } = useRealtimeFeedback({
        projectId,
        onFeedbackReceived: (feedback) => {
            // Add to recent feedback list
            setRecentFeedback(prev => [feedback, ...prev].slice(0, 5))
        }
    })

    // Fetch initial recent feedback
    useEffect(() => {
        const fetchRecent = async () => {
            const { data } = await supabase
                .from('client_feedback')
                .select(`
          *,
          review_links!inner (
            project_id,
            assets (file_name)
          )
        `)
                .eq('review_links.project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(5)

            if (data) {
                setRecentFeedback(data)
            }
        }

        fetchRecent()
    }, [projectId, supabase])

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={clearNotifications}
                >
                    <Bell className="h-5 w-5" />
                    {newFeedbackCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {newFeedbackCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Recent Client Feedback</h4>

                    {recentFeedback.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No feedback yet</p>
                    ) : (
                        <div className="space-y-2">
                            {recentFeedback.map((fb) => (
                                <div
                                    key={fb.id}
                                    className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {fb.status === 'approved' ? (
                                            <span className="text-green-600">✅</span>
                                        ) : (
                                            <span className="text-orange-600">📝</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {fb.review_links?.assets?.file_name || 'Asset'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {fb.client_name} • {new Date(fb.created_at).toLocaleDateString()}
                                        </p>
                                        {fb.feedback_text && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {fb.feedback_text}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
