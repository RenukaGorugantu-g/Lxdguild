"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User, Briefcase, MapPin, AlignLeft, Award, FileText, Upload, Save, Loader2, Link as LinkIcon, Trash2 } from "lucide-react";
import SkillAutocomplete from "@/components/SkillAutocomplete";
import { useRouter } from "next/navigation";

type ProfileRecord = {
  id: string;
  name?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  skills?: string[] | null;
  experience_years?: number | null;
};

const EMPTY_PROFILE_FIELDS: Omit<ProfileRecord, "id"> = {
  name: "",
  headline: "",
  bio: "",
  location: "",
  skills: [],
  experience_years: null,
};

function buildProfileState(initialProfile: ProfileRecord | null): ProfileRecord {
  return {
    id: initialProfile?.id ?? "",
    ...EMPTY_PROFILE_FIELDS,
    ...initialProfile,
    skills: initialProfile?.skills ?? [],
    experience_years: initialProfile?.experience_years ?? null,
  };
}

type ResumeRecord = {
  id: string;
  file_url?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  mime_type?: string | null;
};

function isMissingColumnError(message?: string | null) {
  const normalized = message || "";
  return (
    normalized.includes("Could not find") ||
    normalized.includes("does not exist") ||
    normalized.includes("schema cache")
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "Unknown error";
}

function isSupportedResumeFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return ["pdf", "docx"].includes(extension || "");
}

async function insertResumeRecord(
  supabase: ReturnType<typeof createClient>,
  payload: {
    user_id: string;
    file_url: string;
    file_name: string;
    file_path: string;
    mime_type: string | null;
  }
) {
  const fullInsert = await supabase
    .from("resumes")
    .insert(payload)
    .select()
    .single();

  if (!fullInsert.error) {
    return fullInsert;
  }

  if (fullInsert.error.code !== "42703" && !isMissingColumnError(fullInsert.error.message)) {
    return fullInsert;
  }

  const mediumInsert = await supabase
    .from("resumes")
    .insert({
      user_id: payload.user_id,
      file_url: payload.file_url,
      file_name: payload.file_name,
      file_path: payload.file_path,
      mime_type: payload.mime_type,
    })
    .select()
    .single();

  if (!mediumInsert.error) {
    return mediumInsert;
  }

  if (mediumInsert.error.code !== "42703" && !isMissingColumnError(mediumInsert.error.message)) {
    return mediumInsert;
  }

  return supabase
    .from("resumes")
    .insert({
      user_id: payload.user_id,
      file_url: payload.file_url,
      file_name: payload.file_name,
    })
    .select()
    .single();
}

