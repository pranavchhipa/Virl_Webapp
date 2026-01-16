"use client"

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/supabase/client"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { PlayCircle, File as FileIcon, Send, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AssetPlayer } from "./AssetPlayer"

interface Asset {
    id: string
    file_path: string
    file_type: string
    file_name: string
    status: string
    created_at: string
    uploader_id: string
}

interface Comment {
    id: string
    content: string
    created_at: string
    user_id: string
    profiles: {
        full_name: string
        avatar_url: string
    }
}

interface AssetGalleryProps {
    projectId?: string
}

export function AssetGallery({ projectId }: AssetGalleryProps) {
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [activeAssetId, setActiveAssetId] = useState<string | null>(null)
    const [activeAssetUrl, setActiveAssetUrl] = useState<string | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState("")
    const [assetUrls, setAssetUrls] = useState<Record<string, string>>({})
    const supabase = createClient()

    // 1. Fetch Assets
    useEffect(() => {
        fetchAssets()

        if (projectId) {
            const subscription = supabase
                .channel(`public:assets:project_id=eq.${projectId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'assets',
                    filter: `project_id=eq.${projectId}`
                }, fetchAssets)
                .subscribe()

            return () => {
                supabase.removeChannel(subscription)
            }
        }
    }, [projectId])

    const fetchAssets = async () => {
        let query = supabase
            .from('assets')
            .select('*')

        if (projectId) {
            query = query.eq('project_id', projectId)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching assets:', error)
        } else {
            setAssets(data as Asset[])
        }
        setLoading(false)
    }

    // Fetch R2 URL when opening asset sheet
    useEffect(() => {
        if (!activeAssetId) {
            setActiveAssetUrl(null)
            return
        }

        const fetchUrl = async () => {
            try {
                const { getR2DownloadUrl } = await import('@/lib/r2-client')
                const url = await getR2DownloadUrl(activeAssetId)
                setActiveAssetUrl(url)
            } catch (error) {
                console.error('Failed to get asset URL:', error)
            }
        }

        fetchUrl()
    }, [activeAssetId])

    // 2. Fetch Comments when Asset Sheet is Open
    useEffect(() => {
        if (!activeAssetId) return;

        fetchComments(activeAssetId);

        const subscription = supabase
            .channel(`comments:${activeAssetId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comments',
                filter: `asset_id=eq.${activeAssetId}`
            }, (payload) => {
                // Optimistically fetch fresh data to get profile relation
                fetchComments(activeAssetId);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        }
    }, [activeAssetId]);

    const fetchComments = async (assetId: string) => {
        const { data } = await supabase
            .from('comments')
            .select(`
                id,
                content,
                created_at,
                user_id,
                profiles ( full_name, avatar_url )
            `)
            .eq('asset_id', assetId)
            .order('created_at', { ascending: true });

        if (data) {
            // @ts-ignore
            setComments(data as Comment[]);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !activeAssetId) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('comments')
            .insert({
                project_id: projectId, // Required by RLS/Schema usually
                asset_id: activeAssetId,
                user_id: user.id,
                content: newComment,
                tagged_users: [] // Parsing logic would go here
            });

        if (!error) {
            setNewComment("");
        }
    };

    if (loading) return <div className="text-center p-10">Loading assets...</div>

    if (assets.length === 0) {
        return (
            <div className="text-center p-10 border border-dashed rounded-lg text-muted-foreground">
                No assets uploaded yet.
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
            {assets.map((asset) => {
                const isImage = asset.file_type?.startsWith('image')
                const isVideo = asset.file_type?.startsWith('video')

                return (
                    <Sheet key={asset.id} onOpenChange={(open) => {
                        if (open) setActiveAssetId(asset.id);
                        else setActiveAssetId(null);
                    }}>
                        <SheetTrigger asChild>
                            <div className="relative group cursor-pointer aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border hover:shadow-lg transition-all">
                                {/* Thumbnail placeholder - R2 requires signed URLs so we show file type icon */}
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                    {isVideo ? (
                                        <>
                                            <PlayCircle className="w-12 h-12 text-muted-foreground" />
                                        </>
                                    ) : isImage ? (
                                        <FileIcon className="w-12 h-12 text-muted-foreground" />
                                    ) : (
                                        <FileIcon className="w-12 h-12 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white">
                                    <p className="text-xs font-medium truncate">{asset.file_name}</p>
                                </div>
                            </div>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
                            {/* Preview Area */}
                            <div className="h-[40vh] bg-black flex items-center justify-center relative">
                                {activeAssetUrl ? (
                                    <AssetPlayer src={activeAssetUrl} type={asset.file_type || 'unknown'} />
                                ) : (
                                    <div className="flex items-center gap-2 text-white">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading...
                                    </div>
                                )}
                            </div>

                            {/* Details & Chat */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <SheetHeader className="p-6 pb-2">
                                    <div className="flex items-center justify-between">
                                        <SheetTitle className="truncate pr-4">{asset.file_name}</SheetTitle>
                                        <Badge>{asset.status}</Badge>
                                    </div>
                                    <SheetDescription>
                                        Uploaded on {new Date(asset.created_at).toLocaleDateString()}
                                    </SheetDescription>
                                </SheetHeader>

                                <Separator />

                                <div className="flex-1 flex flex-col bg-muted/10 p-0 overflow-hidden">
                                    <ScrollArea className="flex-1 p-6">
                                        <div className="space-y-4">
                                            {comments.length === 0 ? (
                                                <div className="text-center text-sm text-muted-foreground py-8">
                                                    No comments yet. Be the first to leave feedback!
                                                </div>
                                            ) : (
                                                comments.map((comment) => (
                                                    <div key={comment.id} className="flex gap-3">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarImage src={comment.profiles?.avatar_url} />
                                                            <AvatarFallback>{comment.profiles?.full_name?.charAt(0) || "?"}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-semibold">{comment.profiles?.full_name || "Unknown"}</span>
                                                                <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <p className="text-sm text-foreground/90 mt-1">{comment.content}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>

                                    <div className="p-4 border-t bg-background">
                                        <form className="flex gap-2" onSubmit={handlePostComment}>
                                            <Input
                                                placeholder="Type your feedback..."
                                                className="flex-1"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                            />
                                            <Button type="submit" size="icon" disabled={!newComment.trim()}>
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                )
            })}
        </div>
    )
}

