'use client'

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Users, Building2, Bell, CreditCard } from "lucide-react"

const tabs = [
    { title: "Profile", href: "/settings/profile", icon: User },
    { title: "Team", href: "/settings/team", icon: Users },
    { title: "Workspace", href: "/settings/workspace", icon: Building2 },
    { title: "Billing", href: "/settings/billing", icon: CreditCard },
    { title: "Notifications", href: "/settings/notifications", icon: Bell }
]

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    const pathname = usePathname()

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
            {/* Clean Header */}
            <div className="border-b border-slate-200">
                <div className="px-8 lg:px-12">
                    {/* Title Section */}
                    <div className="py-8">
                        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage your preferences</p>
                    </div>

                    {/* Clean Text Tabs */}
                    <div className="flex items-center gap-6">
                        {tabs.map((tab) => {
                            const isActive = pathname === tab.href || (pathname?.startsWith(tab.href + '/') ?? false)
                            const Icon = tab.icon
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={cn(
                                        "relative pb-3 text-sm font-medium transition-all flex items-center gap-2",
                                        isActive
                                            ? "text-violet-600"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.title}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="px-8 lg:px-12 py-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
