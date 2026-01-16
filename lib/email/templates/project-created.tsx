// Simple HTML email template for project created (temporary, without react-email)
export function ProjectCreatedEmail({
  memberName,
  projectName,
  createdBy,
  actionUrl,
}: {
  memberName: string
  projectName: string
  createdBy: string
  actionUrl: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Project Created</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 24px; text-align: center; background-color: #6366f1;">
        <img src="https://virl.in/images/virl-email-logo.png" alt="Virl" width="40" height="40" style="display: block; margin: 0 auto;" />
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 0 24px;">
        <h2 style="color: #18181b; font-size: 24px; margin: 32px 0 16px;">New Project Created! 🚀</h2>
        
        <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 16px 0;">
          Hi ${memberName},
        </p>
        
        <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 16px 0;">
          <strong>${createdBy}</strong> has created a new project: <strong>${projectName}</strong>
        </p>
        
        <!-- Info Box -->
        <table width="100%" cellpadding="16" cellspacing="0" style="background-color: #f0f9ff; border: 2px solid #7dd3fc; border-radius: 8px; margin: 24px 0;">
          <tr>
            <td>
              <p style="color: #0c4a6e; font-size: 14px; margin: 0;">
                ✨ You're part of the team! Start collaborating now.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Button -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
          <tr>
            <td>
              <a href="${actionUrl}" style="display: inline-block; background-color: #6366f1; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
                View Project
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding: 0 24px;">
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">
        <p style="color: #737373; font-size: 12px; text-align: center; margin: 8px 0;">
          You're receiving this because you're a member of this workspace.
        </p>
        <p style="color: #737373; font-size: 12px; text-align: center; margin: 8px 0 48px;">
          Virl - Social Media Content Management Platform
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
