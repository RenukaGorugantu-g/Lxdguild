import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import EmployerProfileForm from "./EmployerProfileForm";
import { isEmployerRole } from "@/lib/profile-role";

export default async function EmployerProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, name, headline, bio, location, company_name, employer_designation")
    .eq("id", user.id)
    .single();

  if (!profile || !isEmployerRole(profile.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="premium-shell premium-page">
      <div className="premium-content premium-container space-y-8">
        <section className="premium-hero p-8 sm:p-10">
          <div className="premium-badge">Employer Profile</div>
          <h1 className="premium-title mt-5 text-4xl sm:text-5xl">Tell candidates who you are and what your company stands for.</h1>
          <p className="premium-copy mt-4 max-w-3xl text-sm leading-7">
            Keep your employer presence sharp with a cleaner story, better company context, and more confidence for every applicant who lands on your job posts.
          </p>
        </section>

        <EmployerProfileForm
          initialProfile={{
            id: profile.id,
            name: profile.name,
            headline: profile.headline,
            bio: profile.bio,
            location: profile.location,
            company_name: profile.company_name,
            employer_designation: profile.employer_designation,
          }}
        />
      </div>
    </div>
  );
}
