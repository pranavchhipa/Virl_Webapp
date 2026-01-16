'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function requestEnterprisePlan() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing')
        return { success: false, error: 'Email service not configured' }
    }

    try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        // Get user details
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single()

        const fullName = profile?.full_name || user.user_metadata?.full_name || 'Unknown Name'
        const email = profile?.email || user.email || 'Unknown Email'

        // Send email to Sales Team
        await resend.emails.send({
            from: process.env.MAIL_FROM || 'Virl App <noreply@virl.in>',
            to: 'sales@virl.in',
            replyTo: email,
            subject: `🚀 Enterprise Plan Inquiry: ${fullName}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>New Enterprise Inquiry</h2>
                    <p><strong>User:</strong> ${fullName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>User ID:</strong> ${user.id}</p>
                    <hr />
                    <p>This user clicked "Contact Sales" on the Billing page.</p>
                </div>
            `
        })

        // Optional: Send confirmation to User
        await resend.emails.send({
            from: process.env.MAIL_FROM || 'Virl App <noreply@virl.in>',
            to: email,
            subject: 'We received your Enterprise inquiry',
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Thanks for your interest!</h2>
                    <p>Hi ${fullName},</p>
                    <p>We've received your inquiry about the Enterprise plan. Our sales team will get back to you shortly.</p>
                    <br/>
                    <p>Best,<br/>The Virl Team</p>
                </div>
            `
        })

        return { success: true }
    } catch (error) {
        console.error('Failed to send enterprise enquiry:', error)
        return { success: false, error: 'Failed to send enquiry' }
    }
}
