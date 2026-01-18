import { redirect } from "next/navigation"

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ workspace?: string }> }) {
    const { workspace } = await searchParams
    const destination = workspace
        ? `/settings/profile?workspace=${workspace}`
        : "/settings/profile"

    redirect(destination)
}
