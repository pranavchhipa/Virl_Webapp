"use client"

import { useState, useRef, useEffect } from "react"
import {
    MessageSquare,
    X,
    PenTool,
    Check,
    Eraser,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Send
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

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
    const [isDrawingMode, setIsDrawingMode] = useState(false)
    const [isDrawingActive, setIsDrawingActive] = useState(false)
    const [hasAnnotations, setHasAnnotations] = useState(false)
    const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen')
    const [zoom, setZoom] = useState(1)
    const [imageLoaded, setImageLoaded] = useState(false)

    // Pan state - position based
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState(false)
    const [panStart, setPanStart] = useState({ x: 0, y: 0 })
    const [positionStart, setPositionStart] = useState({ x: 0, y: 0 })

    // Local comments state for immediate updates
    const [localComments, setLocalComments] = useState(comments)

    // Update local comments when prop changes
    useEffect(() => {
        setLocalComments(comments)
    }, [comments])

    // Reset position when zoom resets
    useEffect(() => {
        if (zoom === 1) {
            setPosition({ x: 0, y: 0 })
        }
    }, [zoom])

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
                ctx.strokeStyle = '#8b5cf6'
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
            setHasAnnotations(false)
        }
    }

    const toggleDrawingMode = () => {
        const newState = !isDrawingMode
        setIsDrawingMode(newState)
        if (newState) {
            initCanvas()
            setActiveTool('pen')
        }
    }

    // Check if panning should be enabled
    const canPan = zoom > 1 && !isDrawingMode

    // Drawing Handlers
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingMode) return

        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!ctx || !canvas) return

        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        const x = (e.clientX - rect.left) * scaleX
        const y = (e.clientY - rect.top) * scaleY

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
        if (!isDrawingMode || !isDrawingActive) return
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (ctx && canvas) {
            const rect = canvas.getBoundingClientRect()
            const scaleX = canvas.width / rect.width
            const scaleY = canvas.height / rect.height
            ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY)
            ctx.stroke()
            setHasAnnotations(true)
        }
    }

    const stopDrawing = () => {
        if (!isDrawingMode) return
        setIsDrawingActive(false)
        const ctx = canvasRef.current?.getContext('2d')
        ctx?.closePath()
    }

    // Pan handlers - position based for smooth movement
    const startPan = (e: React.MouseEvent) => {
        if (!canPan) return
        e.preventDefault()
        setIsPanning(true)
        setPanStart({ x: e.clientX, y: e.clientY })
        setPositionStart({ x: position.x, y: position.y })
    }

    const doPan = (e: React.MouseEvent) => {
        if (!isPanning) return
        const dx = e.clientX - panStart.x
        const dy = e.clientY - panStart.y
        setPosition({
            x: positionStart.x + dx,
            y: positionStart.y + dy
        })
    }

    const stopPan = () => {
        setIsPanning(false)
    }

    const captureImageWithAnnotations = (): string | null => {
        if (!imageRef.current || !canvasRef.current) return null

        const tempCanvas = document.createElement('canvas')
        const img = imageRef.current
        tempCanvas.width = img.naturalWidth
        tempCanvas.height = img.naturalHeight
        const ctx = tempCanvas.getContext('2d')

        if (ctx) {
            ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)
            ctx.drawImage(canvasRef.current, 0, 0, tempCanvas.width, tempCanvas.height)
            return tempCanvas.toDataURL('image/jpeg', 0.8)
        }
        return null
    }

    const submitComment = () => {
        if (!commentContent?.trim()) return

        try {
            let attachment = null
            if (hasAnnotations) {
                try {
                    attachment = captureImageWithAnnotations()
                } catch (error) {
                    console.error('Failed to capture image:', error)
                }
            }

            const optimisticComment = {
                id: `temp-${Date.now()}`,
                content: attachment
                    ? `${commentContent.trim()}\n\n![Annotation](${attachment})`
                    : commentContent.trim(),
                timestamp: 0,
                user: { full_name: 'You' },
                resolved: false,
                created_at: new Date().toISOString()
            }

            setLocalComments(prev => [...prev, optimisticComment])

            onAddComment?.({
                timestamp: 0,
                content: commentContent.trim(),
                attachment
            })

            setCommentContent("")
            clearCanvas()
            setIsDrawingMode(false)
            setActiveTool('pen')
            setHasAnnotations(false)
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
                    if (isDrawingMode) toggleDrawingMode()
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
                    setPosition({ x: 0, y: 0 })
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isDrawingMode])

    const getCursor = () => {
        if (isDrawingMode) return 'crosshair'
        if (canPan) return isPanning ? 'grabbing' : 'grab'
        return 'default'
    }

    const handleResetView = () => {
        setZoom(1)
        setPosition({ x: 0, y: 0 })
    }

    return (
        <div className="flex flex-col lg:flex-row h-[600px] border rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50 shadow-2xl">
            {/* LEFT: Image Viewer */}
            <div ref={containerRef} className="flex-1 relative flex flex-col bg-gradient-to-br from-slate-100 via-indigo-50/30 to-violet-100/30 group overflow-hidden">
                {/* Image Container */}
                <div
                    className="flex-1 overflow-hidden p-4 flex items-center justify-center"
                    style={{ cursor: getCursor() }}
                    onMouseDown={canPan ? startPan : undefined}
                    onMouseMove={isPanning ? doPan : undefined}
                    onMouseUp={stopPan}
                    onMouseLeave={stopPan}
                >
                    <div
                        className="relative inline-block select-none"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                            transformOrigin: 'center center',
                            transition: isPanning ? 'none' : 'transform 0.2s ease'
                        }}
                    >
                        <img
                            ref={imageRef}
                            src={src}
                            alt="Review Image"
                            className="max-w-full max-h-[450px] object-contain rounded-lg shadow-lg"
                            onLoad={() => setImageLoaded(true)}
                            crossOrigin="anonymous"
                            draggable={false}
                        />

                        {/* Annotation Canvas Overlay */}
                        <canvas
                            ref={canvasRef}
                            className={cn(
                                "absolute inset-0 z-10 touch-none rounded-lg",
                                isDrawingMode ? "pointer-events-auto" : "pointer-events-none"
                            )}
                            style={{ cursor: isDrawingMode ? 'crosshair' : 'inherit' }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        />
                    </div>
                </div>

                {/* Drawing Mode Banner */}
                {isDrawingMode && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-violet-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
                        <PenTool className="h-4 w-4" />
                        <span className="text-sm font-semibold">Annotation Mode</span>
                        {hasAnnotations && (
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Has drawings</span>
                        )}
                    </div>
                )}

                {/* Pan hint when zoomed */}
                {canPan && !isPanning && (
                    <div className="absolute top-4 right-4 z-20 bg-black/60 text-white/80 px-3 py-1.5 rounded-full text-xs font-medium">
                        Click & drag to pan
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
                                    title="Zoom Out (-)"
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
                                    title="Zoom In (+)"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResetView}
                                    className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                                    title="Reset View (0)"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Divider */}
                            <div className="h-6 w-px bg-white/20" />

                            {/* Drawing Tools */}
                            <div className="flex items-center gap-1">
                                {isDrawingMode && (
                                    <div className="flex items-center bg-white/10 rounded-lg p-1 gap-1 border border-white/10 mr-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveTool('pen')}
                                            className={cn(
                                                "h-8 w-8 p-0 transition-all",
                                                activeTool === 'pen' ? "bg-violet-600 text-white shadow-md" : "text-white/70 hover:text-white hover:bg-white/10"
                                            )}
                                            title="Pen Tool"
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
                                            title="Clear All"
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
                                        isDrawingMode && "bg-violet-600 text-white hover:bg-violet-700 border-violet-500 shadow-lg"
                                    )}
                                    title="Toggle Annotation Mode"
                                >
                                    {isDrawingMode ? (
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
                        {localComments.length} {localComments.length === 1 ? 'note' : 'notes'}
                    </span>
                </div>

                {/* Thread List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                    {localComments.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <MessageSquare className="h-8 w-8 text-violet-400" />
                            </div>
                            <p className="font-semibold text-slate-600 mb-1">No comments yet</p>
                            <p className="text-sm">Be the first to leave feedback!</p>
                        </div>
                    ) : (
                        localComments.map((comment, i) => (
                            <div
                                key={comment.id || i}
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
                                        {onResolveComment && !comment.id?.startsWith('temp-') && (
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
                    {hasAnnotations && (
                        <div className="flex items-center gap-2 text-sm text-violet-600 font-medium mb-3 bg-violet-50 px-3 py-2 rounded-lg border border-violet-200">
                            <PenTool className="h-4 w-4" />
                            <span>Annotation will be attached</span>
                            <button
                                onClick={clearCanvas}
                                className="ml-auto text-xs text-slate-500 hover:text-red-500"
                            >
                                Remove
                            </button>
                        </div>
                    )}

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
                            <Send className="h-5 w-5" />
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
