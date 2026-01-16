"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { GoogleButton } from "./GoogleButton"

export function LoginForm() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
                if (error.message.includes("Invalid login credentials")) throw new Error("Invalid email or password.")
                throw error
            }
            toast.success("Welcome back!")
            router.push("/dashboard")
        } catch (error: any) { toast.error(error.message || "Failed to sign in") }
        finally { setLoading(false) }
    }

    return (
        <div className="space-y-6 w-full max-w-[400px]">
            <GoogleButton loading={loading} setLoading={setLoading} />

            <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400 uppercase tracking-widest">or</span></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                    <Label className="text-sm text-slate-700 font-semibold">Email</Label>
                    <Input
                        type="email"
                        placeholder="john@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 transition-all"
                    />
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm text-slate-700 font-semibold">Password</Label>
                        <Link href="/forgot-password" className="text-xs text-violet-600 hover:text-violet-500 font-medium">Forgot password?</Link>
                    </div>
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-12 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 pr-10 transition-all"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign in"}
                </Button>
            </form>
        </div>
    )
}
