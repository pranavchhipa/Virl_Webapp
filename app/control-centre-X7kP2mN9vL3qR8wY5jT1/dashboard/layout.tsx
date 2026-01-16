'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Users,
    Server,
    HardDrive,
    Settings,
    Shield,
    LogOut,
    Loader2,
    MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONTROL_CENTRE_PATH } from '@/lib/admin-guard'

const navItems = [
    { href: '', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/feedback', label: 'Feedback', icon: MessageSquare },
    { href: '/system', label: 'System', icon: Server },
    { href: '/storage', label: 'Storage', icon: HardDrive },
    { href: '/settings', label: 'Settings', icon: Settings },
]

export default function ControlCentreLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        const isAuthenticated = sessionStorage.getItem('admin_authenticated') === 'true'
        if (!isAuthenticated) {
            router.push(CONTROL_CENTRE_PATH)
            return
        }
        setIsAuthorized(true)
        setIsLoading(false)
    }, [router])

    const handleLogout = () => {
        sessionStorage.removeItem('admin_authenticated')
        router.push(CONTROL_CENTRE_PATH)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        )
    }

    if (!isAuthorized) return null

    const basePath = `${CONTROL_CENTRE_PATH}/dashboard`

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar - Dark Violet Theme */}
            <aside className="w-56 bg-gradient-to-b from-violet-900 to-purple-900 flex flex-col shadow-xl">
                {/* Header */}
                <div className="p-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-sm">Control Centre</h1>
                            <p className="text-xs text-white/60">Super Admin</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => {
                        const fullHref = `${basePath}${item.href}`
                        const isActive = item.href === ''
                            ? pathname === basePath
                            : pathname?.startsWith(fullHref)
                        return (
                            <Link
                                key={item.href}
                                href={fullHref}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-white text-violet-900"
                                        : "text-white/80 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all w-full"
                    >
                        <LogOut className="h-4 w-4" />
                        Lock & Exit
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}
