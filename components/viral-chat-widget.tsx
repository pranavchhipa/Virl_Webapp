'use client'

import { useState, useRef, useEffect } from "react"
import { useChat } from "ai/react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Sparkles, Send, User, RotateCcw, Wand2, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { createProjectFromIdea } from "@/app/actions/projects"
import { IdeaCard, ViralIdea } from "./ai/idea-card"
import { ThinkingBubble } from "./ui/thinking-bubble"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const VIXI_VIBES = ["🌶️ Spicy", "💼 Professional", "🤪 Gen-Z", "🧙‍♂️ Sage", "🤖 Robo-Chic"]
const VIXI_ROLES = ["🧠 Strategist", "✍️ Copywriter", "🎬 Script Doctor", "#️⃣ Trend Hunter"]
const VISUAL_FORMATS = ["Talking Head", "Cinematic B-Roll", "Text/Meme Overlay", "Green Screen Reaction", "Vlog Style"]
const TARGET_AUDIENCES = ["Gen Z", "Professionals", "Parents", "Gamers", "Entrepreneurs", "General Public"]
const CONTENT_PILLARS = ["Education", "Entertainment", "Inspiration", "Promotion", "Behind the Scenes"]

const QUICK_ACTIONS = [
    { label: "✨ Improve Hook", prompt: "Reword the hook to be more attention-grabbing and controversial." },
    { label: "📉 Make Shorter", prompt: "Condense this video concept to under 30 seconds." },
    { label: "🔥 Trend Jack", prompt: "Adapt this idea to a current viral trend." },
]

