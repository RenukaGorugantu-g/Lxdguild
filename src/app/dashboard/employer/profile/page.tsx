import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import EmployerProfileForm from "./EmployerProfileForm";
import { isEmployerRole } from "@/lib/profile-role";

function isMissingColumnError(message?: string | null) {
  const normalized = message || "";
  return normalized.includes("Could not find") || normalized.includes("does not exist");
}

export default async function EmployerProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profileQuery = await supabase
    .from("profiles")
    .select("id, role, name, headline, bio, location, company_name, employer_designation, company_logo_url, company_website, organization_about, hiring_requirements, industry_domain")
    .eq("id", user.id)
    .single();

  let profile = profileQuery.data;

  if (!profile && (profileQuery.error?.code === "42703" || isMissingColumnError(profileQuery.error?.message))) {
    const fallbackQuery = await supabase
      .from("profiles")
      .select("id, role, name, headline, bio, location, company_name, employer_designation")
      .eq("id", user.id)
      .single();

    profile = fallbackQuery.data
      ? {
          ...fallbackQuery.data,
          company_logo_url: null,
          company_website: null,
          organization_about: null,
          hiring_requirements: null,
          industry_domain: null,
        }
      : null;
  }

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
            company_logo_url: profile.company_logo_url,
            company_website: profile.company_website,
            organization_about: profile.organization_about,
            hiring_requirements: profile.hiring_requirements,
            industry_domain: profile.industry_domain,
          }}
        />
      </div>
    </div>
  );
}
