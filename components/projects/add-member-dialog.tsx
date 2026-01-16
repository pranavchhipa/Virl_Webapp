'use client'

import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { UserPlus } from 'lucide-react'
import { getAvailableWorkspaceMembers, addProjectMember } from '@/app/actions/project-members'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'

export function AddMemberDialog({ onMemberAdded }: { onMemberAdded: () => void }) {
    const params = useParams()
    const projectId = params?.id as string

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [availableMembers, setAvailableMembers] = useState<any[]>([])
    const [selectedUserId, setSelectedUserId] = useState<string>('')
    const [role, setRole] = useState<'manager' | 'editor' | 'contributor' | 'viewer'>('editor')

    useEffect(() => {
        if (open) {
            fetchAvailableMembers()
        }
    }, [open])

    async function fetchAvailableMembers() {
        setLoading(true)
        const members = await getAvailableWorkspaceMembers(projectId)
        setAvailableMembers(members)
        setLoading(false)
    }

    async function handleSubmit() {
        if (!selectedUserId) {
            toast.error("Please select a member")
            return
        }

        setSubmitting(true)
        const result = await addProjectMember({
            projectId,
            userId: selectedUserId,
            role
        })

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Member added to project")
            setOpen(false)
            onMemberAdded()
            setSelectedUserId('')
            setRole('editor')
        }
        setSubmitting(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Project Member</DialogTitle>
                    <DialogDescription>
                        Select a member from your workspace to add to this project.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Select Member</Label>
                        {loading ? (
                            <div className="h-10 w-full animate-pulse bg-slate-100 rounded-md"></div>
                        ) : availableMembers.length === 0 ? (
                            <div className="text-sm text-slate-500 py-2 bg-slate-50 p-3 rounded-md border border-slate-100">
                                No available members found. Invite them to the workspace first.
                            </div>
                        ) : (
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a member..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMembers.map(member => (
                                        <SelectItem key={member.id} value={member.id}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={member.avatar_url} />
                                                    <AvatarFallback>{member.full_name?.[0] || member.email[0]}</AvatarFallback>
                                                </Avatar>
                                                <span>{member.full_name || member.email}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={role} onValueChange={(val: any) => setRole(val)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manager">
                                    <div className="flex flex-col text-left">
                                        <span className="font-medium">Manager</span>
                                        <span className="text-xs text-slate-500">Full control, manage team & settings</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="editor">
                                    <div className="flex flex-col text-left">
                                        <span className="font-medium">Editor</span>
                                        <span className="text-xs text-slate-500">Edit assets, manage tasks</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="contributor">
                                    <div className="flex flex-col text-left">
                                        <span className="font-medium">Contributor</span>
                                        <span className="text-xs text-slate-500">Upload assets, create tasks</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="viewer">
                                    <div className="flex flex-col text-left">
                                        <span className="font-medium">Viewer</span>
                                        <span className="text-xs text-slate-500">View only, can comment</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting || !selectedUserId} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {submitting ? 'Adding...' : 'Add Member'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
