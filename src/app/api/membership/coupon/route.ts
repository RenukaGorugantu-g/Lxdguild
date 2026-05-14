import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getMembershipCouponQuote, normalizeMembershipCouponCode } from "@/lib/membership-coupons";

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

  const body = await req.json().catch(() => null);
  const couponCode = typeof body?.couponCode === "string" ? normalizeMembershipCouponCode(body.couponCode) : "";

  const { quote, error } = await getMembershipCouponQuote(admin, user.id, couponCode, user.email);

  if (error || !quote) {
    return NextResponse.json({ error: error || "Unable to apply coupon." }, { status: 400 });
  }

  return NextResponse.json({
    coupon: {
      code: quote.code,
      description: quote.description,
      discountType: quote.discountType,
      discountValue: quote.discountValue,
    },
    pricing: {
      originalAmountInr: quote.originalAmountInr,
      discountAmountInr: quote.discountAmountInr,
      finalAmountInr: quote.finalAmountInr,
    },
  });
}
