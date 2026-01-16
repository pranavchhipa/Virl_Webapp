'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useProjectFeedback } from '@/hooks/useRealtimeFeedback'

interface FeedbackListProps {
    projectId: string
}

export function FeedbackList({ projectId }: FeedbackListProps) {
    const { feedback, loading } = useProjectFeedback(projectId)

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Client Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        )
    }

    if (feedback.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Client Feedback</CardTitle>
                    <CardDescription>No feedback received yet</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Client Feedback ({feedback.length})</CardTitle>
                <CardDescription>Real-time updates from clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {feedback.map((fb: any) => (
                    <div
                        key={fb.id}
                        className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50"
                    >
                        <div className="flex-shrink-0 mt-1">
                            {fb.status === 'approved' ? (
                                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                    <XCircle className="h-5 w-5 text-orange-600" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h4 className="font-semibold text-sm">
                                        {fb.review_links?.assets?.file_name || 'Asset'}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        {fb.client_name} • {fb.client_email}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {new Date(fb.created_at).toLocaleString()}
                                </div>
                            </div>

                            {fb.feedback_text && (
                                <div className="rounded-md bg-background/50 p-3 border">
                                    <p className="text-sm text-foreground">{fb.feedback_text}</p>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                {fb.status === 'approved' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-700 text-xs font-medium">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Approved
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-700 text-xs font-medium">
                                        <XCircle className="h-3 w-3" />
                                        Changes Requested
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
