"use client"

import { useState, useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, UserPlus, Crown, Shield } from "lucide-react"
import { addProjectMember, removeProjectMemberByUser } from "@/app/actions/project-members"
import { toast } from "sonner"

interface Profile {
    id: string
    full_name: string
    avatar_url?: string
    email?: string
    role?: string // from join
}

interface TeamManagerProps {
    projectId: string
    currentMembers: Profile[]
    availableMembers: Profile[]
}

export function TeamManager({ projectId, currentMembers, availableMembers }: TeamManagerProps) {
    const [isPending, startTransition] = useTransition()
    const [selectedUserId, setSelectedUserId] = useState<string>("")
    const [selectedRole, setSelectedRole] = useState<string>("viewer")

    const handleAddMember = () => {
        if (!selectedUserId) return

        startTransition(async () => {
            const res = await addProjectMember({ projectId, userId: selectedUserId, role: selectedRole as any })
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Member added to project")
                setSelectedUserId("")
            }
        })
    }

    const handleRemoveMember = (userId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return

        startTransition(async () => {
            const res = await removeProjectMemberByUser(projectId, userId)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Member removed from project")
            }
        })
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'lead': return 'bg-purple-100 text-purple-700'
            case 'editor': return 'bg-blue-100 text-blue-700'
            case 'viewer': return 'bg-gray-100 text-gray-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Team</CardTitle>
                <CardDescription>Manage who has access to this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* List Members */}
                <div className="space-y-4">
                    {currentMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={member.avatar_url} />
                                    <AvatarFallback>{member.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">{member.full_name}</p>
                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary" className={getRoleBadgeColor(member.role || 'viewer')}>
                                    {member.role === 'lead' && <Crown className="w-3 h-3 mr-1" />}
                                    {member.role === 'editor' && <Shield className="w-3 h-3 mr-1" />}
                                    {member.role}
                                </Badge>

                                {member.role !== 'lead' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                        onClick={() => handleRemoveMember(member.id)}
                                        disabled={isPending}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}

                    {currentMembers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No members assigned yet.</p>
                    )}
                </div>

                {/* Add Member Section */}
                <div className="pt-6 border-t">
                    <h4 className="text-sm font-medium mb-3">Add Team Member</h4>
                    <div className="flex items-center gap-2">
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select colleague" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableMembers.map(m => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.full_name}
                                    </SelectItem>
                                ))}
                                {availableMembers.length === 0 && (
                                    <SelectItem value="none" disabled>No other workspace members</SelectItem>
                                )}
                            </SelectContent>
                        </Select>

                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={handleAddMember}
                            disabled={!selectedUserId || isPending || availableMembers.length === 0}
                            className="gap-2"
                        >
                            <UserPlus className="h-4 w-4" />
                            Add
                        </Button>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
