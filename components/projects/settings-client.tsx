"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, UserPlus, Save, AlertTriangle, Archive } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { addProjectMember, removeProjectMemberByUser } from "@/app/actions/project-members"

interface Profile {
    id: string
    full_name: string
    avatar_url?: string
    email?: string
    role?: string
    joined_at?: string
}

interface SettingsClientProps {
    project: any
    team: Profile[]
    availableMembers: Profile[]
}

export function SettingsClient({ project, team, availableMembers }: SettingsClientProps) {
    const [activeTab, setActiveTab] = useState("general")
    const router = useRouter()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Manage Project</h2>
                <p className="text-muted-foreground">Manage configuration, team access, and lifecycle.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="team">Team Access</TabsTrigger>
                    <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <GeneralSettings project={project} />
                </TabsContent>

                <TabsContent value="team" className="space-y-4">
                    <TeamSettings project={project} team={team} availableMembers={availableMembers} />
                </TabsContent>

                <TabsContent value="danger" className="space-y-4">
                    <DangerZone project={project} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function GeneralSettings({ project }: { project: any }) {
    const [name, setName] = useState(project.name)
    const [description, setDescription] = useState(project.description || "")
    const [saving, setSaving] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const handleSave = async () => {
        setSaving(true)
        const { error } = await supabase
            .from('projects')
            .update({ name, description })
            .eq('id', project.id)

        if (error) {
            toast.error("Failed to update project")
        } else {
            toast.success("Project updated successfully")
            router.refresh()
        }
        setSaving(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Update the project details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                    />
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleSave} disabled={saving} className="ml-auto">
                    {saving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                </Button>
            </CardFooter>
        </Card>
    )
}

function TeamSettings({ project, team, availableMembers }: { project: any, team: Profile[], availableMembers: Profile[] }) {
    const [selectedUserId, setSelectedUserId] = useState("")
    const [selectedRole, setSelectedRole] = useState("editor")
    const [isPending, startTransition] = useTransition()

    const handleAddMember = () => {
        if (!selectedUserId) return
        startTransition(async () => {
            const res = await addProjectMember({ projectId: project.id, userId: selectedUserId, role: selectedRole as any })
            if (res.error) toast.error(res.error)
            else {
                toast.success("Member invited")
                setSelectedUserId("")
            }
        })
    }

    const handleRemoveMember = (userId: string) => {
        if (!confirm("Remove this member?")) return
        startTransition(async () => {
            const res = await removeProjectMemberByUser(project.id, userId)
            if (res.error) toast.error(res.error)
            else toast.success("Member removed")
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Control who has access to this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Invite Section */}
                <div className="flex flex-col sm:flex-row gap-3 p-6 bg-indigo-50/30 border border-dashed border-indigo-200 rounded-xl items-end sm:items-center">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="w-full sm:w-[250px] bg-white border-indigo-200 text-slate-900 focus:ring-violet-500">
                            <SelectValue placeholder="Select team member..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                            {availableMembers.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                            ))}
                            {availableMembers.length === 0 && <SelectItem value="none" disabled>No members available</SelectItem>}
                        </SelectContent>
                    </Select>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-full sm:w-[150px] bg-white border-indigo-200 text-slate-900 focus:ring-violet-500">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAddMember} disabled={!selectedUserId || isPending} className="sm:ml-auto">
                        <UserPlus className="mr-2 h-4 w-4" /> Invite
                    </Button>
                </div>

                {/* Team Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="hidden sm:table-cell">Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {team.map((member) => (
                                <TableRow key={member.id} className="bg-white hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                                    <TableCell className="flex items-center gap-3 font-medium">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.avatar_url} />
                                            <AvatarFallback>{member.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span>{member.full_name}</span>
                                            <span className="text-xs text-muted-foreground font-normal sm:hidden">{member.role}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize font-normal text-xs">
                                            {member.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                                        {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Unknown'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {member.role !== 'lead' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                                onClick={() => handleRemoveMember(member.id)}
                                                disabled={isPending}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

function DangerZone({ project }: { project: any }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleDelete = async () => {
        if (!confirm("Are you sure? This action cannot be undone.")) return

        setLoading(true)
        const { error } = await supabase.from('projects').delete().eq('id', project.id)
        if (error) {
            toast.error("Failed to delete project")
            setLoading(false)
        } else {
            toast.success("Project deleted")
            router.push('/dashboard')
        }
    }

    return (
        <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" /> Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions for this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border bg-background rounded-lg">
                    <div>
                        <h4 className="font-semibold text-sm">Archive Project</h4>
                        <p className="text-xs text-muted-foreground">Make readonly and hide from main dashboard.</p>
                    </div>
                    <Button variant="outline" size="sm">Archive</Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-destructive/20 bg-background rounded-lg">
                    <div>
                        <h4 className="font-semibold text-sm text-destructive">Delete Project</h4>
                        <p className="text-xs text-muted-foreground">Permanently remove all assets and data.</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>Delete Project</Button>
                </div>
            </CardContent>
        </Card>
    )
}
