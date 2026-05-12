import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/utils/supabase/server";
import { MEMBER_ANNUAL_PLAN_CODE, MEMBER_ANNUAL_PRICE_INR, hasActiveMembership } from "@/lib/membership";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { createAdminClient } from "@/utils/supabase/admin";
import { getMembershipCouponQuote, normalizeMembershipCouponCode } from "@/lib/membership-coupons";

type MembershipRouteProfile = {
  role?: string | null;
  membership_status?: string | null;
  membership_expires_at?: string | null;
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_jOXWfiSjhOX7IX",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "P4hRxesj7MOwZx1nWovLtNv5",
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!admin) {
    return NextResponse.json({ error: "Missing admin credentials." }, { status: 500 });
  }

  await ensureUserProfile(user);

  const body = await req.json().catch(() => null);
  const couponCode = typeof body?.couponCode === "string" ? normalizeMembershipCouponCode(body.couponCode) : "";

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

  const { quote, error: couponError } = couponCode
    ? await getMembershipCouponQuote(admin, user.id, couponCode)
    : { quote: null, error: null };

  if (couponCode && (couponError || !quote)) {
    return NextResponse.json({ error: couponError || "Unable to apply coupon." }, { status: 400 });
  }

  const finalAmountInr = quote?.finalAmountInr ?? MEMBER_ANNUAL_PRICE_INR;
  const discountAmountInr = quote?.discountAmountInr ?? 0;

  const order = await razorpay.orders.create({
    amount: finalAmountInr * 100,
    currency: "INR",
    receipt: `membership_${Date.now()}`,
    notes: {
      purpose: "membership",
      plan_code: MEMBER_ANNUAL_PLAN_CODE,
      user_id: user.id,
      original_amount_inr: String(MEMBER_ANNUAL_PRICE_INR),
      discount_amount_inr: String(discountAmountInr),
      final_amount_inr: String(finalAmountInr),
      coupon_code: quote?.code || "",
    },
  });

  return NextResponse.json({
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    planCode: MEMBER_ANNUAL_PLAN_CODE,
    amountInr: finalAmountInr,
    originalAmountInr: MEMBER_ANNUAL_PRICE_INR,
    discountAmountInr,
    couponCode: quote?.code || null,
  });
}
