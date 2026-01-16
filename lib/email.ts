import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html, react }: { to: string, subject: string, html?: string, react?: React.ReactElement }) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn("RESEND_API_KEY is missing. Email simulation:", { to, subject });
            return { success: true, simulated: true };
        }

        const fromEmail = process.env.MAIL_FROM || 'Virl <onboarding@resend.dev>';

        if (fromEmail.includes('onboarding@resend.dev')) {
            console.warn("⚠️  WARNING: Using Resend Test Domain. Emails to external users will FAIL.");
            console.warn("   Action: Set MAIL_FROM in .env.local to 'Virl <noreply@virl.in>'");
        }

        console.log(`Sending email to ${to} from ${fromEmail}`);

        const payload: any = {
            from: fromEmail,
            to: [to],
            subject: subject,
        };

        if (react) {
            payload.react = react;
        } else if (html) {
            payload.html = html;
        } else {
            throw new Error("Either 'html' or 'react' content must be provided");
        }

        const data = await resend.emails.send(payload);

        if (data.error) {
            console.error("Resend API Error:", data.error);
            return { success: false, error: data.error };
        }

        console.log("Email sent successfully:", data);
        return { success: true, data };
    } catch (error) {
        console.error("Email Exception:", error);
        return { success: false, error };
    }
};
