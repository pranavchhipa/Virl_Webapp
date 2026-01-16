import { NextRequest, NextResponse } from 'next/server'
import { notifyMention } from '@/lib/notifications'

export async function POST(request: NextRequest) {
    try {
        const { projectId, authorId, mentionedUserIds, content } = await request.json()

        // Validate inputs
        if (!projectId || !authorId || !mentionedUserIds || !Array.isArray(mentionedUserIds)) {
            return NextResponse.json(
                { error: 'Invalid request parameters' },
                { status: 400 }
            )
        }

        // Send notifications (this is async but we don't wait)
        notifyMention(projectId, authorId, mentionedUserIds, content)
            .catch(err => console.error('Notification error:', err))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
