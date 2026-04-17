import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  MEMBER_ANNUAL_PLAN_CODE,
  MEMBER_ANNUAL_PRICE_INR,
  addMembershipYear,
  hasActiveMembership,
} from "@/lib/membership";

export async function POST(req: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json({ error: "Missing admin credentials." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing Razorpay verification fields." }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || "P4hRxesj7MOwZx1nWovLtNv5";
  const digest = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (digest !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const verifyProfileResult = await admin
    .from("profiles")
    .select("role, membership_status, membership_expires_at")
    .eq("id", user.id)
    .single();
  let profile = verifyProfileResult.data;

  if (verifyProfileResult.error?.code === "42703") {
    const fallback = await admin
      .from("profiles")
      .select("role, membership_status")
      .eq("id", user.id)
      .single();
    profile = fallback.data;
  }

  if (hasActiveMembership(profile)) {
    return NextResponse.json({ success: true, alreadyActive: true });
  }

  const now = new Date();
  const expiresAt = addMembershipYear(now);

  let { error: updateError } = await admin
    .from("profiles")
    .update({
      membership_status: "active",
      membership_plan: MEMBER_ANNUAL_PLAN_CODE,
      membership_started_at: now.toISOString(),
      membership_expires_at: expiresAt.toISOString(),
      membership_order_id: razorpay_order_id,
      membership_payment_id: razorpay_payment_id,
    })
    .eq("id", user.id);

  if (updateError?.code === "42703") {
    const fallbackUpdate = await admin
      .from("profiles")
      .update({
        membership_status: `active_until:${expiresAt.toISOString()}`,
      })
      .eq("id", user.id);
    updateError = fallbackUpdate.error;
  }

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: paymentError } = await admin
    .from("membership_payments")
    .insert({
      user_id: user.id,
      amount_inr: MEMBER_ANNUAL_PRICE_INR,
      currency: "INR",
      plan_code: MEMBER_ANNUAL_PLAN_CODE,
      status: "paid",
      razorpay_order_id,
      razorpay_payment_id,
      membership_started_at: now.toISOString(),
      membership_expires_at: expiresAt.toISOString(),
    });

  if (paymentError && paymentError.code !== "PGRST205" && paymentError.code !== "42P01") {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    membershipStartedAt: now.toISOString(),
    membershipExpiresAt: expiresAt.toISOString(),
  });
}
