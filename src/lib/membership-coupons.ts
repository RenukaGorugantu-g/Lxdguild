import { MEMBER_ANNUAL_PRICE_INR } from "@/lib/membership";

type AdminClient = ReturnType<typeof import("@/utils/supabase/admin").createAdminClient>;

export type MembershipCouponRecord = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "flat" | "percent";
  discount_value: number;
  active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  max_redemptions: number | null;
  per_user_redemption_limit: number | null;
};

export type MembershipCouponQuote = {
  couponId: string;
  code: string;
  description: string | null;
  discountType: "flat" | "percent";
  discountValue: number;
  discountAmountInr: number;
  originalAmountInr: number;
  finalAmountInr: number;
};

const EARLY_ACCESS_ALLOWED_EMAILS = new Set([
  "vythee@vylearn.com",
  "nj0309.academician@gmail.com",
  "meena924@gmail.com",
  "potti23062002@gmail.com",
]);

const EARLY_ACCESS_EXPIRY_IST = new Date("2026-05-16T23:59:59+05:30");

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function computeDiscountAmount(discountType: "flat" | "percent", discountValue: number, baseAmountInr: number) {
  if (discountType === "flat") {
    return Math.max(0, Math.min(baseAmountInr, Math.round(discountValue)));
  }

  const percentageAmount = Math.round((baseAmountInr * discountValue) / 100);
  return Math.max(0, Math.min(baseAmountInr, percentageAmount));
}

export async function getMembershipCouponQuote(
  admin: NonNullable<AdminClient>,
  userId: string,
  couponCode: string,
  userEmail?: string | null
): Promise<{ quote: MembershipCouponQuote | null; error: string | null }> {
  const normalizedCode = normalizeCode(couponCode);

  if (!normalizedCode) {
    return { quote: null, error: "Enter a coupon code." };
  }

  const { data: coupon, error: couponError } = await admin
    .from("membership_coupons")
    .select(
      "id, code, description, discount_type, discount_value, active, valid_from, valid_until, max_redemptions, per_user_redemption_limit"
    )
    .eq("code", normalizedCode)
    .maybeSingle<MembershipCouponRecord>();

  if (couponError && couponError.code !== "PGRST116" && couponError.code !== "42P01") {
    return { quote: null, error: couponError.message };
  }

  if (!coupon) {
    return { quote: null, error: "This coupon code was not found." };
  }

  if (!coupon.active) {
    return { quote: null, error: "This coupon is inactive." };
  }

  const now = new Date();
  const validFrom = parseDate(coupon.valid_from);
  const validUntil = parseDate(coupon.valid_until);
  const normalizedEmail = userEmail?.trim().toLowerCase() || "";

  if (validFrom && validFrom.getTime() > now.getTime()) {
    return { quote: null, error: "This coupon is not active yet." };
  }

  if (validUntil && validUntil.getTime() < now.getTime()) {
    return { quote: null, error: "This coupon has expired." };
  }

  if (now.getTime() > EARLY_ACCESS_EXPIRY_IST.getTime()) {
    return { quote: null, error: "This coupon access window closed on May 16, 2026." };
  }

  if (!normalizedEmail || !EARLY_ACCESS_ALLOWED_EMAILS.has(normalizedEmail)) {
    return { quote: null, error: "This coupon is only available for approved early-access email addresses." };
  }

  if (coupon.max_redemptions) {
    const { count, error: totalCountError } = await admin
      .from("membership_coupon_redemptions")
      .select("*", { count: "exact", head: true })
      .eq("coupon_id", coupon.id);

    if (totalCountError && totalCountError.code !== "42P01") {
      return { quote: null, error: totalCountError.message };
    }

    if ((count || 0) >= coupon.max_redemptions) {
      return { quote: null, error: "This coupon has reached its usage limit." };
    }
  }

  const perUserLimit = coupon.per_user_redemption_limit ?? 1;
  if (perUserLimit > 0) {
    const { count, error: userCountError } = await admin
      .from("membership_coupon_redemptions")
      .select("*", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .eq("user_id", userId);

    if (userCountError && userCountError.code !== "42P01") {
      return { quote: null, error: userCountError.message };
    }

    if ((count || 0) >= perUserLimit) {
      return { quote: null, error: "You have already used this coupon." };
    }
  }

  const discountAmountInr = computeDiscountAmount(coupon.discount_type, coupon.discount_value, MEMBER_ANNUAL_PRICE_INR);
  const finalAmountInr = Math.max(1, MEMBER_ANNUAL_PRICE_INR - discountAmountInr);

  return {
    quote: {
      couponId: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountAmountInr,
      originalAmountInr: MEMBER_ANNUAL_PRICE_INR,
      finalAmountInr,
    },
    error: null,
  };
}

export function normalizeMembershipCouponCode(code: string) {
  return normalizeCode(code);
}
