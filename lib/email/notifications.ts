import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

// Email configuration
const EMAIL_CONFIG = {
    from: process.env.EMAIL_FROM || 'Virl <notifications@virl.in>',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}

// Email event types
export type EmailEventType =
    | 'workspace_member_removed'
    | 'workspace_member_added'
    | 'workspace_member_role_changed'
    | 'project_member_removed'
    | 'project_member_added'
    | 'project_member_role_changed'
    | 'project_created'
    | 'project_archived'
    | 'project_deleted'
    | 'task_assigned'
    | 'task_due_soon'
    | 'asset_uploaded'
    | 'mention_notification'
    | 'workspace_invite'
    | 'project_invite'
    | 'client_feedback_received'

interface EmailRecipient {
    email: string
    name?: string
}

interface EmailPayload {
    type: EmailEventType
    recipients: EmailRecipient[]
    data: Record<string, any>
}

/**
 * Send an email notification
 */
export async function sendNotification(payload: EmailPayload) {
    try {
        // Filter recipients based on their notification preferences
        const filteredRecipients = await filterRecipientsByPreferences(payload.recipients, payload.type)

        if (filteredRecipients.length === 0) {
            console.log(`⏭️  No recipients want ${payload.type} notifications - skipping email`)
            return { success: true, skipped: true, reason: 'all_recipients_opted_out' }
        }

        const { template, subject } = await getEmailTemplate(payload)

        // Send to filtered recipients
        const results = await Promise.all(
            filteredRecipients.map(recipient =>
                resend.emails.send({
                    from: EMAIL_CONFIG.from,
                    to: recipient.email,
                    subject,
                    ...(typeof template === 'string' ? { html: template } : { react: template }),
                })
            )
        )

        console.log(`✅ Sent ${payload.type} email to ${filteredRecipients.length}/${payload.recipients.length} recipients`)
        return { success: true, results }
    } catch (error) {
        console.error('❌ Email send error:', error)
        return { success: false, error }
    }
}

/**
 * Filter recipients based on their notification preferences
 */
async function filterRecipientsByPreferences(
    recipients: EmailRecipient[],
    eventType: EmailEventType
): Promise<EmailRecipient[]> {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Map event types to preference keys
    const preferenceKeyMap: Record<string, string> = {
        'workspace_invite': 'workspace_invites',
        'project_invite': 'project_invites',
        'project_member_added': 'project_assignment',
        'workspace_member_added': 'member_added',
        'workspace_member_removed': 'removed_from_workspace',
        'project_member_removed': 'removed_from_project',
        'workspace_member_role_changed': 'workspace_role_changed',
        'project_member_role_changed': 'project_role_changed',
        'project_created': 'project_created',
        'project_archived': 'project_archived',
        'project_deleted': 'project_deleted',
        'task_assigned': 'task_assigned',
        'task_due_soon': 'task_due_soon',
        'asset_uploaded': 'new_assets',
        'mention_notification': 'mentions',
    }

    const preferenceKey = preferenceKeyMap[eventType]
    if (!preferenceKey) {
        // If no preference key mapped, allow by default
        return recipients
    }

    // Fetch all recipients' preferences in one query
    const emails = recipients.map(r => r.email)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('email, notification_preferences')
        .in('email', emails)

    if (!profiles) return recipients

    // Filter recipients who have this notification enabled
    const filtered = recipients.filter(recipient => {
        const profile = profiles.find(p => p.email === recipient.email)
        if (!profile?.notification_preferences) {
            // No preferences set - allow by default
            return true
        }

        const prefs = profile.notification_preferences as Record<string, boolean>
        const isEnabled = prefs[preferenceKey]

        // If preference is explicitly false, filter out
        if (isEnabled === false) {
            console.log(`⏭️  Skipping ${recipient.email} for ${eventType} (preference disabled)`)
            return false
        }

        // Otherwise allow (true or undefined defaults to enabled)
        return true
    })

    return filtered
}

/**
 * Get the appropriate email template and subject for an event type
 */
