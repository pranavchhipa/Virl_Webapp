'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { AssetNotificationEmail } from '@/lib/email/templates/AssetNotification'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function notifyTeam(projectId: string, fileName: string, uploaderName: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("⚠️ No RESEND_API_KEY found. Skipping email.")
        return { success: true, message: "Email skipped (No API Key)" }
    }

    try {
        const supabase = createClient()

        // 1. Fetch Project Details
        const { data: project } = await (await supabase)
            .from('projects')
            .select('name')
            .eq('id', projectId)
            .single()

        const projectName = project?.name || 'Project'

        // 2. Fetch Team Members
        const { data: { user } } = await (await supabase).auth.getUser()
        const targetEmail = user?.email || 'delivered@resend.dev'

        console.log(`[NotifyTeam] Sending email for ${fileName} in ${projectName}`)

        const { data, error } = await resend.emails.send({
            from: 'Virl Team <notifications@virl.in>',
            to: targetEmail,
            subject: `[Virl.in] New Assets for ${projectName}`,
            html: AssetNotificationEmail({
                projectName,
                uploaderName,
                fileName,
                projectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/assets`,
                projectId
            })
        })

        if (error) {
            console.error('Resend Error:', error)
            return { error: error.message }
        }

        return { success: true, data }
    } catch (e) {
        console.error('Notification Action Error:', e)
        return { error: 'Internal Server Error' }
    }
}
