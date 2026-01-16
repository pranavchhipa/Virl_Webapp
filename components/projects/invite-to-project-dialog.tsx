'use client'

import { useState, useEffect } from 'react'
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail } from 'lucide-react'
import { inviteUserAction } from '@/app/actions/team'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'

export function InviteToProjectDialog({ onInviteSent }: { onInviteSent?: () => void }) {
    const params = useParams()
    const projectId = params?.id as string
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)

    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState("")
    const [role, setRole] = useState("editor")
    const [sending, setSending] = useState(false)

    useEffect(() => {
        if (open && !workspaceId) {
            fetchWorkspaceId()
        }
    }, [open])

    async function fetchWorkspaceId() {
        const supabase = createClient()
        const { data } = await supabase.from('projects').select('workspace_id').eq('id', projectId).single()
        if (data) {
            setWorkspaceId(data.workspace_id)
        }
    }

    async function handleInvite() {
        if (!email || !workspaceId) return

        setSending(true)
        try {
            const result = await inviteUserAction({
                email,
                role: 'member', // Default workspace role
                workspaceId,
                autoAssignProjectId: projectId,
                projectRole: role
            })

            if (result.success) {
                toast.success("Invite sent successfully")
                setOpen(false)
                setEmail("")
                if (onInviteSent) onInviteSent()
            } else {
                toast.error(result.error || "Failed to send invite")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setSending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="!bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm transition-all hover:scale-[1.02]"
                >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335" />
                    </svg>
                    Invite by Email
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite to Project</DialogTitle>
                    <DialogDescription>
                        Invite a new user via email. They will be added to the workspace and this project.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input
                            placeholder="colleague@company.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Project Role</Label>
                        <Select value={role} onValueChange={setRole}>
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
                    <Button onClick={handleInvite} disabled={sending || !email || !workspaceId}>
                        {sending ? 'Sending...' : 'Send Invite'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
