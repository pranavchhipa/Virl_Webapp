"use client"

import { ReviewPlayer } from "@/components/media/review-player"
import { ImageReviewer } from "@/components/media/image-reviewer"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { addCommentAction, toggleResolveAction } from "@/app/actions/comments"

interface ReviewPlayerClientProps {
    assetId: string
    src: string
    fileType: string
    initialComments: any[]
    currentUser: string
}

export function ReviewPlayerClient({ assetId, src, fileType, initialComments, currentUser }: ReviewPlayerClientProps) {
    const supabase = createClient()
    const router = useRouter()
    const [comments, setComments] = useState(initialComments)

    // Realtime subscriptions
    useEffect(() => {
        const channel = supabase
            .channel(`asset-${assetId}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'asset_comments', filter: `asset_id=eq.${assetId}` },
                async (payload) => {
                    // Fetch the new comment with profile
                    const { data: newComment } = await supabase
                        .from('asset_comments')
                        .select('*, user:profiles(full_name, avatar_url)')
                        .eq('id', payload.new.id)
                        .single()

                    if (newComment) {
                        setComments(prev => [...prev, newComment])
                    }
                }
            )
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'asset_comments', filter: `asset_id=eq.${assetId}` },
                (payload) => {
                    setComments(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c))
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [assetId, supabase])

    const handleAddComment = async (comment: { timestamp: number, content: string, attachment?: string | null }) => {
        try {
            let finalContent = comment.content
            if (comment.attachment) {
                finalContent = `${comment.content}\n\n![Annotation](${comment.attachment})`
            }

            // Use Server Action to bypass RLS
            const result = await addCommentAction(
                assetId,
                finalContent,
                currentUser,
                comment.timestamp
            )

            if (!result.success) {
                throw new Error(result.error)
            }

            toast.success("Comment added")
            router.refresh()
        } catch (error: any) {
            console.error("Submission Failed:", error)
            toast.error(`Failed to add comment: ${error.message}`)
        }
    }

    const handleResolveComment = async (commentId: string, resolved: boolean) => {
        try {
            const result = await toggleResolveAction(commentId, resolved)

            if (!result.success) {
                throw new Error(result.error)
            }

            // Optimistic update
            setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved } : c))
            toast.success(resolved ? "Marked as resolved" : "Re-opened comment")
            router.refresh()
        } catch (error: any) {
            console.error("Resolve Failed:", error)
            toast.error(`Failed to update status: ${error.message}`)
        }
    }

    // Determine which viewer to render based on file type
    const isImage = fileType === 'image'

    if (isImage) {
        return (
            <ImageReviewer
                src={src}
                comments={comments}
                onAddComment={handleAddComment}
                onResolveComment={handleResolveComment}
            />
        )
    }

    // Default: Video player
    return (
        <ReviewPlayer
            src={src}
            comments={comments}
            onAddComment={handleAddComment}
            onResolveComment={handleResolveComment}
        />
    )
}

