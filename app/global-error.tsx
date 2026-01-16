'use client'

import { Inter } from "next/font/google"
import "./globals.css"
import { Button } from "@/components/ui/button"

const inter = Inter({ subsets: ["latin"] })

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-900">
                    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl text-center max-w-md">
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Critical Error</h2>
                        <p className="text-slate-600 mb-6">
                            Something went wrong in the global application shell.
                        </p>
                        <div className="bg-slate-100 p-3 rounded-lg text-xs font-mono text-slate-700 mb-6 text-left overflow-auto max-h-32">
                            {error.message}
                        </div>
                        <Button onClick={() => reset()} className="w-full">
                            Try again
                        </Button>
                    </div>
                </div>
            </body>
        </html>
    )
}
