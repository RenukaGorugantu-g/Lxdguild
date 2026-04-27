import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/utils/supabase/server";
import { MEMBER_ANNUAL_PLAN_CODE, MEMBER_ANNUAL_PRICE_INR, hasActiveMembership } from "@/lib/membership";

type MembershipRouteProfile = {
  role?: string | null;
  membership_status?: string | null;
  membership_expires_at?: string | null;
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_jOXWfiSjhOX7IX",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "P4hRxesj7MOwZx1nWovLtNv5",
});

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderProfileResult = await supabase
    .from("profiles")
    .select("role, membership_status, membership_expires_at")
    .eq("id", user.id)
    .single();
  let profile: MembershipRouteProfile | null = orderProfileResult.data;

  if (orderProfileResult.error?.code === "42703") {
    const fallback = await supabase
      .from("profiles")
      .select("role, membership_status")
      .eq("id", user.id)
      .single();
    profile = fallback.data;
  }

  if (hasActiveMembership(profile)) {
    return NextResponse.json({ error: "Membership already active." }, { status: 409 });
  }

  const order = await razorpay.orders.create({
    amount: MEMBER_ANNUAL_PRICE_INR * 100,
    currency: "INR",
    receipt: `membership_${Date.now()}`,
    notes: {
      purpose: "membership",
      plan_code: MEMBER_ANNUAL_PLAN_CODE,
      user_id: user.id,
    },
  });

  return NextResponse.json({
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    planCode: MEMBER_ANNUAL_PLAN_CODE,
    amountInr: MEMBER_ANNUAL_PRICE_INR,
  });
}
