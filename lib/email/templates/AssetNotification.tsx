
interface AssetNotificationProps {
    projectName: string;
    uploaderName: string;
    fileName: string;
    projectUrl: string;
    projectId: string; // Added to match new template requirements if needed, or derived
}

export const AssetNotificationEmail = ({
    projectName,
    uploaderName,
    fileName,
    projectUrl,
    projectId
}: AssetNotificationProps) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    </style>
</head>
<body>
    <div style="font-family: sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://virl.in/images/virl-email-logo.png" width="40" height="40" alt="Virl" />
        </div>
        <h2>🎥 New Content Uploaded</h2>
        <p><strong>${uploaderName}</strong> just uploaded <strong>"${fileName}"</strong> to ${projectName}.</p>
        <a href="https://virl.in/projects/${projectId}/assets" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Assets</a>
    </div>
</body>
</html>
`;
