import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    const { orderId, paymentId, signature, planId } = await req.json()

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

    const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(orderId + '|' + paymentId)
        .digest('hex')

    if (generated_signature === signature) {
        // Payment verified! Update DB.
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Find workspaces owned by user and update them
        // (Similar to admin action, but self-serve)
        const { data: workspaces } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_id', user.id)

        if (workspaces && workspaces.length > 0) {
            const wsIds = workspaces.map(w => w.id)

            // Calculate subscription end date (30 days from now)
            const subscriptionEndDate = new Date()
            subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30)

            await supabase.from('workspaces').update({
                plan_tier: planId,
                subscription_end_date: subscriptionEndDate.toISOString()
            }).in('id', wsIds)

            // Send Payment Confirmation Email
            if (process.env.RESEND_API_KEY) {
                try {
                    const { Resend } = await import('resend')
                    const resend = new Resend(process.env.RESEND_API_KEY)
                    const formattedDate = subscriptionEndDate.toLocaleDateString('en-GB')

                    await resend.emails.send({
                        from: process.env.MAIL_FROM || 'Virl <noreply@virl.in>',
                        to: user.email!,
                        subject: 'Upgrade Successful! Welcome to Pro',
                        html: `
                            <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; text-align: center;">
                                <img src="https://virl.in/images/virl-email-logo.png" alt="Virl Logo" style="height: 40px; margin-bottom: 20px;" />
                                <h1 style="color: #7c3aed; margin-bottom: 10px;">Payment Successful! 🎉</h1>
                                <p>Hi there,</p>
                                <p>Thank you for upgrading to the <strong>Pro Plan</strong>. Your payment has been verified.</p>
                                
                                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 5px 0;"><strong>Plan:</strong> Pro Monthly</p>
                                    <p style="margin: 5px 0;"><strong>Amount:</strong> ₹799</p>
                                    <p style="margin: 5px 0;"><strong>Valid Until:</strong> ${formattedDate}</p>
                                    <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
                                </div>

                                <p>You now have access to:</p>
                                <ul>
                                    <li>3 Workspaces</li>
                                    <li>10 Team Members</li>
                                    <li>50 GB Storage</li>
                                    <li>300 Vixi Sparks</li>
                                </ul>
                                
                                <p>Happy creating!<br/>The Virl Team</p>
                            </div>
                        `
                    })
                } catch (err) {
                    console.error('Failed to send payment email:', err)
                }
            }

            // Log to Subscription History
            await supabase.from('subscription_history').insert({
                user_id: user.id,
                plan_tier: planId,
                change_type: 'upgrade',
                amount: 799.00,
                currency: 'INR',
                payment_method: 'razorpay',
                transaction_id: paymentId,
                period_start: new Date().toISOString(),
                period_end: subscriptionEndDate.toISOString(),
                metadata: { orderId }
            })
        }

        return NextResponse.json({ success: true })
    } else {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
}
