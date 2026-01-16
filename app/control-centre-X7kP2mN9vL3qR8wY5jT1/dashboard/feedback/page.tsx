import { getFeedback } from "@/app/actions/feedback"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { DeleteFeedbackButton } from "@/components/feedback/delete-feedback-button"

export const dynamic = 'force-dynamic'

export default async function FeedbackPage() {
    const { data: feedbackList, error } = await getFeedback(100)

    if (error) {
        return (
            <div className="p-8 text-red-500">
                Failed to load feedback: {error}
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 text-slate-900">
            <div className="p-6 border-b border-slate-200 bg-white">
                <h1 className="text-2xl font-bold text-slate-900">
                    User Feedback
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Manage and review feedback submitted by beta testers.
                </p>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6">
                    <div className="grid gap-4">
                        {feedbackList?.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                                No feedback submitted yet.
                            </div>
                        ) : (
                            feedbackList?.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-purple-300 transition-all shadow-sm hover:shadow-md hover:shadow-purple-900/5"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            {/* Sentiment Emoji */}
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-xl border border-slate-100">
                                                {item.sentiment === 'angry' && '😡'}
                                                {item.sentiment === 'unhappy' && '🙁'}
                                                {item.sentiment === 'neutral' && '😐'}
                                                {item.sentiment === 'happy' && '🙂'}
                                                {item.sentiment === 'excited' && '🤩'}
                                                {!['angry', 'unhappy', 'neutral', 'happy', 'excited'].includes(item.sentiment) ? item.sentiment : ''}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-slate-900">
                                                        {item.profiles?.full_name || item.profiles?.email || 'Anonymous'}
                                                    </span>
                                                    <span className="text-slate-400 text-xs">•</span>
                                                    <span className="text-slate-500 text-xs">
                                                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Badge variant="outline" className={
                                                        item.type === 'bug' ? 'border-red-200 text-red-700 bg-red-50' :
                                                            item.type === 'feature' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                                                'border-slate-200 text-slate-700 bg-slate-100'
                                                    }>
                                                        {item.type}
                                                    </Badge>
                                                    {item.path && (
                                                        <Badge variant="outline" className="border-slate-200 text-slate-500 bg-slate-50 font-mono text-[10px]">
                                                            {item.path}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <DeleteFeedbackButton id={item.id} />
                                    </div>

                                    <div className="mt-4 pl-[52px] space-y-4">
                                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                            {item.message}
                                        </p>

                                        {item.screenshot_url && (
                                            <div className="bg-slate-100 rounded-lg p-2 inline-block border border-slate-200">
                                                <a
                                                    href={item.screenshot_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative block overflow-hidden rounded-md"
                                                >
                                                    <img
                                                        src={item.screenshot_url}
                                                        alt="Feedback Attachment"
                                                        className="h-32 w-auto object-contain rounded-md transition-transform group-hover:scale-105 bg-white"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-xs text-white bg-black/60 px-2 py-1 rounded">View Full</span>
                                                    </div>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
}
