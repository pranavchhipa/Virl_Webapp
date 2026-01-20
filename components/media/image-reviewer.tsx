"use client"

import { useState, useRef, useEffect } from "react"
import {
    MessageSquare,
    Clock,
    X,
    PenTool,
    Check,
    Eraser,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Move
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"

interface ImageReviewerProps {
    src: string
    comments?: any[]
    onAddComment?: (comment: { timestamp: number, content: string, attachment?: string | null }) => void
    onResolveComment?: (commentId: string, resolved: boolean) => void
}

export function ImageReviewer({ src, comments = [], onAddComment, onResolveComment }: ImageReviewerProps) {
    // Refs
    const imageRef = useRef<HTMLImageElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const commentInputRef = useRef<HTMLTextAreaElement>(null)

    // State
    const [commentContent, setCommentContent] = useState("")
    const [isDrawing, setIsDrawing] = useState(false)
    const [isDrawingActive, setIsDrawingActive] = useState(false)
    const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen')
    const [zoom, setZoom] = useState(1)
    const [imageLoaded, setImageLoaded] = useState(false)

    // Initialize canvas when image loads
    useEffect(() => {
        if (imageLoaded && imageRef.current && canvasRef.current) {
            initCanvas()
        }
    }, [imageLoaded, zoom])

    const initCanvas = () => {
        if (canvasRef.current && imageRef.current) {
            const img = imageRef.current
            canvasRef.current.width = img.clientWidth
            canvasRef.current.height = img.clientHeight
            const ctx = canvasRef.current.getContext('2d')
            if (ctx) {
                ctx.strokeStyle = '#8b5cf6' // Violet-500
                ctx.lineWidth = 4
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
            }
        }
    }

    const clearCanvas = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d')
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
    }

    const toggleDrawingMode = () => {
        const newState = !isDrawing
        setIsDrawing(newState)
        if (newState) {
            initCanvas()
        } else {
            clearCanvas()
        }
    }

    // Drawing Handlers
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return

        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!ctx || !canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = (e.clientX - rect.left) / zoom
        const y = (e.clientY - rect.top) / zoom

        setIsDrawingActive(true)
        ctx.beginPath()
        ctx.moveTo(x, y)

        if (activeTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out'
            ctx.lineWidth = 20
        } else {
            ctx.globalCompositeOperation = 'source-over'
            ctx.strokeStyle = '#8b5cf6'
            ctx.lineWidth = 4
        }
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !isDrawingActive) return
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (ctx && canvas) {
            const rect = canvas.getBoundingClientRect()
            ctx.lineTo((e.clientX - rect.left) / zoom, (e.clientY - rect.top) / zoom)
            ctx.stroke()
        }
    }

    const stopDrawing = () => {
        if (!isDrawing) return
        setIsDrawingActive(false)
        const ctx = canvasRef.current?.getContext('2d')
        ctx?.closePath()
    }

    const captureImageWithAnnotations = (): string | null => {
        if (!imageRef.current || !canvasRef.current) return null

        const tempCanvas = document.createElement('canvas')
        const img = imageRef.current
        tempCanvas.width = img.naturalWidth
        tempCanvas.height = img.naturalHeight
        const ctx = tempCanvas.getContext('2d')

        if (ctx) {
            // 1. Draw original image
            ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)

            // 2. Draw annotations (scaled to natural resolution)
            ctx.drawImage(canvasRef.current, 0, 0, tempCanvas.width, tempCanvas.height)

            return tempCanvas.toDataURL('image/jpeg', 0.8)
        }
        return null
    }

    const submitComment = () => {
        if (!commentContent?.trim()) return

        try {
            let attachment = null
            if (isDrawing) {
                try {
                    attachment = captureImageWithAnnotations()
                } catch (error) {
                    console.error('Failed to capture image:', error)
                }
            }

            onAddComment?.({
                timestamp: 0, // Images don't have timestamps
                content: commentContent.trim(),
                attachment
            })

            setCommentContent("")
            clearCanvas()
            setIsDrawing(false)
            setActiveTool('pen')
        } catch (error) {
            console.error('Failed to submit comment:', error)
        }
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                if (e.key === 'Escape') {
                    target.blur()
                }
                return
            }

            switch (e.key.toLowerCase()) {
                case 'escape':
                    if (isDrawing) toggleDrawingMode()
                    break
                case '+':
                case '=':
                    setZoom(z => Math.min(z + 0.25, 3))
                    break
                case '-':
                    setZoom(z => Math.max(z - 0.25, 0.5))
                    break
                case '0':
                    setZoom(1)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isDrawing])

    return (
        <div className="flex flex-col lg:flex-row h-[600px] border rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50 shadow-2xl">
            {/* LEFT: Image Viewer */}
            <div ref={containerRef} className="flex-1 relative flex flex-col bg-gradient-to-br from-slate-100 via-indigo-50/30 to-violet-100/30 group overflow-hidden">
                {/* Image Container */}
                <div className="flex-1 flex items-center justify-center overflow-auto p-4">
                    <div
                        className="relative"
                        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease' }}
                    >
                        <img
                            ref={imageRef}
                            src={src}
                            alt="Review Image"
                            className="max-w-full max-h-[450px] object-contain rounded-lg shadow-lg"
                            onLoad={() => setImageLoaded(true)}
                            crossOrigin="anonymous"
                        />

                        {/* Annotation Canvas Overlay */}
                        <canvas
                            ref={canvasRef}
                            className={cn(
                                "absolute inset-0 z-10 touch-none pointer-events-none rounded-lg",
                                isDrawing && "pointer-events-auto cursor-crosshair"
                            )}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        />
                    </div>
                </div>

                {/* Drawing Mode Banner */}
                {isDrawing && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-violet-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
                        <PenTool className="h-4 w-4" />
                        <span className="text-sm font-semibold">Drawing Mode Active</span>
                        <span className="text-xs opacity-75">Press ESC to exit</span>
                    </div>
                )}

                {/* Bottom Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl bg-black/80 backdrop-blur-md rounded-2xl p-4 z-30 shadow-2xl border border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Zoom Controls */}
                            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1 border border-white/10">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                                    className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                                <span className="text-xs font-mono text-white/80 min-w-[50px] text-center">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
                                    className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setZoom(1)}
                                    className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                                    title="Reset Zoom"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Divider */}
                            <div className="h-6 w-px bg-white/20" />

                            {/* Drawing Tools */}
                            <div className="flex items-center gap-1">
                                {isDrawing && (
                                    <div className="flex items-center bg-white/10 rounded-lg p-1 gap-1 border border-white/10 mr-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveTool('pen')}
                                            className={cn(
                                                "h-8 w-8 p-0 transition-all",
                                                activeTool === 'pen' ? "bg-violet-600 text-white shadow-md" : "text-white/70 hover:text-white hover:bg-white/10"
                                            )}
                                            title="Pen Tool (Draw)"
                                        >
                                            <PenTool className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveTool('eraser')}
                                            className={cn(
                                                "h-8 w-8 p-0 transition-all",
                                                activeTool === 'eraser' ? "bg-violet-600 text-white shadow-md" : "text-white/70 hover:text-white hover:bg-white/10"
                                            )}
                                            title="Eraser"
                                        >
                                            <Eraser className="h-4 w-4" />
                                        </Button>

                                        <div className="h-5 w-px bg-white/20 mx-1" />

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearCanvas}
                                            className="text-white/70 hover:text-red-400 hover:bg-red-950/30 h-8 px-2 text-xs"
                                            title="Clear All Annotations"
                                        >
                                            <X className="h-3 w-3 mr-1" />
                                            Clear
                                        </Button>
                                    </div>
                                )}

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleDrawingMode}
                                    className={cn(
                                        "text-white/80 hover:bg-white/20 h-8 px-3 transition-all font-medium text-xs rounded-lg border border-transparent",
                                        isDrawing && "bg-violet-600 text-white hover:bg-violet-700 border-violet-500 shadow-lg"
                                    )}
                                    title="Toggle Annotation Mode"
                                >
                                    {isDrawing ? (
                                        <>
                                            <Check className="h-3 w-3 mr-1.5" />
                                            Done
                                        </>
                                    ) : (
                                        <>
                                            <PenTool className="h-3 w-3 mr-1.5" />
                                            Annotate
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: Comment Thread (Sidebar) */}
            <div className="w-full lg:w-[380px] bg-white border-l border-slate-200 flex flex-col shadow-xl">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                        <MessageSquare className="h-5 w-5 text-violet-600" />
                        Comments
                    </h3>
                    <span className="text-xs font-semibold text-violet-600 bg-violet-100 px-3 py-1 rounded-full">
                        {comments.length} {comments.length === 1 ? 'note' : 'notes'}
                    </span>
                </div>

                {/* Thread List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                    {comments.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <MessageSquare className="h-8 w-8 text-violet-400" />
                            </div>
                            <p className="font-semibold text-slate-600 mb-1">No comments yet</p>
                            <p className="text-sm">Be the first to leave feedback!</p>
                        </div>
                    ) : (
                        comments.map((comment, i) => (
                            <div
                                key={i}
                                className="group flex gap-3 p-4 rounded-xl hover:bg-white cursor-pointer transition-all border border-slate-100 hover:border-violet-200 hover:shadow-md bg-white"
                            >
                                <Avatar className="h-10 w-10 ring-2 ring-violet-100">
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold">
                                        {comment.user?.full_name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-bold text-slate-700">
                                            {comment.user?.full_name || 'User'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-600 leading-relaxed">
                                        {(() => {
                                            const match = comment.content.match(/!\[Annotation\]\((.*?)\)/)
                                            const displayContent = comment.content.replace(/!\[Annotation\]\(.*?\)/, '').trim()

                                            return (
                                                <>
                                                    {displayContent}
                                                    {match && match[1] && (
                                                        <div
                                                            className="mt-3 rounded-lg overflow-hidden border-2 border-slate-200 cursor-pointer hover:border-violet-400 transition-colors shadow-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                window.open(match[1], '_blank')
                                                            }}
                                                        >
                                                            <img src={match[1]} alt="Annotation" className="w-full h-auto object-cover" />
                                                        </div>
                                                    )}
                                                </>
                                            )
                                        })()}
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {comment.resolved && (
                                                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Check className="h-3 w-3" /> Resolved
                                                </span>
                                            )}
                                        </div>
                                        {onResolveComment && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onResolveComment(comment.id, !comment.resolved)
                                                }}
                                                className={cn(
                                                    "text-xs flex items-center gap-1 transition-all font-medium",
                                                    comment.resolved ? "text-green-600 hover:text-green-700" : "text-slate-400 hover:text-green-600 opacity-0 group-hover:opacity-100"
                                                )}
                                            >
                                                {comment.resolved ? (
                                                    <>Mark Unresolved</>
                                                ) : (
                                                    <><Check className="h-3 w-3" /> Mark Resolved</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area */}
                <div className="p-5 border-t border-slate-200 bg-white">
                    <div className="relative">
                        <Textarea
                            ref={commentInputRef}
                            placeholder="Leave a note..."
                            className="min-h-[100px] resize-none pr-12 text-slate-900 bg-slate-50 border-slate-200 focus:border-violet-400 focus:ring-violet-100 rounded-xl"
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    submitComment()
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            className="absolute bottom-3 right-3 h-10 w-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-violet-500/30 transition-all hover:scale-105"
                            onClick={submitComment}
                            disabled={!commentContent?.trim()}
                        >
                            <MessageSquare className="h-5 w-5" />
                        </Button>
                    </div>
                    <p className="text-xs text-center text-slate-400 mt-3">
                        Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Enter</kbd> to save
                    </p>
                </div>
            </div>
        </div>
    )
}
