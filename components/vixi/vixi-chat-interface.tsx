'use client'

import { useState, useRef, useEffect, useCallback } from "react"
import { useChat } from "ai/react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Sparkles, RotateCcw, AlertCircle, Bot } from "lucide-react"
import { toast } from "sonner"
import { useParams } from "next/navigation"

import { ChatMessage, MessageContent, ChatMessageProps } from "./chat-message"
import { ChatInput } from "./chat-input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getVixiUsage, canUseVixiSpark, incrementVixiSpark } from "@/app/actions/vixi-usage"
import { VixiSparksIcon } from "@/components/icons/vixi-sparks-icon"

// --- TYPES ---
type FlowStep = 'welcome' | 'platform' | 'content_type' | 'audience' | 'vibe' | 'brainstorming'

interface VixiConfig {
    platform: string
    contentType: string
    audience: string
    vibe: string
}

// --- CONSTANTS ---
const STEPS = {
    PLATFORM: {
        question: "Pick a platform to start",
        options: [
            { id: 'instagram', label: 'Instagram', value: 'Instagram' },
            { id: 'facebook', label: 'Facebook', value: 'Facebook' },
            { id: 'youtube', label: 'YouTube', value: 'YouTube' },
            { id: 'x', label: 'X (Twitter)', value: 'X (Twitter)' },
            { id: 'linkedin', label: 'LinkedIn', value: 'LinkedIn' },
            { id: 'email', label: 'Email', value: 'Email' }
        ]
    },
    CONTENT_TYPES: {
        'instagram': [
            { id: 'insta-reel', label: '🎬 Reel', value: 'Instagram Reel' },
            { id: 'insta-post', label: '🖼️ Post', value: 'Instagram Post' },
            { id: 'insta-story', label: '📖 Story', value: 'Instagram Story' },
            { id: 'insta-carousel', label: '🎠 Carousel', value: 'Instagram Carousel' }
        ],
        'facebook': [
            { id: 'fb-post', label: '📝 Post', value: 'Facebook Post' },
            { id: 'fb-reel', label: '🎬 Reel', value: 'Facebook Reel' },
            { id: 'fb-story', label: '📖 Story', value: 'Facebook Story' }
        ],
        'youtube': [
            { id: 'yt-shorts', label: '⚡ Shorts', value: 'YouTube Shorts' },
            { id: 'yt-script', label: '📜 Long Form Script', value: 'YouTube Video' },
            { id: 'yt-community', label: '💬 Community Post', value: 'YouTube Community Post' }
        ],
        'x': [
            { id: 'x-tweet', label: '🐦 Tweet', value: 'X Tweet' },
            { id: 'x-thread', label: '🧵 Thread', value: 'X Thread' }
        ],
        'linkedin': [
            { id: 'li-post', label: '📝 Post', value: 'LinkedIn Post' },
            { id: 'li-article', label: '📰 Article', value: 'LinkedIn Article' }
        ],
        'email': [
            { id: 'email-newsletter', label: '📰 Newsletter', value: 'Newsletter' },
            { id: 'email-promo', label: '🚀 Promo Blast', value: 'Promotional Email' }
        ]
    },
    AUDIENCE: {
        question: "Who is this for?",
        options: [
            { id: 'genz', label: '👾 Gen Z', value: 'Gen Z' },
            { id: 'founders', label: '🚀 Founders', value: 'Founders' },
            { id: 'creatives', label: '🎨 Creatives', value: 'Creatives' },
            { id: 'professionals', label: '👔 Professionals', value: 'Professionals' },
            { id: 'parents', label: '👶 Parents', value: 'Parents' },
            { id: 'students', label: '🎓 Students', value: 'Students' },
            { id: 'mainstream', label: '🌍 Everyone', value: 'General Audience' },
            { id: 'other', label: '✏️ Other', value: 'Other' }
        ]
    },
    VIBE: {
        question: "What's the vibe?",
        options: [
            { id: 'spicy', label: '🌶️ Spicy & Bold', value: 'Spicy & Bold' },
            { id: 'pro', label: '👔 Professional', value: 'Professional' },
            { id: 'chill', label: '🧘 Chill & Educational', value: 'Chill & Educational' },
            { id: 'meme', label: '🤪 Meme/Funny', value: 'Meme/Funny' },
            { id: 'inspo', label: '✨ Inspirational', value: 'Inspirational' },
            { id: 'hightech', label: '🤖 High-Tech', value: 'High-Tech & Modern' },
            { id: 'story', label: '📖 Storytelling', value: 'Storytelling' },
            { id: 'other', label: '✏️ Other', value: 'Other' }
        ]
    }
}

