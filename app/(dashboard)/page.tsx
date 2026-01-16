import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Plus, Users, FolderKanban, ArrowRight, Sparkles } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get all workspaces user belongs to
    const { data: workspaceMemberships } = await supabase
        .from('workspace_members')
        .select(`
            workspace_id,
            role,
            workspaces (
                id,
                name,
                created_at
            )
        `)
        .eq('user_id', user.id)

    // Get project counts for each workspace
    const workspaceIds = workspaceMemberships?.map(m => m.workspace_id) || []
    const { data: projects } = await supabase
        .from('projects')
        .select('id, workspace_id')
        .in('workspace_id', workspaceIds)

    // Count projects per workspace
    const projectCounts = projects?.reduce((acc, p) => {
        acc[p.workspace_id] = (acc[p.workspace_id] || 0) + 1
        return acc
    }, {} as Record<string, number>) || {}

    // Count members per workspace
    const { data: memberCounts } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .in('workspace_id', workspaceIds)

    const memberCountsMap = memberCounts?.reduce((acc, m) => {
        acc[m.workspace_id] = (acc[m.workspace_id] || 0) + 1
        return acc
    }, {} as Record<string, number>) || {}

    const workspaces = workspaceMemberships?.map(m => ({
        ...(m.workspaces as any),
        role: m.role,
        projectCount: projectCounts[m.workspace_id] || 0,
        memberCount: memberCountsMap[m.workspace_id] || 0
    })) || []

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header with Gradient */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        Welcome back!
                    </div>
                    <h1 className="text-5xl font-bold text-slate-900 mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text">
                        Your Workspaces
                    </h1>
                    <p className="text-lg text-slate-600">
                        Manage multiple clients and their projects in one place
                    </p>
                </div>

                {/* Workspace Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create New Workspace Card */}
                    <Link
                        href="/workspaces/new"
                        className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 bg-white p-8 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                    >
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 group-hover:from-indigo-200 group-hover:to-blue-200 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                                <Plus className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-1 text-lg">
                                    Create Workspace
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Add a new client workspace
                                </p>
                            </div>
                        </div>

                        {/* Hover effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-blue-50/0 to-indigo-50/0 group-hover:from-indigo-50/50 group-hover:via-blue-50/50 group-hover:to-indigo-50/50 transition-all duration-300 -z-10" />
                    </Link>

                    {/* Existing Workspaces */}
                    {workspaces.map((workspace, index) => (
                        <Link
                            key={workspace.id}
                            href={`/projects?workspace=${workspace.id}`}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300 hover:scale-[1.02]"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Gradient Header */}
                            <div className="h-32 bg-gradient-to-br from-indigo-500 via-blue-500 to-indigo-600 relative overflow-hidden">
                                {/* Animated background pattern */}
                                <div className="absolute inset-0 opacity-20">
                                    <div className="absolute inset-0" style={{
                                        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                                        backgroundSize: '32px 32px'
                                    }} />
                                </div>

                                {/* Owner badge */}
                                {workspace.role === 'owner' && (
                                    <div className="absolute top-4 right-4">
                                        <span className="px-3 py-1.5 text-xs font-semibold bg-white/20 backdrop-blur-md text-white rounded-full border border-white/30">
                                            Owner
                                        </span>
                                    </div>
                                )}

                                {/* Workspace icon */}
                                <div className="absolute -bottom-8 left-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
                                        <Building2 className="w-8 h-8 text-indigo-600" />
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 pt-12">
                                <div className="mb-4">
                                    <h3 className="font-bold text-xl text-slate-900 mb-1 truncate group-hover:text-indigo-600 transition-colors">
                                        {workspace.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 capitalize">
                                        {workspace.role}
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 group-hover:bg-indigo-50 transition-colors">
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                                                <FolderKanban className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <span className="font-medium">Projects</span>
                                        </div>
                                        <span className="text-xl font-bold text-slate-900">{workspace.projectCount}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 group-hover:bg-blue-50 transition-colors">
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                                                <Users className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <span className="font-medium">Members</span>
                                        </div>
                                        <span className="text-xl font-bold text-slate-900">{workspace.memberCount}</span>
                                    </div>
                                </div>

                                {/* View button */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                                        View workspace
                                    </span>
                                    <ArrowRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            {/* Hover glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-blue-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:via-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-300 pointer-events-none" />
                        </Link>
                    ))}
                </div>

                {/* Empty State */}
                {workspaces.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-50 mx-auto mb-6 flex items-center justify-center">
                            <Building2 className="w-16 h-16 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">
                            No workspaces yet
                        </h3>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            Create your first workspace to start managing client projects
                        </p>
                        <Link
                            href="/workspaces/new"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300 font-semibold hover:scale-105"
                        >
                            <Plus className="w-5 h-5" />
                            Create Your First Workspace
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
