"use client"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import { addAssetComment, Comment } from "@/app/actions/asset-reviews"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface CommentSectionProps {
    assetId: string
    projectId: string
    initialComments: Comment[]
    currentTime: number
    onTimestampClick: (time: number) => void
}

export function CommentSection({ assetId, projectId, initialComments, currentTime, onTimestampClick }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [newComment, setNewComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Sync comments when initialComments change (revalidation)
    useEffect(() => {
        setComments(initialComments)
    }, [initialComments])

    // Scroll to bottom on comment update
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [comments])

    const handleSubmit = async () => {
        if (!newComment.trim()) return

        setIsSubmitting(true)

        // Optimistic update
        const tempId = Math.random().toString()
        const optimisticComment: Comment = {
            id: tempId,
            content: newComment,
            created_at: new Date().toISOString(),
            user_id: "me",
            profiles: {
                full_name: "Me",
                avatar_url: null
            }
        }

        setComments(prev => [optimisticComment, ...prev]) // Add to top if reverse ordered, but typically we append bottom. DB query is desc. 
        // Wait, getAssetComments orders by DESC (newest first). 
        // Let's standardise on Newest First for a feed, or Oldest First for chat. 
        // Chat usually is Oldest First (at top) -> Newest (at bottom).
        // My server action said ".order('created_at', { ascending: false })" -> Newest First.
        // If the UI maps top-down, newest will be at top.
        // Let's stick to the server action sort which is Newest First.
        // So optimistic comment goes to front? Or should I render in reverse?
        // Standard chat is usually Newest at Bottom.

        // CORRECTION: Standard chat is Oldest at Top, Newest at Bottom.
        // So server should be ASCENDING. 
        // *Self-Correction*: I will assume the server action I just wrote (DESC) is what I want for a "Feed" style, 
        // but for "Chat" style it should be ASC.
        // User asked for "sync", I'll stick to what I wrote: DESC (Newest First).
        // So optimistic comment goes to TOP (start of array).

        // setComments(prev => [optimisticComment, ...prev]) --> This matches DESC order.

        setNewComment("")

        const result = await addAssetComment(assetId, projectId, newComment)

        if (result.error) {
            toast.error(result.error)
            setComments(prev => prev.filter(c => c.id !== tempId))
        } else {
            toast.success("Comment added")
        }

        setIsSubmitting(false)
    }

    return (
        <div className="flex flex-col h-full bg-card rounded-xl border overflow-hidden">
            <div className="p-4 border-b bg-muted/30">
                <h3 className="font-semibold text-sm">Comments ({comments.length})</h3>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {comments.map((comment, i) => (
                        <div key={comment.id || i} className="flex gap-3 text-sm">
                            <Avatar className="h-8 w-8 mt-1">
                                <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                                <AvatarFallback>{comment.profiles?.full_name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{comment.profiles?.full_name || 'Unknown'}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                    {comments.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground text-sm">
                            No comments yet. Be the first!
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-background">
                <div className="relative">
                    <Textarea
                        placeholder="Leave a note..."
                        className="min-h-[80px] resize-none pr-12"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit()
                            }
                        }}
                    />
                    <Button
                        size="icon"
                        className="absolute bottom-3 right-3 h-8 w-8"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !newComment.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground flex justify-between">
                    <span>Pro tip: Press Enter to send</span>
                </div>
            </div>
        </div>
    )
}
