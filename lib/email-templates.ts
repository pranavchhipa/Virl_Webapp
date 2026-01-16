
const BASE_STYLE = `font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155; border: 1px solid #e2e8f0; border-radius: 12px;`
const BUTTON_STYLE = `display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; text-align: center;`
const HEADER_STYLE = `text-align: center; margin-bottom: 24px;`
const LOGO_STYLE = `color: #4f46e5; font-size: 24px; font-weight: 800; margin: 0 0 16px; letter-spacing: -0.5px;`

export function getWorkspaceInviteTemplate(role: string, inviteUrl: string) {
    return `
        <div style="${BASE_STYLE}">
            <div style="${HEADER_STYLE}">
                <h1 style="${LOGO_STYLE}">Virl</h1>
                <h2 style="margin: 0; color: #1e293b; font-size: 20px;">Workspace Invitation</h2>
            </div>
            <div style="padding: 24px; background-color: #f8fafc; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">
                    You have been invited to join the workspace on Virl as a <strong>${role}</strong>.
                </p>
                <a href="${inviteUrl}" style="${BUTTON_STYLE}">Join Workspace</a>
            </div>
            <p style="text-align: center; font-size: 12px; color: #94a3b8; margin: 0;">
                If the button doesn't work, copy and paste this link:<br>
                <a href="${inviteUrl}" style="color: #4f46e5;">${inviteUrl}</a>
            </p>
        </div>
    `
}

export function getProjectAssignmentTemplate(projectName: string, role: string, url: string) {
    return `
        <div style="${BASE_STYLE}">
            <div style="${HEADER_STYLE}">
                <h1 style="${LOGO_STYLE}">Virl</h1>
                <h2 style="margin: 0; color: #1e293b; font-size: 20px;">New Project Assignment</h2>
            </div>
             <div style="padding: 24px; background-color: #f8fafc; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">
                    You have been assigned to project <strong>${projectName}</strong> as a <strong>${role}</strong>.
                </p>
                <a href="${url}" style="${BUTTON_STYLE}">View Project</a>
            </div>
        </div>
    `
}

export function getNewAssetTemplate(projectName: string, uploaderName: string, fileName: string, url: string) {
    return `
         <div style="${BASE_STYLE}">
            <div style="${HEADER_STYLE}">
                <h1 style="${LOGO_STYLE}">Virl</h1>
                <h2 style="margin: 0; color: #1e293b; font-size: 20px;">New Asset Uploaded</h2>
            </div>
             <div style="padding: 24px; background-color: #f8fafc; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.5;">
                    <strong>${uploaderName}</strong> uploaded a new asset to <strong>${projectName}</strong>.
                </p>
                 <p style="margin: 0 0 16px; font-size: 14px; color: #64748b;">
                    File: ${fileName}
                </p>
                <a href="${url}" style="${BUTTON_STYLE}">Review Asset</a>
            </div>
        </div>
    `
}

export function getMentionTemplate(content: string, authorName: string, url: string) {
    return `
         <div style="${BASE_STYLE}">
            <div style="${HEADER_STYLE}">
                <h1 style="${LOGO_STYLE}">Virl</h1>
                <h2 style="margin: 0; color: #1e293b; font-size: 20px;">You were mentioned</h2>
            </div>
             <div style="padding: 24px; background-color: #f8fafc; border-radius: 8px; text-align: left; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #475569;">
                    ${authorName} mentioned you:
                </p>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-style: italic; color: #334155; margin-bottom: 16px;">
                    "${content}"
                </div>
                 <div style="text-align: center;">
                    <a href="${url}" style="${BUTTON_STYLE}">View Context</a>
                 </div>
            </div>
        </div>
    `
}
