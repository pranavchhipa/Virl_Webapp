import { createClient } from "@/lib/supabase/server"
import { ProjectOverviewClient } from "@/components/project-overview-client"
import { redirect } from "next/navigation"

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    // Fetch Project with creator info
    const { data: project, error } = await supabase
        .from('projects')
        .select('*, creator:created_by(id, full_name, avatar_url)')
        .eq('id', id)
        .single()

    if (error || !project) {
        return <div>Project not found</div>
    }

    // Fetch Asset Count
    const { count: assetCount } = await supabase
        .from('assets')
        .select('id', { count: 'exact' })
        .eq('project_id', id)

    // Fetch Member Count
    const { count: memberCount } = await supabase
        .from('project_members')
        .select('id', { count: 'exact' })
        .eq('project_id', id)

    // Fetch Recent Activity (Last 5 assets)
    const { data: recentAssets } = await supabase
        .from('assets')
        .select('*, uploader:uploader_id(full_name)')
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(5)

    // Calculate Total Storage Used (sum of file_size from all assets)
    const { data: storageData } = await supabase
        .from('assets')
        .select('file_size')
        .eq('project_id', id)

    const totalStorageBytes = storageData?.reduce((sum, asset) => sum + (asset.file_size || 0), 0) || 0
    const storageGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2)

    // Get creator name - fallback to first project member if created_by is null
    let creatorName = project.creator?.full_name
    if (!creatorName) {
        const { data: firstMember } = await supabase
            .from('project_members')
            .select('user_id, profiles!project_members_user_id_fkey(full_name)')
            .eq('project_id', id)
            .order('joined_at', { ascending: true })
            .limit(1)
            .maybeSingle()
        creatorName = (firstMember as any)?.profiles?.full_name || 'Unknown'
    }

    return (
        <ProjectOverviewClient
            project={project}
            fileCount={assetCount || 0}
            memberCount={memberCount || 1}
            recentActivity={recentAssets || []}
            creatorName={creatorName}
            storageGB={storageGB}
        />
    )
}

