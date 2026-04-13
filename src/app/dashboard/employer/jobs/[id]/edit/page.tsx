import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import JobEditForm from "./JobEditForm";

export default async function EditJobPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (!profile.role?.startsWith("employer") && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, company, location, apply_url, description, user_id")
    .eq("id", params.id)
    .single();

  if (!job) notFound();

  if (profile.role !== "admin" && job.user_id !== user.id) {
    redirect("/dashboard");
  }

  return <JobEditForm initialJob={job} />;
}
