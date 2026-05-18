import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isAdminRole, isEmployerRole } from "@/lib/profile-role";
import PostJobForm from "./PostJobForm";

export default async function EmployerPostJobPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (!isEmployerRole(profile.role) && !isAdminRole(profile.role))) {
    redirect("/dashboard");
  }

  return <PostJobForm isAdmin={isAdminRole(profile.role)} />;
}
