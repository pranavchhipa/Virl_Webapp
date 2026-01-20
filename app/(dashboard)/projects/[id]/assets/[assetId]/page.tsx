import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getSignedDownloadUrl } from "@/lib/r2-storage"
import { ReviewPlayerClient } from "@/app/(dashboard)/projects/[id]/assets/[assetId]/client"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { format } from "date-fns"

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string, assetId: string }> }) {
    const { id, assetId } = await params
    const supabase = await createClient()

    // 1. Fetch Asset with uploader info
    const { data: asset } = await supabase
        .from('assets')
        .select(`
            *,
            uploader:profiles!uploader_id(full_name, email)
        `)
        .eq('id', assetId)
        .single()

    if (!asset) return notFound()

    // 2. Fetch Comments (with profiles)
    const { data: comments } = await supabase
        .from('asset_comments')
        .select(`
            *,
            user:profiles(full_name, avatar_url)
        `)
        .eq('asset_id', assetId)
        .order('created_at', { ascending: true })

    // 3. Get R2 signed URL for the asset
    let assetUrl = ''
    try {
        assetUrl = await getSignedDownloadUrl(asset.file_path, 3600) // 1 hour expiry
    } catch (error) {
        console.error('Failed to get R2 signed URL:', error)
        // Fallback to empty URL - UI should handle this gracefully
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 text-slate-900">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-white shadow-sm">
                <Link
                    href={`/projects/${id}/assets`}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-slate-800 truncate">{asset.file_name}</h1>
                    <p className="text-xs text-slate-500">
                        {asset.uploader?.full_name && (
                            <span>Uploaded by {asset.uploader.full_name} • </span>
                        )}
                        {format(new Date(asset.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                    </p>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200">v1</span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-6">
                <ReviewPlayerClient
                    assetId={assetId}
                    src={assetUrl}
                    fileType={asset.file_type}
                    initialComments={comments || []}
                    currentUser={(await supabase.auth.getUser()).data.user?.id!}
                />
            </div>
        </div>
    )
}

