'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { workspaceEvents } from "@/lib/workspace-events"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Building, Loader2, Check } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function WorkspaceSettingsPage() {
    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()

    // Get workspace ID from URL or fallback
    const workspaceId = searchParams.get('workspace')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [workspace, setWorkspace] = useState<any>(null)
    const [name, setName] = useState("")

    useEffect(() => {
        if (workspaceId) {
            fetchWorkspace(workspaceId)
        } else {
            // Fallback: try to load *any* workspace (or maybe the default one)
            fetchFirstWorkspace()
        }
    }, [workspaceId])

    async function fetchFirstWorkspace() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: members } = await supabase
                .from('workspace_members')
                .select('workspace:workspaces(*)')
                .eq('user_id', user.id)
                .limit(1)

            if (members && members.length > 0) {
                const memberData = members[0] as any
                if (memberData.workspace) {
                    setWorkspace(memberData.workspace)
                    setName(memberData.workspace.name)
                }
            }
        } catch (error) {
            console.error('Error fetching workspace', error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchWorkspace(id: string) {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Verify membership AND fetch workspace details
            const { data: member } = await supabase
                .from('workspace_members')
                .select('role, workspace:workspaces(*)')
                .eq('user_id', user.id)
                .eq('workspace_id', id)
                .single()

            if (member && member.workspace) {
                // Check permissions (optional UI guard, Real security is RLS)
                if (member.role !== 'owner' && member.role !== 'admin') {
                    toast.error("You intentionally don't have permissions to edit this workspace.")
                }
                const ws = member.workspace as any
                setWorkspace(ws)
                setName(ws.name)
            } else {
                toast.error("Workspace not found or access denied")
            }
        } catch (error) {
            console.error('Error fetching workspace', error)
        } finally {
            setLoading(false)
        }
    }

    async function updateWorkspace() {
        if (!workspace) return
        try {
            setSaving(true)
            const { error } = await supabase
                .from('workspaces')
                .update({ name: name })
                .eq('id', workspace.id)

            if (error) throw error

            setWorkspace({ ...workspace, name })
            workspaceEvents.emit('workspace-updated', { id: workspace.id, name })
            fetch(`/api/revalidate?path=/dashboard&path=/settings`)
            router.refresh()

            toast.success("Workspace updated")
        } catch (error) {
            toast.error("Failed to update workspace")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-600 mx-auto" />
                    <p className="text-sm text-slate-500">Loading workspace...</p>
                </div>
            </div>
        )
    }

    if (!workspace) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Building className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">No Workspace Found</h3>
                    <p className="text-sm text-slate-500">You don't have any workspace yet.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Workspace Name Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Building className="w-4 h-4 text-slate-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Workspace Name</h3>
                </div>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    className="bg-white border-slate-200"
                    style={{ backgroundColor: 'white' }}
                />
                <p className="text-xs text-slate-500 mt-2">
                    The name of your workspace visible to all members.
                </p>
            </div>

            {/* Workspace ID Section (Read-only info) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <span className="text-xs font-mono text-slate-600">#</span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Workspace ID</h3>
                </div>
                <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-sm text-slate-600">
                    {workspace.id}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Your unique workspace identifier. Use this for API integrations.
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                    variant="outline"
                    className="h-10 px-5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() => setName(workspace?.name || "")}
                >
                    Cancel
                </Button>
                <Button
                    onClick={updateWorkspace}
                    disabled={saving}
                    className="h-10 px-5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium shadow-lg shadow-violet-200"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Check className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
