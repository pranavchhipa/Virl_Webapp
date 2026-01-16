import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use anon client for public feedback submissions
const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params

        const {
            clientName,
            clientEmail,
            status,
            feedbackText,
            timestamp
        } = await request.json()

        // Validate status
        if (!['approved', 'changes_requested'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be "approved" or "changes_requested"' },
                { status: 400 }
            )
        }

        // Fetch review link to get ID (using anon client)
        const { data: reviewLink, error: linkError } = await supabaseAnon
            .from('review_links')
            .select('id, project_id, asset_id, allow_comments')
            .eq('token', token)
            .eq('is_active', true)
            .single()

        if (linkError || !reviewLink) {
            console.error('Review link error:', linkError)
            return NextResponse.json(
                { error: 'Review link not found or expired' },
                { status: 404 }
            )
        }

        // Check if comments are allowed
        if (!reviewLink.allow_comments && status === 'changes_requested') {
            return NextResponse.json(
                { error: 'Comments are not allowed for this review' },
                { status: 403 }
            )
        }

        // Submit feedback (using anon client - RLS allows anon insert)
        const { data: feedback, error: feedbackError } = await supabaseAnon
            .from('client_feedback')
            .insert({
                review_link_id: reviewLink.id,
                client_name: clientName,
                client_email: clientEmail,
                status,
                feedback_text: feedbackText,
                timestamp
            })
            .select()
            .single()

        if (feedbackError) {
            console.error('Error submitting feedback:', feedbackError)
            return NextResponse.json(
                { error: 'Failed to submit feedback: ' + feedbackError.message },
                { status: 500 }
            )
        }

        // Update asset status based on feedback
        if (status === 'approved') {
            await supabaseAnon
                .from('assets')
                .update({ status: 'approved' })
                .eq('id', reviewLink.asset_id)
        }

        // Send email notification to team
        // TODO: Implement email notification
        try {
            const { sendNotification } = await import('@/lib/email/notifications')

            // Get project members
            const { data: members } = await supabaseAnon
                .from('project_members')
                .select('user_id, profiles:user_id (email, full_name)')
                .eq('project_id', reviewLink.project_id)

            if (members && members.length > 0) {
                const recipients = members
                    .map((m: any) => ({
                        email: m.profiles?.email,
                        name: m.profiles?.full_name
                    }))
                    .filter((r: any) => r.email)

                // Get asset details
                const { data: asset } = await supabaseAnon
                    .from('assets')
                    .select('file_name')
                    .eq('id', reviewLink.asset_id)
                    .single()

                await sendNotification({
                    type: 'client_feedback_received' as any,
                    recipients,
                    data: {
                        clientName: clientName || 'Anonymous',
                        assetName: asset?.file_name || 'Asset',
                        status,
                        feedbackText,
                        reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${reviewLink.project_id}/assets`
                    }
                })
            }
        } catch (emailError) {
            console.error('Error sending email notification:', emailError)
            // Don't fail the request if email fails
        }

        return NextResponse.json({
            success: true,
            feedback
        })

    } catch (error) {
        console.error('Error submitting feedback:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
