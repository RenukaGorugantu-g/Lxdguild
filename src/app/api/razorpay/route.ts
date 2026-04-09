import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_jOXWfiSjhOX7IX',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'P4hRxesj7MOwZx1nWovLtNv5',
});

export async function POST(request: Request) {
  try {
    const { amount } = await request.json(); // amount in INR (from client)

    const options = {
      amount: amount * 100, // Razorpay expects amount in smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
