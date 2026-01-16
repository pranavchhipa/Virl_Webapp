'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createWorkspaceAction } from '@/app/actions/workspaces'

export default function NewWorkspacePage() {
    const router = useRouter()
    const [creating, setCreating] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    async function handleCreate() {
        if (!name.trim()) {
            toast.error('Please enter a workspace name')
            return
        }

        setCreating(true)
        try {
            const result = await createWorkspaceAction({ name, description })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Workspace created successfully!')
                router.push('/projects')
            }
        } catch (error) {
            toast.error('Failed to create workspace')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-2xl mx-auto">
                {/* Back Button */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Workspaces
                </Link>

                {/* Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-8">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Create New Workspace
                        </h1>
                        <p className="text-white/80">
                            Set up a workspace for your client or team
                        </p>
                    </div>

                    {/* Form */}
                    <div className="p-8 space-y-6">
                        {/* Workspace Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-900 mb-2">
                                Workspace Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Acme Corp - Social Media"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                disabled={creating}
                            />
                            <p className="mt-2 text-sm text-slate-500">
                                This is usually your client's name or project
                            </p>
                        </div>

                        {/* Description (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-900 mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g., Workspace for managing Acme Corp's social media campaigns"
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                                disabled={creating}
                            />
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2">
                                💡 What's a workspace?
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Each client gets their own workspace</li>
                                <li>• Workspaces contain multiple projects</li>
                                <li>• Invite team members to specific projects</li>
                                <li>• Keep client data separate and organized</li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-4">
                            <button
                                onClick={handleCreate}
                                disabled={creating || !name.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Building2 className="w-5 h-5" />
                                        Create Workspace
                                    </>
                                )}
                            </button>
                            <Link
                                href="/dashboard"
                                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                            >
                                Cancel
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
