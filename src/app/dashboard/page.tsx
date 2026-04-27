import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CandidateDashboard from "./candidate/page";
import EmployerDashboard from "./employer/page";
import AdminDashboard from "./admin/page";
import { getBaseRole } from "@/lib/profile-role";
import { ensureUserProfile } from "@/lib/ensure-user-profile";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    profile = await ensureUserProfile(user);
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="max-w-xl rounded-[28px] border border-[#dfe8d8] bg-white p-8 text-center shadow-[0_18px_45px_rgba(94,119,74,0.08)]">
          <h1 className="text-2xl font-semibold text-[#111827]">We could not finish setting up your profile.</h1>
          <p className="mt-3 text-sm leading-7 text-[#5f6876]">
            Your account is signed in, but the profile record is missing. Please contact support or sign out and register again.
          </p>
        </div>
      </div>
    );
  }

  const validRoles = new Set([
    "visitor",
    "candidate_onhold",
    "candidate_mvp",
    "employer_free",
    "employer_pro",
    "employer_premium",
    "pro_member",
    "admin",
  ]);

  const roleStr = String(profile.role || "").toLowerCase();
  if (!roleStr || !validRoles.has(roleStr)) {
    const repairedProfile = await ensureUserProfile(user);
    if (repairedProfile) {
      profile = repairedProfile;
    }
  }

  const baseRole = getBaseRole(profile);

  if (baseRole === "candidate") {
    return <CandidateDashboard profile={profile} />;
  }

  if (baseRole === "employer") {
    return <EmployerDashboard profile={profile} />;
  }

  if (baseRole === "admin") {
    return <AdminDashboard profile={profile} />;
  }

  return (
    <div className="flex h-screen items-center justify-center pt-16">
      <p>Unrecognized role.</p>
    </div>
  );
}
