import { ProjectsView } from "@/components/projects/projects-view"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { getUserProjects } from "@/app/actions/dashboard"

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ workspace?: string }> }) {
    const { workspace } = await searchParams
    const projects = await getUserProjects(workspace)

    return (
        <PageWrapper>
            <ProjectsView key={workspace || 'all'} initialProjects={projects} />
        </PageWrapper>
    )
}
