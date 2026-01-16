"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function CreateWorkspaceDialog() {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Please enter a workspace name")
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error("You must be logged in")
                return
            }

            // Create workspace
            const { data: workspace, error: workspaceError } = await supabase
                .from('workspaces')
                .insert({ name: name.trim(), owner_id: user.id })
                .select()
                .single()

            if (workspaceError) throw workspaceError

            // Add user as member
            const { error: memberError } = await supabase
                .from('workspace_members')
                .insert({
                    workspace_id: workspace.id,
                    user_id: user.id,
                    role: 'owner'
                })

            if (memberError) throw memberError

            toast.success("Workspace created successfully!")
            setName("")
            setOpen(false)

            // Store and navigate to new workspace instantly
            localStorage.setItem('selectedWorkspaceId', workspace.id)
            const url = new URL(window.location.href)
            url.searchParams.set('workspace', workspace.id)
            window.location.href = url.pathname + url.search
        } catch (error: any) {
            console.error("Error creating workspace:", error)
            toast.error(error.message || "Failed to create workspace")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start font-normal h-8"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Workspace
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Workspace</DialogTitle>
                    <DialogDescription>
                        Create a new workspace to organize your projects and collaborate with your team.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Workspace Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. My Agency, Personal Projects"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                e.stopPropagation() // Prevent Select from capturing keystrokes
                                if (e.key === 'Enter' && !loading) {
                                    handleCreate()
                                }
                            }}
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={loading || !name.trim()}
                        className="bg-violet-600 hover:bg-violet-700"
                    >
                        {loading ? "Creating..." : "Create Workspace"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
