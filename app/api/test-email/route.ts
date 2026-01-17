import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to') || 'hello@virl.in';

    // 1. Check Env Vars
    const hasKey = !!process.env.RESEND_API_KEY;
    // Match logic in contact.ts
    const mailFrom = process.env.MAIL_FROM || 'Virl Team <hello@updates.virl.in>';

    console.log("--- EMAIL DEBUG START ---");
    console.log("Has API Key:", hasKey);
    console.log("Mail From:", mailFrom);
    console.log("Sending To:", to);

    try {
        if (!hasKey) {
            return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 });
        }

        const data = await resend.emails.send({
            from: mailFrom,
            to: [to],
            subject: "Virl Email Test: " + new Date().toISOString(),
            html: `<p>If you received this, your email configuration is correct!</p><p>From: ${mailFrom}</p>`,
        });

        console.log("Resend Response:", data);

        if (data.error) {
            return NextResponse.json({ success: false, error: data.error, debug: { mailFrom, to } }, { status: 400 });
        }

        return NextResponse.json({ success: true, data, debug: { mailFrom, to } });
    } catch (error: any) {
        console.error("Resend Exception:", error);
        return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
    }
}
