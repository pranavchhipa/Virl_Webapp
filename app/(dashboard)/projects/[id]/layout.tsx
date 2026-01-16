import { createClient } from "@/lib/supabase/server"
import { ProjectHeader } from "@/components/project-header"

export default async function ProjectLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const supabase = createClient()

    // Attempt to fetch project and members
    let title = "Loading..."
    let status = "active"
    let members: any[] = []

    try {
        const { data: project } = await (await supabase)
            .from('projects')
            .select('name, status')
            .eq('id', id)
            .single()

        if (project) {
            title = project.name
            status = project.status
        } else {
            title = "New Viral Project" // Fallback
        }

        // Fetch members
        const { data: membersData } = await (await supabase)
            .from('project_members')
            .select('user_id, role, profiles(full_name, avatar_url)')
            .eq('project_id', id)

        if (membersData) {
            members = membersData.map(m => {
                const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
                return {
                    id: m.user_id,
                    full_name: profile?.full_name || 'Unknown',
                    avatar_url: profile?.avatar_url
                }
            })
        }

    } catch (e) {
        console.error("Failed to fetch project in layout", e)
        title = "Project"
    }

    return (
        <ProjectLayoutClient projectId={id} title={title} status={status} members={members}>
            {children}
        </ProjectLayoutClient>
    )
}

import { ProjectLayoutClient } from "@/components/projects/project-layout-client"
