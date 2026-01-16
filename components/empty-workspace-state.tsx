import { FolderOpen, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function EmptyWorkspaceState() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="relative">
                <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full" />
                <div className="relative bg-white/80 backdrop-blur-sm border border-violet-100 rounded-3xl p-12 shadow-xl">
                    <div className="flex flex-col items-center text-center space-y-6">
                        {/* Icon */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-violet-500/20 blur-2xl rounded-full" />
                            <div className="relative h-24 w-24 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <FolderOpen className="h-12 w-12 text-white" />
                            </div>
                        </div>

                        {/* Text */}
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-slate-800">
                                No Projects Yet
                            </h3>
                            <p className="text-slate-600 max-w-md">
                                This workspace is empty. Create your first project to start collaborating with your team.
                            </p>
                        </div>

                        {/* CTA */}
                        <Button
                            asChild
                            size="lg"
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/30 mt-4"
                        >
                            <Link href="/projects/new">
                                <Plus className="mr-2 h-5 w-5" />
                                Create Your First Project
                            </Link>
                        </Button>

                        {/* Quick Tips */}
                        <div className="mt-8 pt-8 border-t border-slate-200 w-full">
                            <p className="text-sm font-medium text-slate-700 mb-3">Quick Start Guide:</p>
                            <ul className="text-sm text-slate-600 space-y-2 text-left">
                                <li className="flex items-start gap-2">
                                    <span className="text-violet-600 font-bold">1.</span>
                                    <span>Create a project to organize your content</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-violet-600 font-bold">2.</span>
                                    <span>Invite team members to collaborate</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-violet-600 font-bold">3.</span>
                                    <span>Use Vixi AI to generate viral content ideas</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
