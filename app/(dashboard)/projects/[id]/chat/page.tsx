import { TeamChat } from "@/components/chat/team-chat"

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div className="h-full flex flex-col bg-white border rounded-lg shadow-sm overflow-hidden">
            {/* Chat header area if needed, or just let TeamChat handle it */}
            <div className="p-4 border-b bg-gray-50/50">
                <p className="text-sm text-muted-foreground">Discuss the campaign here. Mention @team to notify everyone.</p>
            </div>
            <div className="flex-1 overflow-hidden">
                <TeamChat projectId={id} />
            </div>
        </div>
    )
}
