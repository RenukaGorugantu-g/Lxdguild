import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import MembershipCheckout from "./MembershipCheckout";
import { MEMBER_ANNUAL_PRICE_INR, formatMembershipDate, getMembershipState } from "@/lib/membership";

type MembershipPageProfile = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  membership_status?: string | null;
  membership_plan?: string | null;
  membership_expires_at?: string | null;
};

export default async function MembershipPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const membershipProfileResult = await supabase
    .from("profiles")
    .select("name, email, role, membership_status, membership_plan, membership_expires_at")
    .eq("id", user.id)
    .single();
  let profile: MembershipPageProfile | null = membershipProfileResult.data;

  if (membershipProfileResult.error?.code === "42703") {
    const fallback = await supabase
      .from("profiles")
      .select("name, email, role, membership_status")
      .eq("id", user.id)
      .single();
    profile = fallback.data;
  }

  const membership = getMembershipState(profile);

  return (
    <div className="marketing-page min-h-screen">
      <div className="marketing-section pt-32 pb-16">
        <div className="marketing-container max-w-6xl">
        <MembershipCheckout
          isActive={membership.active}
          expiresAtLabel={formatMembershipDate(membership.expiresAt)}
          amountInr={MEMBER_ANNUAL_PRICE_INR}
          userName={profile?.name || null}
          userEmail={profile?.email || user.email || null}
        />
        </div>
      </div>
    </div>
  );
}
