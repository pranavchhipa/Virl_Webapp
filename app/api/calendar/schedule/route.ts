import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/calendar/schedule - Update asset schedule
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { assetId, scheduledDate, scheduledTime, platform, platformSpecific } = await request.json()

        if (!assetId || !scheduledDate) {
            return NextResponse.json(
                { error: 'Asset ID and scheduled date are required' },
                { status: 400 }
            )
        }

        // Verify user has access to this asset
        const { data: asset } = await supabase
            .from('assets')
            .select('project_id')
            .eq('id', assetId)
            .single()

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
        }

        // Check project access
        const { data: projectMember } = await supabase
            .from('project_members')
            .select('id')
            .eq('project_id', asset.project_id)
            .eq('user_id', user.id)
            .single()

        if (!projectMember) {
            return NextResponse.json(
                { error: 'You do not have access to this project' },
                { status: 403 }
            )
        }

        // Check for conflicts before scheduling
        if (platform) {
            const { data: conflictCheck } = await supabase.rpc('detect_conflicts', {
                p_asset_id: assetId,
                p_scheduled_date: scheduledDate,
                p_scheduled_time: scheduledTime || '12:00:00',
                p_platform: platform,
                p_project_id: asset.project_id,
            })

            if (conflictCheck && conflictCheck.length > 0) {
                // Log conflicts but allow scheduling
                const conflicts = conflictCheck as any[]
                conflicts.forEach((conflict) => {
                    if (conflict.severity === 'error') {
                        console.warn('Scheduling conflict:', conflict.message)
                    }
                })

                // Return conflicts as warnings
                return NextResponse.json({
                    success: true,
                    warnings: conflicts,
                    message: 'Scheduled with conflicts - please review',
                })
            }
        }

        // Update asset schedule
        console.log('Attempting to update asset:', { assetId, scheduledDate, scheduledTime, platform });

        const { data: updatedAsset, error: updateError } = await supabase
            .from('assets')
            .update({
                scheduled_date: scheduledDate,
                scheduled_time: scheduledTime || null,
                platform: platform || null,
                platform_specific: platformSpecific || {},
            })
            .eq('id', assetId)
            .select()
            .single()

        if (updateError) {
            console.error('Supabase Update Error:', JSON.stringify(updateError, null, 2));
            return NextResponse.json(
                { error: 'Failed to update schedule', details: updateError },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            asset: updatedAsset,
        })
    } catch (error) {
        console.error('Error in schedule API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET /api/calendar/schedule - Get scheduled assets for a project
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const projectId = searchParams.get('projectId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const platform = searchParams.get('platform')

        if (!projectId) {
            return NextResponse.json(
                { error: 'Project ID is required' },
                { status: 400 }
            )
        }

        // Build query
        let query = supabase
            .from('assets')
            .select('*')
            .eq('project_id', projectId)
            .not('scheduled_date', 'is', null)
            .order('scheduled_date', { ascending: true })

        if (startDate) {
            query = query.gte('scheduled_date', startDate)
        }

        if (endDate) {
            query = query.lte('scheduled_date', endDate)
        }

        if (platform && platform !== 'all') {
            query = query.eq('platform', platform)
        }

        const { data: assets, error } = await query

        if (error) {
            console.error('Error fetching scheduled assets:', error)
            return NextResponse.json(
                { error: 'Failed to fetch assets' },
                { status: 500 }
            )
        }

        return NextResponse.json({ assets })
    } catch (error) {
        console.error('Error in get schedule API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/calendar/schedule - Remove schedule from asset
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const assetId = searchParams.get('assetId')

        if (!assetId) {
            return NextResponse.json(
                { error: 'Asset ID is required' },
                { status: 400 }
            )
        }

        // Unschedule asset
        const { data, error } = await supabase
            .from('assets')
            .update({
                scheduled_date: null,
                scheduled_time: null,
                platform: null,
            })
            .eq('id', assetId)
            .select()
            .single()

        if (error) {
            return NextResponse.json(
                { error: 'Failed to unschedule asset' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, asset: data })
    } catch (error) {
        console.error('Error in delete schedule API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