export function ViralChatWidget() {
    const router = useRouter()
    const [isConfigured, setIsConfigured] = useState(false)
    const [config, setConfig] = useState({
        vibe: "",
        role: "",
        audience: "",
        pillar: "",
        format: "",
        contextSource: ""
    })

    // Project Creation State
    const [projectModalOpen, setProjectModalOpen] = useState(false)
    const [pendingIdea, setPendingIdea] = useState<ViralIdea | null>(null)
    const [assigneeId, setAssigneeId] = useState<string>('me')
    const [isCreatingProject, setIsCreatingProject] = useState(false)

    // Chat Hook
    const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading, append } = useChat({
        api: '/api/chat',
        body: { data: config },
        maxSteps: 5,
        onError: (err) => {
            console.error("Chat Hook Error:", err);
            toast.error(`Connection failed: ${err.message}`);
        }
    });

    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isLoading])

    const startSession = () => {
        if (!config.vibe || !config.role) {
            toast.error("Please select both a Vibe and a Role.")
            return
        }
        setIsConfigured(true)
    }

    const resetSession = () => {
        setIsConfigured(false)
        setConfig({
            vibe: "",
            role: "",
            audience: "",
            pillar: "",
            format: "",
            contextSource: ""
        })
    }

    const handleRefine = (instruction: string) => {
        append({ role: 'user', content: instruction })
    }

    const onFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return
        originalHandleSubmit(e)
    }

    const openCreateProject = (idea: ViralIdea) => {
        setPendingIdea(idea)
        setProjectModalOpen(true)
    }

    const handleConfirmProject = async () => {
        if (!pendingIdea) return
        setIsCreatingProject(true)
        const res = await createProjectFromIdea({
            title: pendingIdea.caption.split('.')[0].slice(0, 50) || "New Viral Idea",
            description: pendingIdea.caption,
            script_outline: pendingIdea.script_outline,
            assigneeId: assigneeId
        })
        setIsCreatingProject(false)
        if (res.error) toast.error(res.message);
        else {
            toast.success("Project created & assigned!");
            setProjectModalOpen(false);
            if (res.projectId) {
                router.push(`/projects/${res.projectId}`)
            }
        }
    }

    // Animation Variants
    const messageVariants: Variants = {
        hidden: (role: string) => ({
            opacity: 0,
            x: role === 'user' ? 20 : -20,
            y: 10
        }),
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 25 }
        }
    }

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-slate-950 rounded-xl overflow-hidden shadow-sm border relative">

            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-30">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight">Vixi Assistant</h2>
                        {isConfigured && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{config.vibe}</span>
                                <span className="text-slate-300">•</span>
                                <span>{config.role}</span>
                            </div>
                        )}
                    </div>
                </div>
                {isConfigured && (
                    <Button variant="ghost" size="sm" onClick={resetSession} className="text-muted-foreground hover:text-foreground">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                )}
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay z-0" />

                <AnimatePresence mode="wait">
                    {!isConfigured ? (
                        /* STATE 1: SETUP OVERLAY */
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 overflow-y-auto"
                        >
                            <div className="max-w-2xl w-full space-y-8 text-center">
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold tracking-tight">Hi! I'm Vixi.</h1>
                                    <p className="text-lg text-muted-foreground">Let's set the mood and my role before we start brainstorming.</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8 text-left">
                                    <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border">
                                        <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Choose Vibe</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {VIXI_VIBES.map(v => (
                                                <button
                                                    key={v}
                                                    onClick={() => setConfig({ ...config, vibe: v })}
                                                    className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${config.vibe === v
                                                        ? 'bg-purple-100 border-purple-500 text-purple-700 shadow-sm scale-105'
                                                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                                                        }`}
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border">
                                        <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Choose Role</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {VIXI_ROLES.map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => setConfig({ ...config, role: r })}
                                                    className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${config.role === r
                                                        ? 'bg-indigo-100 border-indigo-500 text-indigo-700 shadow-sm scale-105'
                                                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                                                        }`}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Expanded Configuration Fields */}
                                    <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border">
                                        <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Target Details</Label>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Target Audience</Label>
                                                <Select value={config.audience} onValueChange={(v) => setConfig({ ...config, audience: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Select Audience" /></SelectTrigger>
                                                    <SelectContent>
                                                        {TARGET_AUDIENCES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Content Pillar</Label>
                                                <Select value={config.pillar} onValueChange={(v) => setConfig({ ...config, pillar: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Select Theme" /></SelectTrigger>
                                                    <SelectContent>
                                                        {CONTENT_PILLARS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border">
                                        <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Creative Context</Label>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Visual Format</Label>
                                                <Select value={config.format} onValueChange={(v) => setConfig({ ...config, format: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Select Format" /></SelectTrigger>
                                                    <SelectContent>
                                                        {VISUAL_FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">Context Source (URL or Notes)</Label>
                                                <Input
                                                    value={config.contextSource}
                                                    onChange={(e) => setConfig({ ...config, contextSource: e.target.value })}
                                                    placeholder="Paste URL..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    size="lg"
                                    onClick={startSession}
                                    className="w-full max-w-sm mx-auto h-12 text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02] shadow-xl shadow-purple-500/20 transition-all"
                                >
                                    Start Chatting <Wand2 className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        /* STATE 2: ACTIVE CHAT interface */
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 z-10 flex flex-col"
                        >
                            {/* Scrollable Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                        <Sparkles className="h-12 w-12 mb-4 text-purple-300" />
                                        <p>Vixi is ready! Ask me anything.</p>
                                    </div>
                                )}

                                {messages.map((m) => (
                                    <motion.div
                                        key={m.id}
                                        custom={m.role}
                                        variants={messageVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <Avatar className="h-9 w-9 shadow-sm shrink-0 mt-1">
                                            <AvatarFallback className={m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-purple-600 border border-purple-100'}>
                                                {m.role === 'user' ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className={`flex flex-col gap-2 max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            {m.content && (
                                                <div className={`p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed relative ${m.role === 'user'
                                                    ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-none'
                                                    : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-tl-none text-slate-800 dark:text-slate-200'
                                                    }`}>
                                                    {m.content}
                                                </div>
                                            )}

                                            {/* Idea Cards Rendering */}
                                            {m.toolInvocations?.map((toolInvocation) => {
                                                if (toolInvocation.state === 'result' && toolInvocation.toolName === 'propose_idea') {
                                                    return (
                                                        <motion.div
                                                            key={toolInvocation.toolCallId}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="w-full"
                                                        >
                                                            <IdeaCard
                                                                idea={toolInvocation.result as ViralIdea}
                                                                onRefine={handleRefine}
                                                                onCreateProject={openCreateProject}
                                                            />
                                                        </motion.div>
                                                    )
                                                }
                                                return null
                                            })}
                                        </div>
                                    </motion.div>
                                ))}
                                {isLoading && <ThinkingBubble />}
                                <div ref={messagesEndRef} className="h-2" />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t z-20">
                                <div className="max-w-4xl mx-auto space-y-3">
                                    {/* Quick Actions */}
                                    {messages.length > 0 && (
                                        <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide">
                                            {QUICK_ACTIONS.map((action, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleRefine(action.prompt)}
                                                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 hover:scale-105 transition-all border border-purple-100 flex items-center gap-1.5 whitespace-nowrap"
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <form onSubmit={onFormSubmit} className="flex gap-2 relative">
                                        <Input
                                            value={input}
                                            onChange={handleInputChange}
                                            placeholder="Type your idea..."
                                            className="flex-1 pr-12 h-12 rounded-xl bg-slate-50 hover:bg-white focus:bg-white transition-colors border-slate-200 text-base shadow-sm"
                                            disabled={isLoading}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={isLoading || !input.trim()}
                                            className="absolute right-1 top-1 h-10 w-10 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:scale-105 transition-all p-0"
                                        >
                                            <Send className="h-4 w-4 text-white" />
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Project Creation Modal */}
            <Dialog open={projectModalOpen} onOpenChange={setProjectModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Launch Viral Project</DialogTitle>
                        <DialogDescription>
                            Create a new project workspace for <span className="font-semibold text-purple-600">"{pendingIdea?.caption.split('.')[0].slice(0, 30)}..."</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="grid gap-2">
                            <Label>Assign Strategy & Scripting To</Label>
                            <Select value={assigneeId} onValueChange={setAssigneeId}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="me">Myself (Owner)</SelectItem>
                                    <SelectItem value="editor1">Editor Team</SelectItem>
                                    <SelectItem value="creator1">Creative Lead</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setProjectModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmProject} disabled={isCreatingProject} className="bg-purple-600 text-white hover:bg-purple-700">
                            {isCreatingProject ? <span className="flex items-center gap-2"><div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Launching...</span> : "Confirm & Launch"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
