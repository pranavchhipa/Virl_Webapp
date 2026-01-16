'use client'

import React from 'react'

import { motion } from "framer-motion"
import { Bot, User, Share2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { PostPreviewCard, PostPreviewData } from "./post-preview-card"

export interface MessageAction {
    id: string
    label: string
    value: string
    selected?: boolean
}

export interface MessageContent {
    text: string
    actions?: MessageAction[]
    contentCard?: PostPreviewData
}

export interface ChatMessageProps {
    id?: string
    role: 'user' | 'assistant'
    content: MessageContent
    onActionClick?: (actionId: string, value: string) => void
    onShareClick?: (content: string) => void
    isLast?: boolean
    isActive?: boolean
}

// --- LOGO HELPER ---
const getPlatformLogo = (id: string) => {
    const lowerId = id.toLowerCase()

    if (lowerId.includes('instagram') || lowerId === 'reel') {
        return (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 5.1632C14.2265 5.1632 14.4905 5.17178 15.3698 5.21193C16.1831 5.24903 16.6201 5.38503 16.9142 5.49929C17.3037 5.65053 17.581 5.83063 17.8728 6.12242C18.1646 6.41421 18.3447 6.69135 18.4961 7.08092C18.6103 7.37482 18.7463 7.81198 18.7834 8.62518C18.8236 9.50444 18.8322 9.76832 18.8322 11.9949C18.8322 14.2215 18.8236 14.4854 18.7834 15.3646C18.7463 16.1779 18.6103 16.615 18.4961 16.909C18.3447 17.2985 18.1646 17.5756 17.8728 17.8674C17.581 18.1592 17.3037 18.3393 16.9142 18.4907C16.6201 18.6049 16.1831 18.7408 15.3698 18.7779C14.4905 18.8181 14.2265 18.8267 12 18.8267C9.77353 18.8267 9.50955 18.8181 8.63022 18.7779C7.81692 18.7408 7.37996 18.6049 7.08585 18.4907C6.69623 18.3393 6.41909 18.1592 6.1273 17.8674C5.83551 17.5756 5.65532 17.2985 5.50398 16.909C5.38973 16.615 5.25383 16.1779 5.21663 15.3646C5.17648 14.4854 5.16789 14.2215 5.16789 11.9949C5.16789 9.76832 5.17648 9.50444 5.21663 8.62518C5.25383 7.81198 5.38973 7.37482 5.50398 7.08092C5.65532 6.69135 5.83551 6.41421 6.1273 6.12242C6.41909 5.83063 6.69623 5.65053 7.08585 5.49929C7.37996 5.38503 7.81692 5.24903 8.63022 5.21193C9.50955 5.17178 9.77353 5.1632 12 5.1632ZM12 3C9.73906 3 9.45564 3.00957 8.56681 3.05013C7.68007 3.09059 7.07447 3.23055 6.54452 3.43657C5.99625 3.64969 5.53128 3.93172 5.06648 4.39652C4.60168 4.86132 4.31965 5.32629 4.10654 5.87456C3.90051 6.40451 3.76056 7.01011 3.7201 7.89685C3.67954 8.78568 3.66997 9.0691 3.66997 11.33C3.66997 13.5909 3.67954 13.8744 3.7201 14.7632C3.76056 15.65 3.90051 16.2555 4.10654 16.7855C4.31965 17.3338 4.60168 17.7987 5.06648 18.2635C5.53128 18.7283 5.99625 19.0104 6.54452 19.2235C7.07447 19.4295 7.68007 19.5695 8.56681 19.61C9.45564 19.6505 9.73906 19.6601 12 19.6601C14.2609 19.6601 14.5444 19.6505 15.4332 19.61C16.32 19.5695 16.9255 19.4295 17.4555 19.2235C18.0038 19.0104 18.4687 18.7283 18.9335 18.2635C19.3983 17.7987 19.6804 17.3338 19.8935 16.7855C20.0995 16.2555 20.2395 15.65 20.2799 14.7632C20.3205 13.8744 20.33 13.5909 20.33 11.33C20.33 9.0691 20.3205 8.78568 20.2799 7.89685C20.2395 7.01011 20.0995 6.40451 19.8935 5.87456C19.6804 5.32629 19.3983 4.86132 18.9335 4.39652C18.4687 3.93172 18.0038 3.64969 17.4555 3.43657C16.9255 3.23055 16.32 3.09059 15.4332 3.05013C14.5444 3.00957 14.2609 3 12 3Z" fill="#E1306C" />
                <path fillRule="evenodd" clipRule="evenodd" d="M12 7.53572C9.5401 7.53572 7.54605 9.52978 7.54605 11.9897C7.54605 14.4496 9.5401 16.4436 12 16.4436C14.4599 16.4436 16.454 14.4496 16.454 11.9897C16.454 9.52978 14.4599 7.53572 12 7.53572ZM12 14.2929C10.7279 14.2929 9.69677 13.2618 9.69677 11.9897C9.69677 10.7176 10.7279 9.68644 12 9.68644C13.2721 9.68644 14.3033 10.7176 14.3033 11.9897C14.3033 13.2618 13.2721 14.2929 12 14.2929Z" fill="#E1306C" />
                <path d="M17.8455 7.58784C17.8455 8.37894 17.2043 9.02016 16.4132 9.02016C15.6221 9.02016 14.9808 8.37894 14.9808 7.58784C14.9808 6.79673 15.6221 6.15552 16.4132 6.15552C17.2043 6.15552 17.8455 6.79673 17.8455 7.58784Z" fill="#E1306C" />
            </svg>
        )
    }
    if (lowerId.includes('facebook') || lowerId === 'fb') {
        return (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12.0635C22 6.50455 17.5222 2 12 2C6.47775 2 2 6.50455 2 12.0635C2 17.0877 5.6635 21.2407 10.4375 21.9791V14.965H7.90625V12.0635H10.4375V9.84452C10.4375 7.332 11.9305 5.93284 14.2155 5.93284C15.3087 5.93284 16.454 6.12871 16.454 6.12871V8.59976H15.1923C13.95 8.59976 13.5625 9.37395 13.5625 10.1666V12.0635H16.3375L15.8955 14.965H13.5625V21.9791C18.3365 21.2407 22 17.0877 22 12.0635Z" fill="#1877F2" />
            </svg>
        )
    }
    if (lowerId.includes('youtube') || lowerId.includes('yt')) {
        return (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.582 6.006C21.328 5.054 20.582 4.308 19.63 4.054C17.904 3.592 12 3.592 12 3.592C12 3.592 6.096 3.592 4.37 4.054C3.418 4.308 2.672 5.054 2.418 6.006C1.96 7.732 1.96 11.332 1.96 11.332C1.96 11.332 1.96 14.932 2.418 16.658C2.672 17.61 3.418 18.356 4.37 18.61C6.096 19.072 12 19.072 12 19.072C12 19.072 17.904 19.072 19.63 18.61C20.582 18.356 21.328 17.61 21.582 16.658C22.04 14.932 22.04 11.332 22.04 11.332C22.04 11.332 22.04 7.732 21.582 6.006ZM9.982 15.02V7.644L15.42 11.332L9.982 15.02Z" fill="#FF0000" />
            </svg>
        )
    }
    if (lowerId.includes('twitter') || lowerId === 'x') {
        return (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.2439 2.25H21.5519L14.325 10.51L22.8276 21.75H16.1697L10.956 14.934L4.99049 21.75H1.68058L9.40939 12.915L1.25391 2.25H8.07971L12.7928 8.481L18.2439 2.25ZM17.0831 19.77H18.9161L7.08412 4.125H5.11684L17.0831 19.77Z" fill="#000000" />
            </svg>
        )
    }
    if (lowerId.includes('linkedin')) {
        return (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.4471 20.452H16.8911V14.881C16.8911 13.553 16.8641 11.844 15.0351 11.844C13.1821 11.844 12.8971 13.291 12.8971 14.786V20.452H9.3401V9H12.7551V10.566H12.8021C13.2771 9.666 14.4381 8.717 16.1671 8.717C19.7681 8.717 20.4471 11.087 20.4471 14.167V20.452ZM5.3371 7.433C4.1971 7.433 3.2741 6.509 3.2741 5.369C3.2741 4.229 4.1971 3.305 5.3371 3.305C6.4771 3.305 7.4001 4.229 7.4001 5.369C7.4001 6.509 6.4771 7.433 5.3371 7.433ZM3.5571 20.452H7.1171V9H3.5571V20.452ZM22.2251 0H1.7711C0.7921 0 0 0.774 0 1.729V22.271C0 23.227 0.7921 24 1.7711 24H22.2221C23.2011 24 24 23.227 24 22.271V1.729C24 0.774 23.2011 0 22.2251 0Z" fill="#0A66C2" />
            </svg>
        )
    }
    // Default fallback icon
    return null
}

// Memoize the component to prevent unnecessary re-renders
export const ChatMessage = React.memo(ChatMessageComponent);

function ChatMessageComponent({ role, content, onActionClick, onShareClick, isLast, isActive }: ChatMessageProps) {
    const isUser = role === 'user'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "flex gap-4 max-w-3xl w-full",
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
        >
            {/* Avatar */}
            <div className="shrink-0">
                <Avatar className={cn(
                    "h-10 w-10 border-2 shadow-lg",
                    isUser ? "border-purple-300 shadow-purple-500/20" : "border-purple-200 shadow-indigo-500/10"
                )}>
                    {isUser ? (
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                            <User className="h-5 w-5" />
                        </AvatarFallback>
                    ) : (
                        <AvatarFallback className="bg-gradient-to-br from-violet-100 to-fuchsia-100 text-purple-600">
                            <Sparkles className="h-5 w-5" />
                        </AvatarFallback>
                    )}
                </Avatar>
            </div>

            <div className={cn("flex flex-col gap-2 min-w-0 w-full", isUser ? "items-end" : "items-start")}>
                {/* Message Bubble */}
                {content.text && (
                    <div className={cn(
                        "rounded-2xl px-5 py-3.5 shadow-md text-[15px] leading-relaxed max-w-fit",
                        isUser
                            ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-purple-500/25"
                            : "bg-white/90 backdrop-blur-sm border border-purple-100/50 text-slate-700 rounded-tl-none shadow-slate-200/50"
                    )}>
                        {typeof content.text === 'string' ? content.text : JSON.stringify(content.text)}
                    </div>
                )}

                {/* Interactive Action Chips (AI Only) */}
                {!isUser && content.actions && content.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {content.actions.map((action, index) => {
                            // Handle both string and object actions
                            const actionId = typeof action === 'string' ? action : (action?.id || `action-${index}`)
                            const actionLabel = typeof action === 'string' ? action : (action?.label || action?.value || 'Option')
                            const actionValue = typeof action === 'string' ? action : (action?.value || action?.label || String(action))

                            // Brand Colors Logic
                            let brandClass = "bg-white border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                            const lowerId = String(actionId).toLowerCase()
                            const Logo = getPlatformLogo(String(actionId))

                            // Use isActive prop to determine interactivity, fallback to isLast for backward compatibility
                            const isClickable = isActive !== undefined ? isActive : isLast

                            if (!isClickable) {
                                brandClass = "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60 grayscale"
                            } else {
                                if (lowerId.includes('instagram') || lowerId === 'reel') {
                                    brandClass = "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100 hover:border-pink-300 hover:shadow-pink-100"
                                } else if (lowerId.includes('facebook') || lowerId === 'fb') {
                                    brandClass = "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:shadow-blue-100"
                                } else if (lowerId.includes('linkedin')) {
                                    brandClass = "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 hover:border-sky-300 hover:shadow-sky-100"
                                } else if (lowerId.includes('youtube') || lowerId.includes('yt')) {
                                    brandClass = "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 hover:shadow-red-100"
                                } else if (lowerId.includes('twitter') || lowerId === 'x') {
                                    brandClass = "bg-slate-50 border-slate-300 text-slate-900 hover:bg-slate-100 hover:border-slate-400 hover:shadow-slate-100"
                                } else if (lowerId.includes('email')) {
                                    brandClass = "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300 hover:shadow-orange-100"
                                }
                            }

                            return (
                                <motion.button
                                    key={actionId}
                                    disabled={!isClickable}
                                    whileHover={isClickable ? { scale: 1.05 } : {}}
                                    whileTap={isClickable ? { scale: 0.95 } : {}}
                                    onClick={() => isClickable && onActionClick?.(String(actionId), String(actionValue))}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border shadow-sm flex items-center gap-2",
                                        brandClass
                                    )}
                                >
                                    {Logo && Logo}
                                    {String(actionLabel)}
                                </motion.button>
                            )
                        })}
                    </div>
                )}

                {/* Content Card (Final Output) */}
                {!isUser && content.contentCard && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full"
                    >
                        <PostPreviewCard
                            data={content.contentCard}
                            onShare={() => {
                                if (!content.contentCard || !onShareClick) return

                                const data = content.contentCard
                                const parts = [
                                    `TITLE: ${data.title}`,
                                    `PLATFORM: ${data.type}`,
                                    data.best_time_to_post ? `BEST TIME: ${data.best_time_to_post}` : null,
                                    `\n-- VISUAL HOOK --\n${data.hook_visual || 'N/A'}`,
                                    `\n-- CONTENT / SCRIPT --\n${data.content}`,
                                ]

                                if (data.timeline && data.timeline.length > 0) {
                                    parts.push(`\n-- TIMELINE --`)
                                    data.timeline.forEach(t => {
                                        parts.push(`[${t.time}] Visual: ${t.visual} | Audio: ${t.audio}`)
                                    })
                                }

                                if (data.hashtags && data.hashtags.length > 0) {
                                    parts.push(`\nHASHTAGS: ${data.hashtags.join(' ')}`)
                                }

                                const fullText = parts.filter(Boolean).join('\n')
                                onShareClick(fullText)
                            }}
                        />
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}
