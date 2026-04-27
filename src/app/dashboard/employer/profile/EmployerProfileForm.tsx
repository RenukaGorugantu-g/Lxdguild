"use client";

import { useState } from "react";
import { Building2, FileText, Loader2, MapPin, Save, UserRound } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type EmployerProfileRecord = {
  id: string;
  name?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  company_name?: string | null;
  employer_designation?: string | null;
};

const employerDesignationOptions = [
  { value: "hiring_manager", label: "Hiring Manager" },
  { value: "talent_acquisition", label: "Talent Acquisition" },
  { value: "founder_ceo", label: "Founder / CEO" },
  { value: "ld_leader", label: "L&D Leader" },
  { value: "hr_business_partner", label: "HR Business Partner" },
];

export default function EmployerProfileForm({ initialProfile }: { initialProfile: EmployerProfileRecord }) {
  const [profile, setProfile] = useState(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        headline: profile.headline,
        bio: profile.bio,
        location: profile.location,
        company_name: profile.company_name,
        employer_designation: profile.employer_designation,
      })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message || "Unable to update employer profile.");
      setIsSaving(false);
      return;
    }

    setStatus("Employer profile updated successfully.");
    setIsSaving(false);
    router.refresh();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="premium-card-light p-8">
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 border-b border-[#e4ebdf] pb-4">
              <UserRound className="h-5 w-5 text-[#138d1a]" />
              <h2 className="text-lg font-bold text-[#111827]">About You</h2>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Full Name" value={profile.name || ""} onChange={(value) => setProfile({ ...profile, name: value })} placeholder="Your full name" />
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">Designation</label>
                <select
                  value={profile.employer_designation || "hiring_manager"}
                  onChange={(e) => setProfile({ ...profile, employer_designation: e.target.value })}
                  className="w-full rounded-2xl border border-[#dbe4d5] bg-white px-4 py-3 text-sm outline-none focus:border-[#8fd97e] focus:ring-2 focus:ring-[#8fd97e]"
                >
                  {employerDesignationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Headline" value={profile.headline || ""} onChange={(value) => setProfile({ ...profile, headline: value })} placeholder="Hiring high-impact L&D talent" />
              <Field label="Location" icon={MapPin} value={profile.location || ""} onChange={(value) => setProfile({ ...profile, location: value })} placeholder="Bangalore / Remote" />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">About You</label>
              <textarea
                rows={5}
                value={profile.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full rounded-3xl border border-[#dbe4d5] bg-white px-4 py-3 text-sm outline-none focus:border-[#8fd97e] focus:ring-2 focus:ring-[#8fd97e]"
                placeholder="Share your hiring approach, what you value in talent, and how your team works."
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 border-b border-[#e4ebdf] pb-4">
              <Building2 className="h-5 w-5 text-[#138d1a]" />
              <h2 className="text-lg font-bold text-[#111827]">Company Details</h2>
            </div>

            <div className="mt-6 grid gap-5">
              <Field
                label="Company Name"
                value={profile.company_name || ""}
                onChange={(value) => setProfile({ ...profile, company_name: value })}
                placeholder="Maple Learning Solutions"
              />
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">Company Snapshot</label>
                <div className="rounded-3xl border border-[#dbe4d5] bg-[#f8fbf4] p-5 text-sm leading-7 text-[#55606f]">
                  This profile will appear across your employer workflow so candidates see the company name, your designation, location, and a clearer hiring context before they apply.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="premium-card-light p-6">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-[#138d1a]" />
            <h3 className="text-lg font-bold text-[#111827]">Employer Preview</h3>
          </div>
          <div className="mt-6 rounded-[1.8rem] border border-[#dce7d4] bg-white p-5 shadow-[0_16px_40px_rgba(87,108,67,0.06)]">
            <p className="text-lg font-semibold text-[#111827]">{profile.company_name || "Your Company Name"}</p>
            <p className="mt-1 text-sm text-[#138d1a]">{toLabel(profile.employer_designation) || "Hiring Manager"}</p>
            <p className="mt-4 text-sm font-medium text-[#2c3440]">{profile.headline || "Hiring top L&D talent with clarity and intent."}</p>
            <p className="mt-3 text-sm leading-6 text-[#5b6757]">{profile.bio || "Add a short employer story to help candidates understand your team, hiring approach, and brand."}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[#8a9482]">{profile.location || "Location not added yet"}</p>
          </div>
        </div>

        <div className="premium-card-light p-6">
          <h3 className="text-lg font-bold text-[#111827]">Next Step</h3>
          <p className="mt-3 text-sm leading-7 text-[#5b6757]">
            Once this looks right, post jobs with a cleaner employer story and send serious candidates to a stronger first impression.
          </p>
          {status ? <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{status}</div> : null}
          {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[1.1rem] bg-[linear-gradient(135deg,#118118,#2aa82b)] py-4 font-bold text-white shadow-[0_18px_36px_rgba(24,124,29,0.2)] transition-all hover:scale-[1.01] disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {isSaving ? "Saving..." : "Save Employer Profile"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: typeof MapPin;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">{label}</label>
      <div className="relative">
        {Icon ? <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /> : null}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-2xl border border-[#dbe4d5] bg-white px-4 py-3 text-sm outline-none focus:border-[#8fd97e] focus:ring-2 focus:ring-[#8fd97e] ${Icon ? "pl-10" : ""}`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function toLabel(value?: string | null) {
  if (!value) return "";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
