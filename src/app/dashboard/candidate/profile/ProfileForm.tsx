"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User, Briefcase, MapPin, AlignLeft, Award, FileText, Upload, Save, Loader2, Link as LinkIcon, Trash2 } from "lucide-react";
import SkillAutocomplete from "@/components/SkillAutocomplete";
import { useRouter } from "next/navigation";

export default function ProfileForm({ initialProfile, initialResumes }: { initialProfile: any, initialResumes: any[] }) {
  const [profile, setProfile] = useState(initialProfile);
  const [resumes, setResumes] = useState(initialResumes);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSave = async () => {
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
    } catch (err: any) {
      alert("Error updating profile: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);

    try {
      // 1. Upload to Storage (resumes bucket)
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw new Error("Storage upload failed (Make sure 'resumes' bucket exists): " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(filePath);

      // 2. Insert into resumes table
      const { data: resumeData, error: dbError } = await supabase
        .from("resumes")
        .insert({
          user_id: profile.id,
          file_url: publicUrl,
          file_name: file.name
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setResumes([...resumes, resumeData]);
      alert("Resume uploaded!");
    } catch (err: any) {
      alert("Error uploading resume: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteResume = async (id: string) => {
    try {
      const { error } = await supabase.from("resumes").delete().eq("id", id);
      if (error) throw error;
      setResumes(resumes.filter(r => r.id !== id));
    } catch (err: any) {
      alert("Error deleting resume: " + err.message);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-surface-dark border p-8 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
             <User className="w-5 h-5 text-brand-600" />
             <h2 className="font-bold text-lg">Professional Basics</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Full Name</label>
              <input 
                type="text" 
                value={profile.name || ""} 
                onChange={e => setProfile({...profile, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Professional Headline</label>
              <input 
                type="text" 
                placeholder="e.g. Senior Instructional Designer"
                value={profile.headline || ""} 
                onChange={e => setProfile({...profile, headline: e.target.value})}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
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
                  onChange={e => setProfile({...profile, experience_years: parseFloat(e.target.value)})}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
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
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                placeholder="Tell your professional story..."
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white dark:bg-surface-dark border p-8 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
             <Award className="w-5 h-5 text-brand-600" />
             <h2 className="font-bold text-lg">Skills & Expertise</h2>
          </div>
          <SkillAutocomplete 
            selectedSkills={profile.skills || []}
            onAddSkill={(s) => setProfile({...profile, skills: [...(profile.skills || []), s]})}
            onRemoveSkill={(s) => setProfile({...profile, skills: profile.skills.filter((sk: string) => sk !== s)})}
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Resumes */}
        <div className="bg-white dark:bg-surface-dark border p-6 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
             <FileText className="w-5 h-5 text-brand-600" />
             <h2 className="font-bold text-lg">Resumes</h2>
          </div>

          <div className="space-y-3">
            {resumes.map(resume => (
              <div key={resume.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-4 h-4 text-brand-500 shrink-0" />
                  <p className="text-sm font-medium truncate">{resume.file_name || "Resume"}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={resume.file_url} target="_blank" className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-zinc-500">
                    <LinkIcon className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => deleteResume(resume.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <label className="block w-full cursor-pointer">
              <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-brand-500 hover:bg-brand-50/10 transition-all transition-colors">
                {isUploading ? <Loader2 className="w-6 h-6 text-brand-600 animate-spin" /> : <Upload className="w-6 h-6 text-zinc-300" />}
                <p className="mt-2 text-sm font-bold text-zinc-500">Upload New Resume</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">PDF, DOCX (Max 5MB)</p>
              </div>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={isUploading} />
            </label>
          </div>
        </div>

        {/* Action Bar */}
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-xl shadow-brand-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Update Profile
        </button>
      </div>
    </div>
  );
}
