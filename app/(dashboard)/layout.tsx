import DashboardLayout from "@/components/dashboard-layout"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserProjects } from "@/app/actions/dashboard"
import { ProjectsProvider } from "@/components/providers/projects-provider"

export default async function Layout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const projects = await getUserProjects()

    return (
        <ProjectsProvider initialProjects={projects}>
            <DashboardLayout user={user}>{children}</DashboardLayout>
        </ProjectsProvider>
    )
}
