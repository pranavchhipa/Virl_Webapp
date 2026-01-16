import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            assetId,
            projectId,
            expiresIn, // hours (null = never expires)
            allowComments = true,
            password = null
        } = body

        // Validate required fields
        if (!assetId || !projectId) {
            return NextResponse.json(
                { error: 'Asset ID and Project ID are required' },
                { status: 400 }
            )
        }

        // Verify user has access to this project
        const { data: projectMember } = await supabase
            .from('project_members')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single()

        if (!projectMember) {
            return NextResponse.json(
                { error: 'You do not have access to this project' },
                { status: 403 }
            )
        }

        // Generate secure token
        const token = nanoid(16) // 16-character unique token

        // Calculate expiration date
        let expiresAt = null
        if (expiresIn) {
            expiresAt = new Date()
            expiresAt.setHours(expiresAt.getHours() + expiresIn)
        }

        // Hash password if provided
        let passwordHash = null
        if (password) {
            passwordHash = await bcrypt.hash(password, 10)
        }

        // Create review link
        const { data: reviewLink, error: linkError } = await supabase
            .from('review_links')
            .insert({
                asset_id: assetId,
                project_id: projectId,
                token,
                created_by: user.id,
                expires_at: expiresAt,
                allow_comments: allowComments,
                password_protected: !!password,
                password_hash: passwordHash
            })
            .select()
            .single()

        if (linkError) {
            console.error('Error creating review link:', linkError)
            return NextResponse.json(
                { error: 'Failed to create review link' },
                { status: 500 }
            )
        }

        // Generate public URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const publicUrl = `${baseUrl}/review/${token}`

        return NextResponse.json({
            success: true,
            reviewLink: {
                ...reviewLink,
                publicUrl
            }
        })

    } catch (error) {
        console.error('Error in create review link API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET all review links for a project
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const projectId = searchParams.get('projectId')

        if (!projectId) {
            return NextResponse.json(
                { error: 'Project ID is required' },
                { status: 400 }
            )
        }

        // Get all review links for this project
        const { data: reviewLinks, error } = await supabase
            .from('review_links')
            .select(`
        *,
        assets:asset_id (
          id,
          file_name,
          file_type,
          status
        ),
        profiles:created_by (
          full_name,
          email
        )
      `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching review links:', error)
            return NextResponse.json(
                { error: 'Failed to fetch review links' },
                { status: 500 }
            )
        }

        // Add public URLs
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const linksWithUrls = reviewLinks?.map(link => ({
            ...link,
            publicUrl: `${baseUrl}/review/${link.token}`
        }))

        return NextResponse.json({ reviewLinks: linksWithUrls })

    } catch (error) {
        console.error('Error in get review links API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
