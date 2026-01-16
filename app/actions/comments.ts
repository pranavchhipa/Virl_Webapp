'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function addCommentAction(
    assetId: string,
    content: string,
    userId: string,
    timestamp: number
) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        if (!supabaseServiceKey) {
            throw new Error("Missing Service Role Key")
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { data, error } = await supabase
            .from('asset_comments')
            .insert({
                asset_id: assetId,
                user_id: userId,
                content: content,
                timestamp: Math.round(timestamp)
            })
            .select()
            .single()

        if (error) {
            console.error("Admin Comment Insert Error:", error)
            throw new Error(error.message)
        }

        revalidatePath(`/projects/[id]/assets/${assetId}`)
        return { success: true, data }
    } catch (error: any) {
        console.error("Server Action Error:", error)
        return { success: false, error: error.message }
    }
}

export async function toggleResolveAction(commentId: string, resolved: boolean) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        if (!supabaseServiceKey) {
            throw new Error("Missing Service Role Key")
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { data, error } = await supabase
            .from('asset_comments')
            .update({ resolved: resolved })
            .eq('id', commentId)
            .select()
            .single()

        if (error) {
            console.error("Admin Resolve Error:", error)
            throw new Error(error.message)
        }

        revalidatePath(`/projects/[id]/assets/[assetId]`)
        return { success: true, data }
    } catch (error: any) {
        console.error("Server Action Error:", error)
        return { success: false, error: error.message }
    }
}
