"use client"

import { ViralChatWidget } from "@/components/viral-chat-widget"

export default function AiChatPage() {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] max-w-5xl mx-auto w-full p-4">
            <div className="mb-4">
                <h1 className="text-2xl font-bold tracking-tight">Viral Strategy Center</h1>
                <p className="text-muted-foreground">Collaborate with Virl AI to plan your next viral hit.</p>
            </div>
            <div className="flex-1 h-full">
                <ViralChatWidget />
            </div>
        </div>
    )
}
