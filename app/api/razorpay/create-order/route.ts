import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error('Razorpay keys missing')
        return NextResponse.json({ error: 'Payment configuration missing' }, { status: 500 })
    }

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    // Get plan details (MVP: Only 'pro' supported via API for now)
    const body = await req.json()
    const planId = body.planId // 'pro'

    if (planId !== 'pro') {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const amount = 799 * 100 // 799 INR in paisa
    const currency = 'INR'

    try {
        const order = await razorpay.orders.create({
            amount,
            currency,
            // Razorpay receipt max length is 40 chars. 
            // UUID is 36 chars, so we need to be careful.
            // Using a shortened unique string: r_ + last 8 chars of user + timestamp
            receipt: `r_${user.id.slice(-8)}_${Date.now().toString().slice(-13)}`,
            notes: {
                userId: user.id,
                planId: 'pro'
            }
        })

        return NextResponse.json({ orderId: order.id, amount, currency, keyId: process.env.RAZORPAY_KEY_ID })
    } catch (error: any) {
        console.error('Razorpay Order Creation Error Full Details:', JSON.stringify(error, null, 2))
        console.error('Error Message:', error.message)
        console.error('Error Stack:', error.stack)
        return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 })
    }
}
