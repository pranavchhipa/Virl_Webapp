"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const feedbackSchema = z.object({
    type: z.enum(["bug", "feature", "general"]),
    message: z.string().min(1, "Message is required").max(1000, "Message is too long"),
    sentiment: z.string(),
    path: z.string().optional(),
    userAgent: z.string().optional(),
    screenshotUrl: z.string().optional(),
})

export type FeedbackInput = z.infer<typeof feedbackSchema>

export async function submitFeedback(input: FeedbackInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: "You must be logged in to submit feedback" }
        }

        const result = feedbackSchema.safeParse(input)
        if (!result.success) {
            return { error: "Invalid input", details: result.error.flatten() }
        }

        const { error } = await supabase.from("feedback").insert({
            user_id: user.id,
            type: input.type,
            message: input.message,
            sentiment: input.sentiment,
            path: input.path,
            user_agent: input.userAgent,
            screenshot_url: input.screenshotUrl,
        })

        if (error) {
            console.error("Error submitting feedback:", error)
            return { error: "Failed to submit feedback" }
        }

        return { success: true }
    } catch (error) {
        console.error("Unexpected error submitting feedback:", error)
        return { error: "An unexpected error occurred" }
    }
}


export async function deleteFeedback(id: string) {
    try {
        const adminSupabase = createAdminClient()

        // Use admin client to delete since standard users might not have delete policies
        const { error } = await adminSupabase
            .from("feedback")
            .delete()
            .eq("id", id)

        if (error) {
            console.error("Error deleting feedback:", error)
            return { error: "Failed to delete feedback" }
        }

        revalidatePath("/control-centre-X7kP2mN9vL3qR8wY5jT1/dashboard/feedback")
        return { success: true }
    } catch (error) {
        console.error("Unexpected error deleting feedback:", error)
        return { error: "An unexpected error occurred" }
    }
}

export async function getFeedback(limit = 50) {
    const adminSupabase = createAdminClient()

    // 2. Fetch Data using Admin Client (Bypasses RLS)
    const { data, error } = await adminSupabase
        .from("feedback")
        .select(`
            *,
            profiles:user_id (
                full_name,
                email
            )
        `)
        .order("created_at", { ascending: false })
        .limit(limit)

    if (error) {
        return { error: error.message }
    }

    return { data }
}
