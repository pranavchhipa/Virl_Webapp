"use client"

import { useState, Suspense, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AuthHero } from "@/components/auth/AuthHero"
import { LoginForm } from "@/components/auth/LoginForm"
import { SignupForm } from "@/components/auth/SignupForm"

function AuthPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // Determine initial view from URL
    const initialView = searchParams?.get("view") === "signup" ? "signup" : "login"
    const [view, setView] = useState<"login" | "signup">(initialView)

    // Sync state if URL changes (e.g. back button)
    useEffect(() => {
        const currentView = searchParams?.get("view") === "signup" ? "signup" : "login"
        setView(currentView)
    }, [searchParams])

    const toggleView = (newView: "login" | "signup") => {
        setView(newView)
        // Update URL shallowly without reload
        const newUrl = newView === "signup" ? "/login?view=signup" : "/login"
        router.push(newUrl, { scroll: false })
    }

    return (
        <div className="min-h-screen flex w-full bg-white">
            {/* Left Side - Form Container */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 py-6 transition-all duration-500">
                <div className="w-full max-w-[440px] mx-auto lg:mx-0">
                    {/* Logo - BIGGER & Adjusted spacing */}
                    <Link href="/" className="inline-flex items-center gap-2 mb-4">
                        <Image src="/virl-logo.png" alt="Virl" width={160} height={160} className="w-40 h-auto object-contain" />
                    </Link>

                    {/* Dynamic Header */}
                    <div className="mb-4 space-y-2">
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                            {view === "login" ? "Log in to Virl" : "Start your free trial"}
                        </h1>
                        <p className="text-slate-500 text-lg">
                            {view === "login" ? "Welcome back! Please enter your details." : "Join creative teams shipping content faster."}
                        </p>
                    </div>

                    {/* Form Switcher */}
                    <div className="transition-all duration-300 ease-in-out">
                        {view === "login" ? <LoginForm /> : <SignupForm />}
                    </div>

                    {/* Footer Toggle Link */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500">
                            {view === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                            <button
                                onClick={() => toggleView(view === "login" ? "signup" : "login")}
                                className="font-semibold text-violet-600 hover:text-violet-700 hover:underline transition-colors"
                            >
                                {view === "login" ? "Sign up" : "Sign in"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Hero (Fixed) */}
            <AuthHero />
        </div>
    )
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>}>
            <AuthPageContent />
        </Suspense>
    )
}
