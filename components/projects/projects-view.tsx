"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ProjectCard } from "@/components/dashboard/project-card"
import { Plus, Archive, Trash2, Undo2, Search, Filter, Sparkles, FolderKanban } from "lucide-react"
import { restoreProject, deleteProject } from "@/app/actions/projects"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateProjectDialog } from "./create-project-dialog"
import { useSearchParams } from "next/navigation"
import { EmptyWorkspaceState } from "@/components/empty-workspace-state"
import { workspaceEvents } from "@/lib/workspace-events"
import { motion, AnimatePresence } from "framer-motion"


interface ProjectsViewProps {
    initialProjects: any[]
}

export function ProjectsView({ initialProjects }: ProjectsViewProps) {
    const projects = initialProjects
    const [activeTab, setActiveTab] = useState("active")
    const [searchQuery, setSearchQuery] = useState("")
    const router = useRouter()
    const searchParams = useSearchParams()
    const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null)

    // Initialize workspace from URL or localStorage
    useEffect(() => {
        const workspaceId = searchParams?.get('workspace') ||
            (typeof window !== 'undefined' ? localStorage.getItem('selectedWorkspaceId') : null)
        setCurrentWorkspace(workspaceId)
    }, [searchParams])

    // Listen for workspace changes
    useEffect(() => {
        const unsubscribe = workspaceEvents.subscribe('workspace-switched', (data) => {
            if (data?.workspaceId) {
                setCurrentWorkspace(data.workspaceId)
            }
        })
        return unsubscribe
    }, [])


    // Filter projects by selected workspace - with fallback to all projects
    const workspaceProjects = currentWorkspace
        ? projects.filter((p: any) => p.workspace_id === currentWorkspace)
        : projects

    // If filtering results in empty but we have projects, show all projects
    const displayProjects = workspaceProjects.length > 0 ? workspaceProjects : projects

    const activeProjects = displayProjects.filter((p: any) => p.status !== 'archived')
    const archivedProjects = displayProjects.filter((p: any) => p.status === 'archived')

    const filteredActive = activeProjects.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const handleRestore = async (projectId: string) => {
        const res = await restoreProject(projectId)
        if (res.error) toast.error(res.error)
        else {
            toast.success("Project restored")
            router.refresh()
        }
    }

    const handleDelete = async (projectId: string) => {
        if (!confirm("Delete permanently? This cannot be undone.")) return
        const res = await deleteProject(projectId)
        if (res.error) toast.error(res.error)
        else {
            toast.success("Project deleted")
            router.refresh()
        }
    }

    return (
        <div className="flex-1 space-y-8">
            {/* Modern Header */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-3">
                            <FolderKanban className="w-3.5 h-3.5" />
                            {activeTab === 'active' ? `${filteredActive.length} Active` : `${archivedProjects.length} Archived`}
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Projects
                        </h2>
                        <p className="text-slate-600 mt-2">Manage and track all your client projects</p>
                    </div>
                    <CreateProjectDialog />
                </div>

                {/* Enhanced Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                        <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                            <TabsTrigger
                                value="active"
                                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6"
                            >
                                Active
                            </TabsTrigger>
                            <TabsTrigger
                                value="archived"
                                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6"
                            >
                                Archived
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search projects..."
                            className="pl-10 border-slate-200 focus:border-indigo-300 focus:ring-indigo-100"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content Grid with Animation */}
            <AnimatePresence mode="wait">
                {activeTab === 'active' ? (
                    filteredActive.length === 0 && activeProjects.length === 0 ? (
                        <EmptyWorkspaceState />
                    ) : (
                        <motion.div
                            key="active-grid"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {filteredActive.length === 0 ? (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                                    <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Search className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <h3 className="font-semibold text-xl text-slate-900">No projects found</h3>
                                    <p className="text-slate-500 text-sm max-w-sm mt-2">
                                        Try adjusting your search or create a new project to get started.
                                    </p>
                                </div>
                            ) : (
                                filteredActive.map((project: any, index: number) => (
                                    <motion.div
                                        key={project.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.3 }}
                                    >
                                        <ProjectCard
                                            id={project.id}
                                            title={project.name}
                                            description={project.description || undefined}
                                            client="Client"
                                            status={project.status}
                                            startDate={project.start_date || project.created_at || undefined}
                                            dueDate={project.due_date || undefined}
                                            priority={project.priority}
                                            team={["User"]}
                                        />
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )
                ) : (
                    <motion.div
                        key="archived-grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {archivedProjects.length === 0 ? (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                                <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                    <Archive className="h-8 w-8 text-slate-400" />
                                </div>
                                <h3 className="font-semibold text-xl text-slate-900">No archived projects</h3>
                                <p className="text-slate-500 text-sm">Archive is empty</p>
                            </div>
                        ) : (
                            archivedProjects.map((project: any, index: number) => (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                    className="group relative rounded-2xl border-2 border-red-200 bg-red-50/50 overflow-hidden hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2">
                                                <h3 className="font-bold text-xl leading-none text-slate-900">{project.name}</h3>
                                                <p className="text-xs text-red-600 uppercase font-bold tracking-wider flex items-center gap-1.5">
                                                    <Archive className="h-3 w-3" />
                                                    Archived
                                                </p>
                                            </div>
                                        </div>
                                        {project.description && (
                                            <p className="text-sm text-slate-600 line-clamp-2">{project.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 gap-2 border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400 transition-all"
                                                onClick={() => handleRestore(project.id)}
                                            >
                                                <Undo2 className="h-4 w-4" /> Restore
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 gap-2 border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400 transition-all"
                                                onClick={() => handleDelete(project.id)}
                                            >
                                                <Trash2 className="h-4 w-4" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
