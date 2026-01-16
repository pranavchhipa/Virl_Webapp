"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Home,
    FolderKanban,
    Settings,
    Plus,
    Command,
    LogOut,
    User,
    Calendar
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { CreateWorkspaceDialog } from "./create-workspace-dialog"
import { useRouter, useSearchParams } from "next/navigation"
import { workspaceEvents } from "@/lib/workspace-events"

export function Sidebar({ className, user }: { className?: string, user?: any }) {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const [workspaces, setWorkspaces] = useState<any[]>([])
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>("")

    useEffect(() => {
        const fetchWorkspaces = async () => {
            if (!user) return

            // Get memberships
            const { data: members } = await supabase
                .from('workspace_members')
                .select('workspace_id, workspaces(id, name)')
                .eq('user_id', user.id)

            // Get owned workspaces
            const { data: owned } = await supabase
                .from('workspaces')
                .select('id, name')
                .eq('owner_id', user.id)

            // Merge and deduplicate
            const wsList = members?.map((m: any) => m.workspaces).filter(Boolean) || []
            const allMapped = [...wsList, ...(owned || [])]
            const unique = Array.from(new Map(allMapped.map(item => [item.id, item])).values())

            setWorkspaces(unique)

            // Get workspace from URL or localStorage
            const urlWorkspace = searchParams?.get('workspace')
            const storedWorkspace = localStorage.getItem('selectedWorkspaceId')

            if (urlWorkspace && unique.some(w => w.id === urlWorkspace)) {
                setSelectedWorkspace(urlWorkspace)
                localStorage.setItem('selectedWorkspaceId', urlWorkspace)
            } else if (storedWorkspace && unique.some(w => w.id === storedWorkspace)) {
                setSelectedWorkspace(storedWorkspace)
            } else if (unique.length > 0) {
                setSelectedWorkspace(unique[0].id)
                localStorage.setItem('selectedWorkspaceId', unique[0].id)
            }
        }
        fetchWorkspaces()
    }, [user, searchParams])


    const handleWorkspaceChange = (workspaceId: string) => {
        setSelectedWorkspace(workspaceId)
        localStorage.setItem('selectedWorkspaceId', workspaceId)

        // Emit event for instant cross-component updates
        workspaceEvents.emit('workspace-switched', { workspaceId })

        // Update URL without refresh for instant response
        const url = new URL(window.location.href)
        url.searchParams.set('workspace', workspaceId)
        window.history.pushState({}, '', url.pathname + url.search)
    }

    const links = [
        { href: "/dashboard", label: "Dashboard", icon: Home },
        { href: "/calendar", label: "Calendar", icon: Calendar },
        { href: "/projects", label: "Projects", icon: FolderKanban },
        { href: "/settings", label: "Settings", icon: Settings },
    ]

    return (
        <div className={cn("flex flex-col h-full bg-white/80 backdrop-blur-xl border-r border-slate-200/60 p-4 w-full box-border", className)}>

            {/* Top: Logo & Create Button */}
            <div className="flex flex-col mb-2">
                {/* Logo Area */}
                <div className="flex items-center gap-2 px-4 h-12 mb-4">
                    <div className="h-8 w-8 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30">
                        <Command className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-800">Virl</span>
                </div>

                {/* Workspace Switcher */}
                <div className="px-4 my-2">
                    <label className="text-xs font-medium text-muted-foreground ml-2 mb-2 block">
                        Select Workspace
                    </label>
                    <Select value={selectedWorkspace || undefined} onValueChange={handleWorkspaceChange}>
                        <SelectTrigger className="w-full bg-white border-slate-200/80 shadow-sm">
                            <SelectValue placeholder="Select Workspace" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>My Workspaces</SelectLabel>
                                {workspaces.map((ws) => (
                                    <SelectItem key={ws.id} value={ws.id}>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 rounded bg-primary/20" />
                                            {ws.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                            <SelectSeparator />
                            <CreateWorkspaceDialog />
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Middle: Navigation Pills */}
            <div className="flex-1 overflow-y-auto py-6 space-y-1">
                <nav className="space-y-1.5">
                    {links.map((link) => {
                        const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-full transition-all duration-200",
                                    isActive
                                        ? "bg-violet-100 text-violet-700 font-semibold shadow-sm"
                                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                                )}
                            >
                                <link.icon className={cn("h-5 w-5", isActive ? "text-violet-700" : "text-slate-500")} />
                                {link.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Bottom: User Profile with Dropdown */}
            <div className="pt-4 mt-auto border-t border-slate-200/60">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-3 p-2 rounded-2xl bg-transparent hover:bg-white/50 transition-colors cursor-pointer group border border-transparent hover:border-slate-100 hover:shadow-sm">
                            <Avatar className="h-9 w-9 border border-indigo-100 shadow-sm">
                                <AvatarImage src={user?.user_metadata?.avatar_url} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                                    {user?.user_metadata?.full_name?.substring(0, 2).toUpperCase() || 'ME'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-semibold truncate text-slate-800 group-hover:text-violet-700 transition-colors">
                                    {user?.user_metadata?.full_name || 'My Profile'}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {user?.email || 'user@virl.in'}
                                </p>
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/settings/profile" className="cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <a href="mailto:support@virl.in" className="cursor-pointer">
                                <span className="mr-2 h-4 w-4 flex items-center justify-center font-bold">?</span>
                                Support
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onClick={async () => {
                                await supabase.auth.signOut()
                                window.location.href = '/login'
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
