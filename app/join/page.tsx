import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { acceptInvitation } from "@/app/actions/invite"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export default async function JoinPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>
}) {
    const { token } = await searchParams

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Invalid Invite Link</h1>
                <p className="text-muted-foreground mb-4">This link is missing a valid token.</p>
                <Link href="/"><Button>Go Home</Button></Link>
            </div>
        )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // If not logged in, redirect to Sign Up/Log In with return URL
    // We append ?next=/join?token=... so they come back here after auth
    if (!user) {
        const nextUrl = `/join?token=${token}`
        redirect(`/login?next=${encodeURIComponent(nextUrl)}`)
    }

    // Attempt to accept the invitation automatically
    const result = await acceptInvitation(token)

    if (result.error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Invite Failed</h1>
                <p className="text-muted-foreground mb-4">{result.error}</p>
                <Link href="/dashboard"><Button variant="outline">Go to Dashboard</Button></Link>
            </div>
        )
    }

    // Success! Redirect to the project or dashboard
    const destination = result.projectId ? `/projects/${result.projectId}` : '/dashboard'

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 animate-in zoom-in duration-300" />
            <h1 className="text-2xl font-bold">Joining Workspace...</h1>
            <p className="text-muted-foreground">Redirecting you to the team.</p>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />

            {/* Fallback if redirect is slow */}
            <meta httpEquiv="refresh" content={`2;url=${destination}`} />
            <Link href={destination}>
                <Button variant="link">Click here if not redirected...</Button>
            </Link>
        </div>
    )
}
