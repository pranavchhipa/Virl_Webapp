"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProjectFromIdea } from "@/app/actions/projects"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ProjectCreationModalProps {
    children: React.ReactNode
}

export function ProjectCreationModal({ children }: ProjectCreationModalProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        assigneeId: "me"
    })

    const handleCreate = async () => {
        if (!formData.title) return

        setIsSubmitting(true)
        try {
            const res = await createProjectFromIdea({
                title: formData.title,
                description: formData.description,
                assigneeId: formData.assigneeId
            })

            if (res.error) {
                toast.error(res.message || "Failed to create project")
            } else {
                toast.success("Project launched successfully!")
                setOpen(false)
                setFormData({ title: "", description: "", assigneeId: "me" })
                // If we have a projectId, maybe navigate there?
                if (res.projectId) {
                    router.push(`/projects/${res.projectId}`)
                }
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Launch New Project</DialogTitle>
                    <DialogDescription>
                        Start a new social media campaign.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Project Name</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Summer Collection Launch"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Campaign Goal (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Briefly describe the campaign strategy..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Assign Leader</Label>
                        <Select value={formData.assigneeId} onValueChange={(val) => setFormData({ ...formData, assigneeId: val })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="me">Myself</SelectItem>
                                {/* Future: Map real team members */}
                                <SelectItem value="editor">Editor Team</SelectItem>
                                <SelectItem value="strategy">Strategy Lead</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={!formData.title || isSubmitting}>
                        {isSubmitting ? "Launching..." : "Launch Project"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