async function getEmailTemplate(payload: EmailPayload): Promise<{ template: React.ReactElement | string, subject: string }> {
    const { type, data } = payload

    switch (type) {
        case 'workspace_member_removed':
            const { MemberRemovedEmail } = await import('./templates/member-removed')
            return {
                template: MemberRemovedEmail({
                    memberName: data.memberName,
                    removedBy: data.removedBy,
                    workspaceName: data.workspaceName,
                    isWorkspace: true,
                }),
                subject: `You've been removed from ${data.workspaceName}`,
            }

        case 'project_member_removed':
            const { MemberRemovedEmail: ProjectRemovedEmail } = await import('./templates/member-removed')
            return {
                template: ProjectRemovedEmail({
                    memberName: data.memberName,
                    removedBy: data.removedBy,
                    workspaceName: data.workspaceName,
                    projectName: data.projectName,
                    isWorkspace: false,
                }),
                subject: `You've been removed from ${data.projectName}`,
            }

        case 'workspace_member_added':
        case 'project_member_added':
            const { MemberAddedEmail } = await import('./templates/member-added')
            const isWorkspace = type === 'workspace_member_added'
            return {
                template: MemberAddedEmail({
                    memberName: data.memberName,
                    addedBy: data.addedBy,
                    entityName: isWorkspace ? data.workspaceName : data.projectName,
                    role: data.role,
                    actionUrl: `${EMAIL_CONFIG.appUrl}${data.actionUrl}`,
                    isWorkspace,
                }),
                subject: `You've been added to ${isWorkspace ? data.workspaceName : data.projectName}`,
            }

        case 'workspace_member_role_changed':
        case 'project_member_role_changed':
            const { RoleChangedEmail } = await import('./templates/role-changed')
            const isWorkspaceRole = type === 'workspace_member_role_changed'
            return {
                template: RoleChangedEmail({
                    memberName: data.memberName,
                    changedBy: data.changedBy,
                    entityName: isWorkspaceRole ? data.workspaceName : data.projectName,
                    oldRole: data.oldRole,
                    newRole: data.newRole,
                    actionUrl: `${EMAIL_CONFIG.appUrl}${data.actionUrl}`,
                    isWorkspace: isWorkspaceRole,
                }),
                subject: `Your role has been updated in ${isWorkspaceRole ? data.workspaceName : data.projectName}`,
            }

        case 'project_created':
            const { ProjectCreatedEmail } = await import('./templates/project-created')
            return {
                template: ProjectCreatedEmail({
                    memberName: data.memberName,
                    projectName: data.projectName,
                    createdBy: data.createdBy,
                    actionUrl: `${EMAIL_CONFIG.appUrl}/projects/${data.projectId}`,
                }),
                subject: `New project created: ${data.projectName}`,
            }

        case 'project_archived':
            const { ProjectArchivedEmail } = await import('./templates/project-archived')
            return {
                template: ProjectArchivedEmail({
                    memberName: data.memberName,
                    projectName: data.projectName,
                    archivedBy: data.archivedBy,
                    actionUrl: `${EMAIL_CONFIG.appUrl}/projects/${data.projectId}`,
                }),
                subject: `Project archived: ${data.projectName}`,
            }

        case 'project_deleted':
            const { ProjectDeletedEmail } = await import('./templates/project-deleted')
            return {
                template: ProjectDeletedEmail({
                    memberName: data.memberName,
                    projectName: data.projectName,
                    deletedBy: data.deletedBy,
                }),
                subject: `Project deleted: ${data.projectName}`,
            }

        case 'task_assigned':
            const { TaskAssignedEmail } = await import('./templates/task-assigned')
            return {
                template: TaskAssignedEmail({
                    assigneeName: data.assigneeName,
                    taskTitle: data.taskTitle,
                    projectName: data.projectName,
                    assignedBy: data.assignedBy,
                    dueDate: data.dueDate,
                    priority: data.priority,
                    actionUrl: `${EMAIL_CONFIG.appUrl}${data.actionUrl}`,
                }),
                subject: `New task assigned: ${data.taskTitle}`,
            }

        case 'asset_uploaded':
            const { AssetUploadedEmail } = await import('./templates/asset-uploaded')
            return {
                template: AssetUploadedEmail({
                    memberName: data.memberName,
                    uploaderName: data.uploaderName,
                    assetName: data.assetName,
                    projectName: data.projectName,
                    actionUrl: `${EMAIL_CONFIG.appUrl}${data.actionUrl}`,
                }),
                subject: `New asset uploaded: ${data.assetName}`,
            }

        case 'workspace_invite':
            const { WorkspaceInviteEmail } = await import('./templates/workspace-invite')
            return {
                template: WorkspaceInviteEmail({
                    inviteeName: data.inviteeName,
                    inviterName: data.inviterName,
                    workspaceName: data.workspaceName,
                    role: data.role,
                    inviteUrl: data.inviteUrl,
                }),
                subject: `You're invited to join ${data.workspaceName} on Virl`,
            }

        case 'project_invite':
            const { ProjectInviteEmail } = await import('./templates/project-invite')
            return {
                template: ProjectInviteEmail({
                    inviteeName: data.inviteeName,
                    inviterName: data.inviterName,
                    projectName: data.projectName,
                    workspaceName: data.workspaceName,
                    role: data.role,
                    inviteUrl: data.inviteUrl,
                }),
                subject: `You're invited to ${data.projectName} on Virl`,
            }

        case 'client_feedback_received':
            const { ClientFeedbackEmail } = await import('./templates/client-feedback')
            return {
                template: ClientFeedbackEmail({
                    clientName: data.clientName,
                    assetName: data.assetName,
                    status: data.status,
                    feedbackText: data.feedbackText,
                    reviewUrl: data.reviewUrl,
                }),
                subject: data.status === 'approved'
                    ? `✅ Content Approved: ${data.assetName}`
                    : `📝 Changes Requested: ${data.assetName}`,
            }

        default:
            throw new Error(`Unknown email type: ${type}`)
    }
}

/**
 * Utility: Get user details for email
 */
export async function getUserEmailDetails(userId: string): Promise<EmailRecipient | null> {
    try {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()

        const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single()

        if (!profile) return null

        return {
            email: profile.email,
            name: profile.full_name || undefined,
        }
    } catch (error) {
        console.error('Error fetching user email details:', error)
        return null
    }
}

/**
 * Utility: Get multiple users' email details
 */
export async function getUsersEmailDetails(userIds: string[]): Promise<EmailRecipient[]> {
    const results = await Promise.all(userIds.map(getUserEmailDetails))
    return results.filter((r): r is EmailRecipient => r !== null)
}
