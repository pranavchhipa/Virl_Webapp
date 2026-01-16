'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getPlatformInfo, CalendarAsset } from '@/lib/calendar/platforms'
import { CheckCircle2, Clock, MessageCircle, MoreHorizontal, CalendarOff, Trash2, Play, Film, ImageIcon, Edit, Eye } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

interface PostCardProps {
    asset: CalendarAsset
    isCompact?: boolean
    showTime?: boolean
    onExpand?: () => void
    onUnschedule?: () => void
    onDelete?: () => void
}

export function PostCard({ asset, isCompact = false, showTime = true, onExpand, onUnschedule, onDelete }: PostCardProps) {
    const platformInfo = getPlatformInfo(asset.platform)
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(asset.thumbnail_url || null)
    const isVideo = asset.file_type?.toLowerCase().includes('video')

    // Fetch R2 signed URL for thumbnail if not already set
    useEffect(() => {
        if (!thumbnailUrl && asset.id) {
            const fetchThumbnail = async () => {
                try {
                    const response = await fetch(`/api/r2-download?assetId=${asset.id}`)
                    if (response.ok) {
                        const data = await response.json()
                        setThumbnailUrl(data.url)
                    }
                } catch (e) {
                    console.error('Failed to fetch thumbnail:', e)
                }
            }
            fetchThumbnail()
        }
    }, [asset.id, thumbnailUrl])

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: asset.id,
        data: {
            asset,
            type: 'calendar-asset',
        },
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 100 : 1,
    }

    // Status configuration
    const getStatusDot = () => {
        switch (asset.status) {
            case 'approved':
                return <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            case 'rejected':
                return <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            case 'in-review':
                return <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            default:
                return <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
        }
    }

    // Platform icon with color
    const getPlatformIcon = () => {
        if (!platformInfo) return null
        return (
            <div
                className="flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px]"
                style={{ backgroundColor: platformInfo.color }}
            >
                {platformInfo.icon}
            </div>
        )
    }

    // Format time nicely
    const formatTime = (time: string) => {
        if (!time) return ''
        const [hours, minutes] = time.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12
        return `${displayHour}:${minutes}`
    }

    // Compact card for calendar cells - Stitch UI Style
    if (isCompact) {
        // Decide colors based on file type or status
        const isPurple = isVideo && asset.status !== 'approved'
        const cardBg = isPurple ? 'bg-[#F5F3FF]' : 'bg-[#EFF6FF]'
        const iconBg = isPurple ? 'bg-[#7C3AED]' : 'bg-[#3B82F6]'
        const textColor = isPurple ? 'text-[#5B21B6]' : 'text-[#1E40AF]'

        return (
            <div
                ref={setNodeRef}
                {...listeners}
                {...attributes}
                className={cn(
                    "group flex items-center gap-2.5 p-1.5 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md transition-all border border-transparent hover:border-white/50",
                    cardBg
                )}
                style={{
                    transform: CSS.Translate.toString(transform),
                    opacity: isDragging ? 0.6 : 1,
                    zIndex: isDragging ? 100 : 'auto',
                }}
                onClick={onExpand}
            >
                {/* Square Icon */}
                <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm",
                    iconBg
                )}>
                    {isVideo ? (
                        <Play className="h-3.5 w-3.5 text-white fill-current" />
                    ) : (
                        <ImageIcon className="h-3.5 w-3.5 text-white" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={cn("text-[11px] font-bold truncate leading-tight", textColor)}>
                        {asset.file_name.replace(/\.[^/.]+$/, '')}
                    </p>
                    {asset.scheduled_time && (
                        <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
                            {formatTime(asset.scheduled_time)}
                        </p>
                    )}
                </div>

                {/* Simple More Menu - always visible on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="h-5 w-5 flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 rounded-xl p-1 shadow-xl border-slate-100">
                            <DropdownMenuItem className="rounded-lg text-xs" onClick={(e) => { e.stopPropagation(); onExpand?.() }}>
                                <Eye className="h-3 w-3 mr-2 text-blue-500" />
                                View
                            </DropdownMenuItem>
                            {onUnschedule && (
                                <DropdownMenuItem className="rounded-lg text-xs" onClick={(e) => { e.stopPropagation(); onUnschedule() }}>
                                    <CalendarOff className="h-3 w-3 mr-2 text-orange-500" />
                                    Unschedule
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="rounded-lg text-xs text-red-600 focus:text-red-600"
                                        onClick={(e) => { e.stopPropagation(); onDelete() }}
                                    >
                                        <Trash2 className="h-3 w-3 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        )
    }

    // Full card view (for modals/expanded view)
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="group bg-white rounded-xl border border-slate-200 overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-lg transition-all"
            onClick={onExpand}
        >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-slate-100">
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={asset.file_name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        {isVideo ? (
                            <Film className="h-12 w-12 text-slate-400" />
                        ) : (
                            <ImageIcon className="h-12 w-12 text-slate-400" />
                        )}
                    </div>
                )}

                {/* Platform Badge */}
                {platformInfo && (
                    <div
                        className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-medium"
                        style={{ backgroundColor: platformInfo.color }}
                    >
                        {platformInfo.icon} {platformInfo.name}
                    </div>
                )}

                {/* Video play overlay */}
                {isVideo && thumbnailUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/70 transition-colors">
                            <Play className="h-6 w-6 text-white ml-1" fill="white" />
                        </div>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
                <h3 className="font-medium text-sm line-clamp-2 text-slate-800">
                    {asset.posting_notes || asset.file_name}
                </h3>

                <div className="flex items-center justify-between text-xs">
                    {showTime && asset.scheduled_time && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(asset.scheduled_time)}
                        </div>
                    )}

                    <div className="flex items-center gap-1.5">
                        {getStatusDot()}
                        <span className="text-slate-600 capitalize">{asset.status || 'pending'}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