export default function ProfileForm({
  initialProfile,
  initialResumes,
}: {
  initialProfile: ProfileRecord | null;
  initialResumes: ResumeRecord[];
}) {
  const [profile, setProfile] = useState(() => buildProfileState(initialProfile));
  const [resumes, setResumes] = useState(initialResumes);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSave = async () => {
    if (!profile.id) {
      alert("Profile is still loading. Please refresh and try again.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          headline: profile.headline,
          bio: profile.bio,
          location: profile.location,
          skills: profile.skills,
          experience_years: profile.experience_years
        })
        .eq("id", profile.id);

      if (error) throw error;
      alert("Profile updated successfully!");
      router.refresh();
    } catch (err: unknown) {
      alert("Error updating profile: " + getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (!isSupportedResumeFile(file)) {
      alert("Please upload a PDF or DOCX resume file.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload to Storage (resumes bucket)
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw new Error("Storage upload failed (Make sure 'resumes' bucket exists): " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(filePath);

      // 2. Insert into resumes table
      const { data: resumeData, error: dbError } = await insertResumeRecord(supabase, {
        user_id: profile.id,
        file_url: publicUrl,
        file_name: file.name,
        file_path: filePath,
        mime_type: file.type || null,
      });

      if (dbError) throw new Error(dbError.message || "Resume record could not be created.");
      setResumes((current) => [...current, resumeData]);
      alert("Resume uploaded successfully!");
    } catch (err: unknown) {
      alert("Error uploading resume: " + getErrorMessage(err));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const deleteResume = async (id: string) => {
    try {
      const { error } = await supabase.from("resumes").delete().eq("id", id);
      if (error) throw error;
      setResumes(resumes.filter(r => r.id !== id));
    } catch (err: unknown) {
      alert("Error deleting resume: " + getErrorMessage(err));
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        {/* Basic Info */}
        <div className="rounded-[1.9rem] border border-[#dde7d8] bg-[#fbfdf8] p-8 shadow-[0_16px_40px_rgba(87,108,67,0.06)] space-y-6">
          <div className="flex items-center gap-3 border-b border-[#e4ebdf] pb-4">
             <User className="w-5 h-5 text-[#138d1a]" />
             <h2 className="font-bold text-lg">Professional Basics</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Full Name</label>
              <input 
                type="text" 
                value={profile.name || ""} 
                onChange={e => setProfile({...profile, name: e.target.value})}
                className="w-full rounded-2xl border border-[#dbe4d5] bg-white px-4 py-3 focus:ring-2 focus:ring-[#8fd97e] outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Professional Headline</label>
              <input 
                type="text" 
                placeholder="e.g. Senior Instructional Designer"
                value={profile.headline || ""} 
                onChange={e => setProfile({...profile, headline: e.target.value})}
                className="w-full rounded-2xl border border-[#dbe4d5] bg-white px-4 py-3 focus:ring-2 focus:ring-[#8fd97e] outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  value={profile.location || ""} 
                  onChange={e => setProfile({...profile, location: e.target.value})}
                  className="w-full rounded-2xl border border-[#dbe4d5] bg-white py-3 pl-10 pr-4 focus:ring-2 focus:ring-[#8fd97e] outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Years of Experience</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="number" 
                  step="0.5"
                  value={profile.experience_years || ""} 
                  onChange={e => setProfile({...profile, experience_years: e.target.value ? parseFloat(e.target.value) : null})}
                  className="w-full rounded-2xl border border-[#dbe4d5] bg-white py-3 pl-10 pr-4 focus:ring-2 focus:ring-[#8fd97e] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Professional Bio / Summary</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
              <textarea 
                rows={4}
                value={profile.bio || ""} 
                onChange={e => setProfile({...profile, bio: e.target.value})}
                className="w-full rounded-2xl border border-[#dbe4d5] bg-white py-3 pl-10 pr-4 focus:ring-2 focus:ring-[#8fd97e] outline-none resize-none"
                placeholder="Tell your professional story..."
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="rounded-[1.9rem] border border-[#dde7d8] bg-[#fbfdf8] p-8 shadow-[0_16px_40px_rgba(87,108,67,0.06)] space-y-6">
          <div className="flex items-center gap-3 border-b border-[#e4ebdf] pb-4">
             <Award className="w-5 h-5 text-[#138d1a]" />
             <h2 className="font-bold text-lg">Skills & Expertise</h2>
          </div>
          <SkillAutocomplete 
            selectedSkills={profile.skills || []}
            onAddSkill={(s) => setProfile({...profile, skills: [...(profile.skills || []), s]})}
            onRemoveSkill={(s) => setProfile({...profile, skills: (profile.skills || []).filter((sk: string) => sk !== s)})}
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Resumes */}
        <div className="rounded-[1.9rem] border border-[#dde7d8] bg-[#fbfdf8] p-6 shadow-[0_16px_40px_rgba(87,108,67,0.06)] space-y-6">
          <div className="flex items-center gap-3 border-b border-[#e4ebdf] pb-4">
             <FileText className="w-5 h-5 text-[#138d1a]" />
             <h2 className="font-bold text-lg">Resumes</h2>
          </div>

          <div className="space-y-3">
            {resumes.map(resume => (
              <div key={resume.id} className="space-y-4 rounded-2xl border border-[#e4ebdf] bg-white p-4">
                <div className="flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-4 h-4 text-[#138d1a] shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{resume.file_name || "Resume"}</p>
                      <p className="text-[11px] text-zinc-400 uppercase tracking-[0.18em]">Uploaded resume</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`/api/resumes/${resume.id}/download`} target="_blank" className="rounded-lg p-1.5 text-zinc-500 hover:bg-[#f4f7f1]">
                      <LinkIcon className="w-3.5 h-3.5" />
                    </a>
                    <button onClick={() => deleteResume(resume.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}

            <label className="block w-full cursor-pointer">
              <div className="flex flex-col items-center justify-center rounded-[1.6rem] border-2 border-dashed border-[#dbe4d5] py-8 transition-all transition-colors hover:border-[#8fd97e] hover:bg-[#f7fbf4]">
                {isUploading ? <Loader2 className="w-6 h-6 text-[#138d1a] animate-spin" /> : <Upload className="w-6 h-6 text-zinc-300" />}
                <p className="mt-2 text-sm font-bold text-zinc-500">Upload New Resume</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">PDF, DOCX</p>
              </div>
              <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleResumeUpload} disabled={isUploading} />
            </label>
          </div>
        </div>

        {/* Action Bar */}
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 rounded-[1.1rem] bg-[linear-gradient(135deg,#118118,#2aa82b)] py-4 font-bold text-white shadow-[0_18px_36px_rgba(24,124,29,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Update Profile
        </button>
      </div>
    </div>
  );
}
