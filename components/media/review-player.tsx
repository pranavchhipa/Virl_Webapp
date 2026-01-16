"use client"

import { useState, useRef, useEffect, forwardRef } from "react"
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    SkipForward,
    Rewind,
    MoreHorizontal,
    MessageSquare,
    Clock,
    X,
    PenTool,
    Check,
    Eraser
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"

interface ReviewPlayerProps {
    src: string
    poster?: string
    comments?: any[]
    onAddComment?: (comment: { timestamp: number, content: string, attachment?: string | null }) => void
    onResolveComment?: (commentId: string, resolved: boolean) => void
}

export function ReviewPlayer({ src, poster, comments = [], onAddComment, onResolveComment }: ReviewPlayerProps) {
    // Refs
    const videoRef = useRef<HTMLVideoElement>(null)
    const playerContainerRef = useRef<HTMLDivElement>(null)
    const commentInputRef = useRef<HTMLTextAreaElement>(null)

    // State
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1)

    // Commenting State
    const [commentContent, setCommentContent] = useState("")
    const [capturedTimestamp, setCapturedTimestamp] = useState<number | null>(null)

    // Markers


    // Drawing State
    const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen')

    // Helpers
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [isDrawingActive, setIsDrawingActive] = useState(false) // Tracking mouse down

    const toggleDrawingMode = () => {
        const newState = !isDrawing
        setIsDrawing(newState)
        if (newState) {
            // Pause video when starting to draw
            if (videoRef.current) {
                videoRef.current.pause()
                setIsPlaying(false)
            }
            // Initialize canvas size to match video
            initCanvas()
        } else {
            clearCanvas()
        }
    }

    const initCanvas = () => {
        if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.clientWidth
            canvasRef.current.height = videoRef.current.clientHeight
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

    // Drawing Handlers
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return

        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!ctx || !canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Auto-capture timestamp if not set
        if (capturedTimestamp === null && videoRef.current) {
            setCapturedTimestamp(videoRef.current.currentTime)
        }



        // Pen & Eraser Logic
        setIsDrawingActive(true)
        ctx.beginPath()
        ctx.moveTo(x, y)

        if (activeTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out'
            ctx.lineWidth = 20
        } else {
            ctx.globalCompositeOperation = 'source-over'
            ctx.strokeStyle = '#8b5cf6' // Violet-500
            ctx.lineWidth = 4
        }
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !isDrawingActive) return
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (ctx && canvas) {
            const rect = canvas.getBoundingClientRect()
            ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
            ctx.stroke()
        }
    }



    const stopDrawing = () => {
        if (!isDrawing) return
        setIsDrawingActive(false)
        const ctx = canvasRef.current?.getContext('2d')
        ctx?.closePath()
    }

    const captureFrameWithAnnotations = (): string | null => {
        if (!videoRef.current || !canvasRef.current) return null

        // Create a temporary canvas to merge video + drawing
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = videoRef.current.videoWidth
        tempCanvas.height = videoRef.current.videoHeight
        const ctx = tempCanvas.getContext('2d')

        if (ctx) {
            // 1. Draw Video Frame
            ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height)

            // 2. Draw Annotations (Scaled to video native resolution)
            // We need to scale the overlay canvas (which matches display size) to video source size
            ctx.drawImage(canvasRef.current, 0, 0, tempCanvas.width, tempCanvas.height)

            return tempCanvas.toDataURL('image/jpeg', 0.8) // High quality JPEG
        }
        return null
    }

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in ANY input (comment box or overlay text)
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                if (e.key === 'Escape') {
                    target.blur()
                }
                return
            }

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault()
                    togglePlay()
                    break
                case 'j':
                    if (videoRef.current) videoRef.current.currentTime -= 10
                    break
                case 'l':
                    if (videoRef.current) videoRef.current.currentTime += 10
                    break
                case 'arrowleft':
                    if (videoRef.current) videoRef.current.currentTime -= (1 / 24) // Frame back
                    break
                case 'arrowright':
                    if (videoRef.current) videoRef.current.currentTime += (1 / 24) // Frame forward
                    break
                case 'escape':
                    if (isDrawing) toggleDrawingMode()
                    break
                case 'f': // Fullscreen
                    // toggleFullscreen()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isPlaying, isDrawing])

    // Handlers (Modified)
    const togglePlay = () => {
        if (isDrawing) {
            // Don't auto-stop, just warn or let user decide? 
            // Better UX: Keys shouldn't toggle play in drawing mode unless explicitly desired.
            // For now, allow it but drawing pauses video anyway.
        }

        if (videoRef.current) {
            if (videoRef.current.paused) { // Check ref directly for source of truth
                videoRef.current.play()
                setIsPlaying(true)
            } else {
                videoRef.current.pause()
                setIsPlaying(false)
            }
        }
    }

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime)
        }
    }

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration)
        }
    }

    const handleSeek = (value: number[]) => {
        if (videoRef.current) {
            videoRef.current.currentTime = value[0]
            setCurrentTime(value[0])
        }
    }

    const handleCommentFocus = () => {
        if (videoRef.current && isPlaying) {
            videoRef.current.pause()
            setIsPlaying(false)
        }
        // Capture timestamp ONLY if we haven't already captured one for this draft
        if (capturedTimestamp === null && videoRef.current) {
            setCapturedTimestamp(videoRef.current.currentTime)
        }
    }

    const submitComment = () => {
        if (!commentContent?.trim() || capturedTimestamp === null) return

        try {
            let attachment = null
            // If drawing mode was active or we have drawings, capture frame
            if (isDrawing) {
                try {
                    attachment = captureFrameWithAnnotations()
                } catch (error) {
                    console.error('Failed to capture frame:', error)
                    // Continue without attachment
                }
            }

            onAddComment?.({
                timestamp: capturedTimestamp,
                content: commentContent.trim(),
                attachment // Pass the base64 string or null
            })

            setCommentContent("")
            setCapturedTimestamp(null)
            clearCanvas() // Clear canvas after submitting comment
            setIsDrawing(false) // Exit drawing mode
            setActiveTool('pen') // Reset to pen tool
        } catch (error) {
            console.error('Failed to submit comment:', error)
            // You could add a toast notification here
        }
    }



    const frameForward = () => {
        if (videoRef.current) {
            videoRef.current.pause()
            setIsPlaying(false)
            videoRef.current.currentTime += (1 / 24) // Assuming 24fps
        }
    }

    const cyclePlaybackSpeed = () => {
        if (videoRef.current) {
            const speeds = [0.5, 1, 1.5, 2]
            const currentIndex = speeds.indexOf(playbackRate)
            const nextIndex = (currentIndex + 1) % speeds.length
            const newRate = speeds[nextIndex]

            videoRef.current.playbackRate = newRate
            setPlaybackRate(newRate)
        }
    }

    return (
        <div className="flex flex-col lg:flex-row h-[600px] border rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50 shadow-2xl">
            {/* LEFT: Video Player */}
            {/* LEFT: Video Player - Light Theme Background */}
            {/* LEFT: Video Player - Premium Soft Theme */}
            <div ref={playerContainerRef} className="flex-1 relative flex flex-col justify-center bg-gradient-to-br from-slate-100 via-indigo-50/30 to-violet-100/30 group">
                <video
                    ref={videoRef}
                    src={src}
                    poster={poster}
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    controls={false}
                />

                {/* Annotation Canvas Overlay */}
                <canvas
                    ref={canvasRef}
                    className={cn("absolute inset-0 z-10 cursor-crosshair touch-none pointer-events-none", isDrawing && "pointer-events-auto")}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                />

                {/* Floating Text Input - Fixed positioning */}


                {/* Drawing Mode Banner */}
                {isDrawing && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-violet-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
                        <PenTool className="h-4 w-4" />
                        <span className="text-sm font-semibold">Drawing Mode Active</span>
                        <span className="text-xs opacity-75">Press ESC to exit</span>
                    </div>
                )}

                {/* Overlay Controls - Floating Glass Pill */}
                {/* Overlay Controls - Floating Glass Pill */}
                <div className={cn("absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl bg-black/80 backdrop-blur-md rounded-2xl p-4 transition-all duration-300 z-30 shadow-2xl border border-white/10")}>

                    {/* Timeline / Scrubber */}
                    <div className="relative mb-3 group/timeline h-6 flex items-center px-1">
                        <Slider
                            value={[currentTime]}
                            max={duration}
                            step={0.1}
                            onValueChange={handleSeek}
                            className="bg-slate-200 h-2 rounded-full cursor-pointer hover:h-3 transition-all relative z-10"
                        // Slider enabled even during drawing
                        />
                        {/* Comment Markers */}
                        {comments.map((c, i) => (
                            <div
                                key={i}
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 border-2 border-white rounded-full z-20 shadow-lg shadow-yellow-400/50 hover:scale-125 transition-transform cursor-pointer"
                                style={{ left: `${(c.timestamp / duration) * 100}%` }}
                                title={`Comment at ${formatTime(c.timestamp)}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20 hover:scale-110 transition-all">
                                {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
                            </Button>

                            <div className="flex items-center gap-2 text-xs font-mono text-white/90 bg-white/10 px-3 py-1.5 rounded-md border border-white/10">
                                <span className="font-bold">{formatTime(currentTime)}</span>
                                <span className="opacity-50">/</span>
                                <span className="opacity-75">{formatTime(duration)}</span>
                            </div>

                            {/* Divider */}
                            <div className="h-6 w-px bg-white/20 mx-1" />

                            {/* Drawing Tools */}
                            <div className="flex items-center gap-1">
                                {isDrawing && (
                                    <div className="flex items-center bg-white/10 rounded-lg p-1 gap-1 border border-white/10 mr-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveTool('pen')}
                                            className={cn("h-8 w-8 p-0 transition-all", activeTool === 'pen' ? "bg-violet-600 text-white shadow-md" : "text-white/70 hover:text-white hover:bg-white/10")}
                                            title="Pen Tool (Draw)"
                                        >
                                            <PenTool className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveTool('eraser')}
                                            className={cn("h-8 w-8 p-0 transition-all", activeTool === 'eraser' ? "bg-violet-600 text-white shadow-md" : "text-white/70 hover:text-white hover:bg-white/10")}
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
                                    onClick={() => toggleDrawingMode()}
                                    className={cn("text-white/80 hover:bg-white/20 h-8 px-3 transition-all font-medium text-xs rounded-lg border border-transparent", isDrawing && "bg-violet-600 text-white hover:bg-violet-700 border-violet-500 shadow-lg")}
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

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={frameForward}
                                    className="text-white/80 hover:bg-white/20 h-8 px-3 text-xs"
                                    title="Next Frame (→)"
                                >
                                    <SkipForward className="h-3 w-3 mr-1" />
                                    Frame
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cyclePlaybackSpeed}
                                    className={cn("text-white/80 hover:bg-white/20 h-8 px-2 font-mono text-xs transition-all", playbackRate !== 1 && "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30")}
                                    title="Playback Speed"
                                >
                                    {playbackRate}x
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <VolumeControl volume={volume} isMuted={isMuted} onVolumeChange={setVolume} onToggleMute={() => setIsMuted(!isMuted)} />
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-slate-100">
                                <Maximize className="h-5 w-5" />
                            </Button>
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
                    <span className="text-xs font-semibold text-violet-600 bg-violet-100 px-3 py-1 rounded-full">{comments.length} {comments.length === 1 ? 'note' : 'notes'}</span>
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
                                onClick={() => {
                                    if (videoRef.current) {
                                        videoRef.current.currentTime = comment.timestamp
                                    }
                                }}
                            >
                                <Avatar className="h-10 w-10 ring-2 ring-violet-100">
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold">U</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-bold text-slate-700">User</span>
                                        <span className="text-xs font-mono bg-violet-100 text-violet-700 px-2 py-1 rounded-full flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(comment.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {(() => {
                                            const match = comment.content.match(/!\[Annotation\]\((.*?)\)/)
                                            const displayContent = comment.content.replace(/!\[Annotation\]\(.*?\)/, '').trim()

                                            return (
                                                <>
                                                    {displayContent}
                                                    {match && match[1] && (
                                                        <div className="mt-3 rounded-lg overflow-hidden border-2 border-slate-200 cursor-pointer hover:border-violet-400 transition-colors shadow-sm" onClick={(e) => {
                                                            e.stopPropagation()
                                                            window.open(match[1], '_blank')
                                                        }}>
                                                            <img src={match[1]} alt="Frame Annotation" className="w-full h-auto object-cover" />
                                                        </div>
                                                    )}
                                                </>
                                            )
                                        })()}
                                    </p>

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
                                                className={cn("text-xs flex items-center gap-1 transition-all font-medium", comment.resolved ? "text-green-600 hover:text-green-700" : "text-slate-400 hover:text-green-600 opacity-0 group-hover:opacity-100")}
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
                    {capturedTimestamp !== null && (
                        <div className="flex items-center justify-between text-sm text-violet-700 font-semibold mb-3 bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-2 rounded-lg border border-violet-200 animate-in slide-in-from-bottom-2">
                            <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Commenting at {formatTime(capturedTimestamp)}
                            </span>
                            <button
                                onClick={() => setCapturedTimestamp(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="relative">
                        <Textarea
                            ref={commentInputRef}
                            placeholder="Leave a note..."
                            className="min-h-[100px] resize-none pr-12 text-slate-900 bg-slate-50 border-slate-200 focus:border-violet-400 focus:ring-violet-100 rounded-xl"
                            onFocus={handleCommentFocus}
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
                            <SkipForward className="h-5 w-5" />
                        </Button>
                    </div>
                    <p className="text-xs text-center text-slate-400 mt-3">
                        Video pauses when typing • Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Enter</kbd> to save
                    </p>
                </div>
            </div>
        </div>
    )
}

function VolumeControl({ volume, isMuted, onVolumeChange, onToggleMute }: any) {
    return (
        <div className="flex items-center gap-2 group/vol">
            <Button variant="ghost" size="icon" onClick={onToggleMute} className="text-white hover:bg-white/20 h-8 w-8">
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300">
                <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={(val: number[]) => onVolumeChange(val[0])}
                    className="w-20"
                />
            </div>
        </div>
    )
}
