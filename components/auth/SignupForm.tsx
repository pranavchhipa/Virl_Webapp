"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff, Rocket, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { GoogleButton } from "./GoogleButton"

export function SignupForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [formData, setFormData] = useState({ fullName: "", email: "", password: "", confirmPassword: "" })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault()
        if (formData.password !== formData.confirmPassword) { toast.error("Passwords don't match"); return }
        if (formData.password.length < 8) { toast.error("Password must be at least 8 characters"); return }
        setIsLoading(true)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signUp({
                email: formData.email, password: formData.password,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { full_name: formData.fullName } },
            })
            if (error) throw error

            // Fire and forget welcome email
            const { sendWelcomeEmail } = await import("@/app/actions/auth/email")
            sendWelcomeEmail(formData.email, formData.fullName)

            setIsSuccess(true)
        } catch (error: any) { toast.error(error.message || "Failed to create account") }
        finally { setIsLoading(false) }
    }

    if (isSuccess) {
        return (
            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
                    <p className="text-slate-500">We sent a confirmation link to <br /><span className="font-medium text-slate-900">{formData.email}</span></p>
                </div>
                <p className="text-sm text-slate-400">Can't find it? Check your spam folder.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 w-full max-w-[400px]">
            <GoogleButton loading={isLoading} setLoading={setIsLoading} text="Sign up with Google" />

            <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400 uppercase tracking-widest">or sign up with email</span></div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4 text-left">
                <div>
                    <Label className="text-sm text-slate-700 font-semibold">Full Name</Label>
                    <Input placeholder="Your name" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required className="h-11 mt-1.5 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
                </div>
                <div>
                    <Label className="text-sm text-slate-700 font-semibold">Work Email</Label>
                    <Input type="email" placeholder="you@company.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="h-11 mt-1.5 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
                </div>
                <div>
                    <Label className="text-sm text-slate-700 font-semibold">Password</Label>
                    <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} className="h-11 mt-1.5 pr-10 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 translate-y-0.5 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                </div>
                <div>
                    <Label className="text-sm text-slate-700 font-semibold">Confirm Password</Label>
                    <div className="relative">
                        <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required className="h-11 mt-1.5 pr-10 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 transition-all" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 translate-y-0.5 text-slate-400 hover:text-slate-600">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Start free trial"}
                </Button>

                <p className="text-xs text-center text-slate-400">By signing up, you agree to our <Link href="/terms" className="text-violet-600 hover:underline">Terms</Link> and <Link href="/privacy" className="text-violet-600 hover:underline">Privacy Policy</Link></p>
            </form>
        </div>
    )
}
