import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ token: string }> }
) {
    try {
        const supabase = await createClient()
        const params = await props.params
        const { token } = params

        // Find the review link
        const { data: reviewLink, error: findError } = await supabase
            .from('review_links')
            .select('id, view_count')
            .eq('token', token)
            .single()

        if (findError || !reviewLink) {
            return NextResponse.json(
                { error: 'Review link not found' },
                { status: 404 }
            )
        }

        // Increment view count
        const newCount = (reviewLink.view_count || 0) + 1

        const { error: updateError } = await supabase
            .from('review_links')
            .update({ view_count: newCount })
            .eq('id', reviewLink.id)

        if (updateError) {
            console.error('Error updating view count:', updateError)
            return NextResponse.json(
                { error: 'Failed to update view count' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            viewCount: newCount
        })

    } catch (error) {
        console.error('Error in view count API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
