"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Send, Image as ImageIcon, Trash2, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import { submitFeedback } from "@/app/actions/feedback"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface FeedbackModalProps {
    isOpen: boolean
    onClose: () => void
}

const SENTIMENT_EMOJIS = [
    { value: "angry", emoji: "😡", label: "Very Dissatisfied" },
    { value: "unhappy", emoji: "🙁", label: "Dissatisfied" },
    { value: "neutral", emoji: "😐", label: "Neutral" },
    { value: "happy", emoji: "🙂", label: "Satisfied" },
    { value: "excited", emoji: "🤩", label: "Very Satisfied" },
]

const FEEDBACK_TYPES = [
    { value: "bug", label: "Bug Report" },
    { value: "feature", label: "Feature Request" },
    { value: "general", label: "General" },
]

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const pathname = usePathname()
    const [step, setStep] = useState<"sentiment" | "details">("sentiment")
    const [sentiment, setSentiment] = useState<string>("")
    const [type, setType] = useState<string>("general")
    const [message, setMessage] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [screenshot, setScreenshot] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error("Image size should be less than 5MB")
                return
            }
            if (!file.type.startsWith('image/')) {
                toast.error("Only image files are allowed")
                return
            }
            setScreenshot(file)
        }
    }

    const uploadScreenshot = async (file: File) => {
        const supabase = createClient()
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('feedback-attachments')
            .upload(filePath, file)

        if (uploadError) {
            throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
            .from('feedback-attachments')
            .getPublicUrl(filePath)

        return publicUrl
    }

    const handleSubmit = async () => {
        if (!message.trim()) {
            toast.error("Please tell us a bit more before submitting.")
            return
        }

        setIsSubmitting(true)
        try {
            let screenshotUrl = undefined
            if (screenshot) {
                screenshotUrl = await uploadScreenshot(screenshot)
            }

            const result = await submitFeedback({
                type: type as any,
                message,
                sentiment,
                path: pathname || "",
                userAgent: navigator.userAgent,
                screenshotUrl
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Thanks for your feedback!")
                onClose()
                // Reset form after close animation
                setTimeout(() => {
                    setStep("sentiment")
                    setSentiment("")
                    setType("general")
                    setMessage("")
                    setScreenshot(null)
                }, 300)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to submit feedback. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-40%" }}
                        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                        exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-40%" }}
                        transition={{ duration: 0.2 }}
                        className="fixed left-1/2 top-1/2 w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl z-[101] overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="relative flex items-center justify-center p-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
                            <h3 className="text-sm font-semibold text-slate-900">Help us improve Virl</h3>
                            <button
                                onClick={onClose}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-900"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 overflow-y-auto">
                            {step === "sentiment" ? (
                                <div className="space-y-4">
                                    <div className="text-center space-y-1.5">
                                        <h4 className="text-slate-900 font-medium text-sm">How is your experience so far?</h4>
                                    </div>

                                    <div className="flex justify-center gap-2">
                                        {SENTIMENT_EMOJIS.map((item) => (
                                            <button
                                                key={item.value}
                                                onClick={() => {
                                                    setSentiment(item.value)
                                                    setStep("details")
                                                }}
                                                className="group relative p-2 rounded-xl transition-all hover:bg-slate-100 hover:scale-110 active:scale-95"
                                            >
                                                <span className="text-3xl filter drop-shadow-sm grayscale-[0.3] group-hover:grayscale-0 transition-all">
                                                    {item.emoji}
                                                </span>
                                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    {item.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="h-2"></div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Selected Sentiment Indicator */}
                                    <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <span className="text-xl">
                                            {SENTIMENT_EMOJIS.find(e => e.value === sentiment)?.emoji}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-900">
                                                {SENTIMENT_EMOJIS.find(e => e.value === sentiment)?.label}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setStep("sentiment")}
                                            className="text-xs text-slate-500 hover:text-purple-600 underline decoration-slate-300 hover:decoration-purple-600 transition-colors"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    {/* Type Selector */}
                                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                                        {FEEDBACK_TYPES.map(t => (
                                            <button
                                                key={t.value}
                                                onClick={() => setType(t.value)}
                                                className={cn(
                                                    "text-[11px] font-medium py-1.5 px-2 rounded-md transition-all",
                                                    type === t.value
                                                        ? "bg-white text-purple-700 shadow-sm ring-1 ring-black/5"
                                                        : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                                                )}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Message Area */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                                            Details
                                        </label>
                                        <Textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder={
                                                type === "bug"
                                                    ? "What happened? Steps to reproduce?"
                                                    : type === "feature"
                                                        ? "What would you like to see?"
                                                        : "Tell us more..."
                                            }
                                            className="min-h-[80px] bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20 resize-none text-sm"
                                        />
                                    </div>

                                    {/* Attachment */}
                                    <div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        {screenshot ? (
                                            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg group">
                                                <div className="h-8 w-8 bg-slate-200 rounded flex items-center justify-center shrink-0 overflow-hidden relative">
                                                    <img src={URL.createObjectURL(screenshot)} alt="preview" className="h-full w-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-slate-700 truncate">{screenshot.name}</p>
                                                    <p className="text-[10px] text-slate-400">{(screenshot.size / 1024).toFixed(0)}KB</p>
                                                </div>
                                                <button
                                                    onClick={() => setScreenshot(null)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-purple-600 transition-colors px-1"
                                            >
                                                <Paperclip className="w-3.5 h-3.5" />
                                                Attach Screenshot (optional)
                                            </button>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex gap-3 pt-1">
                                        <Button
                                            variant="ghost"
                                            onClick={onClose}
                                            disabled={isSubmitting}
                                            className="flex-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 h-9"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || !message.trim()}
                                            className={cn(
                                                "flex-1 bg-purple-600 hover:bg-purple-700 text-white h-9",
                                                isSubmitting && "opacity-80"
                                            )}
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                                            ) : (
                                                <Send className="w-3.5 h-3.5 mr-2" />
                                            )}
                                            {isSubmitting ? "Sending..." : "Submit"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
