"use client"

import { useState, useRef, ChangeEvent } from 'react'
import { Send, Paperclip, X, Loader2, Smile, Image as ImageIcon, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea' // Or standard textarea
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

// Lazy load picker
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

interface AttachmentPreview {
    file: File
    type: 'image' | 'video' | 'file'
    previewUrl?: string
}

interface ChatInputProps {
    onSendMessage: (content: string, attachments: { type: 'image' | 'video' | 'file', url: string, name: string, size?: number }[]) => Promise<void>
    replyingTo: { id: string, content: string, username: string } | null
    onCancelReply: () => void
    disabled?: boolean
}

export function ChatInput({ onSendMessage, replyingTo, onCancelReply, disabled }: ChatInputProps) {
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [attachments, setAttachments] = useState<AttachmentPreview[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files)

            // Validate
            const validFiles: AttachmentPreview[] = []
            files.forEach(file => {
                const isVideo = file.type.startsWith('video/')
                const isImage = file.type.startsWith('image/')

                // Size limits: Videos 100MB, Photos 30MB, Documents 20MB
                let maxSize: number
                let maxSizeLabel: string

                if (isVideo) {
                    maxSize = 100 * 1024 * 1024 // 100MB
                    maxSizeLabel = '100MB'
                } else if (isImage) {
                    maxSize = 30 * 1024 * 1024 // 30MB
                    maxSizeLabel = '30MB'
                } else {
                    maxSize = 20 * 1024 * 1024 // 20MB
                    maxSizeLabel = '20MB'
                }

                if (file.size > maxSize) {
                    toast.error(`File too large (max ${maxSizeLabel}): ${file.name}`)
                    return
                }

                validFiles.push({
                    file,
                    type: isVideo ? 'video' : (isImage ? 'image' : 'file'),
                    previewUrl: (isImage || isVideo) ? URL.createObjectURL(file) : undefined
                })
            })

            setAttachments(prev => [...prev, ...validFiles])
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
    }

    const handleSend = async () => {
        if ((!message.trim() && attachments.length === 0) || isLoading) return

        setIsLoading(true)
        try {
            const uploadedAttachments = []

            // Upload Files
            if (attachments.length > 0) {
                for (const att of attachments) {
                    const ext = att.file.name.split('.').pop()
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
                    const filePath = `${fileName}`

                    const { error: uploadError } = await supabase.storage
                        .from('chat-attachments')
                        .upload(filePath, att.file)

                    if (uploadError) throw uploadError

                    // Get Public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('chat-attachments')
                        .getPublicUrl(filePath)

                    uploadedAttachments.push({
                        type: att.type,
                        url: publicUrl,
                        name: att.file.name,
                        size: att.file.size
                    })
                }
            }

            await onSendMessage(message, uploadedAttachments)

            // Reset
            setMessage('')
            setAttachments([])
            onCancelReply()
        } catch (error) {
            console.error(error)
            toast.error("Failed to send message")
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="p-2 bg-gradient-to-t from-white via-white to-slate-50/80 backdrop-blur-sm">
            {/* Reply Context */}
            {replyingTo && (
                <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-xl mb-3 border-l-4 border-indigo-500 shadow-sm">
                    <div className="text-sm">
                        <span className="font-semibold text-indigo-600 block text-xs">Replying to {replyingTo.username}</span>
                        <span className="text-slate-600 line-clamp-1 text-xs">{replyingTo.content}</span>
                    </div>
                    <button onClick={onCancelReply} className="p-1.5 hover:bg-white/80 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            )}

            {/* Attachment Previews */}
            {attachments.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-thin scrollbar-thumb-slate-200">
                    {attachments.map((att, i) => (
                        <div key={i} className="relative group w-20 h-20 shrink-0 rounded-xl border-2 border-slate-200 bg-white flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {att.type === 'image' ? (
                                <img src={att.previewUrl} className="w-full h-full object-cover" />
                            ) : att.type === 'video' ? (
                                <video src={att.previewUrl} className="w-full h-full object-cover" muted />
                            ) : (
                                <FileText className="w-8 h-8 text-slate-400" />
                            )}
                            <button
                                onClick={() => removeAttachment(i)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Modern Input Container */}
            <div className="flex gap-2 items-end">
                {/* Action Buttons - Left Side */}
                <div className="flex gap-0.5 shrink-0">
                    {/* File Button */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                        onChange={handleFileSelect}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-100 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || isLoading}
                    >
                        <Paperclip className="w-4 h-4" />
                    </Button>

                    {/* Emoji Button */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-amber-50 transition-all"
                                disabled={disabled || isLoading}
                            >
                                <Smile className="w-4 h-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-none shadow-xl rounded-2xl overflow-hidden" side="top" align="start">
                            <EmojiPicker
                                onEmojiClick={(emojiObject) => setMessage(prev => prev + emojiObject.emoji)}
                                width={320}
                                height={400}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Message Input */}
                <div className="flex-1 min-h-[40px] relative bg-slate-100 rounded-xl border-2 border-slate-200 focus-within:border-violet-400 focus-within:bg-white focus-within:shadow-md focus-within:shadow-violet-100/50 transition-all duration-200">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={replyingTo ? "Type your reply..." : "Message team... (@ to mention)"}
                        className="w-full h-full bg-transparent border-none focus:ring-0 outline-none focus:outline-none resize-none py-2.5 px-4 text-sm max-h-24 placeholder:text-slate-400"
                        rows={1}
                        disabled={disabled || isLoading}
                        style={{ height: 'auto', minHeight: '40px' }}
                    />
                </div>

                {/* Send Button */}
                <Button
                    size="icon"
                    className={`h-10 w-10 rounded-xl shrink-0 transition-all duration-200 shadow-md ${message.trim() || attachments.length > 0
                        ? 'bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-violet-200'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        }`}
                    onClick={handleSend}
                    disabled={(!message.trim() && attachments.length === 0) || isLoading || disabled}
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
            </div>
        </div>
    )
}
