'use client'

import { useEffect, useState } from 'react'
import {
    getSystemInfo, clearAllCache, sendTestEmail,
    purgeInactiveUsers, exportAllData
} from '@/app/actions/admin'
import {
    Loader2, Shield, Key, Server, AlertTriangle, Mail,
    RefreshCw, Download, UserX, Lock, Eye, EyeOff,
    CheckCircle2, Database, HardDrive, ToggleLeft, ToggleRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SystemInfo {
    currentPin: string
    nodeEnv: string
    supabaseUrl: string
    r2Configured: boolean
    totalAssets: number
    totalStorageBytes: number
}

export default function SettingsPage() {
    const [info, setInfo] = useState<SystemInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [showPin, setShowPin] = useState(false)
    const [newUserRegistration, setNewUserRegistration] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    useEffect(() => {
        async function loadInfo() {
            try {
                const data = await getSystemInfo()
                setInfo(data)
            } catch (error) {
                console.error('Failed to load system info:', error)
            } finally { setLoading(false) }
        }
        loadInfo()
    }, [])

    // Real action handlers
    const handleClearCache = async () => {
        setActionLoading('cache')
        try {
            const result = await clearAllCache()
            toast.success(result.message)
        } catch (error) {
            toast.error('Failed to clear cache')
        } finally {
            setActionLoading(null)
        }
    }

    const handleSendTestEmail = async () => {
        setActionLoading('email')
        try {
            const result = await sendTestEmail()
            if (result.success) {
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error('Failed to send test email')
        } finally {
            setActionLoading(null)
        }
    }

    const handlePurgeUsers = async () => {
        setActionLoading('purge')
        try {
            const result = await purgeInactiveUsers(90)
            toast.info(result.message)
        } catch (error) {
            toast.error('Failed to find inactive users')
        } finally {
            setActionLoading(null)
        }
    }

    const handleExportData = async () => {
        setActionLoading('export')
        try {
            const result = await exportAllData()
            // Download as JSON
            const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `virl-export-${new Date().toISOString().slice(0, 10)}.json`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Export downloaded successfully')
        } catch (error) {
            toast.error('Failed to export data')
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-full bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        )
    }

    return (
        <div className="p-8 bg-gray-50 min-h-full">
            {/* Full width - no max-width constraint */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Control Centre configuration & actions</p>
            </div>

            <div className="space-y-6">
                {/* Security Settings */}
                <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-violet-600" />
                            <h2 className="font-semibold text-gray-900">Security</h2>
                        </div>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Admin PIN</p>
                                <p className="text-sm text-gray-500">Control Centre access code</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono bg-gray-100 px-3 py-1.5 rounded-lg">
                                    {showPin ? '142536' : '••••••'}
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => setShowPin(!showPin)}>
                                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400">
                            To change PIN, edit <code className="bg-gray-100 px-1 rounded">lib/admin-guard.ts</code>
                        </p>
                        <hr className="border-gray-100" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Lock All Admin Sessions</p>
                                <p className="text-sm text-gray-500">Force re-authentication for all admins</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    sessionStorage.removeItem('admin_authenticated')
                                    toast.success('Sessions locked - you will be logged out')
                                    setTimeout(() => window.location.href = '/control-centre-X7kP2mN9vL3qR8wY5jT1', 1000)
                                }}
                            >
                                <Lock className="h-4 w-4 mr-2" />
                                Lock Sessions
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Platform Controls */}
                <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <Server className="h-5 w-5 text-blue-600" />
                            <h2 className="font-semibold text-gray-900">Platform Controls</h2>
                        </div>
                    </div>
                    <div className="p-5 space-y-4">

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">User Registration</p>
                                <p className="text-sm text-gray-500">Allow new users to sign up</p>
                            </div>
                            <button
                                onClick={() => {
                                    setNewUserRegistration(!newUserRegistration)
                                    toast.success(newUserRegistration ? 'Registration disabled (visual only)' : 'Registration enabled')
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                {newUserRegistration ? (
                                    <ToggleRight className="h-8 w-8 text-emerald-600" />
                                ) : (
                                    <ToggleLeft className="h-8 w-8" />
                                )}
                            </button>
                        </div>
                        <hr className="border-gray-100" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Environment</p>
                                <p className="text-sm text-gray-500">Current server mode</p>
                            </div>
                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${info?.nodeEnv === 'production'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                                }`}>
                                {info?.nodeEnv}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Integrations Status */}
                <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-emerald-600" />
                            <h2 className="font-semibold text-gray-900">Integrations</h2>
                        </div>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-900">Supabase</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="text-sm font-medium">Connected</span>
                            </div>
                        </div>
                        <hr className="border-gray-100" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <HardDrive className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-900">Cloudflare R2</span>
                            </div>
                            {info?.r2Configured ? (
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span className="text-sm font-medium">Connected</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-amber-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span className="text-sm font-medium">Check env vars</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Email & Notifications - REAL ACTION */}
                <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-blue-600" />
                            <h2 className="font-semibold text-gray-900">Email & Notifications</h2>
                        </div>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Test Email</p>
                                <p className="text-sm text-gray-500">Send test email to pranavchhipa01@gmail.com</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSendTestEmail}
                                disabled={actionLoading === 'email'}
                            >
                                {actionLoading === 'email' ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Mail className="h-4 w-4 mr-2" />
                                )}
                                Send Test
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Danger Zone - REAL ACTIONS */}
                <section className="bg-white rounded-xl border-2 border-red-200 overflow-hidden">
                    <div className="p-5 border-b border-red-100 bg-red-50">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <h2 className="font-semibold text-red-900">Danger Zone</h2>
                        </div>
                    </div>
                    <div className="p-5 space-y-4">
                        {/* Clear Cache - REAL */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Clear Cache</p>
                                <p className="text-sm text-gray-500">Revalidate all cached pages</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={handleClearCache}
                                disabled={actionLoading === 'cache'}
                            >
                                {actionLoading === 'cache' ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Clear Cache
                            </Button>
                        </div>
                        <hr className="border-red-100" />

                        {/* Export Data - REAL */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Export All Data</p>
                                <p className="text-sm text-gray-500">Download full platform backup as JSON</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportData}
                                disabled={actionLoading === 'export'}
                            >
                                {actionLoading === 'export' ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                )}
                                Export
                            </Button>
                        </div>
                        <hr className="border-red-100" />

                        {/* Purge Inactive Users - REAL (just finds them) */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Find Inactive Users</p>
                                <p className="text-sm text-gray-500">List users with no activity for 90+ days</p>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handlePurgeUsers}
                                disabled={actionLoading === 'purge'}
                            >
                                {actionLoading === 'purge' ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <UserX className="h-4 w-4 mr-2" />
                                )}
                                Find Users
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
