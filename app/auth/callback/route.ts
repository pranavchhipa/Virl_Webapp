import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/home";

    console.log('Auth callback - code:', code ? 'present' : 'missing');

    if (code) {
        try {
            const supabase = await createClient();
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
                console.error('Session exchange error:', error);
                return NextResponse.redirect(`${origin}/auth/auth-code-error`);
            }

            if (data?.user) {
                const user = data.user;
                console.log('Session exchange success - user:', user.email);

                // Update last_active_at for health tracking
                await supabase
                    .from('profiles')
                    .update({ last_active_at: new Date().toISOString() })
                    .eq('id', user.id);
                // 0. Check for pending invites by email
                if (user.email) {
                    const normalizedEmail = user.email.toLowerCase();
                    const { data: invites } = await supabase
                        .from('workspace_invites')
                        .select('*')
                        .eq('email', normalizedEmail);

                    if (invites && invites.length > 0) {
                        for (const invite of invites) {
                            console.log('Processing invite for workspace:', invite.workspace_id);

                            // Add to workspace (Upsert to prevent duplicates)
                            const { error: wsError } = await supabase.from('workspace_members').upsert({
                                workspace_id: invite.workspace_id,
                                user_id: user.id,
                                role: invite.role
                            }, { onConflict: 'workspace_id, user_id', ignoreDuplicates: true });

                            if (wsError) console.error('Workspace Member Insert Error:', wsError);

                            // Add to Project (if applicable)
                            if (invite.project_id) {
                                console.log('Processing Project Invite:', invite.project_id);
                                const { error: projectError } = await supabase.from('project_members').upsert({
                                    project_id: invite.project_id,
                                    user_id: user.id,
                                    role: invite.project_role || 'viewer'
                                }, { onConflict: 'project_id, user_id', ignoreDuplicates: true });

                                if (projectError) console.error('Project Member Insert Error:', projectError);
                            }

                            // Delete invite
                            await supabase.from('workspace_invites').delete().eq('id', invite.id);
                        }
                    } else {
                        console.log('No pending invites found for:', normalizedEmail);
                    }
                }

                // Check if user has any workspaces
                const { data: existingWorkspaces } = await supabase
                    .from('workspace_members')
                    .select('workspace_id')
                    .eq('user_id', user.id)
                    .limit(1);

                // If no workspaces exist, create a default one
                if (!existingWorkspaces || existingWorkspaces.length === 0) {
                    const userName = user.user_metadata?.full_name ||
                        user.email?.split('@')[0] ||
                        'User';

                    const workspaceName = `${userName}'s Workspace`;

                    // Create workspace
                    const { data: newWorkspace, error: workspaceError } = await supabase
                        .from('workspaces')
                        .insert({
                            name: workspaceName,
                            owner_id: user.id
                        })
                        .select()
                        .single();

                    if (workspaceError) {
                        console.error('Failed to create workspace:', workspaceError);
                    } else if (newWorkspace) {
                        // Add user as owner
                        await supabase
                            .from('workspace_members')
                            .insert({
                                workspace_id: newWorkspace.id,
                                user_id: user.id,
                                role: 'owner'
                            });
                    }
                }

                console.log('Redirecting to:', `${origin}${next}`);
                return NextResponse.redirect(`${origin}${next}`);
            }
        } catch (err) {
            console.error('Callback exception:', err);
            return NextResponse.redirect(`${origin}/auth/auth-code-error`);
        }
    }

    // Return the user to an error page with instructions if no code
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
