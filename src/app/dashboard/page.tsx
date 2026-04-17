import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CandidateDashboard from "./candidate/page";
import EmployerDashboard from "./employer/page";
import AdminDashboard from "./admin/page";
import { getBaseRole } from "@/lib/profile-role";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
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
