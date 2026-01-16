"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    FolderKanban,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Calendar,
    HelpCircle,
} from 'lucide-react'
import { WorkspaceSelector } from './workspace-selector'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { HelpPanel } from '@/components/help/help-panel'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export function ModernSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [helpPanelOpen, setHelpPanelOpen] = useState(false)
    const [userProfile, setUserProfile] = useState<{
        email: string
        displayName: string
        initial: string
        avatar_url?: string
    } | null>(null)

    useEffect(() => {
        const fetchUserProfile = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user?.email) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('avatar_url, full_name')
                    .eq('id', user.id)
                    .single()

                const displayName = profile?.full_name || user.email.split('@')[0]
                const initial = displayName.charAt(0).toUpperCase()

                setUserProfile({
                    email: user.email,
                    displayName,
                    initial,
                    avatar_url: profile?.avatar_url
                })
            }
        }

        fetchUserProfile()
    }, [])

    const handleSignOut = async () => {
        try {
            setLoading(true)
            const supabase = createClient()
            await supabase.auth.signOut()
            router.push('/login')
            router.refresh()
        } catch (error) {
            console.error('Sign out error:', error)
            toast.error('Failed to sign out')
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={false}
            animate={{ width: collapsed ? 80 : 280 }}
            className="relative h-screen bg-[#0B0F19] text-white flex flex-col border-r border-slate-800 shadow-2xl z-50 font-sans"
        >
            {/* Header with Logo */}
            <div className={cn("relative flex flex-col", collapsed ? "p-4 items-center" : "p-6")}>
                <div className="flex items-center gap-3 shrink-0">
                    {collapsed ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-transparent shrink-0">
                            <img
                                src="/images/virl-logo-icon.png"
                                alt="Virl"
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-start">
                            <img
                                src="/images/virl-logo-full.png"
                                alt="Virl"
                                className="h-20 w-auto object-contain"
                            />
                        </div>
                    )}
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "hover:text-white transition-colors p-1 z-50",
                        collapsed
                            ? "mt-4 text-slate-500 hover:bg-white/10 rounded-lg"
                            : "absolute top-6 right-4 text-slate-600"
                    )}
                >
                    {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>

                {/* Workspace Selector */}
                <div className={cn("mb-2 shrink-0", collapsed ? "mt-4" : "mt-6")}>
                    <WorkspaceSelector collapsed={collapsed} />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={collapsed ? item.name : undefined}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden font-medium text-sm",
                                isActive
                                    ? "bg-[#7C3AED] text-white shadow-lg shadow-violet-900/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/5",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors flex-shrink-0",
                                isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                            )} />

                            <AnimatePresence mode="wait">
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="relative z-10 truncate"
                                    >
                                        {item.name}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    )
                })}
            </nav>

            {/* Help Button */}
            <div className="px-4 pb-2">
                <button
                    onClick={() => setHelpPanelOpen(true)}
                    className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden font-medium text-sm w-full",
                        "text-slate-400 hover:text-white hover:bg-white/5",
                        collapsed && "justify-center px-0"
                    )}
                    title={collapsed ? "Help" : undefined}
                >
                    <HelpCircle className="w-5 h-5 transition-colors flex-shrink-0 text-slate-400 group-hover:text-white" />
                    <AnimatePresence mode="wait">
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="relative z-10 truncate"
                            >
                                Help
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>

            {/* User Section */}
            <div className="p-4 mt-auto">
                <div className={cn(
                    "rounded-2xl transition-all relative overflow-hidden",
                    !collapsed && "bg-[#131722] border border-slate-800/50 p-3"
                )}>
                    <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}>
                        <Avatar className={cn(
                            "border border-slate-700",
                            collapsed ? "w-8 h-8" : "w-9 h-9"
                        )}>
                            <AvatarImage src={userProfile?.avatar_url} />
                            <AvatarFallback className="bg-slate-800 text-slate-200 text-xs">
                                {userProfile?.initial}
                            </AvatarFallback>
                        </Avatar>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate leading-tight">
                                    {userProfile?.displayName}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate font-medium">
                                    {userProfile?.email}
                                </p>
                            </div>
                        )}
                    </div>

                    {!collapsed && (
                        <button
                            onClick={handleSignOut}
                            disabled={loading}
                            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors mt-3 pl-1"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            {loading ? 'Signing out...' : 'Log out'}
                        </button>
                    )}
                </div>
            </div>

            {/* Help Panel */}
            <HelpPanel open={helpPanelOpen} onOpenChange={setHelpPanelOpen} />
        </motion.div>
    )
}
