'use client'

import { motion } from "framer-motion"
import { Copy, Share2, Instagram, Linkedin, Youtube, Mail, Video, Heart, MessageCircle, Bookmark, MoreHorizontal, Send, ThumbsUp, MessageSquare, Repeat, Check, Twitter, Globe, Facebook, ThumbsDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface PostPreviewData {
    title: string
    type: string
    content: string
    hook_visual?: string
    hook_audio?: string
    hashtags?: string[]
    best_time_to_post?: string
    timeline?: Array<{
        time: string
        visual: string
        audio: string
    }>
}

interface PostPreviewCardProps {
    data: PostPreviewData
    onShare?: () => void
}

// --- INSTAGRAM REEL ---
function InstagramReelPreview({ data }: { data: PostPreviewData }) {
    return (
        <div className="relative w-full aspect-[9/16] bg-black rounded-xl overflow-hidden text-white shadow-2xl mx-auto max-w-[320px] border border-gray-800 font-sans select-none">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-30 bg-gradient-to-b from-black/80 to-transparent">
                <span className="font-bold text-xl tracking-tight flex items-center gap-1"><Instagram className="w-5 h-5" /> Reels</span>
                <Video className="w-6 h-6 opacity-80" />
            </div>

            {/* Video Placeholder Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black z-0 flex items-center justify-center">
                <div className="text-center opacity-20">
                    <Video className="w-16 h-16 mx-auto mb-2" />
                    <span className="text-sm font-medium tracking-widest uppercase">Video Preview</span>
                </div>
            </div>

            {/* "On Screen Text" (Visual Hook) - Styled simply as text on video */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[85%] z-10 text-center">
                <span className="bg-white/90 text-black px-4 py-2 text-sm font-bold rounded-lg shadow-lg leading-relaxed box-decoration-clone">
                    {data.hook_visual || "POV: When the plan actually works..."}
                </span>
            </div>

            {/* Right Sidebar Actions */}
            <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-20">
                <div className="flex flex-col items-center gap-1 group cursor-pointer">
                    <Heart className="w-7 h-7 stroke-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[12px] font-medium">Like</span>
                </div>
                <div className="flex flex-col items-center gap-1 group cursor-pointer">
                    <MessageCircle className="w-7 h-7 stroke-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[12px] font-medium">Comment</span>
                </div>
                <div className="flex flex-col items-center gap-1 group cursor-pointer">
                    <Send className="w-7 h-7 stroke-2 group-hover:scale-110 transition-transform -rotate-12" />
                    <span className="text-[12px] font-medium">Share</span>
                </div>
                <MoreHorizontal className="w-6 h-6 mt-2 opacity-80" />
                <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-orange-500 rounded-md border-2 border-white mt-2 shadow-sm" />
            </div>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pt-16 bg-gradient-to-t from-black via-black/70 to-transparent z-20">
                <div className="flex items-center gap-2.5 mb-2.5">
                    <Avatar className="h-8 w-8 ring-2 ring-white/20">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback className="bg-gradient-to-tr from-yellow-400 to-purple-600 text-[10px] text-white font-bold">IG</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm drop-shadow-md text-white">your_brand</span>
                    <button className="border border-white/60 text-white text-[11px] px-3 py-0.5 rounded-[6px] font-semibold backdrop-blur-sm hover:bg-white/20 transition-colors">Follow</button>
                </div>

                <div className="space-y-2 mb-2 pr-12">
                    <p className="text-sm text-white/95 leading-snug line-clamp-2 drop-shadow-sm font-normal">
                        {data.title} <span className="text-white/60 cursor-pointer hover:text-white/80">...more</span>
                    </p>
                    <div className="flex items-center gap-2 text-xs opacity-90 overflow-hidden">
                        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/5">
                            <span className="text-[10px]">♫</span>
                            <span className="truncate max-w-[120px]">{data.hook_audio || "Original Audio • Trending"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- YOUTUBE SHORT ---
function YouTubeShortPreview({ data }: { data: PostPreviewData }) {
    return (
        <div className="relative w-full aspect-[9/16] bg-black rounded-xl overflow-hidden text-white shadow-2xl mx-auto max-w-[320px] border border-zinc-800 font-sans select-none">
            {/* Header */}
            <div className="absolute top-0 right-0 p-4 z-20 flex gap-4">
                <div className="flex gap-4 items-center opacity-80">
                    <Video className="w-6 h-6" />
                    <MoreHorizontal className="w-6 h-6 rotate-90" />
                </div>
            </div>

            {/* Video Placeholder */}
            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center z-0">
                <div className="text-center opacity-30">
                    <p className="text-5xl font-black tracking-tighter uppercase text-zinc-800 select-none">Shorts</p>
                </div>
            </div>

            {/* "Text Overlay" */}
            <div className="absolute top-[20%] left-4 right-16 z-10 pointer-events-none">
                <span className="text-xl font-bold bg-black/60 text-white px-2 py-1 leading-relaxed box-decoration-clone">
                    {data.hook_visual || "POV: Trying to explain this to my boss"}
                </span>
            </div>

            {/* Right Sidebar Actions - YT Style */}
            <div className="absolute right-2 bottom-4 flex flex-col items-center gap-5 z-20 pb-4">
                <div className="flex flex-col items-center gap-1 group cursor-pointer">
                    <div className="bg-zinc-800/60 backdrop-blur-sm p-3 rounded-full group-hover:bg-zinc-700 transition-colors">
                        <ThumbsUp className="w-6 h-6 fill-white" />
                    </div>
                    <span className="text-xs font-semibold">Like</span>
                </div>
                <div className="flex flex-col items-center gap-1 group cursor-pointer">
                    <div className="bg-zinc-800/60 backdrop-blur-sm p-3 rounded-full group-hover:bg-zinc-700 transition-colors">
                        <ThumbsDown className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold">Dislike</span>
                </div>
                <div className="flex flex-col items-center gap-1 group cursor-pointer">
                    <div className="bg-zinc-800/60 backdrop-blur-sm p-3 rounded-full group-hover:bg-zinc-700 transition-colors">
                        <MessageSquare className="w-6 h-6 fill-white" />
                    </div>
                    <span className="text-xs font-semibold">1.2K</span>
                </div>
                <div className="flex flex-col items-center gap-1 group cursor-pointer">
                    <div className="bg-zinc-800/60 backdrop-blur-sm p-3 rounded-full group-hover:bg-zinc-700 transition-colors">
                        <Share2 className="w-6 h-6 fill-white" />
                    </div>
                    <span className="text-xs font-semibold">Share</span>
                </div>
                <div className="w-10 h-10 bg-zinc-700 rounded overflow-hidden mt-1 border border-white/20">
                    <div className="w-full h-full bg-gradient-to-br from-red-500 to-purple-600" />
                </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-16 p-4 pb-6 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
                <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-8 w-8 ring-1 ring-zinc-700">
                        <AvatarFallback className="bg-purple-600 text-white font-bold text-xs">CH</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm text-zinc-100">@ChannelName</span>
                    <button className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full ml-1 hover:bg-zinc-200 transition-colors">Subscribe</button>
                </div>
                <p className="text-sm leading-snug line-clamp-2 mb-2 text-zinc-100 font-medium">{data.title}</p>
                <div className="flex items-center gap-1 text-xs opacity-80 text-zinc-300">
                    <span className="truncate max-w-[200px]">♫ {data.hook_audio || "Sound used in this video"}</span>
                </div>
            </div>
        </div>
    )
}

// --- LINKEDIN POST ---
function LinkedInPreview({ data }: { data: PostPreviewData }) {
    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden font-sans max-w-[500px] mx-auto text-[14px]">
            {/* Header */}
            <div className="px-4 py-3 flex items-start gap-3">
                <Avatar className="h-12 w-12 rounded-sm border border-slate-100">
                    <AvatarFallback className="bg-slate-100 rounded-sm text-slate-500 font-bold">Me</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center flex-wrap gap-1 leading-none mb-1">
                        <span className="font-semibold text-slate-900 hover:text-blue-700 hover:underline cursor-pointer">Your Name</span>
                        <span className="text-slate-500 text-xs">• 2nd</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate leading-none mb-1">Building Viral Strategies 🚀 | Content AI</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 leading-none">
                        <span>3h</span>
                        <span>•</span>
                        <Globe className="h-3 w-3" />
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 -mr-2">
                    <MoreHorizontal className="h-5 w-5" />
                </Button>
            </div>

            {/* Body */}
            <div className="px-4 pb-2 text-slate-900 whitespace-pre-wrap leading-relaxed">
                {data.content}
                {data.hashtags && (
                    <div className="mt-3 text-blue-600 font-semibold hover:underline cursor-pointer">
                        {data.hashtags.join(' ')}
                    </div>
                )}
            </div>

            {/* Visual (LinkedIn style is rectangular usually) */}
            {data.hook_visual && (
                <div className="mt-2 bg-slate-100 aspect-[4/3] flex items-center justify-center relative border-y border-slate-200/50">
                    <div className="text-center p-8 max-w-[80%]">
                        <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-3xl font-serif text-slate-400 opacity-50 mb-2">Visual</p>
                        <p className="text-sm text-slate-600 font-medium italic">"{data.hook_visual}"</p>
                    </div>
                </div>
            )}

            {/* Stats Bar */}
            <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center text-xs text-slate-500 mt-1">
                <div className="flex items-center gap-1.5 hover:text-blue-600 hover:underline cursor-pointer">
                    <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-full bg-blue-500 z-20 flex items-center justify-center ring-2 ring-white"><ThumbsUp className="w-2.5 h-2.5 fill-white text-white" /></div>
                        <div className="w-4 h-4 rounded-full bg-red-500 z-10 flex items-center justify-center ring-2 ring-white"><Heart className="w-2.5 h-2.5 fill-white text-white" /></div>
                        <div className="w-4 h-4 rounded-full bg-green-500 z-0 flex items-center justify-center ring-2 ring-white"><Check className="w-2.5 h-2.5 text-white" /></div>
                    </div>
                    <span>842</span>
                </div>
                <span className="hover:text-blue-600 hover:underline cursor-pointer">24 comments • 4 reposts</span>
            </div>

            {/* Action Bar */}
            <div className="px-2 py-1 flex items-center justify-between gap-1">
                <Button variant="ghost" className="flex-1 gap-2 text-slate-600 hover:bg-slate-100/80 rounded-md h-12 px-2">
                    <ThumbsUp className="w-5 h-5 mb-0.5" />
                    <span className="text-xs font-semibold text-slate-600">Like</span>
                </Button>
                <Button variant="ghost" className="flex-1 gap-2 text-slate-600 hover:bg-slate-100/80 rounded-md h-12 px-2">
                    <MessageSquare className="w-5 h-5 mb-0.5" />
                    <span className="text-xs font-semibold text-slate-600">Comment</span>
                </Button>
                <Button variant="ghost" className="flex-1 gap-2 text-slate-600 hover:bg-slate-100/80 rounded-md h-12 px-2">
                    <Repeat className="w-5 h-5 mb-0.5" />
                    <span className="text-xs font-semibold text-slate-600">Repost</span>
                </Button>
                <Button variant="ghost" className="flex-1 gap-2 text-slate-600 hover:bg-slate-100/80 rounded-md h-12 px-2">
                    <Send className="w-5 h-5 mb-0.5" />
                    <span className="text-xs font-semibold text-slate-600">Send</span>
                </Button>
            </div>
        </div>
    )
}

// --- TWEET (X) ---
function TweetPreview({ data }: { data: PostPreviewData }) {
    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden font-sans max-w-[500px] mx-auto p-4 hover:bg-slate-50/20 transition-colors">
            {/* Header */}
            <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-black text-white font-bold text-sm">X</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="font-bold text-[15px] truncate text-slate-900">Your Name</span>
                            <span className="text-[15px] text-slate-500 truncate">@handle</span>
                            <span className="text-[15px] text-slate-500">·</span>
                            <span className="text-[15px] text-slate-500 hover:underline">3h</span>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                    </div>

                    {/* Content */}
                    <div className="mt-1 text-[15px] text-slate-900 whitespace-pre-wrap leading-normal">
                        {data.content}
                    </div>

                    {/* Visual Card (Twitter Card Style) */}
                    {data.hook_visual && (
                        <div className="mt-3 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 aspect-video flex items-center justify-center relative select-none cursor-pointer hover:bg-slate-100 transition-colors">
                            <div className="text-center p-6 w-full">
                                <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2">
                                    <Video className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-slate-800 text-sm font-bold truncate px-4">{data.hook_visual}</p>
                                <p className="text-slate-400 text-xs">twitter.com</p>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between mt-3 text-slate-500 max-w-[85%]">
                        <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-500 transition-colors">
                            <div className="p-2 -ml-2 rounded-full group-hover:bg-blue-50 transition-colors">
                                <MessageCircle className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-[13px] transition-colors">12</span>
                        </div>
                        <div className="flex items-center gap-2 group cursor-pointer hover:text-green-500 transition-colors">
                            <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
                                <Repeat className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-[13px] transition-colors">4</span>
                        </div>
                        <div className="flex items-center gap-2 group cursor-pointer hover:text-pink-500 transition-colors">
                            <div className="p-2 rounded-full group-hover:bg-pink-50 transition-colors">
                                <Heart className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-[13px] transition-colors">282</span>
                        </div>
                        <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-500 transition-colors">
                            <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                                <Share2 className="w-[18px] h-[18px]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


// --- MAIN WRAPPER ---
export function PostPreviewCard({ data, onShare }: PostPreviewCardProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        // Construct a rich text representation
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

        navigator.clipboard.writeText(fullText)
        setCopied(true)
        toast.success("Full Strategy copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
    }

    const t = data.type.toLowerCase()

    // Dispatcher
    const renderPreview = () => {
        if (t.includes('reel') || t.includes('tiktok') || t.includes('story')) {
            return <InstagramReelPreview data={data} />
        }
        if (t.includes('youtube') || t.includes('short')) {
            return <YouTubeShortPreview data={data} />
        }
        if (t.includes('linkedin')) {
            return <LinkedInPreview data={data} />
        }
        if (t.includes('twitter') || t.includes('x') || t.includes('thread')) {
            return <TweetPreview data={data} />
        }
        // Default / Facebook
        return <LinkedInPreview data={data} /> // Re-use generic card for now
    }

    return (
        <div className="w-full max-w-lg mt-6 mx-auto">
            {/* Best Time Badge (Vixi-specific) */}
            {data.best_time_to_post && (
                <div className="flex items-center justify-center mb-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="px-4 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-full text-[12px] font-bold text-amber-800 flex items-center gap-1.5 shadow-sm"
                    >
                        <span className="text-sm">⚡</span>
                        <span>Best Time to Post: {data.best_time_to_post}</span>
                    </motion.div>
                </div>
            )}

            {/* The Authentic UI Preview */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
                className={cn(
                    "transition-all duration-300",
                    t.includes('reel') || t.includes('short') ? "" : "hover:-translate-y-1 hover:shadow-xl rounded-xl"
                )}
            >
                {renderPreview()}
            </motion.div>

            {/* Action Buttons - Below Visual */}
            <div className="flex items-center justify-center gap-3 mt-4 px-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex-1 max-w-[180px] h-10 font-semibold border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 gap-2"
                >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy Full Script"}
                </Button>
                {onShare && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onShare}
                        className="flex-1 max-w-[180px] h-10 font-semibold border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 gap-2"
                    >
                        <Share2 className="w-4 h-4" />
                        Share to Team
                    </Button>
                )}
            </div>

            {/* Timeline Data (Detailed Breakdown) */}
            {data.timeline && (
                <div className="mt-6 p-4 bg-slate-50/50 rounded-xl border border-slate-100 text-sm">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Strategy Details</h4>
                    <div className="space-y-4">
                        {data.timeline.map((t, i) => (
                            <div key={i} className="flex gap-4 text-xs relative group">
                                <div className="absolute left-[5px] top-2 bottom-[-18px] w-px bg-slate-200 last:hidden" />
                                <div className="w-2.5 h-2.5 rounded-full bg-purple-200 mt-1 shrink-0 z-10 ring-4 ring-slate-50 group-hover:bg-purple-500 transition-colors" />
                                <div className="space-y-2 pb-1 flex-1">
                                    <span className="font-mono text-[11px] text-purple-600 font-semibold block mb-1 bg-purple-50 px-2 py-0.5 rounded w-fit">{t.time}</span>
                                    <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                                        <p className="text-slate-700 leading-relaxed"><span className="font-semibold text-purple-700">🎬 Visual:</span> {t.visual}</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                                        <p className="text-slate-600 leading-relaxed"><span className="font-semibold text-slate-500">🎵 Audio:</span> <span className="italic">"{t.audio}"</span></p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
