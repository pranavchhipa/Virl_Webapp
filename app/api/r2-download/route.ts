import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSignedDownloadUrl } from '@/lib/r2-storage';

// GET: Get signed download URL for an asset
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');
        const assetId = searchParams.get('assetId');

        if (!key && !assetId) {
            return NextResponse.json(
                { error: 'Missing required parameter: key or assetId' },
                { status: 400 }
            );
        }

        let fileKey = key;

        // If assetId provided, look up the file path
        if (assetId && !fileKey) {
            const { data: asset } = await supabase
                .from('assets')
                .select('file_path, project_id')
                .eq('id', assetId)
                .single();

            if (!asset) {
                return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
            }

            // Verify project access
            const { data: member } = await supabase
                .from('project_members')
                .select('id')
                .eq('project_id', asset.project_id)
                .eq('user_id', user.id)
                .single();

            if (!member) {
                return NextResponse.json({ error: 'No access to this asset' }, { status: 403 });
            }

            fileKey = asset.file_path;
        }

        // Generate signed URL (valid for 1 hour)
        const signedUrl = await getSignedDownloadUrl(fileKey!, 3600);

        return NextResponse.json({ url: signedUrl });
    } catch (error) {
        console.error('R2 download URL error:', error);
        return NextResponse.json(
            { error: 'Failed to generate download URL' },
            { status: 500 }
        );
    }
}
