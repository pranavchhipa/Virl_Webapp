"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            })

            if (error) throw error

            setIsSuccess(true)
            toast.success("Password reset email sent!")
        } catch (error: any) {
            console.error("Reset Error:", error)
            toast.error(error.message || "Failed to send reset email")
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-violet-50 p-4">
                <div className="w-full max-w-md text-center space-y-6 animate-in fade-in zoom-in duration-300">
                    <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                        <CheckCircle2 className="h-10 w-10 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            We sent a password reset link to <span className="font-medium text-slate-900">{email}</span>.
                            Click the link to reset your password.
                        </p>
                    </div>
                    <div className="pt-4 space-y-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsSuccess(false)}
                            className="w-full"
                        >
                            Try different email
                        </Button>
                        <Link href="/login" className="block">
                            <Button variant="ghost" className="w-full text-violet-600">
                                Back to login
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-violet-50 p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 space-y-6">
                    {/* Back Link */}
                    <Link
                        href="/login"
                        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors group"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
                        Back to login
                    </Link>

                    {/* Icon */}
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <Mail className="h-8 w-8 text-white" />
                    </div>

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900">Forgot your password?</h1>
                        <p className="text-slate-500 text-sm">
                            No worries! Enter your email and we'll send you a reset link.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 font-medium">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-violet-500 focus:ring-violet-500/20 transition-all duration-200 rounded-lg"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 rounded-lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send reset link"
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500">
                    Remember your password?{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-violet-600 hover:text-violet-500 transition-colors"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
