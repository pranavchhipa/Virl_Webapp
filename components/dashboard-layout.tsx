import { ModernSidebar } from "@/components/layout/modern-sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DashboardLayoutProps {
    children: React.ReactNode
    user: any
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
            {/* Modern Sidebar */}
            <aside className="hidden md:flex flex-col z-20">
                <ModernSidebar />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <ScrollArea className="flex-1 h-full">
                    <div className="w-full h-full">
                        {children}
                    </div>
                </ScrollArea>
            </main>
        </div>
    )
}
