'use server';

import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export async function submitContactForm(data: ContactFormData) {
    if (!process.env.RESEND_API_KEY) {
        console.error("Missing RESEND_API_KEY");
        return { success: false, error: "System configuration error. Please try again later." };
    }

    try {
        const mailFrom = process.env.MAIL_FROM || 'Virl <contact@virl.in>';
        const supportEmail = 'hello@virl.in'; // Target email

        const { error } = await resend.emails.send({
            from: mailFrom, // Must be a verified domain in Resend
            to: [supportEmail],
            replyTo: data.email, // Allow support to reply directly to user
            subject: `[Virl Contact] ${data.subject}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
                    <h2>New Contact Request</h2>
                    <p><strong>Name:</strong> ${data.name}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Subject:</strong> ${data.subject}</p>
                    <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                    <h3>Message:</h3>
                    <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 8px;">${data.message}</p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend API Error:", error);
            return { success: false, error: "Failed to send message. Please try again." };
        }

        return { success: true };
    } catch (e) {
        console.error("Contact Form Exception:", e);
        return { success: false, error: "An unexpected error occurred." };
    }
}
