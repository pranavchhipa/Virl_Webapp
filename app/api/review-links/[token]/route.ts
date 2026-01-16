import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params
        const supabase = await createClient()

        // Fetch review link (PUBLIC access via RLS)
        const { data: reviewLink, error: linkError } = await supabase
            .from('review_links')
            .select(`
        *,
        assets (
          id,
          file_name,
          file_path,
          file_type,
          status
        ),
        projects (
          id,
          name
        )
      `)
            .eq('token', token)
            .single()

        if (linkError || !reviewLink) {
            return NextResponse.json(
                { error: 'Review link not found or expired' },
                { status: 404 }
            )
        }

        // Check if link is active
        if (!reviewLink.is_active) {
            return NextResponse.json(
                { error: 'This review link has been deactivated' },
                { status: 410 }
            )
        }

        // Check if link is expired
        if (reviewLink.expires_at && new Date(reviewLink.expires_at) < new Date()) {
            return NextResponse.json(
                { error: 'This review link has expired' },
                { status: 410 }
            )
        }

        // Increment view count
        await supabase.rpc('increment_review_link_views', { link_token: token })

        // Fetch existing feedback for this link
        const { data: feedback } = await supabase
            .from('client_feedback')
            .select('*')
            .eq('review_link_id', reviewLink.id)
            .order('created_at', { ascending: false })

        return NextResponse.json({
            reviewLink: {
                ...reviewLink,
                feedback: feedback || []
            }
        })

    } catch (error) {
        console.error('Error fetching review link:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/review-links/[token] - Verify password
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params
        const { password } = await request.json()

        const supabase = await createClient()

        // Fetch review link
        const { data: reviewLink, error } = await supabase
            .from('review_links')
            .select('id, password_protected, password_hash')
            .eq('token', token)
            .single()

        if (error || !reviewLink) {
            return NextResponse.json(
                { error: 'Review link not found' },
                { status: 404 }
            )
        }

        // Check if password protected
        if (!reviewLink.password_protected) {
            return NextResponse.json({ valid: true })
        }

        // Verify password
        if (!password || !reviewLink.password_hash) {
            return NextResponse.json(
                { error: 'Password required', valid: false },
                { status: 401 }
            )
        }

        const isValid = await bcrypt.compare(password, reviewLink.password_hash)

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid password', valid: false },
                { status: 401 }
            )
        }

        return NextResponse.json({ valid: true })

    } catch (error) {
        console.error('Error verifying password:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
