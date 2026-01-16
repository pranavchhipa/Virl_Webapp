'use client'

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface ChatInputProps {
    onSend: (message: string) => void
    isLoading?: boolean
    placeholder?: string
}

// Common emojis for quick access
const QUICK_EMOJIS = ['😊', '🔥', '✨', '💡', '🚀', '👍', '❤️', '😂', '🎯', '💪', '🙌', '⭐']

export function ChatInput({ onSend, isLoading, placeholder = "Type a message..." }: ChatInputProps) {
    const [input, setInput] = useState("")
    const [showEmojis, setShowEmojis] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
        }
    }, [input])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleSubmit = () => {
        if (!input.trim() || isLoading) return
        onSend(input)
        setInput("")
        setShowEmojis(false)
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
        }
    }

    const insertEmoji = (emoji: string) => {
        setInput(prev => prev + emoji)
        textareaRef.current?.focus()
    }

    return (
        <div className="w-full bg-gradient-to-r from-white via-purple-50/30 to-white border-t border-purple-100/50 p-3 sm:p-4 z-50 shadow-[0_-4px_30px_-10px_rgba(139,92,246,0.15)]">
            <div className="max-w-4xl mx-auto">
                <div className="relative bg-white rounded-2xl border-2 border-purple-100 focus-within:border-purple-300 focus-within:shadow-lg focus-within:shadow-purple-200/30 transition-all duration-300 px-2 py-2 flex items-end gap-2">

                    {/* Emoji Picker Popup */}
                    <AnimatePresence>
                        {showEmojis && (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 10 }}
                                className="absolute bottom-full left-0 mb-2 p-2.5 bg-white rounded-xl border-2 border-purple-100 shadow-xl shadow-purple-200/30 z-50"
                            >
                                <div className="flex gap-1 flex-wrap max-w-[240px]">
                                    {QUICK_EMOJIS.map((emoji, i) => (
                                        <button
                                            key={i}
                                            onClick={() => insertEmoji(emoji)}
                                            className="h-8 w-8 rounded-lg hover:bg-purple-100 flex items-center justify-center text-lg transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-9 w-9 rounded-full shrink-0 transition-colors",
                            showEmojis
                                ? "bg-purple-100 text-purple-600"
                                : "text-purple-400 hover:text-purple-600 hover:bg-purple-100"
                        )}
                        onClick={() => setShowEmojis(!showEmojis)}
                    >
                        <Smile className="h-5 w-5" />
                    </Button>

                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowEmojis(false)}
                        placeholder={placeholder}
                        className="min-h-[40px] max-h-[120px] py-2.5 flex-1 border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent text-[15px] text-slate-800 placeholder:text-purple-300/80 resize-none leading-relaxed"
                        rows={1}
                    />

                    <Button
                        onClick={handleSubmit}
                        disabled={!input.trim() || isLoading}
                        className={cn(
                            "h-9 w-9 rounded-full transition-all duration-300 shrink-0 flex items-center justify-center p-0",
                            input.trim()
                                ? "bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30"
                                : "bg-purple-100 text-purple-300 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? <span className="h-3.5 w-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
