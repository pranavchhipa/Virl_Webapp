"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X, MessageSquare, Search, MoreVertical, Trash2 } from "lucide-react"
import { TeamChat, TeamChatRef } from "@/components/chat/team-chat"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChatSidebarProps {
    projectId: string
    open: boolean
    onClose: () => void
}

export function ChatSidebar({ projectId, open, onClose }: ChatSidebarProps) {
    const [width, setWidth] = useState(520)
    const [isResizing, setIsResizing] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const sidebarRef = useRef<HTMLDivElement>(null)
    const chatRef = useRef<TeamChatRef>(null)

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
    }, [])

    const stopResizing = useCallback(() => {
        setIsResizing(false)
    }, [])

    const resize = useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isResizing) {
                const newWidth = document.body.clientWidth - mouseMoveEvent.clientX
                if (newWidth > 320 && newWidth < 800) {
                    setWidth(newWidth)
                }
            }
        },
        [isResizing]
    )

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize)
            window.addEventListener("mouseup", stopResizing)
        }
        return () => {
            window.removeEventListener("mousemove", resize)
            window.removeEventListener("mouseup", stopResizing)
        }
    }, [isResizing, resize, stopResizing])

    if (!open) return null

    return (
        <div
            ref={sidebarRef}
            style={{ width: `${width}px` }}
            className="fixed inset-y-0 right-0 bg-white border-l shadow-2xl z-50 flex flex-col transition-[width] duration-0 ease-linear font-sans"
        >
            {/* Resizer Handle - Thin line on hover */}
            <div
                className="absolute top-0 bottom-0 -left-1 w-3 cursor-ew-resize z-50 group"
                onMouseDown={startResizing}
            >
                {/* Thin visible line */}
                <div className={`absolute top-0 bottom-0 left-1 w-[3px] transition-colors duration-150
                    ${isResizing
                        ? 'bg-indigo-500'
                        : 'bg-transparent group-hover:bg-indigo-500'
                    }`}
                />
            </div>

            {/* Header */}
            <div className="h-14 px-4 border-b flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-md text-white">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900">Team Chat</h3>
                </div>
                <div className="flex items-center gap-1">
                    {/* Search Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        onClick={() => setSearchOpen(!searchOpen)}
                    >
                        <Search className="h-4 w-4" />
                    </Button>

                    {/* Delete Button - toggles selection mode */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50"
                        onClick={() => chatRef.current?.toggleSelectionMode()}
                        title="Select & Delete Messages"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>

                    {/* Close Button */}
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            {searchOpen && (
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            chatRef.current?.setSearchQuery(e.target.value)
                        }}
                        placeholder="Search in chat..."
                        className="flex-1 h-8 text-sm border-0 bg-transparent focus-visible:ring-0"
                        autoFocus
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSearchOpen(false); setSearchQuery(''); chatRef.current?.setSearchQuery('') }}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Team Chat Component */}
            <div className="flex-1 overflow-hidden relative bg-white">
                {/* Wallpaper Background */}
                <div
                    className="absolute inset-0 z-0 opacity-[0.25] pointer-events-none mix-blend-multiply"
                    style={{ backgroundImage: `url('/chat-bg.png')`, backgroundSize: '350px' }}
                />

                <div className="relative z-10 h-full">
                    <TeamChat
                        ref={chatRef}
                        projectId={projectId}
                        hideHeader={true}
                        className="h-full border-none shadow-none rounded-none bg-transparent"
                    />
                </div>
            </div>
        </div>
    )
}
