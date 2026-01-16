'use client'

import { useEffect, useState } from 'react'
import { getSystemInfo } from '@/app/actions/admin'
import { Loader2, HardDrive, Database, FileImage, TrendingUp, RefreshCw, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Format bytes to human readable
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export default function StoragePage() {
    const [info, setInfo] = useState<{ totalAssets: number; totalStorageBytes: number } | null>(null)
    const [loading, setLoading] = useState(true)

    async function loadInfo() {
        setLoading(true)
        try {
            const data = await getSystemInfo()
            setInfo({ totalAssets: data.totalAssets, totalStorageBytes: data.totalStorageBytes })
        } catch (error) {
            console.error('Failed to load storage info:', error)
        } finally { setLoading(false) }
    }

    useEffect(() => { loadInfo() }, [])

    const STORAGE_LIMIT = 10 * 1024 * 1024 * 1024 // 10 GB
    const storageBytes = info?.totalStorageBytes || 0
    const storageGB = (storageBytes / (1024 * 1024 * 1024)).toFixed(2)
    const usagePercent = Math.min((storageBytes / STORAGE_LIMIT) * 100, 100)

    return (
        <div className="p-8 bg-gray-50 min-h-full">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Storage</h1>
                    <p className="text-gray-500 mt-1">Cloudflare R2 storage overview</p>
                </div>
                <Button onClick={loadInfo} variant="outline" disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
            ) : (
                <div className="space-y-6">
                    {/* Storage Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                                <HardDrive className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Cloudflare R2</h2>
                                <p className="text-gray-500">Object Storage</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Total Platform Usage</span>
                                <span className="text-3xl font-bold text-gray-900">{formatBytes(storageBytes)}</span>
                            </div>
                            <p className="text-xs text-emerald-600 mt-3 font-medium">✓ Real-time data from R2</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><FileImage className="h-5 w-5 text-blue-600" /></div>
                                <span className="text-gray-500">Total Assets</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{info?.totalAssets.toLocaleString()}</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Database className="h-5 w-5 text-emerald-600" /></div>
                                <span className="text-gray-500">Total Size</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{formatBytes(storageBytes)}</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-orange-600" /></div>
                                <span className="text-gray-500">Avg File Size</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">
                                {info?.totalAssets && info.totalAssets > 0
                                    ? formatBytes(storageBytes / info.totalAssets)
                                    : '0 Bytes'}
                            </p>
                        </div>
                    </div>

                    {/* Configuration */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">R2 Configuration</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-500">Provider</span>
                                <span className="text-gray-900 font-medium">Cloudflare R2</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-500">Bucket</span>
                                <span className="text-gray-900 font-medium font-mono">virl-assets</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-gray-500">Status</span>
                                <span className="text-emerald-600 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    Connected
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
