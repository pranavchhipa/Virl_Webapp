'use server';

import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
    turnstileToken: string;
}

// Verify Turnstile token with Cloudflare
async function verifyTurnstileToken(token: string): Promise<boolean> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
        console.error("Missing TURNSTILE_SECRET_KEY");
        return false;
    }

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: secretKey,
                response: token,
            }),
        });

        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error("Turnstile verification error:", error);
        return false;
    }
}

export async function submitContactForm(data: ContactFormData) {
    // Verify Turnstile token first
    const isValidToken = await verifyTurnstileToken(data.turnstileToken);

    if (!isValidToken) {
        console.error("Turnstile verification failed");
        return { success: false, error: "Security verification failed. Please try again." };
    }

    if (!process.env.RESEND_API_KEY) {
        console.error("Missing RESEND_API_KEY");
        return { success: false, error: "System configuration error. Please try again later." };
    }

    try {
        // Use environment variable for sender, defaulting to the one likely to be verified
        // If 'virl.in' is not verified on Resend, you MUST use 'onboarding@resend.dev' for testing
        const mailFrom = process.env.MAIL_FROM || 'Virl Team <hello@updates.virl.in>';
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

