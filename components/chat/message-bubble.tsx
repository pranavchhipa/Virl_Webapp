"use client"

import { useState } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Paperclip, MoreHorizontal, Smile, Reply, Download } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'

// Lazy load picker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

export interface Attachment {
    type: 'image' | 'video' | 'file'
    url: string
    name: string
    size?: number
}

export interface MessageProps {
    id: string
    content: string
    createdAt: string
    userId: string
    isMe: boolean
    profile: {
        full_name: string
        avatar_url?: string
    }
    replyTo?: {
        id: string
        content: string
        username: string
    } | null
    reactions: Record<string, string[]> // { "👍": ["userId1", "userId2"] }
    attachments: Attachment[]
    onReply: (id: string, content: string, username: string) => void
    onReact: (id: string, emoji: string) => void
}

export function MessageBubble({
    id,
    content,
    createdAt,
    userId,
    isMe,
    profile,
    replyTo,
    reactions,
    attachments,
    onReply,
    onReact
}: MessageProps) {
    const [showReactions, setShowReactions] = useState(false)

    // Common Reactions
    const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🔥"]

    const toggleReaction = (emoji: string) => {
        onReact(id, emoji)
        setShowReactions(false)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group flex items-end gap-3 mb-4 w-full ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {/* Avatar */}
            {!isMe && (
                <Avatar className="h-8 w-8 mb-1 shrink-0">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs">
                        {profile.full_name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            )}

            <div className={`relative max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Sender Name (if not me) */}
                {!isMe && (
                    <span className="text-[11px] text-slate-500 ml-1 mb-1 font-medium">
                        {profile.full_name}
                    </span>
                )}

                {/* Reply Context */}
                {replyTo && (
                    <div className={`
                        mb-1 -ml-2 -mr-2 px-3 py-1.5 rounded-lg text-xs border-l-2
                        ${isMe
                            ? 'bg-indigo-600/10 border-indigo-300 text-indigo-100' // Darker bg for contrast if bubble is colored? No, reply context sits OUTSIDE usually or inside.
                            // Let's put it "Attached" to the bubble.
                            : 'bg-slate-100 border-slate-400 text-slate-600'
                        }
                        opacity-80 flex flex-col
                    `}>
                        <span className="font-bold opacity-75 text-[10px]">Replying to {replyTo.username}</span>
                        <span className="line-clamp-1 italic">{replyTo.content}</span>
                    </div>
                )}

                {/* Check if this is a media message (image or video) */}
                {attachments && attachments.length > 0 && attachments.some(att => att.type === 'image' || att.type === 'video') ? (
                    /* Media Message - WhatsApp Style (edge to edge, minimal wrapper) */
                    <div className="relative">
                        {attachments.map((att, i) => (
                            <div key={i}>
                                {att.type === 'image' ? (
                                    <a
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`block relative rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity shadow-md border-[3px] ${isMe ? 'border-indigo-500' : 'border-slate-200'}`}
                                    >
                                        <img
                                            src={att.url}
                                            alt="attachment"
                                            className="max-w-[300px] w-full h-auto object-cover max-h-[350px]"
                                        />
                                        {/* Time overlay on image */}
                                        <div className={`absolute bottom-2 ${isMe ? 'right-2' : 'left-2'} px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm`}>
                                            <span className="text-[10px] text-white font-medium">
                                                {format(new Date(createdAt), 'h:mm a')}
                                            </span>
                                        </div>
                                    </a>
                                ) : att.type === 'video' ? (
                                    <div className={`relative rounded-xl overflow-hidden shadow-md border-[3px] ${isMe ? 'border-indigo-500' : 'border-slate-200'}`}>
                                        <video
                                            src={att.url}
                                            className="max-w-[300px] w-full h-auto object-cover max-h-[350px]"
                                            controls
                                            preload="metadata"
                                        />
                                        {/* Time overlay on video */}
                                        <div className={`absolute bottom-12 ${isMe ? 'right-2' : 'left-2'} px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm pointer-events-none`}>
                                            <span className="text-[10px] text-white font-medium">
                                                {format(new Date(createdAt), 'h:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                        {/* Text below image if any */}
                        {content && (
                            <div className={`mt-1 px-3 py-2 rounded-xl ${isMe ? 'bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white' : 'bg-white text-slate-800'} shadow-sm`}>
                                <p className="whitespace-pre-wrap text-sm">{content}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Text/File Message - Regular Bubble */
                    <div
                        className={`
                            relative px-4 py-2.5 shadow-sm text-[15px] group-hover:shadow-md transition-shadow
                            ${isMe
                                ? 'bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white rounded-2xl rounded-tr-sm'
                                : 'bg-white text-slate-800 rounded-2xl rounded-tl-sm'
                            }
                            min-w-[60px]
                        `}
                    >
                        {/* File Attachments - WhatsApp Style */}
                        {attachments && attachments.length > 0 && (
                            <div className="space-y-2 mb-2">
                                {attachments.map((att, i) => (
                                    att.type === 'file' && (
                                        <div
                                            key={i}
                                            className={`relative rounded-xl overflow-hidden border-[3px] ${isMe ? 'border-indigo-400' : 'border-slate-200'}`}
                                        >
                                            {/* File Preview Background */}
                                            <div className={`w-full h-32 flex items-center justify-center ${isMe ? 'bg-indigo-500/30' : 'bg-slate-100'}`}>
                                                <FileText className={`w-12 h-12 ${isMe ? 'text-white/50' : 'text-slate-300'}`} />
                                            </div>

                                            {/* Download Button Overlay */}
                                            <a
                                                href={att.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                className="absolute inset-0 flex items-center justify-center"
                                            >
                                                <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-600/90 hover:bg-slate-700 rounded-full shadow-lg transition-colors cursor-pointer">
                                                    <Download className="w-5 h-5 text-white" />
                                                    <span className="text-white font-medium text-sm">
                                                        {att.size ? `${(att.size / 1024).toFixed(0)} KB` : 'Download'}
                                                    </span>
                                                </div>
                                            </a>

                                            {/* File Name */}
                                            <div className={`absolute bottom-0 left-0 right-0 px-3 py-2 ${isMe ? 'bg-indigo-600/80' : 'bg-white/90'} backdrop-blur-sm`}>
                                                <p className={`text-xs font-medium truncate ${isMe ? 'text-white/90' : 'text-slate-700'}`}>
                                                    {att.name}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}

                        {/* Text Content */}
                        {content && (
                            <p className="whitespace-pre-wrap leading-relaxed">
                                {content.split(/(@[\w.-]+)/g).map((part, i) => (
                                    part.match(/^@[\w.-]+$/) ? (
                                        <span key={i} className={`font-semibold ${isMe ? 'text-white underline decoration-white/30' : 'text-indigo-600'}`}>
                                            {part}
                                        </span>
                                    ) : (
                                        part
                                    )
                                ))}
                            </p>
                        )}

                        {/* Meta: Time */}
                        <div className={`
                            flex items-center gap-1 mt-1 text-[10px] select-none
                            ${isMe ? 'text-indigo-100/70 justify-end' : 'text-slate-400/80 justify-start'}
                        `}>
                            {format(new Date(createdAt), 'h:mm a')}
                        </div>

                        {/* Actions Menu (Hover) */}
                        {/* Actions Menu (Hover) */}
                        <div className={`
                        absolute -top-3 ${isMe ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} 
                        opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center
                        z-10
                    `}>
                            <div className="flex items-center gap-0.5 p-0.5 bg-white rounded-full shadow-sm border border-slate-100">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                                    onClick={() => onReply(id, content, isMe ? 'You' : profile.full_name)}
                                    title="Reply"
                                >
                                    <Reply className="w-3.5 h-3.5" />
                                </Button>

                                <Popover open={showReactions} onOpenChange={setShowReactions}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-full hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-colors"
                                            title="React"
                                        >
                                            <Smile className="w-3.5 h-3.5" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-1.5 rounded-xl border-slate-200 shadow-xl" side="top">
                                        <div className="flex gap-1">
                                            {quickReactions.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-lg transition-transform hover:scale-110 active:scale-95 origin-center"
                                                    onClick={() => toggleReaction(emoji)}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Reactions Display (Bottom of bubble) */}
                        {Object.keys(reactions).length > 0 && (
                            <div className={`
                            absolute -bottom-3 ${isMe ? 'right-0' : 'left-0'}
                            flex gap-1 flex-wrap
                        `}>
                                {Object.entries(reactions).map(([emoji, users]) => (
                                    users.length > 0 && (
                                        <button
                                            key={emoji}
                                            onClick={() => onReact(id, emoji)}
                                            className={`
                                            flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] shadow-sm border
                                            ${users.includes(userId)
                                                    ? 'bg-indigo-100 border-indigo-200 text-indigo-700'
                                                    : 'bg-white border-slate-200 text-slate-600'
                                                }
                                        `}
                                        >
                                            <span>{emoji}</span>
                                            <span className="font-semibold">{users.length}</span>
                                        </button>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    )
}
