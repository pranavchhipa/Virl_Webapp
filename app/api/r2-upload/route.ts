import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createUploadSession } from '@/lib/r2-storage';

// POST: Get presigned upload URL for client-side upload
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { fileName, contentType, projectId } = body;

        if (!fileName || !contentType || !projectId) {
            return NextResponse.json(
                { error: 'Missing required fields: fileName, contentType, projectId' },
                { status: 400 }
            );
        }

        // Verify user has access to this project
        // Check 1: Direct project member
        const { data: projectMember } = await supabase
            .from('project_members')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single();

        // Check 2: Is project owner (created the project)
        const { data: projectOwner } = await supabase
            .from('projects')
            .select('id, workspace_id')
            .eq('id', projectId)
            .eq('owner_id', user.id)
            .single();

        // Check 3: Is workspace member (has access via workspace)
        let workspaceMember = null;
        if (!projectMember && !projectOwner) {
            const { data: project } = await supabase
                .from('projects')
                .select('workspace_id')
                .eq('id', projectId)
                .single();

            if (project?.workspace_id) {
                const { data: member } = await supabase
                    .from('workspace_members')
                    .select('id')
                    .eq('workspace_id', project.workspace_id)
                    .eq('user_id', user.id)
                    .single();
                workspaceMember = member;
            }
        }

        if (!projectMember && !projectOwner && !workspaceMember) {
            console.error('R2 upload: No access to project', { projectId, userId: user.id });
            return NextResponse.json({ error: 'No access to this project' }, { status: 403 });
        }

        // Check storage limit based on workspace plan
        const fileSize = parseInt(request.headers.get('x-file-size') || '0');
        if (fileSize > 0) {
            const { checkStorageLimit } = await import('@/app/actions/storage');
            const storageCheck = await checkStorageLimit(projectId, fileSize);

            if (!storageCheck.allowed) {
                console.error('R2 upload: Storage limit exceeded', storageCheck);
                return NextResponse.json(
                    {
                        error: 'Storage limit exceeded',
                        message: storageCheck.message,
                        currentUsed: storageCheck.currentUsed,
                        limit: storageCheck.limit,
                        planTier: storageCheck.planTier
                    },
                    { status: 403 }
                );
            }
        }

        // Create presigned upload URL
        const folder = `projects/${projectId}`;
        const { uploadUrl, key } = await createUploadSession(fileName, contentType, folder);

        console.log('R2 upload session created:', { key, projectId });
        return NextResponse.json({ uploadUrl, key });
    } catch (error) {
        console.error('R2 upload session error:', error);
        return NextResponse.json(
            { error: 'Failed to create upload session' },
            { status: 500 }
        );
    }
}
