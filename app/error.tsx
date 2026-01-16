'use client'

import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center p-8">
            <div className="bg-red-50 p-4 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Something went wrong!</h2>
            <p className="text-slate-600 max-w-sm">
                {error.message || "An unexpected error occurred while loading this segment."}
            </p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                >
                    Reload Page
                </Button>
                <Button
                    onClick={() => reset()}
                >
                    Try again
                </Button>
            </div>
        </div>
    )
}
