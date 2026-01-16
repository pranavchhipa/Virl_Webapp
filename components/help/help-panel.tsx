"use client"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Home,
    FolderOpen,
    Upload,
    Users,
    Settings,
    Sparkles
} from "lucide-react"

interface HelpPanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function HelpPanel({ open, onOpenChange }: HelpPanelProps) {
    const helpSections = [
        {
            icon: Home,
            title: "Dashboard",
            description: "Your home base - see everything happening across all projects in one place.",
            content: [
                "View daily focus tasks",
                "Track active projects",
                "Monitor team activity",
                "Check storage usage"
            ]
        },
        {
            icon: FolderOpen,
            title: "Projects",
            description: "Organized folders for each client or campaign you're working on.",
            content: [
                "Create one project per client",
                "Keep all files organized",
                "Track project status",
                "Archive completed work"
            ]
        },
        {
            icon: Upload,
            title: "Assets & Review",
            description: "Upload videos/images and collaborate with your team.",
            content: [
                "Drag-and-drop files (up to 100MB)",
                "Leave time-stamped comments",
                "Draw annotations on videos",
                "Send for Review - share link with clients (auto-copied!)",
                "Approve final versions"
            ]
        },
        {
            icon: Sparkles,
            title: "Vixi AI Assistant",
            description: "Your personal AI content strategist for viral ideas.",
            content: [
                "Pick a platform (Instagram, YouTube, etc.)",
                "Get trending content ideas",
                "Generate complete scripts",
                "Plan shot-by-shot timelines"
            ]
        },
        {
            icon: Users,
            title: "Team Management",
            description: "Invite team members and manage permissions.",
            content: [
                "Owner: Full control (can't be removed)",
                "Admin: Can invite/remove people",
                "Member: Works on assigned projects",
                "Reviewer: View and comment only"
            ]
        },
        {
            icon: Settings,
            title: "Settings",
            description: "Manage your profile, workspace, and preferences.",
            content: [
                "Update your profile",
                "Invite team members",
                "Manage workspace settings",
                "Configure notifications"
            ]
        }
    ]

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-xl">
                        <span className="text-2xl">🆘</span>
                        Help & Guide
                    </SheetTitle>
                    <SheetDescription>
                        Learn how to use Virl effectively
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                    <ScrollArea className="h-[calc(100vh-180px)]">
                        <div className="space-y-4 pr-4">
                            {helpSections.map((section) => {
                                const Icon = section.icon
                                return (
                                    <div
                                        key={section.title}
                                        className="rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-lg bg-primary/10 p-2">
                                                <Icon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <h3 className="font-semibold text-sm">
                                                    {section.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {section.description}
                                                </p>
                                                <ul className="text-xs space-y-1 text-muted-foreground">
                                                    {section.content.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <span className="text-primary">•</span>
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="pt-4 border-t text-center text-sm text-muted-foreground">
                        Need more help?{" "}
                        <a
                            href="mailto:support@virl.in"
                            className="text-primary hover:underline"
                        >
                            Contact Support
                        </a>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
