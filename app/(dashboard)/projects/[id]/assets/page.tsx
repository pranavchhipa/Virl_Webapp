"use client"

import { useState, useCallback, useEffect, use, useMemo } from "react"
// import { useDropzone } from "react-dropzone" // Removed in favor of AssetUploadZone
import { createClient } from "@/lib/supabase/client"
import { createAssetRecord, deleteAsset } from "@/app/actions/assets"
import { Button } from "@/components/ui/button"
import { UploadCloud, Loader2, ArrowUpCircle, Film, ImageIcon, Share2, Copy, Check, ArrowLeft, FileUp } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AssetsToolbar } from "@/components/assets/assets-toolbar"
import { AssetCard, Asset } from "@/components/assets/asset-card"
import { AssetUploadZone } from "@/components/media/asset-upload-zone"
import { StorageLinearCard } from '@/components/dashboard/storage-linear-card'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import { ScheduleDialog } from "@/components/calendar/ScheduleDialog"
import { Trash2 } from "lucide-react"

export default function AssetsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [assets, setAssets] = useState<Asset[]>([])
    const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
    const [isUploading, setIsUploading] = useState(false)

    // Toolbar State
    const [searchQuery, setSearchQuery] = useState("")
    const [filterType, setFilterType] = useState("all")
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    const supabase = createClient()
    const router = useRouter()

    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Fetch Assets with uploader info
    useEffect(() => {
        const fetchAssets = async () => {
            const { data } = await supabase
                .from('assets')
                .select(`
                    *,
                    uploader:profiles!uploader_id(full_name, email)
                `)
                .eq('project_id', id)
                .order('created_at', { ascending: false })

            if (data) {
                setAssets(data as Asset[])
            }
        }
        fetchAssets()

        const channel = supabase
            .channel('assets_page_realtime')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'assets', filter: `project_id=eq.${id}` },
                async (payload) => {
                    const eventType = payload.eventType
                    if (eventType === 'INSERT') {
                        // Re-fetch the complete asset with uploader info
                        const { data: newAsset } = await supabase
                            .from('assets')
                            .select(`
                                *,
                                uploader:profiles!uploader_id(full_name, email)
                            `)
                            .eq('id', (payload.new as Asset).id)
                            .single()
                        if (newAsset) {
                            setAssets((prev) => [newAsset as Asset, ...prev.filter(a => a.id !== newAsset.id)])
                        }
                    } else if (eventType === 'UPDATE') {
                        // Re-fetch updated asset with uploader info
                        const { data: updatedAsset } = await supabase
                            .from('assets')
                            .select(`
                                *,
                                uploader:profiles!uploader_id(full_name, email)
                            `)
                            .eq('id', (payload.new as Asset).id)
                            .single()
                        if (updatedAsset) {
                            setAssets((prev) => prev.map(a => a.id === updatedAsset.id ? updatedAsset as Asset : a))
                        }
                    } else if (eventType === 'DELETE') {
                        setAssets((prev) => prev.filter(a => a.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [id, supabase])

    // Filter Logic
    useEffect(() => {
        let result = assets

        if (searchQuery) {
            const lower = searchQuery.toLowerCase()
            result = result.filter(a => a.file_name.toLowerCase().includes(lower))
        }

        if (filterType !== 'all') {
            result = result.filter(a => a.file_type === filterType)
        }

        setFilteredAssets(result)
    }, [assets, searchQuery, filterType])

    // Upload Logic - Using Cloudflare R2
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        setIsUploading(true)
        const toastId = toast.loading(`Uploading ${file.name}...`)

        try {
            // Dynamic import to avoid SSR issues
            const { uploadFileToR2 } = await import('@/lib/r2-client')

            // 1. Upload to Cloudflare R2
            const result = await uploadFileToR2(
                file,
                id,
                (progress) => {
                    toast.loading(`Uploading ${file.name}... ${progress.percentage}%`, { id: toastId })
                }
            )

            if (!result.success) {
                throw new Error(result.error || 'Upload failed')
            }

            // 2. Create DB Record with R2 key as file_path
            const res = await createAssetRecord(
                id,
                file.name,
                result.key, // R2 object key
                file.type.split('/')[0], // 'video', 'image', etc.
                file.size // File size in bytes
            )

            if (res.error) {
                // Check if it's a storage limit error
                if ((res as any).storageError) {
                    toast.error(`Storage limit exceeded! ${(res as any).currentUsed} of ${(res as any).limit} used.`, { id: toastId, duration: 5000 })
                } else {
                    throw new Error(res.error)
                }
                return
            }

            toast.success("Upload Complete", { id: toastId })
            // Realtime will update list
        } catch (e: any) {
            console.error("Upload failed:", e)
            toast.error(`Upload failed: ${e.message}`, { id: toastId })
        } finally {
            setIsUploading(false)
        }
    }, [id])

    const handleDownload = async (asset: Asset) => {
        try {
            toast.info("Preparing download...")

            // Get signed R2 download URL
            const { getR2DownloadUrl } = await import('@/lib/r2-client')
            const signedUrl = await getR2DownloadUrl(asset.id)

            if (!signedUrl) {
                throw new Error('Failed to get download URL')
            }

            const response = await fetch(signedUrl)
            if (!response.ok) throw new Error('Download failed')
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = asset.file_name || 'download'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            toast.success("Download complete")
        } catch (error) {
            console.error('Download error:', error)
            toast.error("Download failed")
        }
    }

    const handleUploadWrapper = async (files: File[], onProgress?: (progress: number) => void) => {
        const file = files[0]
        if (!file) return

        try {
            // Dynamic import to avoid SSR issues
            const { uploadFileToR2 } = await import('@/lib/r2-client')

            // 1. Upload to Cloudflare R2 with progress callback
            const result = await uploadFileToR2(
                file,
                id,
                (progressData) => {
                    // Pass percentage to dialog's progress ring
                    if (onProgress) onProgress(progressData.percentage)
                }
            )

            if (!result.success) {
                throw new Error(result.error || 'Upload failed')
            }

            // 2. Create DB Record with R2 key as file_path
            const res = await createAssetRecord(
                id,
                file.name,
                result.key, // R2 object key
                file.type.split('/')[0], // 'video', 'image', etc.
                file.size // File size in bytes
            )

            if (res.error) throw new Error(res.error)

            // 3. Immediately add new asset to list (don't wait for realtime)
            if (res.asset) {
                // Fetch the complete asset with uploader info
                const { data: newAsset } = await supabase
                    .from('assets')
                    .select(`
                        *,
                        uploader:profiles!uploader_id(full_name, email)
                    `)
                    .eq('id', res.asset.id)
                    .single()

                if (newAsset) {
                    setAssets((prev) => [newAsset as Asset, ...prev.filter(a => a.id !== newAsset.id)])
                }
            }

            // Close dialog after success animation shows (2.5 seconds)
            setTimeout(() => setUploadDialogOpen(false), 2500)
        } catch (e: any) {
            console.error("Upload failed:", e)
            throw e // Re-throw so AssetUploadZone can show error state
        }
    }

    const handleScheduleRequest = (asset: Asset) => {
        setSelectedAsset(asset)
        setScheduleDialogOpen(true)
    }

    const handleScheduleConfirm = async (date: Date, time: string, platform: string) => {
        if (!selectedAsset) return

        const response = await fetch('/api/calendar/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assetId: selectedAsset.id,
                scheduledDate: date.toISOString().split('T')[0],
                scheduledTime: time,
                platform,
            }),
        })

        if (!response.ok) {
            throw new Error('Failed to schedule post')
        }

        // Optional: Navigate to calendar or just show success
        // router.push('/calendar') 
    }

    // Send for Review - Generate shareable link
    const handleSendForReview = async (asset: Asset) => {
        const toastId = toast.loading("Creating review link...")

        try {
            const response = await fetch('/api/review-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assetId: asset.id,
                    projectId: id,
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to create review link')
            }

            const data = await response.json()
            const reviewUrl = `${window.location.origin}/review/${data.reviewLink.token}`

            // Copy to clipboard
            await navigator.clipboard.writeText(reviewUrl)

            toast.success(
                <div className="flex flex-col gap-1">
                    <span className="font-medium">Review link copied!</span>
                    <span className="text-xs text-muted-foreground">Share this link with your client</span>
                </div>,
                { id: toastId, duration: 5000 }
            )
        } catch (e: any) {
            console.error('Review link error:', e)
            toast.error(e.message || 'Failed to create review link', { id: toastId })
        }
    }

    const handleDeleteRequest = (asset: Asset) => {
        setAssetToDelete(asset)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!assetToDelete) return

        setIsDeleting(true)
        try {
            const result = await deleteAsset(assetToDelete.id, id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Asset deleted successfully")
                setAssets(prev => prev.filter(a => a.id !== assetToDelete.id))
            }
        } catch (e) {
            toast.error("Failed to delete asset")
        } finally {
            setIsDeleting(false)
            setDeleteDialogOpen(false)
            setAssetToDelete(null)
        }
    }

    // Calculate total storage used in this project
    const totalStorageUsed = useMemo(() => {
        return assets.reduce((sum, asset) => sum + (asset.file_size || 0), 0)
    }, [assets])

    // Storage limit (10GB per project - matches existing implementation)
    const STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024 // 10GB

    return (
        <div className="h-full flex flex-col bg-slate-50/50 relative">
            {/* Header - Stitch UI Style */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 px-6 pt-4">
                <div className="flex flex-col gap-1.5">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A1A2E] tracking-tight">Project Assets</h1>
                    <p className="text-slate-500 text-sm font-medium">Manage and organize your creative files</p>
                </div>

                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center justify-center gap-2.5 h-12 px-8 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-base font-bold rounded-2xl shadow-lg shadow-violet-200 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                            <FileUp className="h-5 w-5" />
                            Upload File
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 shadow-xl rounded-2xl p-0 overflow-hidden">
                        <VisuallyHidden>
                            <DialogTitle>Upload Assets</DialogTitle>
                        </VisuallyHidden>
                        <AssetUploadZone onUpload={handleUploadWrapper} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Storage Usage Card */}
            <div className="px-6 mb-6">
                <StorageLinearCard
                    usedBytes={totalStorageUsed}
                    limitBytes={STORAGE_LIMIT_BYTES}
                    className="max-w-md"
                />
            </div>

            {/* Toolbar */}
            <div className="px-6">
                <AssetsToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filterType={filterType}
                    onFilterChange={setFilterType}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-0">
                {assets.length === 0 && !isUploading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                        <div className="h-20 w-20 bg-violet-50 rounded-full flex items-center justify-center mb-6">
                            <UploadCloud className="h-10 w-10 text-violet-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No assets yet</h3>
                        <p className="text-slate-500 max-w-sm mb-8">
                            Upload your first video or image to get started with the review process.
                        </p>
                        <Button onClick={() => setUploadDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700 rounded-xl px-8">
                            Select File
                        </Button>
                    </div>
                ) : (
                    <>
                        {filteredAssets.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                No files match your filters.
                            </div>
                        ) : (
                            <div className={
                                viewMode === 'grid'
                                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                                    : "space-y-2"
                            }>
                                {filteredAssets.map((asset) => (
                                    viewMode === 'grid' ? (
                                        <AssetCard
                                            key={asset.id}
                                            asset={asset}
                                            projectId={id}
                                            onDownload={handleDownload}
                                            onSchedule={handleScheduleRequest}
                                            onSendForReview={handleSendForReview}
                                            onDelete={handleDeleteRequest}
                                        />
                                    ) : (
                                        // Simple List Item implementation inside map for now
                                        <div key={asset.id} className="flex items-center justify-between p-4 bg-card border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-16 bg-muted rounded flex items-center justify-center">
                                                    {asset.file_type === 'video' ? <Film className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <Link href={`/projects/${id}/assets/${asset.id}`} className="font-medium hover:underline">{asset.file_name}</Link>
                                                    <div className="text-xs text-muted-foreground">Uploaded {new Date(asset.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleScheduleRequest(asset)}>Schedule</Button>
                                                <Link href={`/projects/${id}/assets/${asset.id}`}>
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <ScheduleDialog
                open={scheduleDialogOpen}
                onOpenChange={setScheduleDialogOpen}
                asset={selectedAsset}
                onSchedule={handleScheduleConfirm}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <Trash2 className="h-8 w-8 text-red-600" />
                        </div>
                        <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                            Are you sure you want to delete <strong>{assetToDelete?.file_name}</strong>? This action cannot be undone and the file will be permanently removed from storage.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row justify-center gap-3">
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}


