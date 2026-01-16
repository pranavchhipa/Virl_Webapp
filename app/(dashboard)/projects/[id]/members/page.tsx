'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Users, Plus, Edit, Eye, Trash2, Mail, Crown, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AddMemberDialog } from '@/components/projects/add-member-dialog'
import { InviteToProjectDialog } from '@/components/projects/invite-to-project-dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getProjectMembers, removeProjectMember, updateProjectMemberRole, getCurrentUserPermissions } from '@/app/actions/project-members'

interface Member {
    id: string
    user_id: string
    role: string
    created_at: string
    profiles: {
        full_name: string | null
        email: string
        avatar_url: string | null
    }
}

const ROLE_ICONS = {
    manager: Crown,
    editor: Edit,
    contributor: Plus,
    viewer: Eye,
}

const ROLE_COLORS = {
    manager: 'text-amber-600 bg-amber-50 border-amber-200',
    editor: 'text-blue-600 bg-blue-50 border-blue-200',
    contributor: 'text-green-600 bg-green-50 border-green-200',
    viewer: 'text-slate-600 bg-slate-50 border-slate-200',
}

export default function ProjectMembersPage() {
    const params = useParams()
    const projectId = params?.id as string

    if (!projectId) return null

    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [canManage, setCanManage] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [memberToRemove, setMemberToRemove] = useState<{ id: string, name: string, email: string } | null>(null)
    const [removing, setRemoving] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        loadMembers()
    }, [projectId])

    async function loadMembers() {
        setLoading(true)

        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setCurrentUserId(user.id)

        const [membersData, permissions] = await Promise.all([
            getProjectMembers(projectId),
            getCurrentUserPermissions(projectId)
        ])
        setMembers(membersData)
        setCanManage(permissions.canManage)
        setLoading(false)
    }

    async function handleRemoveMember() {
        if (!memberToRemove) return

        setRemoving(true)
        try {
            const result = await removeProjectMember(memberToRemove.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`${memberToRemove.name} removed from project`)
                setMemberToRemove(null)
                loadMembers()
            }
        } catch (error) {
            toast.error('Failed to remove member')
        } finally {
            setRemoving(false)
        }
    }

    async function handleRoleChange(memberId: string, newRole: string) {
        const result = await updateProjectMemberRole({
            memberId,
            role: newRole as 'manager' | 'editor' | 'contributor' | 'viewer'
        })

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Role updated")
            loadMembers()
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <Link
                    href={`/projects`}
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Projects
                </Link>

                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">Project Members</h2>
                            <p className="text-slate-600 mt-2">
                                Manage who can access this project
                            </p>
                        </div>
                        {canManage && (
                            <div className="flex gap-2">
                                <AddMemberDialog onMemberAdded={loadMembers} />
                                <InviteToProjectDialog onInviteSent={loadMembers} />
                            </div>
                        )}
                    </div>

                    {/* Members List */}
                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                        {members.length === 0 ? (
                            <div className="p-12 text-center">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    No members yet
                                </h3>
                                <p className="text-slate-600">
                                    Members will appear here when assigned to this project
                                </p>
                            </div>
                        ) : (
                            members.map((member) => {
                                const RoleIcon = ROLE_ICONS[member.role as keyof typeof ROLE_ICONS]
                                const roleColor = ROLE_COLORS[member.role as keyof typeof ROLE_COLORS]

                                return (
                                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                                                {member.profiles.full_name?.[0]?.toUpperCase() || member.profiles.email[0].toUpperCase()}
                                            </div>

                                            {/* Info */}
                                            <div>
                                                <div className="font-medium text-slate-900">
                                                    {member.profiles.full_name || 'Unnamed User'}
                                                </div>
                                                <div className="text-sm text-slate-600 flex items-center gap-2">
                                                    <Mail className="w-3 h-3" />
                                                    {member.profiles.email}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Role Badge - Editable via Logic */}
                                            {canManage ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="focus:outline-none">
                                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${roleColor} cursor-pointer hover:opacity-80 transition-opacity`}>
                                                            {RoleIcon && <RoleIcon className="w-4 h-4" />}
                                                            <span className="text-sm font-medium capitalize">
                                                                {member.role}
                                                            </span>
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'manager')}>
                                                            Manager
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'editor')}>
                                                            Editor
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'contributor')}>
                                                            Contributor
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'viewer')}>
                                                            Viewer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${roleColor} opacity-80`}>
                                                    {RoleIcon && <RoleIcon className="w-4 h-4" />}
                                                    <span className="text-sm font-medium capitalize">
                                                        {member.role}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Remove Button */}
                                            {canManage && member.user_id !== currentUserId && (
                                                <button
                                                    onClick={() => setMemberToRemove({
                                                        id: member.id,
                                                        name: member.profiles?.full_name || 'Unknown',
                                                        email: member.profiles?.email || ''
                                                    })}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remove member"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Remove Member Confirmation Dialog */}
            <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">⚠️ Remove Team Member?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3" asChild>
                            <div>
                                <div className="font-medium text-slate-900">
                                    You are about to remove <span className="font-bold">{memberToRemove?.name}</span> from this project.
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="text-red-700 text-sm">
                                        They will lose access to all project tasks, assets, and chat conversations.
                                        This action cannot be undone.
                                    </div>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveMember}
                            disabled={removing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {removing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                'Yes, Remove Member'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
