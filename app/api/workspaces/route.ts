import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    console.log('API /workspaces - User:', user?.id)

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('workspace_members')
        .select(`
            workspace_id,
            role,
            workspaces (
                id,
                name,
                owner_id
            )
        `)
        .eq('user_id', user.id)

    console.log('API /workspaces - Raw data:', data)
    console.log('API /workspaces - Error:', error)

    if (error) {
        console.error('Error fetching workspaces:', error)
        return NextResponse.json([])
    }

    // Extract workspace data
    const workspaces = data?.map(wm => wm.workspaces).filter(Boolean) || []

    console.log('API /workspaces - Workspaces to return:', workspaces)

    return NextResponse.json(workspaces)
}
