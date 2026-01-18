'use client'

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useRef, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Trash2, Mail, Shield, UserPlus, RefreshCw, Check, Users, X } from "lucide-react"
import { inviteUserAction, resendInviteAction, cancelInviteAction } from "@/app/actions/team"
import { updateWorkspaceMemberRole, removeMemberFromWorkspace } from "@/app/actions/workspace-members"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TeamMember {
    id: string
    user_id: string
    role: string
    user: {
        id: string
        full_name: string
        email: string
        avatar_url: string
    }
}

interface Invite {
    id: string
    email: string
    role: string
    created_at: string
}

export default function TeamSettingsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [team, setTeam] = useState<TeamMember[]>([])
    const [invites, setInvites] = useState<Invite[]>([])
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)

    // Actions State
    const [updatingRole, setUpdatingRole] = useState<string | null>(null)
    const [memberToRemove, setMemberToRemove] = useState<{ id: string, name: string, email: string } | null>(null)
    const [removing, setRemoving] = useState(false)

    // Invite State
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteRole, setInviteRole] = useState("member")
    const [inviting, setInviting] = useState(false)
    const [resendingId, setResendingId] = useState<string | null>(null)
    const [cancellingId, setCancellingId] = useState<string | null>(null)

    const searchParams = useSearchParams()
    const workspaceIdParam = searchParams.get('workspace')

    useEffect(() => {
        fetchTeamData()
    }, [workspaceIdParam]) // Refetch when URL parameter changes

    async function fetchTeamData() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let workspaceId = workspaceIdParam
            let myRole = null

            // 1. Resolve Workspace ID
            if (workspaceId) {
                // Verify access
                const { data: membership } = await supabase
                    .from('workspace_members')
                    .select('role')
                    .eq('workspace_id', workspaceId)
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (membership) {
                    myRole = membership.role
                } else {
                    // Access denied or not a member - reset to safe default
                    workspaceId = null
                }
            }

            // Fallback if no URL param or invalid
            if (!workspaceId) {
                const { data: myMembership } = await supabase
                    .from('workspace_members')
                    .select('workspace_id, role')
                    .eq('user_id', user.id)
                    .limit(1)
                    .maybeSingle()

                if (!myMembership) {
                    setLoading(false)
                    return
                }
                workspaceId = myMembership.workspace_id
                myRole = myMembership.role
            }

            setCurrentWorkspaceId(workspaceId)
            setCurrentUserRole(myRole)

            if (!workspaceId) return

            // 2. Fetch Team Members
            const { data: members, error: membersError } = await supabase
                .from('workspace_members')
                .select(`
                    id,
                    user_id,
                    role,
                    profiles:user_id (
                        id,
                        full_name,
                        email,
                        avatar_url
                    )
                `)
                .eq('workspace_id', workspaceId)
                .order('role', { ascending: true })

            if (membersError) throw membersError

            // 3. Fetch Pending Invites
            const { data: pendingInvites, error: invitesError } = await supabase
                .from('workspace_invites')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false })

            if (invitesError) throw invitesError

            // Transform Members
            const formattedMembers = members.map((m: any) => ({
                id: m.id,
                user_id: m.user_id,
                role: m.role,
                user: {
                    id: m.profiles?.id,
                    full_name: m.profiles?.full_name,
                    email: m.profiles?.email,
                    avatar_url: m.profiles?.avatar_url
                }
            }))

            // Sort: Owner > Admin > Member
            const roleOrder = { owner: 0, admin: 1, member: 2 }
            formattedMembers.sort((a, b) => (roleOrder[a.role as keyof typeof roleOrder] ?? 99) - (roleOrder[b.role as keyof typeof roleOrder] ?? 99))

            setTeam(formattedMembers)
            setInvites(pendingInvites || [])

        } catch (error) {
            console.error(error)
            toast.error("Failed to load team data")
        } finally {
            setLoading(false)
        }
    }

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault()
        if (!currentWorkspaceId || !inviteEmail) return

        setInviting(true)
        try {
            const result = await inviteUserAction({
                email: inviteEmail,
                role: inviteRole,
                workspaceId: currentWorkspaceId
            })

            if (result.success) {
                toast.success(result.message)
                setIsInviteOpen(false)
                setInviteEmail("")
                setInviteRole("member")
                fetchTeamData()
            } else {
                toast.error(result.error || "Failed to invite user")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setInviting(false)
        }
    }

    async function handleResendInvite(inviteId: string) {
        setResendingId(inviteId)
        try {
            const result = await resendInviteAction(inviteId)
            if (result.success) {
                toast.success("Invite resent successfully")
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("Failed to resend invite")
        } finally {
            setResendingId(null)
        }
    }

    async function handleCancelInvite(inviteId: string) {
        setCancellingId(inviteId)
        try {
            const result = await cancelInviteAction(inviteId)
            if (result.success) {
                toast.success("Invite cancelled")
                fetchTeamData()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("Failed to cancel invite")
        } finally {
            setCancellingId(null)
        }
    }

    async function handleRoleChange(userId: string, newRole: string) {
        if (!currentWorkspaceId) return

        setUpdatingRole(userId)
        try {
            const result = await updateWorkspaceMemberRole(currentWorkspaceId, userId, newRole)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Role updated to ${newRole}`)
                fetchTeamData() // Refresh list
            }
        } catch (error) {
            toast.error("Failed to update role")
        } finally {
            setUpdatingRole(null)
        }
    }

    async function handleRemoveMember() {
        if (!memberToRemove || !currentWorkspaceId) return

        setRemoving(true)
        try {
            const result = await removeMemberFromWorkspace(currentWorkspaceId, memberToRemove.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Member removed from workspace")
                setMemberToRemove(null)
                fetchTeamData()
            }
        } catch (error) {
            toast.error("Failed to remove member")
        } finally {
            setRemoving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Team Settings</h2>
                    <p className="text-slate-500">Manage your workspace members and invitations.</p>
                </div>
                {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setIsInviteOpen(true)}
                            className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200/50 transition-all hover:scale-[1.02]"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Member
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsInviteOpen(true)}
                            className="!bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm transition-all hover:scale-[1.02]"
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335" />
                            </svg>
                            Invite by Email
                        </Button>

                        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Invite Team Member</DialogTitle>
                                    <DialogDescription>
                                        Send an invitation to join your workspace.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleInvite} className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="colleague@company.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select value={inviteRole} onValueChange={setInviteRole}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="member">Member</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-slate-500">
                                            Admins can manage members and billing. Members can only access projects.
                                        </p>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={inviting} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700">
                                            {inviting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending Invite...
                                                </>
                                            ) : (
                                                'Send Invitation'
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {/* Active Members */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        Active Members
                    </h3>
                    <span className="text-xs text-slate-500 font-medium px-2.5 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                        {team.length} {team.length === 1 ? 'member' : 'members'}
                    </span>
                </div>
                <div className="divide-y divide-slate-100">
                    {team.map((member) => (
                        <div key={member.id} className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                    <AvatarImage src={member.user?.avatar_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-semibold">
                                        {member.user?.full_name?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-slate-900">{member.user?.full_name || 'Unknown'}</p>
                                        {member.user_id === team.find(m => m.role === 'owner')?.user_id && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200">OWNER</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500">{member.user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Role Display / Editor */}
                                {(currentUserRole === 'owner' || currentUserRole === 'admin') && member.role !== 'owner' ? (
                                    <Select
                                        defaultValue={member.role}
                                        onValueChange={(val) => handleRoleChange(member.user_id, val)}
                                        disabled={updatingRole === member.user_id}
                                    >
                                        <SelectTrigger className="h-8 w-[110px] text-xs font-semibold border-0 bg-white shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 text-slate-700 focus:ring-violet-500">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="member">Member</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${member.role === 'owner'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : member.role === 'admin'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                        {member.role === 'owner' && <Shield className="h-3 w-3 mr-1.5" />}
                                        {member.role === 'admin' ? 'Admin' : member.role === 'member' ? 'Member' : member.role}
                                    </span>
                                )}

                                {/* Remove Button */}
                                {(currentUserRole === 'owner' || currentUserRole === 'admin') && member.role !== 'owner' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setMemberToRemove({
                                            id: member.user_id,
                                            name: member.user?.full_name || 'Unknown',
                                            email: member.user?.email || ''
                                        })}
                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending Invites */}
            {(currentUserRole === 'owner' || currentUserRole === 'admin') && invites.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            Pending Invites
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {invites.map((invite) => (
                            <div key={invite.id} className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{invite.email}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-slate-500 capitalize">{invite.role}</span>
                                            <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-100 font-medium">Pending</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleResendInvite(invite.id)}
                                        disabled={resendingId === invite.id}
                                        className="h-8 text-xs font-medium border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                    >
                                        {resendingId === invite.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <>
                                                <RefreshCw className="mr-1.5 h-3 w-3" />
                                                Resend
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleCancelInvite(invite.id)}
                                        disabled={cancellingId === invite.id}
                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        {cancellingId === invite.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <X className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Remove Member Dialog */}
            <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-center text-xl">Remove Team Member?</AlertDialogTitle>
                        <AlertDialogDescription className="text-center space-y-3" asChild>
                            <div>
                                <div className="text-sm text-muted-foreground">
                                    You are about to remove <span className="font-semibold text-slate-900">{memberToRemove?.name}</span> from your workspace.
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
                                    <div className="text-red-700 text-sm">
                                        They will lose access to all projects and data. This action cannot be undone.
                                    </div>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-3">
                        <AlertDialogCancel disabled={removing} className="rounded-xl h-10">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveMember}
                            disabled={removing}
                            className="bg-red-600 hover:bg-red-700 rounded-xl h-10"
                        >
                            {removing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                'Yes, Remove'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
