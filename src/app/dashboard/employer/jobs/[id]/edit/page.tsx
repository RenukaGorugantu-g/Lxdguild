import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import JobEditForm from "./JobEditForm";
import { isAdminRole, isEmployerRole } from "@/lib/profile-role";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (!isEmployerRole(profile.role) && !isAdminRole(profile.role))) {
    redirect("/dashboard");
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, company, location, apply_url, description, user_id")
    .eq("id", id)
    .single();

  if (!job) notFound();

  if (!isAdminRole(profile.role) && job.user_id !== user.id) {
    redirect("/dashboard");
  }

  return <JobEditForm initialJob={job} />;
}
