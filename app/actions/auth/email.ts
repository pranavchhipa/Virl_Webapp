'use server';

import { Resend } from 'resend';
import { WelcomeEmail } from '@/lib/email/templates/welcome';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name: string) {
    if (!process.env.RESEND_API_KEY) {
        console.error("Missing RESEND_API_KEY");
        return { success: false, error: "System configuration error." };
    }

    try {
        const mailFrom = process.env.MAIL_FROM || 'Virl <onboarding@virl.in>';
        const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` : 'https://virl.in/login';

        await resend.emails.send({
            from: mailFrom,
            to: [email],
            subject: 'Welcome to Virl! 🚀',
            react: WelcomeEmail({ name, actionUrl: dashboardUrl }),
        });

        return { success: true };
    } catch (e) {
        console.error("Welcome Email Error:", e);
        // We don't want to fail the signup flow if email fails, so just log it.
        return { success: false, error: "Failed to send welcome email." };
    }
}
