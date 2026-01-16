"use client"

import { useRef, useEffect } from "react"
import { Play, Pause, Volume2, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useState } from "react"

interface AssetPlayerProps {
    src: string
    type: string // 'video' | 'image' | 'audio' | etc
    onTimeUpdate?: (time: number) => void
    initialTime?: number
}

export function AssetPlayer({ src, type, onTimeUpdate, initialTime = 0 }: AssetPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)

    // Image Mode
    if (type.startsWith('image')) {
        return (
            <div className="bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center h-full max-h-[70vh]">
                <img
                    src={src}
                    alt="Asset Preview"
                    className="w-full h-auto max-h-full object-contain"
                />
            </div>
        )
    }

    // Default/Fallback Mode (File Icon)
    if (!type.startsWith('video')) {
        return (
            <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center h-[50vh] text-white p-10">
                <div className="bg-slate-800 p-6 rounded-full mb-4">
                    <Maximize className="h-12 w-12" />
                </div>
                <p className="text-lg font-medium">Preview not available</p>
                <a href={src} target="_blank" rel="noreferrer" className="mt-4 text-blue-400 hover:underline">
                    Download File
                </a>
            </div>
        )
    }

    // Video Mode logic (Keep existing)
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        if (initialTime > 0) {
            video.currentTime = initialTime
        }
    }, [initialTime])

    const togglePlay = () => {
        if (!videoRef.current) return
        if (isPlaying) {
            videoRef.current.pause()
        } else {
            videoRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleTimeUpdate = () => {
        if (!videoRef.current) return
        const time = videoRef.current.currentTime
        setCurrentTime(time)
        if (onTimeUpdate) onTimeUpdate(time)
    }

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration)
        }
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    return (
        <div className="relative group bg-black rounded-xl overflow-hidden shadow-2xl">
            <video
                ref={videoRef}
                src={src}
                className="w-full h-auto max-h-[70vh]"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePlay}
            />

            {/* Custom Controls (Simple Overlay) */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-4 text-white">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={togglePlay}>
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>

                    <span className="text-sm font-medium font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    <div className="flex-1" />

                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Volume2 className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Maximize className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
