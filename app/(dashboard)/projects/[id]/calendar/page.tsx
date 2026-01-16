'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function OldProjectCalendarPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to new global calendar
        router.push('/calendar')
    }, [router])

    return (
        <div className="h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Redirecting to Calendar...</p>
            </div>
        </div>
    )
}