// --- HELPER to handle "Bad control character" errors ---
const cleanAndParseJSON = (str: string) => {
    // First, check if it looks like JSON at all (starts with { or [)
    const trimmed = str.trim()
    const looksLikeJSON = trimmed.startsWith('{') || trimmed.startsWith('[')

    if (!looksLikeJSON) {
        // AI returned plain text - wrap it as a text message
        console.log("[Vixi] Response is not JSON, treating as text message")
        return {
            type: 'text',
            message: str
        }
    }

    try {
        // Try direct parse first (Claude should output valid JSON)
        return JSON.parse(str)
    } catch (firstError) {
        console.log("[Vixi] Direct JSON parse failed, trying cleanup...", firstError)
        console.log("[Vixi] Raw content:", str)

        try {
            // 1. Strip Markdown Code Blocks
            let clean = str.replace(/```json/g, '').replace(/```/g, '').trim()

            // 2. Try to extract JSON from mixed content (text before/after JSON)
            const jsonMatch = clean.match(/(\{[\s\S]*\})/);
            if (jsonMatch) {
                clean = jsonMatch[1];
            }

            // 3. Only escape newlines if they're NOT already escaped
            clean = clean.replace(/([^\\])\n/g, "$1\\n").replace(/([^\\])\r/g, "$1\\r")

            console.log("[Vixi] Cleaned content:", clean)
            return JSON.parse(clean)
        } catch (secondError) {
            console.error("[Vixi] Cleanup parse also failed, treating as text:", secondError)
            // Instead of throwing, return as text message
            return {
                type: 'text',
                message: str
            }
        }
    }
}

// --- COMPONENTS ---
const ThinkingIndicator = () => (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-100/80 to-indigo-100/80 backdrop-blur-sm rounded-2xl w-fit shadow-lg border border-purple-200/50 ml-2">
        <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-sm animate-pulse" />
            <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-full">
                <Sparkles className="h-4 w-4 text-white animate-pulse" />
            </div>
        </div>
        <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">Vixi is crafting magic...</span>
            <div className="flex gap-1">
                <div className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="h-1.5 w-1.5 bg-pink-500 rounded-full animate-bounce" />
            </div>
        </div>
    </div>
)

