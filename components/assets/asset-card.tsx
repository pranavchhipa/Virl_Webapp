"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Film, Image as ImageIcon, Play, Download, Trash2, Edit2, Calendar, Share2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"
import { cn } from "@/lib/utils"

export interface Asset {
    id: string
    file_name: string
    file_type: string
    status: string
    created_at: string
    uploader_name?: string
    uploader_id?: string
    file_path: string
    file_size?: number
    scheduled_date?: string
    scheduled_time?: string
    platform?: string
    uploader?: {
        full_name?: string
        email?: string
    }
}

interface AssetCardProps {
    asset: Asset
    projectId: string
    onDownload: (asset: Asset) => void
    onRename?: (asset: Asset) => void
    onDelete?: (asset: Asset) => void
    onSchedule?: (asset: Asset) => void
    onSendForReview?: (asset: Asset) => void
}

export function AssetCard({ asset, projectId, onDownload, onRename, onDelete, onSchedule, onSendForReview }: AssetCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isHovering, setIsHovering] = useState(false)
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
    const [loadingThumbnail, setLoadingThumbnail] = useState(true)
    const [thumbnailError, setThumbnailError] = useState(false)

    const isVideo = asset.file_type === 'video'
    const isImage = asset.file_type === 'image'

    // Fetch R2 signed URL for thumbnail
    useEffect(() => {
        const fetchThumbnail = async () => {
            try {
                const response = await fetch(`/api/r2-download?assetId=${asset.id}`)
                if (response.ok) {
                    const data = await response.json()
                    setThumbnailUrl(data.url)
                } else {
                    setThumbnailError(true)
                }
            } catch (e) {
                console.error('Failed to fetch thumbnail:', e)
                setThumbnailError(true)
            } finally {
                setLoadingThumbnail(false)
            }
        }
        fetchThumbnail()
    }, [asset.id])

    const handleMouseEnter = () => {
        setIsHovering(true)
        if (videoRef.current && isVideo) {
            videoRef.current.play().catch(() => { })
        }
    }

    const handleMouseLeave = () => {
        setIsHovering(false)
        if (videoRef.current && isVideo) {
            videoRef.current.pause()
            videoRef.current.currentTime = 0
        }
    }

    // Status badge styling - Stitch UI style
    const getStatusBadge = () => {
        const status = asset.status?.toLowerCase() || 'pending'

        if (status === 'approved') {
            return (
                <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wide rounded-full border border-green-200">
                    Approved
                </span>
            )
        }
        if (status === 'in_review' || status === 'changes_requested') {
            return (
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide rounded-full border border-blue-200">
                    In Review
                </span>
            )
        }
        if (status === 'rejected') {
            return (
                <span className="px-2.5 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wide rounded-full border border-red-200">
                    Rejected
                </span>
            )
        }
        return (
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wide rounded-full border border-amber-200">
                Pending
            </span>
        )
    }

    return (
        <div className="group bg-white border border-slate-200 rounded-xl p-3 hover:shadow-lg hover:shadow-violet-100 hover:border-violet-200 transition-all duration-300 cursor-pointer">
            {/* Thumbnail Area */}
            <Link href={`/projects/${projectId}/assets/${asset.id}`}>
                <div
                    className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden mb-3 group/thumb"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Loading state */}
                    {loadingThumbnail && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                            <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Thumbnail from R2 */}
                    {!loadingThumbnail && thumbnailUrl && !thumbnailError && (
                        isVideo ? (
                            <video
                                ref={videoRef}
                                src={thumbnailUrl}
                                className="absolute inset-0 w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                                onError={() => setThumbnailError(true)}
                            />
                        ) : isImage ? (
                            <img
                                src={thumbnailUrl}
                                alt={asset.file_name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                                onError={() => setThumbnailError(true)}
                            />
                        ) : null
                    )}

                    {/* Fallback placeholder */}
                    {!loadingThumbnail && (thumbnailError || !thumbnailUrl) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                            <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center">
                                {isVideo ? (
                                    <div className="relative">
                                        <Film className="h-8 w-8 text-slate-400" />
                                        <Play className="h-4 w-4 text-slate-500 absolute -bottom-1 -right-1" />
                                    </div>
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-slate-400" />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Play Button Overlay - Light Theme (White Circle, Purple Icon) */}
                    {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/10 transition-colors">
                            <div className="size-10 bg-white rounded-full flex items-center justify-center text-violet-600 shadow-md scale-90 group-hover:scale-100 transition-transform duration-300">
                                <Play className="h-5 w-5 fill-current ml-0.5" />
                            </div>
                        </div>
                    )}

                    {/* Status Badge - Top Left (Stitch UI style) */}
                    <div className="absolute top-2 left-2 z-10">
                        {getStatusBadge()}
                    </div>

                    {/* Scheduled Badge - Top Right */}
                    {asset.scheduled_date && (
                        <div className="absolute top-2 right-2 z-10">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 text-slate-800 text-[10px] font-bold rounded-full shadow-sm">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{format(new Date(asset.scheduled_date), 'MMM d')}</span>
                                {asset.scheduled_time && <span className="text-slate-500">• {asset.scheduled_time.slice(0, 5)}</span>}
                            </div>
                        </div>
                    )}
                </div>
            </Link>

            {/* Content Area - Light Theme Text */}
            <div className="flex items-start justify-between gap-3 px-1">
                <div className="min-w-0 flex-1">
                    <Link href={`/projects/${projectId}/assets/${asset.id}`}>
                        <h3 className="text-sm font-bold text-slate-900 truncate leading-snug mb-1 group-hover:text-violet-600 transition-colors">
                            {asset.file_name}
                        </h3>
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        <span>{formatDistanceToNow(new Date(asset.created_at), { addSuffix: false }).toUpperCase()}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{asset.file_type.toUpperCase()}</span>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-700">
                            <MoreVertical className="h-5 w-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs text-slate-500">Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {onSchedule && (
                            <DropdownMenuItem onClick={() => onSchedule(asset)}>
                                <Calendar className="mr-2 h-4 w-4" /> Schedule
                            </DropdownMenuItem>
                        )}
                        {onSendForReview && (
                            <DropdownMenuItem onClick={() => onSendForReview(asset)} className="text-violet-600">
                                <Share2 className="mr-2 h-4 w-4" /> Send for Review
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onDownload(asset)}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRename && onRename(asset)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete && onDelete(asset)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
