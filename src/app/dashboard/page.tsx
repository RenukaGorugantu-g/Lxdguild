import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getBaseRole } from "@/lib/profile-role";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { loadProfile } from "@/lib/load-profile";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profile = await loadProfile<{
    role?: string | null;
    name?: string | null;
    membership_status?: string | null;
    membership_plan?: string | null;
    membership_expires_at?: string | null;
  }>(supabase, user.id, "role, name, membership_status, membership_plan, membership_expires_at");

  if (!profile) {
    const metadataRole =
      typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null;

    if (metadataRole) {
      profile = {
        role: metadataRole,
        name: typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null,
        membership_status: null,
        membership_plan: null,
        membership_expires_at: null,
      };
    } else {
      profile = await ensureUserProfile(user);
    }
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

  const roleStr = String(profile.role || "").toLowerCase();
  if (!roleStr) {
    const repairedProfile = await ensureUserProfile(user);
    if (repairedProfile) {
      profile = repairedProfile;
    }
  }

  const baseRole = getBaseRole(profile);

  if (baseRole === "candidate") {
    redirect("/dashboard/candidate");
  }

  if (baseRole === "employer") {
    redirect("/dashboard/employer");
  }

  if (baseRole === "admin") {
    redirect("/dashboard/admin");
  }

  return (
    <div className="flex h-screen items-center justify-center pt-16">
      <p>Unrecognized role.</p>
    </div>
  );
}