export function VixiChatInterface() {
    const params = useParams()
    const projectId = params?.id as string
    const supabase = createClient()

    // --- STATE ---
    const [messages, setMessages] = useState<ChatMessageProps[]>([])
    const [step, setStep] = useState<FlowStep>('welcome')
    const [config, setConfig] = useState<VixiConfig>({ platform: '', contentType: '', audience: '', vibe: '' })
    const [isHistoryLoaded, setIsHistoryLoaded] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)

    // Vixi Sparks usage state
    const [sparkUsage, setSparkUsage] = useState<{ count: number; limit: number }>({ count: 0, limit: 30 })

    // Refs for strict mode protection & dedup
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const historyLoadedRef = useRef(false)
    const welcomeTriggeredRef = useRef(false)

    // --- AI HOOK ---
    const { messages: aiMessages, input, handleInputChange, append, isLoading, setMessages: setAiMessages } = useChat({
        api: '/api/chat',
        body: { data: config },
        onFinish: async (message) => {
            if (!userId || !projectId) return

            let type = 'text'
            let metadata: any = {}
            let contentCard = undefined
            let actions = undefined
            let textContent = ""

            console.log("[Vixi] Received message from AI:", message.content)

            try {
                // Use the robust cleaning helper
                const parsed = cleanAndParseJSON(message.content)
                console.log("[Vixi] Successfully parsed JSON:", parsed)

                if (parsed.type === 'question') {
                    type = 'question'
                    metadata = { question: parsed }
                    textContent = parsed.message
                    if (parsed.options && Array.isArray(parsed.options)) {
                        // Use neutral IDs (opt-X) to prevents logo auto-detection in ChatMessage
                        actions = parsed.options.map((opt: string, i: number) => ({
                            id: `opt-${i}`,
                            label: opt,
                            value: opt
                        }))
                        console.log("[Vixi] Created actions from options:", actions)
                    }
                } else if (parsed.type === 'preview') {
                    type = 'card'
                    const data = parsed.data || parsed
                    metadata = { card: data }
                    contentCard = {
                        title: data.title || "Viral Concept",
                        type: data.platform || "Content",
                        content: data.script || data.caption,
                        hook_visual: data.visual_cues || data.visual_cue,
                        hashtags: data.hashtags,
                        timeline: data.timeline,
                        best_time_to_post: data.best_time_to_post
                    }
                    textContent = "Here is the viral concept I generated for you:"

                    // ⚡ REFRESH SPARK USAGE on successful preview generation (Client-side sync)
                    if (workspaceId) {
                        // We fetch the usage instead of incrementing, because the server (route.ts) now increments it.
                        const usage = await getVixiUsage(workspaceId)
                        setSparkUsage({ count: usage.sparkCount, limit: usage.limit })
                    }
                } else if (parsed.type === 'text') {
                    // Explicitly handle text type
                    textContent = parsed.message || ""
                } else {
                    // Fallback for valid JSON but unknown type
                    textContent = parsed.message || JSON.stringify(parsed)
                }

            } catch (e) {
                console.error("Vixi JSON Parse Error:", e)

                // Fallback: Try to regex extract the message if it looks like a text response
                // Matches "message": "..." allowing for escaped quotes
                const messageMatch = message.content.match(/"message":\s*"((?:[^"\\]|\\.)*)"/)
                if (messageMatch && messageMatch[1]) {
                    // Unescape the string manually since JSON.parse failed
                    textContent = messageMatch[1]
                        .replace(/\\"/g, '"')
                        .replace(/\\n/g, '\n')
                        .replace(/\\\\/g, '\\')
                } else if (message.content.trim().startsWith('{')) {
                    // Truly broken JSON that we can't extract from
                    // But maybe it's valid JSON that just failed our 'message' extraction?
                    try {
                        // Last ditch attempt: if it parses, just dump it as string? 
                        // No, better to show a generic error than raw code.
                        toast.error("Vixi had a glitch. Please try again.")
                        textContent = "I encountered an error generating the response."
                    } catch {
                        textContent = message.content
                    }
                } else {
                    // Plain text response (fallback)
                    textContent = message.content
                }
            }

            // Generate ID for AI message
            const aiMsgId = crypto.randomUUID()

            // 2. Save Assistant Message to DB
            await saveMessageToDb(aiMsgId, 'assistant', message.content, type, metadata)

            // 3. Update Local State (Deduplication Check)
            setMessages(prev => {
                // If somehow realtime caught it first, don't add
                if (prev.some(m => m.id === aiMsgId)) return prev

                const newMessage: ChatMessageProps = {
                    id: aiMsgId,
                    role: 'assistant',
                    content: {
                        text: textContent || "Here is a concept:",
                        contentCard,
                        actions
                    }
                }
                return [...prev, newMessage]
            })
        },
        onError: (err) => {
            toast.error("Vixi had a brain fart. Try again.")
            console.error(err)
        }
    })

    // --- LOGIC HOISTED ---

    // --- HELPERS (Memoized to prevent useEffect loops) ---

    // Hoist saveMessageToDb for stability
    const saveMessageToDb = useCallback(async (id: string, role: string, content: string, type: string = 'text', metadata: any = {}) => {
        if (!projectId || !userId) return

        const payload = {
            id,
            project_id: projectId,
            user_id: userId,
            role,
            content: content || "",
            type,
            metadata: metadata || {}
        }

        const { error } = await supabase.from('vixi_messages').insert(payload)
        if (error) console.error("[Persistence] Error:", error)
    }, [projectId, userId, supabase])

    const addMessage = useCallback((role: 'user' | 'assistant', content: MessageContent, type: string = 'text', metadata: any = {}) => {
        const id = crypto.randomUUID()
        const match: ChatMessageProps = { id, role, content }

        // Optimistic Update
        setMessages(prev => [...prev, match])

        if (userId) {
            saveMessageToDb(id, role, content.text, type, metadata)
        }
    }, [userId, saveMessageToDb])

    const startWelcomeFlow = useCallback(async () => {
        if (welcomeTriggeredRef.current) return
        welcomeTriggeredRef.current = true

        await new Promise(r => setTimeout(r, 500))
        setStep('welcome')
        addMessage('assistant', { text: "Hi! Ready to create something viral? Let's get the context right." })

        await new Promise(r => setTimeout(r, 800))
        setStep('platform')
        addMessage('assistant', {
            text: STEPS.PLATFORM.question,
            actions: STEPS.PLATFORM.options
        }, 'question', { question: STEPS.PLATFORM })
    }, [addMessage])

    const handleActionClick = async (actionId: string, value: string) => {
        // 1. Visually add the user's selection to the chat immediately
        addMessage('user', { text: value })

        // --- HANDLE "OTHER" SELECTION ---
        if (actionId === 'other') {
            // Do NOT advance step. Just ask for input.
            // handleUserSend will pick it up because 'step' is still 'audience' or 'vibe'
            await new Promise(r => setTimeout(r, 600))

            if (step === 'audience') {
                addMessage('assistant', { text: "Got it. Who is this for specifically?" })
            } else if (step === 'vibe') {
                addMessage('assistant', { text: "Got it. Describe the vibe you're going for." })
            }
            return
        }

        // --- HANDLE "MORE TOPICS" ---
        if (value.toLowerCase().includes('more topics')) {
            await append({
                role: 'user',
                content: "Generate 5 NEW and different viral topics for the same context. Be creative."
            })
            return
        }

        // 2. State Machine Transition
        if (step === 'platform') {
            setConfig(prev => ({ ...prev, platform: value }))
            // Simulate AI "Thinking" delay
            await new Promise(r => setTimeout(r, 600))

            setStep('content_type')
            // Determine content types based on selection
            let options: any[] = []
            if (value.toLowerCase().includes('instagram')) options = STEPS.CONTENT_TYPES.instagram
            else if (value.toLowerCase().includes('facebook')) options = STEPS.CONTENT_TYPES.facebook
            else if (value.toLowerCase().includes('youtube')) options = STEPS.CONTENT_TYPES.youtube
            else if (value.toLowerCase().includes('twitter') || value.toLowerCase().includes('x')) options = STEPS.CONTENT_TYPES.x
            else if (value.toLowerCase().includes('linkedin')) options = STEPS.CONTENT_TYPES.linkedin
            else if (value.toLowerCase().includes('email')) options = STEPS.CONTENT_TYPES.email
            else options = STEPS.CONTENT_TYPES.instagram // Fallback

            addMessage('assistant', {
                text: `What kind of ${value} content?`,
                actions: options
            }, 'question', { question: { message: `What kind of ${value} content?`, options } })

        } else if (step === 'content_type') {
            setConfig(prev => ({ ...prev, contentType: value }))
            await new Promise(r => setTimeout(r, 600))
            setStep('audience')
            addMessage('assistant', {
                text: STEPS.AUDIENCE.question,
                actions: STEPS.AUDIENCE.options
            }, 'question', { question: STEPS.AUDIENCE })

        } else if (step === 'audience') {
            setConfig(prev => ({ ...prev, audience: value }))
            await new Promise(r => setTimeout(r, 600))
            setStep('vibe')
            addMessage('assistant', {
                text: STEPS.VIBE.question,
                actions: STEPS.VIBE.options
            }, 'question', { question: STEPS.VIBE })

        } else if (step === 'vibe') {
            setConfig(prev => ({ ...prev, vibe: value }))
            await new Promise(r => setTimeout(r, 600))
            setStep('brainstorming')
            addMessage('assistant', { text: "Perfect! I have everything I need. What's the topic or core idea?" })

        } else {
            // AI Driven Logic - 2. Trigger the actual API call
            await append({ role: 'user', content: value })
        }
    }

    // 1. Get User & Load History
    const fetchHistory = useCallback(async () => {
        if (!projectId) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

        // Get workspace ID from project
        const { data: project } = await supabase
            .from('projects')
            .select('workspace_id')
            .eq('id', projectId)
            .single()

        if (project?.workspace_id) {
            setWorkspaceId(project.workspace_id)

            // Fetch Vixi Sparks usage
            const usage = await getVixiUsage(project.workspace_id)
            setSparkUsage({ count: usage.sparkCount, limit: usage.limit })
        }

        const { data, error } = await supabase
            .from('vixi_messages')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true })

        if (data) {
            // DEDUPLICATE: Filter out duplicates by ID
            const unique = Array.from(new Map(data.map(m => [m.id, m])).values())

            const formatted: ChatMessageProps[] = unique.map((m: any) => {
                let contentCard = undefined
                let actions = undefined

                // Parse metadata
                if (m.type === 'card' && m.metadata?.card) {
                    const c = m.metadata.card
                    contentCard = {
                        title: c.title || "Viral Concept",
                        type: c.platform || "Content",
                        content: c.script || c.caption,
                        hook_visual: c.visual_cue,
                        hashtags: c.hashtags,
                        timeline: c.timeline
                    }
                } else if (m.type === 'question' && m.metadata?.question) {
                    const q = m.metadata.question
                    if (q.options && Array.isArray(q.options)) {
                        // Convert string options to action objects
                        actions = q.options.map((opt: any) =>
                            typeof opt === 'string'
                                ? { id: opt, label: opt, value: opt }
                                : opt
                        )
                    }
                }

                // Determine the display text based on message type
                let displayText = m.content
                if (m.type === 'question' && m.metadata?.question?.message) {
                    displayText = m.metadata.question.message
                } else if (m.type === 'card') {
                    displayText = "Here is the viral concept I generated for you:"
                }

                return {
                    id: m.id,
                    role: m.role as 'user' | 'assistant',
                    content: {
                        text: displayText,
                        contentCard,
                        actions
                    }
                }
            })
            setMessages(formatted)

            // 🔄 SYNC AI SDK STATE: Essential for context memory!
            setAiMessages(unique.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content
            })) as any)

            historyLoadedRef.current = true
            setIsHistoryLoaded(true)

            // If no history, verify if we should trigger welcome
            // We verify 'formatted.length' to ensure we don't double trigger if DB is truly empty
            if (formatted.length === 0) {
                // Only trigger if we haven't already
                if (!welcomeTriggeredRef.current) {
                    startWelcomeFlow()
                }
            } else {
                // If we found history, ensure we don't auto-trigger welcome later
                welcomeTriggeredRef.current = true
            }
        }
    }, [projectId, supabase, startWelcomeFlow])

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    // 2. Realtime Listener
    useEffect(() => {
        if (!projectId) return

        const channel = supabase
            .channel(`vixi_project:${projectId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vixi_messages', filter: `project_id=eq.${projectId}` },
                (payload) => {
                    const newMsg = payload.new
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev

                        let contentCard = undefined
                        let actions = undefined

                        if (newMsg.type === 'card' && newMsg.metadata?.card) {
                            const c = newMsg.metadata.card
                            contentCard = {
                                title: c.title,
                                type: c.platform,
                                content: c.script || c.caption,
                                hook_visual: c.visual_cue,
                                hashtags: c.hashtags,
                                timeline: c.timeline
                            }
                        } else if (newMsg.type === 'question' && newMsg.metadata?.question) {
                            const q = newMsg.metadata.question
                            actions = q.options?.map((o: string) => ({ id: o, label: o, value: o }))
                        }

                        // IMPORTANT: Only add if it's not already in list (Dedup)
                        return [...prev, {
                            id: newMsg.id,
                            role: newMsg.role,
                            content: {
                                text: newMsg.content,
                                contentCard,
                                actions
                            }
                        }]
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [projectId, supabase])

    // 3. Auto Scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, step])


    const handleUserSend = async (text: string, attachments?: File[]) => {
        if (!text.trim() && (!attachments || attachments.length === 0)) return

        addMessage('user', { text })

        // --- SMART PARSING LOGIC ---
        const lower = text.toLowerCase()
        let detectedPlatform = ''
        let detectedType = ''

        // 1. Detect Intent
        if (lower.includes('reel') || lower.includes('instagram')) {
            detectedPlatform = 'Instagram'
            if (lower.includes('reel')) detectedType = 'Instagram Reel'
        } else if (lower.includes('short') || lower.includes('youtube') || lower.includes('yt')) {
            detectedPlatform = 'YouTube'
            if (lower.includes('short')) detectedType = 'YouTube Shorts'
        } else if (lower.includes('tiktok')) {
            // Map TikTok to generic video or handle if added later. For now map to Insta Reel style or just generic
            detectedPlatform = 'Instagram' // Proxy for vertical video for now or add TikTok explicit support
            detectedType = 'Instagram Reel' // Fallback
        } else if (lower.includes('tweet') || lower.includes('twitter') || lower.includes(' x ')) {
            detectedPlatform = 'X (Twitter)'
            detectedType = 'X Tweet'
        } else if (lower.includes('linkedin')) {
            detectedPlatform = 'LinkedIn'
        } else if (lower.includes('facebook') || lower.includes(' fb ')) {
            detectedPlatform = 'Facebook'
        } else if (lower.includes('email')) {
            detectedPlatform = 'Email'
        }

        // 2. Propagate State based on current step OR detection
        // If we detected a specific intended platform/format, we can "jump" steps
        if (detectedPlatform && (step === 'welcome' || step === 'platform' || step === 'content_type')) {
            setConfig(prev => ({
                ...prev,
                platform: detectedPlatform,
                contentType: detectedType || prev.contentType // Only overwrite if detected
            }))

            // If we have both, jump to audience
            if (detectedType) {
                setStep('audience')
                // Trigger AI question for Audience
                setTimeout(() => {
                    addMessage('assistant', {
                        text: STEPS.AUDIENCE.question,
                        actions: STEPS.AUDIENCE.options
                    }, 'question', { question: STEPS.AUDIENCE })
                }, 600)
            } else {
                // We have platform but not type, go to type
                setStep('content_type')
                // We need to trigger the type question manually here or let AI do it? 
                // Since we are overriding the natural flow, we should manually trigger the next question UI
                let options: any[] = []
                const p = detectedPlatform.toLowerCase()

                if (p.includes('instagram')) options = STEPS.CONTENT_TYPES.instagram
                else if (p.includes('facebook')) options = STEPS.CONTENT_TYPES.facebook
                else if (p.includes('youtube')) options = STEPS.CONTENT_TYPES.youtube
                else if (p.includes('twitter') || p.includes('x')) options = STEPS.CONTENT_TYPES.x
                else if (p.includes('linkedin')) options = STEPS.CONTENT_TYPES.linkedin
                else if (p.includes('email')) options = STEPS.CONTENT_TYPES.email

                setTimeout(() => {
                    addMessage('assistant', {
                        text: `What kind of ${detectedPlatform} content?`,
                        actions: options
                    }, 'question', { question: { message: `What kind of ${detectedPlatform} content?`, options } })
                }, 600)
            }
            // RETURN HERE: Do not send to AI yet, we are just configuring state
            return
        }

        // 3. Normal Step Progression (Manual typing without keywords)
        if (step !== 'brainstorming') {
            if (step === 'platform') {
                // User typed something that didn't match our detector, but we must accept it?
                // Or maybe they typed "I want to make a video". 
                // Let's assume generic acceptance but move to next step sequentially.
                setConfig(prev => ({ ...prev, platform: text }))
                setStep('content_type') // Move to type, don't jump to brainstorming
                // Can't show specific options easily if we don't know platform, so maybe just ask generic?
                setTimeout(() => {
                    addMessage('assistant', { text: "Got it. What specific format? (e.g. Reel, Post, Article)" })
                }, 500)
                return
            }
            if (step === 'content_type') {
                setConfig(prev => ({ ...prev, contentType: text }))
                setStep('audience')
                setTimeout(() => {
                    addMessage('assistant', {
                        text: STEPS.AUDIENCE.question,
                        actions: STEPS.AUDIENCE.options
                    }, 'question', { question: STEPS.AUDIENCE })
                }, 500)
                return
            }
            if (step === 'audience') {
                setConfig(prev => ({ ...prev, audience: text }))
                setStep('vibe')
                setTimeout(() => {
                    addMessage('assistant', {
                        text: STEPS.VIBE.question,
                        actions: STEPS.VIBE.options
                    }, 'question', { question: STEPS.VIBE })
                }, 500)
                return
            }
            if (step === 'vibe') {
                setConfig(prev => ({ ...prev, vibe: text }))
                setStep('brainstorming')
                setTimeout(() => {
                    addMessage('assistant', { text: "Perfect! I have everything I need. What's the topic or core idea?" })
                }, 500)
                return
            }
        }

        // 4. Brainstorming Phase (Sending to AI)
        await append({ role: 'user', content: text })
    }

    const handleShare = async (content: string) => {
        if (!projectId || !userId) return
        // Insert into 'messages' table for Team Chat
        const { error } = await supabase.from('messages').insert({
            project_id: projectId,
            user_id: userId,
            content: `[Vixi Shared Result]\n\n${content}`,
            // Assuming 'messages' table might not have 'type' column based on previous context, 
            // but if it does, it would be good. For now sticking to standard schema known.
        })

        if (error) {
            console.error("Share failed", error)
            toast.error("Failed to share to team.")
        } else {
            toast.success("Shared to Team Chat!")
        }
    }

    const handleReset = async () => {
        if (!confirm("Start fresh? This will clear current context.")) return

        // 1. Clear Local State & Reset Refs
        setMessages([])
        setAiMessages([])
        setConfig({ platform: '', contentType: '', audience: '', vibe: '' })
        welcomeTriggeredRef.current = false
        setIsHistoryLoaded(false) // Force re-check logic

        // 2. Clear DB History
        if (projectId) {
            const { error } = await supabase
                .from('vixi_messages')
                .delete()
                .eq('project_id', projectId)

            if (error) {
                console.error("Failed to clear history:", error)
                toast.error("Failed to clear chat history")
                // Re-fetch to show truth
                fetchHistory()
            } else {
                toast.success("Chat history cleared")
                // 3. Restart Flow ONLY after successful delete
                historyLoadedRef.current = true // We know it's empty now
                setIsHistoryLoaded(true) // Hide spinner
                startWelcomeFlow()
            }
        } else {
            historyLoadedRef.current = true
            setIsHistoryLoaded(true)
            startWelcomeFlow()
        }
    }

    // --- RENDER ---

    const lastAiMessage = aiMessages[aiMessages.length - 1]
    const isStreaming = isLoading && lastAiMessage?.role === 'assistant'

    return (
        <div className="flex flex-col h-full w-full bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 relative overflow-hidden rounded-xl border border-purple-200/50 shadow-lg">
            {/* Decorative background effects */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-300/15 to-violet-300/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header - Fixed at top */}
            <header className="shrink-0 h-16 flex items-center justify-between px-6 border-b border-purple-100/50 bg-white/95 backdrop-blur-xl z-30">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-xl blur-sm opacity-40 animate-pulse" />
                        <div className="relative bg-gradient-to-tr from-purple-600 via-indigo-600 to-fuchsia-600 p-2.5 rounded-xl shadow-lg shadow-purple-500/30 ring-2 ring-white/50">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="font-bold text-base leading-tight bg-gradient-to-r from-purple-700 via-indigo-700 to-fuchsia-700 bg-clip-text text-transparent">Vixi 1.0</h2>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1.5">
                                <span className={cn("h-2 w-2 rounded-full ring-2 ring-white shadow-sm", isLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                                <span className="text-slate-500">{isLoading ? 'Crafting...' : 'Online'}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* 🔥 Spark Counter */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200/60 rounded-full shadow-sm">
                        <VixiSparksIcon size="md" />
                        <span className="text-sm font-bold text-orange-700">
                            {sparkUsage.limit === Infinity ? '∞' : `${sparkUsage.count}/${sparkUsage.limit}`}
                        </span>
                        <span className="text-xs font-medium text-orange-600 hidden sm:inline">Sparks</span>
                    </div>

                    <Button
                        size="sm"
                        onClick={handleReset}
                        className="h-9 px-4 text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25 transition-all"
                    >
                        <RotateCcw className="h-3.5 w-3.5 mr-2" />
                        Start Fresh
                    </Button>
                </div>
            </header>

            {/* Chat Area - Only this section scrolls */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative z-10">
                {!isHistoryLoaded && (
                    <div className="flex items-center justify-center h-full">
                        <Sparkles className="h-8 w-8 text-purple-300 animate-spin" />
                    </div>
                )}

                {messages.map((m, index) => {
                    // The last AI message with actions should always be interactive
                    const isLastMessage = index === messages.length - 1
                    const hasActions = m.role === 'assistant' && m.content.actions && m.content.actions.length > 0

                    return (
                        <ChatMessage
                            key={m.id}
                            {...m}
                            isLast={isLastMessage}
                            isActive={isLastMessage && hasActions}
                            onActionClick={handleActionClick}
                            onShareClick={handleShare}
                        />
                    )
                })}

                {/* Thinking Indicator (Replaces Raw Stream) */}
                {isStreaming && (
                    <ThinkingIndicator />
                )}

                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area */}
            <ChatInput onSend={handleUserSend} isLoading={isLoading} />
        </div>
    )
}