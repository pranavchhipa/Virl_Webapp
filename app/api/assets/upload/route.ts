
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { filename, uploaderName, projectId } = await request.json();

        // In a real app, you would fetch the workspace/project admin email from DB.
        // For now, we mock it or use a default.
        const adminEmail = 'admin@virl.in'; // Replace with real logic

        const { data, error } = await resend.emails.send({
            from: 'Virl Team <notifications@virl.in>', // Use validated domain or resend default
            to: [adminEmail],
            subject: `New Asset Uploaded: ${filename}`,
            html: `
        <h1>New Asset Uploaded</h1>
        <p><strong>${uploaderName}</strong> uploaded <strong>${filename}</strong> to project ID: ${projectId}.</p>
        <p>Login to Virl.in to review.</p>
      `,
        });

        if (error) {
            return NextResponse.json({ error }, { status: 400 });
        }

        return NextResponse.json({ message: 'Notification sent', data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
