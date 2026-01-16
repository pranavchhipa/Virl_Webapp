"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageBubble, Attachment } from './message-bubble'
import { ChatInput } from './chat-input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Loader2, Search, MoreVertical, Trash2, X, ArrowDown } from 'lucide-react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Define the shape of our message including new fields
interface Message {
    id: string
    content: string
    created_at: string
    user_id: string
    profiles: {
        full_name: string
        avatar_url?: string
    }
    reply_to_id?: string
    reactions: Record<string, string[]> // { "Emoji": ["userId1", "userId2"] }
    attachments: Attachment[]
    reply_context?: { // Virtual field for UI, joined from reply_to_id
        id: string
        content: string
        profiles: { full_name: string }
    }
}

interface TeamChatProps {
    projectId: string
    className?: string
    hideHeader?: boolean
}

// Ref methods exposed to parent
export interface TeamChatRef {
    setSearchQuery: (query: string) => void
    toggleSelectionMode: () => void
    scrollToTop: () => void
    scrollToBottom: () => void
}

// Helper to format date separator
function getDateLabel(dateString: string): string {
    const date = new Date(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMMM d, yyyy')
}

export const TeamChat = forwardRef<TeamChatRef, TeamChatProps>(function TeamChat({ projectId, className, hideHeader = false }, ref) {
    const [messages, setMessages] = useState<Message[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [replyingTo, setReplyingTo] = useState<{ id: string, content: string, username: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
    const [selectionMode, setSelectionMode] = useState(false)
    const [userRole, setUserRole] = useState<'viewer' | 'editor' | 'lead' | 'owner' | 'manager' | null>(null)
    const supabase = createClient()
    const scrollRef = useRef<HTMLDivElement>(null)

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        setSearchQuery: (query: string) => setSearchQuery(query),
        toggleSelectionMode: () => {
            setSelectionMode(prev => !prev)
            setSelectedMessages(new Set())
        },
        scrollToTop: () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }),
        scrollToBottom: () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }))

    // Check Auth & Role
    useEffect(() => {
        const checkUserAndRole = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setCurrentUserId(user.id)

            // Check if Project Owner (Creator)
            const { data: project } = await supabase
                .from('projects')
                .select('created_by')
                .eq('id', projectId)
                .single()

            if (project?.created_by === user.id) {
                setUserRole('owner')
                return
            }

            // Check Member Role
            const { data: member } = await supabase
                .from('project_members')
                .select('role')
                .eq('project_id', projectId)
                .eq('user_id', user.id)
                .single()

            if (member) {
                setUserRole(member.role as any)
            }
        }

        if (projectId) checkUserAndRole()
    }, [projectId, supabase])

    // Fetch Messages
    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    id, 
                    content, 
                    created_at, 
                    user_id, 
                    reply_to_id,
                    reactions,
                    attachments,
                    profiles (full_name, avatar_url)
                `)
                .eq('project_id', projectId)
                .order('created_at', { ascending: true })

            if (data) {
                const formatted: Message[] = data.map((d: any) => ({
                    ...d,
                    reactions: d.reactions || {},
                    attachments: d.attachments || []
                }))
                setMessages(formatted)
            }
            setLoading(false)
        }

        if (projectId) fetchMessages()

        // Realtime Subscription
        const channel = supabase
            .channel(`project-chat:${projectId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `project_id=eq.${projectId}`,
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newMsgId = payload.new.id
                        const { data } = await supabase
                            .from('messages')
                            .select('*, profiles(full_name, avatar_url)')
                            .eq('id', newMsgId)
                            .single()

                        if (data) {
                            setMessages(prev => {
                                if (prev.some(m => m.id === data.id)) return prev
                                return [...prev, {
                                    ...data,
                                    reactions: data.reactions || {},
                                    attachments: data.attachments || []
                                } as any as Message]
                            })
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedMsg = payload.new
                        setMessages(prev => prev.map(m =>
                            m.id === updatedMsg.id
                                ? { ...m, reactions: updatedMsg.reactions, attachments: updatedMsg.attachments }
                                : m
                        ))
                    } else if (payload.eventType === 'DELETE') {
                        setMessages(prev => prev.filter(m => m.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [projectId, supabase])

    // Auto Scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, loading])

    const handleSendMessage = async (content: string, attachments: Attachment[]) => {
        if (!currentUserId) return

        const { error } = await supabase
            .from('messages')
            .insert({
                content: content,
                project_id: projectId,
                user_id: currentUserId,
                reply_to_id: replyingTo?.id,
                attachments: attachments,
                reactions: {}
            })

        if (error) {
            console.error(error)
            toast.error("Failed to send message")
        } else {
            setReplyingTo(null)

            // Detect and notify @mentions (non-blocking)
            import('@/lib/mention-helper').then(async ({ extractMentions }) => {
                const mentionedIds = await extractMentions(content, projectId, supabase)
                if (mentionedIds.length > 0) {
                    fetch('/api/notify-mentions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            projectId,
                            authorId: currentUserId,
                            mentionedUserIds: mentionedIds,
                            content: content.substring(0, 100)
                        })
                    }).catch(err => console.error('Mention notification failed:', err))
                }
            }).catch(err => console.error('Mention detection failed:', err))
        }
    }

    const handleReaction = async (msgId: string, emoji: string) => {
        if (!currentUserId) return

        const msg = messages.find(m => m.id === msgId)
        if (!msg) return

        const currentReactions = msg.reactions || {}
        const users = currentReactions[emoji] || []

        let newUsers
        if (users.includes(currentUserId)) {
            newUsers = users.filter(u => u !== currentUserId)
        } else {
            newUsers = [...users, currentUserId]
        }

        const newReactions = { ...currentReactions, [emoji]: newUsers }
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: newReactions } : m))

        const { error } = await supabase
            .from('messages')
            .update({ reactions: newReactions })
            .eq('id', msgId)

        if (error) {
            toast.error("Failed to update reaction")
        }
    }

    // Delete selected messages
    const handleDeleteMessages = async () => {
        if (selectedMessages.size === 0) return

        const idsToDelete = Array.from(selectedMessages).filter(id => {
            const msg = messages.find(m => m.id === id)
            if (!msg) return false

            // Allow if own message OR if user is owner/lead
            const isOwn = msg.user_id === currentUserId
            const isAdmin = userRole === 'owner' || userRole === 'lead' || userRole === 'manager'

            return isOwn || isAdmin
        })

        if (idsToDelete.length === 0) {
            toast.error("You don't have permission to delete these messages")
            return
        }

        // Use Server Action to bypass RLS for Admins/Managers
        try {
            const { deleteMessagesAction } = await import('@/app/actions/chat')
            const result = await deleteMessagesAction(idsToDelete, projectId)

            if (result.error) {
                toast.error(result.error)
                console.error(result.error)
            } else {
                toast.success(`${idsToDelete.length} message(s) deleted`)
                // Optimistic update handled by realtime usually, but good to have fallback
                setMessages(prev => prev.filter(m => !idsToDelete.includes(m.id)))
                setSelectedMessages(new Set())
                setSelectionMode(false)
            }
        } catch (error) {
            toast.error("Failed to delete messages")
            console.error(error)
        }
    }

    // Toggle message selection
    const toggleMessageSelection = (msgId: string, isOwn: boolean) => {
        if (!selectionMode) return

        const isAdmin = userRole === 'owner' || userRole === 'lead' || userRole === 'manager'
        if (!isOwn && !isAdmin) {
            toast.error("You can only select your own messages")
            return
        }

        setSelectedMessages(prev => {
            const newSet = new Set(prev)
            if (newSet.has(msgId)) {
                newSet.delete(msgId)
            } else {
                newSet.add(msgId)
            }
            return newSet
        })
    }

    // Filter messages by search query
    const filteredMessages = searchQuery
        ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
        : messages

    // Group messages by date for separators
    const renderMessagesWithDateSeparators = () => {
        let lastDate: string | null = null

        return filteredMessages.map((msg, index) => {
            const isMe = msg.user_id === currentUserId
            const msgDate = getDateLabel(msg.created_at)
            const showDateSeparator = msgDate !== lastDate
            lastDate = msgDate

            const repliedMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null
            const replyContext = repliedMsg ? {
                id: repliedMsg.id,
                content: repliedMsg.content,
                username: repliedMsg.profiles.full_name
            } : null

            const isSelected = selectedMessages.has(msg.id)

            return (
                <div key={msg.id}>
                    {/* Date Separator */}
                    {showDateSeparator && (
                        <div className="flex justify-center my-4">
                            <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full shadow-sm">
                                {msgDate}
                            </span>
                        </div>
                    )}

                    {/* Message */}
                    <div
                        className={`relative ${selectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-indigo-50 rounded-lg -mx-2 px-2' : ''}`}
                        onClick={() => selectionMode && toggleMessageSelection(msg.id, isMe)}
                    >
                        {selectionMode && isMe && (
                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-5 h-5 rounded-full border-2 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'} flex items-center justify-center`}>
                                {isSelected && <span className="text-white text-xs">✓</span>}
                            </div>
                        )}
                        <MessageBubble
                            id={msg.id}
                            content={msg.content}
                            createdAt={msg.created_at}
                            userId={msg.user_id}
                            isMe={isMe}
                            profile={msg.profiles}
                            replyTo={replyContext}
                            reactions={msg.reactions || {}}
                            attachments={msg.attachments || []}
                            onReply={(id, content, username) => setReplyingTo({ id, content, username })}
                            onReact={handleReaction}
                        />
                    </div>
                </div>
            )
        })
    }

    return (
        <div className={`flex flex-col h-full bg-transparent overflow-hidden ${className}`}>

            {/* Header with Search and Options */}
            {!hideHeader && (
                <div className="px-4 py-3 border-b border-slate-200 bg-white/50 backdrop-blur-sm flex justify-between items-center">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Team Chat
                        <span className="ml-2 text-slate-300 font-normal">#{projectId.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700"
                            onClick={() => setSearchOpen(!searchOpen)}
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setSelectionMode(!selectionMode)}>
                                    {selectionMode ? 'Cancel Selection' : 'Select Messages'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>
                                    Scroll to Top
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}>
                                    Scroll to Bottom
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            )}

            {/* Search Bar (Collapsible) */}
            {searchOpen && (
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search in chat..."
                        className="flex-1 h-8 text-sm border-0 bg-transparent focus-visible:ring-0"
                        autoFocus
                    />
                    {searchQuery && (
                        <span className="text-xs text-slate-400">
                            {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
                        </span>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSearchOpen(false); setSearchQuery('') }}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Selection Mode Toolbar */}
            {selectionMode && (
                <div className="px-3 py-1.5 border-b border-indigo-100 bg-indigo-50 flex items-center justify-between">
                    <span className="text-xs font-medium text-indigo-700">
                        {selectedMessages.size} selected
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                            onClick={() => {
                                // Select all own messages
                                const ownMsgIds = messages.filter(m => m.user_id === currentUserId).map(m => m.id)
                                setSelectedMessages(new Set(ownMsgIds))
                            }}
                        >
                            Select All
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleDeleteMessages}
                            disabled={selectedMessages.size === 0}
                        >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setSelectionMode(false); setSelectedMessages(new Set()) }}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 pl-8" ref={scrollRef}>
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-2">
                            <span className="text-xl">👋</span>
                        </div>
                        <p>No messages yet.</p>
                        <p className="text-xs">Start the conversation!</p>
                    </div>
                ) : (
                    renderMessagesWithDateSeparators()
                )}
            </div>

            <ChatInput
                onSendMessage={handleSendMessage}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                disabled={loading}
            />
        </div>
    )
})
