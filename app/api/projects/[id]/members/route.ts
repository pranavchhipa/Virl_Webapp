import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
        .from('project_members')
        .select(`
            *,
            profiles (
                full_name,
                email
            )
        `)
        .eq('project_id', id)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching members:', error)
        return NextResponse.json([])
    }

    return NextResponse.json(data || [])
}
