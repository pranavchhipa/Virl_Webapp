'use client'

import { useState, useEffect } from 'react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import { Bell, Loader2, Check, Users, Sparkles, FolderKanban, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function NotificationsSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [preferences, setPreferences] = useState({
        // Workspace & Projects
        workspace_invites: true,
        project_invites: true,
        project_assignment: true,
        new_assets: true,
        mentions: true,

        // Task Management
        task_assigned: true,
        task_due_soon: true,
        task_comments: true,

        // Project Updates
        project_created: true,
        project_archived: true,
        project_deleted: true,
        project_role_changed: true,

        // Security & Access
        workspace_role_changed: true,
        removed_from_workspace: true,
        removed_from_project: true,
        member_added: true,
        member_removed: true,
    })

    useEffect(() => {
        loadPreferences()
    }, [])

    async function loadPreferences() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase.from('profiles').select('notification_preferences').eq('id', user.id).single()

        if (data?.notification_preferences) {
            setPreferences({ ...preferences, ...data.notification_preferences as any })
        }
        setLoading(false)
    }

    async function savePreferences() {
        setSaving(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase.from('profiles').update({
            notification_preferences: preferences
        }).eq('id', user.id)

        if (error) {
            console.error(error)
            toast.error("Failed to save preferences")
        } else {
            toast.success("Preferences saved successfully")
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-600 mx-auto" />
                    <p className="text-sm text-slate-500">Loading preferences...</p>
                </div>
            </div>
        )
    }

    const NotificationToggle = ({ id, title, description, checked, onChange }: any) => (
        <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
            <div className="space-y-0.5 flex-1 pr-4">
                <Label htmlFor={id} className="text-sm font-medium text-slate-900 cursor-pointer">{title}</Label>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
            <Switch
                id={id}
                checked={checked}
                onCheckedChange={onChange}
            />
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Workspace & Projects */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Workspace & Projects</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Notifications about workspace and project membership</p>
                </div>
                <div className="px-6">
                    <NotificationToggle
                        id="workspace_invites"
                        title="Workspace Invites"
                        description="Receive emails when you are invited to a new workspace"
                        checked={preferences.workspace_invites}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, workspace_invites: checked }))}
                    />
                    <NotificationToggle
                        id="project_invites"
                        title="Project Invites"
                        description="When you're invited to join a project via email"
                        checked={preferences.project_invites}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, project_invites: checked }))}
                    />
                    <NotificationToggle
                        id="project_assignment"
                        title="Project Assignments"
                        description="When you are added to a new project"
                        checked={preferences.project_assignment}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, project_assignment: checked }))}
                    />
                    <NotificationToggle
                        id="new_assets"
                        title="New Asset Uploads"
                        description="When a team member uploads a file to your project"
                        checked={preferences.new_assets}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, new_assets: checked }))}
                    />
                    <NotificationToggle
                        id="mentions"
                        title="Mentions & Comments"
                        description="When someone mentions you in a comment or chat"
                        checked={preferences.mentions}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, mentions: checked }))}
                    />
                </div>
            </div>

            {/* Task Management */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Task Management</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Stay updated on your tasks and deadlines</p>
                </div>
                <div className="px-6">
                    <NotificationToggle
                        id="task_assigned"
                        title="Task Assignments"
                        description="When you're assigned a new task"
                        checked={preferences.task_assigned}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, task_assigned: checked }))}
                    />
                    <NotificationToggle
                        id="task_due_soon"
                        title="Task Due Soon"
                        description="Reminders for upcoming task deadlines (24 hours before)"
                        checked={preferences.task_due_soon}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, task_due_soon: checked }))}
                    />
                    <NotificationToggle
                        id="task_comments"
                        title="Task Comments"
                        description="When someone comments on your assigned tasks"
                        checked={preferences.task_comments}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, task_comments: checked }))}
                    />
                </div>
            </div>

            {/* Project Updates */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                            <FolderKanban className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Project Updates</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Important changes to projects you're part of</p>
                </div>
                <div className="px-6">
                    <NotificationToggle
                        id="project_created"
                        title="New Projects"
                        description="When a new project is created in your workspace"
                        checked={preferences.project_created}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, project_created: checked }))}
                    />
                    <NotificationToggle
                        id="project_archived"
                        title="Project Archived"
                        description="When a project you're in is archived"
                        checked={preferences.project_archived}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, project_archived: checked }))}
                    />
                    <NotificationToggle
                        id="project_deleted"
                        title="Project Deleted"
                        description="When a project you're in is permanently deleted"
                        checked={preferences.project_deleted}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, project_deleted: checked }))}
                    />
                    <NotificationToggle
                        id="project_role_changed"
                        title="Project Role Changed"
                        description="When your role in a project is updated"
                        checked={preferences.project_role_changed}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, project_role_changed: checked }))}
                    />
                </div>
            </div>

            {/* Security & Access */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center">
                            <Shield className="w-3.5 h-3.5 text-red-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Security & Access</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Critical security and access changes</p>
                </div>
                <div className="px-6">
                    <NotificationToggle
                        id="workspace_role_changed"
                        title="Workspace Role Changed"
                        description="When your workspace role is updated"
                        checked={preferences.workspace_role_changed}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, workspace_role_changed: checked }))}
                    />
                    <NotificationToggle
                        id="removed_from_workspace"
                        title="Removed from Workspace"
                        description="When you're removed from a workspace"
                        checked={preferences.removed_from_workspace}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, removed_from_workspace: checked }))}
                    />
                    <NotificationToggle
                        id="removed_from_project"
                        title="Removed from Project"
                        description="When you're removed from a project"
                        checked={preferences.removed_from_project}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, removed_from_project: checked }))}
                    />
                    <NotificationToggle
                        id="member_added"
                        title="New Team Members"
                        description="When new members join your workspace or project"
                        checked={preferences.member_added}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, member_added: checked }))}
                    />
                    <NotificationToggle
                        id="member_removed"
                        title="Members Removed"
                        description="When team members are removed from workspace or project"
                        checked={preferences.member_removed}
                        onChange={(checked: boolean) => setPreferences(p => ({ ...p, member_removed: checked }))}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                    variant="outline"
                    className="h-10 px-5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={loadPreferences}
                >
                    Cancel
                </Button>
                <Button
                    onClick={savePreferences}
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
