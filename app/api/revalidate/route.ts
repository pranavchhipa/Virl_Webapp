import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API route for selective cache revalidation
 * Usage: GET /api/revalidate?path=/dashboard
 */
export async function GET(request: NextRequest) {
    try {
        const paths = request.nextUrl.searchParams.getAll('path')

        if (paths.length === 0) {
            return NextResponse.json(
                { error: 'Missing path parameter' },
                { status: 400 }
            )
        }

        // Revalidate all requested paths
        paths.forEach(path => {
            revalidatePath(path)
        })

        return NextResponse.json({
            revalidated: true,
            paths,
            now: Date.now()
        })
    } catch (error) {
        return NextResponse.json(
            { error: 'Revalidation failed' },
            { status: 500 }
        )
    }
}
