import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isAdminRole, isEmployerRole } from "@/lib/profile-role";
import PostJobForm from "./PostJobForm";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Post a Job",
  "Private employer route for creating L&D job listings and managing hiring inputs."
);

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
