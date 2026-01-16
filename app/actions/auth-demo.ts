'use server'

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function loginAsDemoUser() {
    const supabase = await createClient()
    const email = 'demo@virl.in'
    const password = 'demo12345'

    // 1. Try to sign in
    let { error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    // 2. If user doesn't exist (or login failed), try to sign up
    if (error) {
        console.log("Demo user login failed, attempting to create user...", error.message)

        // Attempt SignUp
        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: "Demo User",
                    avatar_url: ""
                }
            }
        })

        if (signUpError) {
            console.error("Failed to create demo user:", signUpError)
            // If failed, redirect to login with error
            redirect('/login?error=demo_creation_failed')
        }

        // Try signing in again to ensure session is active
        const { error: signInRetryError } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (signInRetryError) {
            console.error("Failed to sign in after creation:", signInRetryError)
            redirect('/login?error=demo_signin_failed')
        }
    }

    // 3. Redirect to dashboard on success
    redirect('/dashboard')
}
