'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
    CheckCircle2, XCircle, Loader2, Eye, Lock, Play, MessageSquare,
    User, Mail, Sparkles, Send, Clock, Download, ChevronDown
} from 'lucide-react'
import { VirlLogo } from '@/components/ui/virl-logo'
import { useRealtimeFeedback } from '@/hooks/useRealtimeFeedback'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

export default function PublicReviewPage() {
    const params = useParams()
    const token = params?.token as string

    const [loading, setLoading] = useState(true)
    const [reviewData, setReviewData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [viewCount, setViewCount] = useState(0)
    const [assetUrl, setAssetUrl] = useState<string | null>(null)

    const isAlreadyApproved = reviewData?.assets?.status === 'approved' ||
        reviewData?.feedback?.some((fb: any) => fb.status === 'approved')

    const { newFeedbackCount } = useRealtimeFeedback({
        reviewLinkId: reviewData?.id,
        onFeedbackReceived: (feedback) => {
            setReviewData((prev: any) => ({
                ...prev,
                feedback: [feedback, ...(prev?.feedback || [])]
            }))
        }
    })

    const [passwordRequired, setPasswordRequired] = useState(false)
    const [password, setPassword] = useState('')
    const [passwordVerified, setPasswordVerified] = useState(false)

    const [clientName, setClientName] = useState('')
    const [clientEmail, setClientEmail] = useState('')
    const [feedbackText, setFeedbackText] = useState('')

    useEffect(() => {
        if (token) fetchReviewData()
    }, [token])

    async function fetchReviewData() {
        try {
            const response = await fetch(`/api/review-links/${token}`)
            const data = await response.json()
            if (!response.ok) {
                setError(data.error || 'Failed to load review')
                setLoading(false)
                return
            }
            setReviewData(data.reviewLink)
            setViewCount(data.reviewLink.view_count || 0)
            setPasswordRequired(data.reviewLink.password_protected && !passwordVerified)

            // Fetch R2 signed URL for the asset
            if (data.reviewLink.assets?.id) {
                try {
                    const r2Response = await fetch(`/api/r2-download?assetId=${data.reviewLink.assets.id}`)
                    if (r2Response.ok) {
                        const r2Data = await r2Response.json()
                        setAssetUrl(r2Data.url)
                    }
                } catch (e) {
                    console.error('Failed to get R2 URL:', e)
                }
            }

            setLoading(false)
            incrementViewCount()
        } catch (err) {
            setError('Failed to load review')
            setLoading(false)
        }
    }

    async function incrementViewCount() {
        try {
            const response = await fetch(`/api/review-links/${token}/view`, { method: 'POST' })
            if (response.ok) {
                const data = await response.json()
                setViewCount(data.viewCount || viewCount + 1)
            }
        } catch (err) { }
    }

    async function verifyPassword() {
        try {
            const response = await fetch(`/api/review-links/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            })
            const data = await response.json()
            if (data.valid) {
                setPasswordVerified(true)
                setPasswordRequired(false)
                toast.success('Access granted')
            } else {
                toast.error('Invalid password')
            }
        } catch (err) {
            toast.error('Failed to verify password')
        }
    }

    async function submitFeedback(status: 'approved' | 'changes_requested') {
        if (!clientName || !clientEmail) {
            toast.error('Please fill in all required fields')
            return
        }
        if (status === 'changes_requested' && !feedbackText) {
            toast.error('Please provide feedback for requested changes')
            return
        }

        setSubmitting(true)
        try {
            const response = await fetch(`/api/review-links/${token}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientName, clientEmail, status, feedbackText: feedbackText || null, timestamp: null })
            })
            const data = await response.json()
            if (response.ok) {
                setSubmitted(true)
                toast.success(status === 'approved' ? 'Content approved!' : 'Feedback submitted!')
            } else {
                toast.error(data.error || 'Failed to submit feedback')
            }
        } catch (err) {
            toast.error('Failed to submit feedback')
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDownload() {
        const asset = reviewData?.assets
        if (!asset || !assetUrl) {
            toast.error('Download not available')
            return
        }

        try {
            toast.info('Starting download...')
            const response = await fetch(assetUrl)
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = asset.file_name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)
            toast.success('Download complete!')
        } catch (err) {
            toast.error('Download failed')
        }
    }

    // Loading
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-4">
                <div className="text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600/10 flex items-center justify-center mx-auto shadow-xl shadow-indigo-900/20 animate-pulse border border-indigo-500/20">
                        <VirlLogo className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-500" />
                    </div>
                    <p className="mt-4 text-slate-500 text-sm sm:text-base">Loading review...</p>
                </div>
            </div>
        )
    }

    // Error
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-4">
                <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <XCircle className="h-7 w-7 sm:h-8 sm:w-8 text-red-500" />
                    </div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Review Not Available</h1>
                    <p className="text-slate-500 text-sm">{error}</p>
                </div>
            </div>
        )
    }

    // Password
    if (passwordRequired) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-4">
                <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200">
                            <Lock className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                        </div>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-800">Protected Content</h1>
                        <p className="text-slate-500 text-sm mt-1">Enter password to view</p>
                    </div>
                    <div className="space-y-3">
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                            className="h-11 rounded-xl border-slate-200"
                            placeholder="Enter password"
                        />
                        <Button
                            onClick={verifyPassword}
                            className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl font-medium"
                        >
                            Access Review
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // Success
    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-4">
                <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-200">
                        <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Thank You!</h1>
                    <p className="text-slate-500 text-sm sm:text-base">Your feedback has been submitted.</p>
                    <div className="mt-6 pt-5 border-t border-slate-100">
                        <p className="text-slate-400 text-xs">Powered by</p>
                        <p className="text-violet-600 font-semibold">Virl</p>
                    </div>
                </div>
            </div>
        )
    }

    const asset = reviewData?.assets
    const project = reviewData?.projects

    return (
        <div className="flex h-screen bg-[#0B0F19] overflow-hidden font-sans">
            {/* Left Panel - Dark Content Area */}
            <div className="flex-1 flex flex-col relative min-w-0 bg-[#0B0F19]">
                {/* Header */}
                <header className="flex-shrink-0 h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0B0F19]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Play className="w-4 h-4 text-white fill-current" />
                        </div>
                        <div>
                            <h1 className="text-white font-semibold text-sm leading-tight">Virl</h1>
                            <span className="text-slate-400 text-xs">{asset?.file_name}</span>
                        </div>
                    </div>

                    {/* Team Avatars + Chat Button */}
                    <div className="flex items-center gap-4">
                        {/* Overlapping Avatars */}
                        <div className="flex items-center -space-x-2">
                            <div className="w-8 h-8 rounded-full border-2 border-[#0B0F19] bg-gradient-to-br from-amber-200 to-amber-400 overflow-hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Team member" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-8 h-8 rounded-full border-2 border-[#0B0F19] bg-gradient-to-br from-pink-200 to-pink-400 overflow-hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="Team member" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-8 h-8 rounded-full border-2 border-[#0B0F19] bg-gradient-to-br from-blue-200 to-blue-400 overflow-hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Brian" alt="Team member" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-8 h-8 rounded-full border-2 border-[#0B0F19] bg-slate-700 flex items-center justify-center text-xs font-semibold text-white">
                                +2
                            </div>
                        </div>

                        {/* Team Chat Button */}
                        <Button
                            className="h-9 px-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-full shadow-lg shadow-violet-500/30 transition-all flex items-center gap-2"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Team Chat
                        </Button>
                    </div>

                    {isAlreadyApproved && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            className="h-8 !bg-white border border-slate-300 !text-slate-900 hover:!bg-slate-100 transition-colors font-medium"
                        >
                            <Download className="w-3.5 h-3.5 mr-2" />
                            Download
                        </Button>
                    )}
                </header>

                {/* Main Content (Video) */}
                <main className="flex-1 flex items-center justify-center p-8 bg-[#0B0F19] relative">
                    <div className="w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-2xl bg-black ring-1 ring-white/10 relative group">
                        {assetUrl ? (
                            asset?.file_type?.startsWith('video') || asset?.file_type === 'video' ? (
                                <video
                                    src={assetUrl}
                                    controls
                                    className="w-full h-full object-contain"
                                    playsInline
                                />
                            ) : asset?.file_type?.startsWith('image') || asset?.file_type === 'image' ? (
                                <img
                                    src={assetUrl}
                                    alt={asset?.file_name}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                    <div className="text-center text-slate-500">
                                        <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                        <p>Preview not available</p>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                            </div>
                        )}
                    </div>

                </main>
            </div>

            {/* Right Panel - Sidebar Form */}
            <aside className="w-[400px] bg-white border-l border-slate-200 flex flex-col z-20 shadow-xl">
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Submit Review</h2>
                        <p className="text-slate-500 text-xs leading-relaxed">
                            Provide your feedback for this version.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Your Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    placeholder="John Doe"
                                    className="pl-9 h-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-lg text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Your Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    type="email"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    className="pl-9 h-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-lg text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">Feedback</Label>
                            <Textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Type your comments here..."
                                className="min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-lg resize-none p-3 text-sm"
                            />
                        </div>

                        <div className="pt-2 space-y-2">
                            {isAlreadyApproved ? (
                                <div className="space-y-2">
                                    <div className="w-full h-10 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-2 text-green-700 font-semibold mb-2 text-sm">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Content Approved
                                    </div>
                                    <Button
                                        onClick={() => submitFeedback('changes_requested')}
                                        disabled={submitting}
                                        className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-200 transition-all hover:translate-y-[-1px] text-sm"
                                    >
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Comment'}
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Button
                                        onClick={() => submitFeedback('approved')}
                                        disabled={submitting}
                                        className="w-full h-10 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-lg shadow-lg shadow-green-200 transition-all hover:translate-y-[-1px] flex items-center justify-center gap-2 text-sm"
                                    >
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                            <><CheckCircle2 className="w-4 h-4" /> Approve Content</>
                                        )}
                                    </Button>

                                    <Button
                                        onClick={() => submitFeedback('changes_requested')}
                                        disabled={submitting}
                                        className="w-full h-10 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold rounded-lg shadow-lg shadow-violet-200 transition-all hover:translate-y-[-1px] flex items-center justify-center gap-2 text-sm"
                                    >
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                            <><MessageSquare className="w-4 h-4" /> Request Changes</>
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-center text-[10px] text-slate-400">
                        Powered by Virl Review System © 2026
                    </p>
                </div>
            </aside>
        </div>
    )
}

function FeedbackItem({ feedback }: { feedback: any }) {
    return (
        <div className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs",
                feedback.status === 'approved' ? "bg-green-500" : "bg-indigo-500"
            )}>
                {feedback.client_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">{feedback.client_name}</p>
                    <span className="text-xs text-slate-400">
                        {feedback.created_at && formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                    </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{feedback.feedback_text}</p>
            </div>
        </div>
    )
}
