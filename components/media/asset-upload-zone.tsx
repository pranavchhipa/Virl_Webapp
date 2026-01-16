"use client"

import { useState, useCallback } from "react"
import { useDropzone, FileRejection } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Loader2, FileVideo, Image, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface AssetUploadZoneProps {
    onUpload?: (files: File[], onProgress?: (progress: number) => void) => Promise<void>
}

// Modern Cloud Upload Icon Component
function CloudUploadIcon({ isActive }: { isActive?: boolean }) {
    return (
        <div className="relative">
            {/* Glow Effect */}
            <motion.div
                animate={{
                    scale: isActive ? [1, 1.3, 1] : [1, 1.1, 1],
                    opacity: [0.15, 0.3, 0.15]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-violet-400 rounded-full blur-3xl"
            />

            {/* Icon Container */}
            <motion.svg
                width="100"
                height="100"
                viewBox="0 0 80 80"
                fill="none"
                animate={{ y: isActive ? [-5, 5, -5] : [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
            >
                {/* Cloud Shape - Gradient Fill */}
                <defs>
                    <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="50%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="cloudStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c4b5fd" />
                        <stop offset="100%" stopColor="#a5b4fc" />
                    </linearGradient>
                </defs>

                {/* Cloud Background Path */}
                <path
                    d="M58 52H22C14.268 52 8 45.732 8 38C8 31.052 13.052 25.332 19.684 24.212C21.164 17.3 27.332 12 34.8 12C40.708 12 45.868 15.268 48.596 20.052C50.076 19.38 51.684 19 53.4 19C60.492 19 66.2 24.708 66.2 31.8C66.2 32.204 66.18 32.604 66.14 33C70.732 34.268 74 38.452 74 43.4C74 49.252 66.58 52 58 52Z"
                    fill="url(#cloudGradient)"
                    stroke="url(#cloudStroke)"
                    strokeWidth="2"
                />

                {/* Arrow Up - White */}
                <g>
                    <motion.rect
                        x="37"
                        y="38"
                        width="6"
                        height="22"
                        rx="3"
                        fill="white"
                        initial={{ y: 0 }}
                        animate={{ y: isActive ? -4 : 0 }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                    />
                    <motion.path
                        d="M40 30L50 42H30L40 30Z"
                        fill="white"
                        initial={{ y: 0 }}
                        animate={{ y: isActive ? -4 : 0 }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                    />
                </g>

                {/* Decorative Dots */}
                <circle cx="18" cy="35" r="2" fill="#c4b5fd" opacity="0.6" />
                <circle cx="62" cy="40" r="2" fill="#a5b4fc" opacity="0.6" />
            </motion.svg>
        </div>
    )
}

export function AssetUploadZone({ onUpload }: AssetUploadZoneProps) {
    const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle')
    const [progress, setProgress] = useState(0)
    const [fileName, setFileName] = useState("")
    const [errorMessage, setErrorMessage] = useState("")

    const handleUpload = async (files: File[]) => {
        setFileName(files[0]?.name || "file")
        setUploadState('uploading')
        setProgress(0)
        setErrorMessage("")

        try {
            if (onUpload) {
                // Pass progress callback to parent
                await onUpload(files, (p) => setProgress(p))
            }

            setUploadState('success')
            setTimeout(() => {
                setUploadState('idle')
                setProgress(0)
            }, 2500)
        } catch (error: any) {
            console.error('Upload error:', error)
            setErrorMessage(error.message || 'Upload failed')
            setUploadState('error')
            setTimeout(() => {
                setUploadState('idle')
                setProgress(0)
            }, 3000)
        }
    }

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            handleUpload(acceptedFiles)
        }
    }, [onUpload])

    const onDropRejected = useCallback((rejectedFiles: FileRejection[]) => {
        if (rejectedFiles.length > 0) {
            toast.error("Only video and image files are accepted", {
                description: "Please upload MP4, MOV, PNG, JPG, or GIF files"
            })
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        onDropRejected,
        accept: {
            'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
        },
        disabled: uploadState !== 'idle',
        noClick: true,
        maxFiles: 1
    })

    return (
        <div className="w-full p-6">
            <div
                {...getRootProps()}
                className={cn(
                    "relative overflow-hidden rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center p-10 transition-all duration-300 bg-white",
                    isDragActive ? "border-violet-400 bg-violet-50/50 scale-[1.01]" : "border-slate-200",
                    uploadState !== 'idle' && "border-solid border-slate-100"
                )}
            >
                <input {...getInputProps()} />

                <AnimatePresence mode="wait">
                    {uploadState === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center space-y-6"
                        >
                            {/* Modern Cloud Icon - Bigger */}
                            <CloudUploadIcon isActive={isDragActive} />

                            {/* Text */}
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium text-slate-700">
                                    {isDragActive ? "Drop your files here" : "Select your file or drag and drop"}
                                </h3>
                            </div>

                            {/* File Type Indicators */}
                            <div className="flex items-center justify-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-xl border border-violet-100">
                                    <FileVideo className="h-4 w-4 text-violet-500" />
                                    <span className="text-xs font-medium text-violet-600">Videos</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-xl border border-pink-100">
                                    <Image className="h-4 w-4 text-pink-500" />
                                    <span className="text-xs font-medium text-pink-600">Images</span>
                                </div>
                            </div>

                            {/* Browse Button */}
                            <Button
                                onClick={open}
                                className="px-8 h-11 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-xl font-medium shadow-md shadow-violet-200/50 transition-all hover:shadow-lg hover:shadow-violet-300/50"
                            >
                                Browse Files
                            </Button>
                        </motion.div>
                    )}

                    {uploadState === 'uploading' && (
                        <motion.div
                            key="uploading"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="flex flex-col items-center space-y-6 py-4"
                        >
                            {/* Progress Ring */}
                            <div className="relative w-28 h-28">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="56"
                                        cy="56"
                                        r="48"
                                        stroke="#e2e8f0"
                                        strokeWidth="6"
                                        fill="transparent"
                                    />
                                    <motion.circle
                                        cx="56"
                                        cy="56"
                                        r="48"
                                        stroke="url(#progressGradient)"
                                        strokeWidth="6"
                                        fill="transparent"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: progress / 100 }}
                                    />
                                    <defs>
                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#6366f1" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-violet-600">{Math.round(progress)}%</span>
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700">Uploading...</p>
                                <p className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">{fileName}</p>
                            </div>
                        </motion.div>
                    )}

                    {uploadState === 'processing' && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center space-y-5 py-4"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                                <Loader2 className="h-10 w-10 text-violet-600 animate-spin" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700">Processing</p>
                                <p className="text-xs text-slate-400 mt-1">Generating thumbnails...</p>
                            </div>
                        </motion.div>
                    )}

                    {uploadState === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center space-y-5 py-4"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center"
                            >
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </motion.div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700">Upload Complete!</p>
                                <p className="text-xs text-slate-400 mt-1">Ready for review</p>
                            </div>
                        </motion.div>
                    )}

                    {uploadState === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center space-y-5 py-4"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center"
                            >
                                <AlertCircle className="h-10 w-10 text-red-600" />
                            </motion.div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700">Upload Failed</p>
                                <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
