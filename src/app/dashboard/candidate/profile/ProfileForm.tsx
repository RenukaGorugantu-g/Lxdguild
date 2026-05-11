"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User, Briefcase, MapPin, AlignLeft, Award, FileText, Upload, Save, Loader2, Link as LinkIcon, Trash2, Sparkles, Wand2, Compass, Mail, TrendingUp, CheckCircle2, X } from "lucide-react";
import SkillAutocomplete from "@/components/SkillAutocomplete";
import { useRouter } from "next/navigation";

type ProfileRecord = {
  id: string;
  name?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  portfolio_url?: string | null;
  skills?: string[] | null;
  experience_years?: number | null;
};

const EMPTY_PROFILE_FIELDS: Omit<ProfileRecord, "id"> = {
  name: "",
  headline: "",
  bio: "",
  location: "",
  portfolio_url: "",
  skills: [],
  experience_years: null,
};

function buildProfileState(initialProfile: ProfileRecord | null): ProfileRecord {
  return {
    id: initialProfile?.id ?? "",
    ...EMPTY_PROFILE_FIELDS,
    ...initialProfile,
    portfolio_url: initialProfile?.portfolio_url ?? "",
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

type ResumeSkillSuggestionState = {
  resumeId: string;
  detectedSkills: string[];
  recommendedSkills: string[];
  suggestionReasons: string[];
  resumeReadinessScore: number;
  strengthSignals: string[];
  focusAreas: string[];
  scoreBreakdown: Array<{
    label: string;
    score: number;
    detail: string;
  }>;
  academyCourseRecommendations: Array<{
    code: string;
    title: string;
    description: string;
    url: string;
    recommendedFor: string[];
  }>;
} | null;

type ResumeOptimizationState = {
  resumeId: string;
  source: "ai" | "template";
  summary: string;
  skillsSection: string[];
  bulletPoints: string[];
  atsFormattingTips: string[];
  note: string;
  beforeScore: number;
  afterScore: number;
  improvementPercent: number;
  strengths: string[];
  focusAreas: string[];
} | null;

type CareerPathPredictionState = {
  resumeId: string;
  source: "ai" | "template";
  paths: Array<{
    title: string;
    timeline: string;
    rationale: string;
    requiredSkills: string[];
  }>;
} | null;

type CoverLetterState = {
  resumeId: string;
  source: "ai" | "template";
  subject: string;
  intro: string;
  body: string[];
  closing: string;
  note: string;
} | null;

const RESUME_SUGGESTIONS_STORAGE_KEY = "lxdguild_resume_skill_suggestions";
const RESUME_OPTIMIZER_STORAGE_KEY = "lxdguild_resume_optimizer";
const CAREER_PATHS_STORAGE_KEY = "lxdguild_resume_career_paths";
const COVER_LETTER_STORAGE_KEY = "lxdguild_resume_cover_letter";
const ROADMAP_POSITIONS = [
  { left: "10%", top: "71%" },
  { left: "37%", top: "53%" },
  { left: "63%", top: "35%" },
  { left: "85%", top: "16%" },
];

function getProfileStorageKey(baseKey: string, profileId: string) {
  return `${baseKey}:${profileId}`;
}

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
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [isOptimizingResume, setIsOptimizingResume] = useState(false);
  const [isPredictingCareerPaths, setIsPredictingCareerPaths] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [copiedOptimization, setCopiedOptimization] = useState(false);
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);
  const [resumeSkillSuggestions, setResumeSkillSuggestions] = useState<ResumeSkillSuggestionState>(null);
  const [resumeOptimization, setResumeOptimization] = useState<ResumeOptimizationState>(null);
  const [careerPathPredictions, setCareerPathPredictions] = useState<CareerPathPredictionState>(null);
  const [coverLetterDraft, setCoverLetterDraft] = useState<CoverLetterState>(null);
  const [activeRoadmapIndex, setActiveRoadmapIndex] = useState<number | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const clearResumeArtifacts = (options?: { preserveResumeId?: string }) => {
    const preserveResumeId = options?.preserveResumeId;

    setResumeSkillSuggestions((current) =>
      current && current.resumeId === preserveResumeId ? current : null
    );
    setResumeOptimization((current) =>
      current && current.resumeId === preserveResumeId ? current : null
    );
    setCareerPathPredictions((current) =>
      current && current.resumeId === preserveResumeId ? current : null
    );
    setCoverLetterDraft((current) =>
      current && current.resumeId === preserveResumeId ? current : null
    );
  };

  useEffect(() => {
    if (!profile.id || typeof window === "undefined") return;

    try {
      const storedSuggestions = window.localStorage.getItem(`${RESUME_SUGGESTIONS_STORAGE_KEY}:${profile.id}`);
      const storedOptimization = window.localStorage.getItem(`${RESUME_OPTIMIZER_STORAGE_KEY}:${profile.id}`);
      const storedCareerPaths = window.localStorage.getItem(`${CAREER_PATHS_STORAGE_KEY}:${profile.id}`);
      const storedCoverLetter = window.localStorage.getItem(`${COVER_LETTER_STORAGE_KEY}:${profile.id}`);

      if (storedSuggestions) {
        setResumeSkillSuggestions(JSON.parse(storedSuggestions));
      }

      if (storedOptimization) {
        setResumeOptimization(JSON.parse(storedOptimization));
      }

      if (storedCareerPaths) {
        setCareerPathPredictions(JSON.parse(storedCareerPaths));
      }

      if (storedCoverLetter) {
        setCoverLetterDraft(JSON.parse(storedCoverLetter));
      }
    } catch {
      // ignore localStorage parse issues
    }
  }, [profile.id]);

  useEffect(() => {
    if (!profile.id || typeof window === "undefined") return;

    const validResumeIds = new Set(resumes.map((resume) => resume.id));

    const nextSuggestions =
      resumeSkillSuggestions && validResumeIds.has(resumeSkillSuggestions.resumeId)
        ? resumeSkillSuggestions
        : null;
    const nextOptimization =
      resumeOptimization && validResumeIds.has(resumeOptimization.resumeId)
        ? resumeOptimization
        : null;
    const nextCareerPaths =
      careerPathPredictions && validResumeIds.has(careerPathPredictions.resumeId)
        ? careerPathPredictions
        : null;
    const nextCoverLetter =
      coverLetterDraft && validResumeIds.has(coverLetterDraft.resumeId)
        ? coverLetterDraft
        : null;

    if (nextSuggestions !== resumeSkillSuggestions) {
      setResumeSkillSuggestions(nextSuggestions);
    }
    if (nextOptimization !== resumeOptimization) {
      setResumeOptimization(nextOptimization);
    }
    if (nextCareerPaths !== careerPathPredictions) {
      setCareerPathPredictions(nextCareerPaths);
    }
    if (nextCoverLetter !== coverLetterDraft) {
      setCoverLetterDraft(nextCoverLetter);
    }

    if (resumes.length === 0) {
      window.localStorage.removeItem(getProfileStorageKey(RESUME_SUGGESTIONS_STORAGE_KEY, profile.id));
      window.localStorage.removeItem(getProfileStorageKey(RESUME_OPTIMIZER_STORAGE_KEY, profile.id));
      window.localStorage.removeItem(getProfileStorageKey(CAREER_PATHS_STORAGE_KEY, profile.id));
      window.localStorage.removeItem(getProfileStorageKey(COVER_LETTER_STORAGE_KEY, profile.id));
    }
  }, [
    careerPathPredictions,
    coverLetterDraft,
    profile.id,
    resumeOptimization,
    resumeSkillSuggestions,
    resumes,
  ]);

  useEffect(() => {
    if (!profile.id || typeof window === "undefined") return;

    if (resumeSkillSuggestions) {
      window.localStorage.setItem(
        getProfileStorageKey(RESUME_SUGGESTIONS_STORAGE_KEY, profile.id),
        JSON.stringify(resumeSkillSuggestions)
      );
    } else {
      window.localStorage.removeItem(getProfileStorageKey(RESUME_SUGGESTIONS_STORAGE_KEY, profile.id));
    }
  }, [profile.id, resumeSkillSuggestions]);

  useEffect(() => {
    if (!profile.id || typeof window === "undefined") return;

    if (resumeOptimization) {
      window.localStorage.setItem(
        getProfileStorageKey(RESUME_OPTIMIZER_STORAGE_KEY, profile.id),
        JSON.stringify(resumeOptimization)
      );
    } else {
      window.localStorage.removeItem(getProfileStorageKey(RESUME_OPTIMIZER_STORAGE_KEY, profile.id));
    }
  }, [profile.id, resumeOptimization]);

  useEffect(() => {
    if (!profile.id || typeof window === "undefined") return;

    if (careerPathPredictions) {
      window.localStorage.setItem(
        getProfileStorageKey(CAREER_PATHS_STORAGE_KEY, profile.id),
        JSON.stringify(careerPathPredictions)
      );
    } else {
      window.localStorage.removeItem(getProfileStorageKey(CAREER_PATHS_STORAGE_KEY, profile.id));
    }
  }, [careerPathPredictions, profile.id]);

  useEffect(() => {
    if (!profile.id || typeof window === "undefined") return;

    if (coverLetterDraft) {
      window.localStorage.setItem(
        getProfileStorageKey(COVER_LETTER_STORAGE_KEY, profile.id),
        JSON.stringify(coverLetterDraft)
      );
    } else {
      window.localStorage.removeItem(getProfileStorageKey(COVER_LETTER_STORAGE_KEY, profile.id));
    }
  }, [coverLetterDraft, profile.id]);

  useEffect(() => {
    if (activeRoadmapIndex === null) return;

    const timeoutId = window.setTimeout(() => {
      setActiveRoadmapIndex(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [activeRoadmapIndex]);

  const fetchResumeSkillSuggestions = async (resumeId: string) => {
    setIsAnalyzingResume(true);
    try {
      const response = await fetch("/api/resumes/skill-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Resume skill analysis failed.");
      }

      setResumeSkillSuggestions({
        resumeId,
        detectedSkills: Array.isArray(result.detectedSkills) ? result.detectedSkills : [],
        recommendedSkills: Array.isArray(result.recommendedSkills) ? result.recommendedSkills : [],
        suggestionReasons: Array.isArray(result.suggestionReasons) ? result.suggestionReasons : [],
        resumeReadinessScore: typeof result.resumeReadinessScore === "number" ? result.resumeReadinessScore : 0,
        strengthSignals: Array.isArray(result.strengthSignals) ? result.strengthSignals : [],
        focusAreas: Array.isArray(result.focusAreas) ? result.focusAreas : [],
        scoreBreakdown: Array.isArray(result.scoreBreakdown) ? result.scoreBreakdown : [],
        academyCourseRecommendations: Array.isArray(result.academyCourseRecommendations)
          ? result.academyCourseRecommendations
          : [],
      });
    } catch (error: unknown) {
      alert("Error generating resume skill suggestions: " + getErrorMessage(error));
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  const optimizeResume = async (resumeId: string) => {
    setIsOptimizingResume(true);
    try {
      const response = await fetch("/api/resumes/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Resume optimization failed.");
      }

      setResumeOptimization({
        resumeId,
        source: result.source === "ai" ? "ai" : "template",
        summary: typeof result.summary === "string" ? result.summary : "",
        skillsSection: Array.isArray(result.skillsSection) ? result.skillsSection : [],
        bulletPoints: Array.isArray(result.bulletPoints) ? result.bulletPoints : [],
        atsFormattingTips: Array.isArray(result.atsFormattingTips) ? result.atsFormattingTips : [],
        note: typeof result.note === "string" ? result.note : "",
        beforeScore: typeof result.beforeScore === "number" ? result.beforeScore : 0,
        afterScore: typeof result.afterScore === "number" ? result.afterScore : 0,
        improvementPercent: typeof result.improvementPercent === "number" ? result.improvementPercent : 0,
        strengths: Array.isArray(result.strengths) ? result.strengths : [],
        focusAreas: Array.isArray(result.focusAreas) ? result.focusAreas : [],
      });
    } catch (error: unknown) {
      alert("Error optimizing resume: " + getErrorMessage(error));
    } finally {
      setIsOptimizingResume(false);
    }
  };

  const predictCareerPaths = async (resumeId: string) => {
    setIsPredictingCareerPaths(true);
    try {
      const response = await fetch("/api/resumes/career-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Career path prediction failed.");
      }

      setCareerPathPredictions({
        resumeId,
        source: result.source === "ai" ? "ai" : "template",
        paths: Array.isArray(result.paths) ? result.paths : [],
      });
    } catch (error: unknown) {
      alert("Error predicting career paths: " + getErrorMessage(error));
    } finally {
      setIsPredictingCareerPaths(false);
    }
  };

  const generateCoverLetter = async (resumeId: string) => {
    setIsGeneratingCoverLetter(true);
    try {
      const response = await fetch("/api/resumes/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Cover letter generation failed.");
      }

      setCoverLetterDraft({
        resumeId,
        source: result.source === "ai" ? "ai" : "template",
        subject: typeof result.subject === "string" ? result.subject : "",
        intro: typeof result.intro === "string" ? result.intro : "",
        body: Array.isArray(result.body) ? result.body : [],
        closing: typeof result.closing === "string" ? result.closing : "",
        note: typeof result.note === "string" ? result.note : "",
      });
    } catch (error: unknown) {
      alert("Error generating cover letter: " + getErrorMessage(error));
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const suggestionStrengthSignals = resumeSkillSuggestions?.strengthSignals ?? [];
  const suggestionDetectedSkills = resumeSkillSuggestions?.detectedSkills ?? [];
  const suggestionRecommendedSkills = resumeSkillSuggestions?.recommendedSkills ?? [];
  const suggestionFocusAreas = resumeSkillSuggestions?.focusAreas ?? [];
  const suggestionReasons = resumeSkillSuggestions?.suggestionReasons ?? [];
  const suggestionAcademyCourses = resumeSkillSuggestions?.academyCourseRecommendations ?? [];
  const suggestionScoreBreakdown = resumeSkillSuggestions?.scoreBreakdown ?? [];

  const handleSave = async () => {
    if (!profile.id) {
      alert("Profile is still loading. Please refresh and try again.");
      return;
    }

    setIsSaving(true);
    try {
      const profileUpdate = {
        name: profile.name,
        headline: profile.headline,
        bio: profile.bio,
        location: profile.location,
        portfolio_url: profile.portfolio_url,
        skills: profile.skills,
        experience_years: profile.experience_years
      };

      const fullUpdate = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", profile.id);

      if (fullUpdate.error && (fullUpdate.error.code === "42703" || isMissingColumnError(fullUpdate.error.message))) {
        const legacyProfileUpdate = {
          name: profile.name,
          headline: profile.headline,
          bio: profile.bio,
          location: profile.location,
          skills: profile.skills,
          experience_years: profile.experience_years
        };
        const legacyUpdate = await supabase
          .from("profiles")
          .update(legacyProfileUpdate)
          .eq("id", profile.id);

        if (legacyUpdate.error) {
          throw legacyUpdate.error;
        }
      } else if (fullUpdate.error) {
        throw fullUpdate.error;
      }

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
      clearResumeArtifacts();

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
      await fetchResumeSkillSuggestions(resumeData.id);
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
      const nextResumes = resumes.filter((r) => r.id !== id);
      const nextResumeIds = new Set(nextResumes.map((resume) => resume.id));
      const preserveResumeId =
        [
          resumeSkillSuggestions?.resumeId,
          resumeOptimization?.resumeId,
          careerPathPredictions?.resumeId,
          coverLetterDraft?.resumeId,
        ].find((resumeId) => resumeId && nextResumeIds.has(resumeId)) ?? nextResumes[0]?.id;
      setResumes(nextResumes);
      clearResumeArtifacts({ preserveResumeId });
    } catch (err: unknown) {
      alert("Error deleting resume: " + getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[1.7rem] border border-[#dde7d8] bg-[linear-gradient(135deg,rgba(235,247,231,0.85),rgba(255,255,255,0.95))] p-5 shadow-[0_16px_40px_rgba(87,108,67,0.06)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Profile Editor</p>
          <p className="mt-2 text-sm leading-7 text-[#5f6876]">
            Keep the essentials clean: profile basics, skills, and one strong resume set.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-[1.1rem] bg-[linear-gradient(135deg,#118118,#2aa82b)] px-5 py-3 font-bold text-white shadow-[0_18px_36px_rgba(24,124,29,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Update Profile
        </button>
      </div>

      <div className="space-y-6">
        <div className="rounded-[1.9rem] border border-[#dde7d8] bg-[#fbfdf8] p-8 shadow-[0_16px_40px_rgba(87,108,67,0.06)] space-y-6">
          <div className="flex items-center gap-3 border-b border-[#e4ebdf] pb-4">
            <User className="w-5 h-5 text-[#138d1a]" />
            <h2 className="font-bold text-lg">Professional Basics</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-tighter text-zinc-400">Full Name</label>
              <input
                type="text"
                value={profile.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full rounded-2xl border border-[#dbe4d5] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#8fd97e]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-tighter text-zinc-400">Professional Headline</label>
              <input
                type="text"
                placeholder="e.g. Senior Instructional Designer"
                value={profile.headline || ""}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                className="w-full rounded-2xl border border-[#dbe4d5] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#8fd97e]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-tighter text-zinc-400">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={profile.location || ""}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full rounded-2xl border border-[#dbe4d5] bg-white py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#8fd97e]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-tighter text-zinc-400">Years of Experience</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="number"
                  step="0.5"
                  value={profile.experience_years || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      experience_years: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-2xl border border-[#dbe4d5] bg-white py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#8fd97e]"
                />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-tighter text-zinc-400">Portfolio Link</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="url"
                  placeholder="https://your-portfolio-site.com"
                  value={profile.portfolio_url || ""}
                  onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                  className="w-full rounded-2xl border border-[#dbe4d5] bg-white py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#8fd97e]"
                />
              </div>
              <p className="text-xs text-[#6d7d68]">
                Add your portfolio, case study hub, or personal site so employers can review your work.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-tighter text-zinc-400">Professional Bio / Summary</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <textarea
                rows={4}
                value={profile.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full resize-none rounded-2xl border border-[#dbe4d5] bg-white py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#8fd97e]"
                placeholder="Tell your professional story..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-[1.9rem] border border-[#dde7d8] bg-[#fbfdf8] p-8 shadow-[0_16px_40px_rgba(87,108,67,0.06)] space-y-6">
          <div className="flex items-center gap-3 border-b border-[#e4ebdf] pb-4">
            <Award className="w-5 h-5 text-[#138d1a]" />
            <h2 className="font-bold text-lg">Skills & Expertise</h2>
          </div>
          <SkillAutocomplete
            selectedSkills={profile.skills || []}
            onAddSkill={(s) => setProfile({ ...profile, skills: [...(profile.skills || []), s] })}
            onRemoveSkill={(s) =>
              setProfile({
                ...profile,
                skills: (profile.skills || []).filter((sk: string) => sk !== s),
              })
            }
          />
        </div>

        <div className="rounded-[1.9rem] border border-[#dde7d8] bg-[#fbfdf8] p-8 shadow-[0_16px_40px_rgba(87,108,67,0.06)] space-y-6">
          <div className="flex items-center gap-3 border-b border-[#e4ebdf] pb-4">
            <FileText className="w-5 h-5 text-[#138d1a]" />
            <div>
              <h2 className="font-bold text-lg">Resume Vault</h2>
              <p className="mt-1 text-sm text-[#6d7d68]">
                Keep one or two polished resumes here, then pull suggestions from the one you want to strengthen.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-3 lg:col-span-2">
              {resumes.map((resume) => (
                <div key={resume.id} className="space-y-4 rounded-2xl border border-[#e4ebdf] bg-white p-4">
                  <div className="group flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="h-4 w-4 shrink-0 text-[#138d1a]" />
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-medium">{resume.file_name || "Resume"}</p>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">Uploaded resume</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <a
                        href={`/api/resumes/${resume.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-[#f4f7f1]"
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => deleteResume(resume.id)}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fetchResumeSkillSuggestions(resume.id)}
                      disabled={isAnalyzingResume}
                      className="inline-flex items-center rounded-xl border border-[#dbe4d5] px-3 py-2 text-xs font-semibold text-[#138d1a] hover:bg-[#f4f7f1] disabled:opacity-60"
                    >
                      {isAnalyzingResume && resumeSkillSuggestions?.resumeId === resume.id
                        ? "Analyzing..."
                        : "Suggest skills from this resume"}
                    </button>
                    <button
                      type="button"
                      onClick={() => optimizeResume(resume.id)}
                      disabled={isOptimizingResume}
                      className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#118118,#2aa82b)] px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(24,124,29,0.16)] hover:scale-[1.01] disabled:opacity-60"
                    >
                      {isOptimizingResume && resumeOptimization?.resumeId === resume.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="h-3.5 w-3.5" />
                      )}
                      {isOptimizingResume && resumeOptimization?.resumeId === resume.id ? "Fixing..." : "Fix my resume"}
                    </button>
                    <button
                      type="button"
                      onClick={() => predictCareerPaths(resume.id)}
                      disabled={isPredictingCareerPaths}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#dbe4d5] bg-white px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#f4f7f1] disabled:opacity-60"
                    >
                      {isPredictingCareerPaths && careerPathPredictions?.resumeId === resume.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#138d1a]" />
                      ) : (
                        <Compass className="h-3.5 w-3.5 text-[#138d1a]" />
                      )}
                      {isPredictingCareerPaths && careerPathPredictions?.resumeId === resume.id
                        ? "Predicting..."
                        : "Predict career paths"}
                    </button>
                    <button
                      type="button"
                      onClick={() => generateCoverLetter(resume.id)}
                      disabled={isGeneratingCoverLetter}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#dbe4d5] bg-white px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#f4f7f1] disabled:opacity-60"
                    >
                      {isGeneratingCoverLetter && coverLetterDraft?.resumeId === resume.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#138d1a]" />
                      ) : (
                        <Mail className="h-3.5 w-3.5 text-[#138d1a]" />
                      )}
                      {isGeneratingCoverLetter && coverLetterDraft?.resumeId === resume.id
                        ? "Drafting..."
                        : "Create cover letter"}
                    </button>
                  </div>
                </div>
              ))}

              <label className="block w-full cursor-pointer">
                <div className="flex flex-col items-center justify-center rounded-[1.6rem] border-2 border-dashed border-[#dbe4d5] py-8 transition-all hover:border-[#8fd97e] hover:bg-[#f7fbf4]">
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-[#138d1a]" />
                  ) : (
                    <Upload className="h-6 w-6 text-zinc-300" />
                  )}
                  <p className="mt-2 text-sm font-bold text-zinc-500">Upload New Resume</p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-400">PDF, DOCX</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={handleResumeUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-[#e4ebdf] bg-white p-5">
            <div className="flex items-center gap-3 border-b border-[#eef3ea] pb-4">
              <Award className="h-5 w-5 text-[#138d1a]" />
              <div>
                <h3 className="font-bold text-lg text-[#111827]">Resume Action Engine</h3>
                <p className="mt-1 text-sm text-[#6d7d68]">
                  Upload a resume first, then we can score it, show gaps, improve it, build a cover letter, and map the next learning move.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {isOptimizingResume && !resumeOptimization ? (
                <div className="flex items-center gap-3 rounded-2xl border border-[#d5e6d0] bg-[linear-gradient(135deg,#f2f9ef,#ffffff)] px-4 py-4 text-sm text-zinc-600">
                  <Loader2 className="h-4 w-4 animate-spin text-[#138d1a]" />
                  Rewriting your resume into a more ATS-friendly version...
                </div>
              ) : null}

              {isPredictingCareerPaths && !careerPathPredictions ? (
                <div className="flex items-center gap-3 rounded-2xl border border-[#d5e6d0] bg-[linear-gradient(135deg,#f2f9ef,#ffffff)] px-4 py-4 text-sm text-zinc-600">
                  <Loader2 className="h-4 w-4 animate-spin text-[#138d1a]" />
                  Mapping realistic next career paths from your resume and skill profile...
                </div>
              ) : null}

              {isAnalyzingResume && !resumeSkillSuggestions ? (
                <div className="flex items-center gap-3 rounded-2xl border border-[#e4ebdf] bg-[#fbfdf8] px-4 py-4 text-sm text-zinc-600">
                  <Loader2 className="h-4 w-4 animate-spin text-[#138d1a]" />
                  Reading the resume and generating skill suggestions...
                </div>
              ) : null}

              {isGeneratingCoverLetter && !coverLetterDraft ? (
                <div className="flex items-center gap-3 rounded-2xl border border-[#e4ebdf] bg-[#fbfdf8] px-4 py-4 text-sm text-zinc-600">
                  <Loader2 className="h-4 w-4 animate-spin text-[#138d1a]" />
                  Drafting a reusable cover letter from your current resume signals...
                </div>
              ) : null}

              {!resumeSkillSuggestions && !resumeOptimization && !coverLetterDraft ? (
                <div className="rounded-2xl border border-dashed border-[#dbe4d5] bg-[#fbfdf8] px-4 py-5 text-sm leading-7 text-[#6d7d68]">
                  Upload a resume, then run <span className="font-semibold text-[#138d1a]">Suggest skills from this resume</span>, <span className="font-semibold text-[#138d1a]">Fix my resume</span>, and <span className="font-semibold text-[#138d1a]">Create cover letter</span> to keep your full improvement plan here.
                </div>
              ) : null}

              {(resumeSkillSuggestions || resumeOptimization || coverLetterDraft || careerPathPredictions) ? (
                <div className="space-y-5">
                  {(resumeSkillSuggestions || resumeOptimization) ? (
                    <div className="px-1 py-2">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Current readiness</p>
                          <h3 className="mt-1 text-lg font-bold text-[#111827]">See the baseline before you rewrite anything.</h3>
                        </div>
                        <div className="mt-4 w-full max-w-xl space-y-4">
                          {[
                            {
                              label: "Current score",
                              value: resumeOptimization ? resumeOptimization.beforeScore : resumeSkillSuggestions?.resumeReadinessScore || 0,
                            },
                            ...(resumeOptimization
                              ? [
                                  { label: "Projected fixed score", value: resumeOptimization.afterScore },
                                  { label: "Improvement", value: resumeOptimization.improvementPercent },
                                ]
                              : []),
                          ].map((item) => (
                            <div key={item.label}>
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-[#11203b]">{item.label}</p>
                                <span className="rounded-xl bg-[#475569] px-2.5 py-1 text-xs font-semibold text-white [color:#fff] [-webkit-text-fill-color:#fff]">
                                  {item.label === "Improvement" ? `+${item.value}%` : `${item.value}%`}
                                </span>
                              </div>
                              <div className="h-3 rounded-full bg-[#edf2ed]">
                                <div
                                  className="h-3 rounded-full bg-[linear-gradient(90deg,#7ee46b_0%,#138d1a_100%)]"
                                  style={{ width: `${Math.max(0, Math.min(item.value, 100))}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="hidden flex-wrap gap-3">
                          <div className="rounded-2xl border border-[#dbe6d7] bg-white px-4 py-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a8a74]">Current score</p>
                            <p className="mt-1 text-2xl font-bold text-[#11203b]">
                              {resumeOptimization ? resumeOptimization.beforeScore : resumeSkillSuggestions?.resumeReadinessScore || 0}%
                            </p>
                          </div>
                          {resumeOptimization ? (
                            <>
                              <div className="rounded-2xl border border-[#dbe6d7] bg-white px-4 py-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a8a74]">Projected fixed score</p>
                                <p className="mt-1 text-2xl font-bold text-[#138d1a]">{resumeOptimization.afterScore}%</p>
                              </div>
                              <div className="rounded-2xl border border-[#dbe6d7] bg-white px-4 py-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a8a74]">Improvement</p>
                                <p className="mt-1 inline-flex items-center gap-2 text-2xl font-bold text-[#138d1a]">
                                  <TrendingUp className="h-5 w-5" />
                                  +{resumeOptimization.improvementPercent}%
                                </p>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>

                      {suggestionScoreBreakdown.length ? (
                        <div className="mt-5 space-y-4">
                          {suggestionScoreBreakdown.map((item) => (
                            <div key={item.label}>
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-[#11203b]">{item.label}</p>
                                  <p className="text-xs text-[#667085]">{item.detail}</p>
                                </div>
                                <span className="rounded-xl bg-[#475569] px-2.5 py-1 text-xs font-semibold text-white [color:#fff] [-webkit-text-fill-color:#fff]">
                                  {item.score}%
                                </span>
                              </div>
                              <div className="h-3 rounded-full bg-[#edf2ed]">
                                <div
                                  className="relative h-3 rounded-full bg-[linear-gradient(90deg,#7ee46b_0%,#138d1a_100%)]"
                                  style={{ width: `${item.score}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {resumeSkillSuggestions ? (
                    <div className="px-1 py-2">
                      <div className="flex items-start gap-3 pb-4">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#138d1a]" />
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Skill gaps and strengths</p>
                          <h3 className="mt-1 text-lg font-bold text-[#111827]">Focus on the clearest wins first.</h3>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                        <div className="space-y-5">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Detected strengths</p>
                            <div className="mt-3 space-y-2">
                              {(suggestionStrengthSignals.length > 0
                                ? suggestionStrengthSignals
                                : ["Resume has enough baseline signal to start improving."]).map((item) => (
                                <p key={item} className="text-sm leading-6 text-zinc-700">{item}</p>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Skills already visible</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {suggestionDetectedSkills.length > 0 ? (
                                suggestionDetectedSkills.map((skill) => (
                                  <span key={skill} className="rounded-full border border-[#e4ebdf] bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <p className="text-sm text-zinc-500">No structured skills were detected from this resume yet.</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Skills to add or learn</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {suggestionRecommendedSkills.length > 0 ? (
                                suggestionRecommendedSkills.map((skill) => {
                                  const alreadyAdded = (profile.skills || []).includes(skill);
                                  return (
                                    <button
                                      key={skill}
                                      type="button"
                                      disabled={alreadyAdded}
                                      onClick={() =>
                                        setProfile((current) => ({
                                          ...current,
                                          skills: alreadyAdded ? current.skills : [...(current.skills || []), skill],
                                        }))
                                      }
                                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                        alreadyAdded
                                          ? "bg-[#dff4d8] text-[#138d1a]"
                                          : "bg-[#138d1a] text-white hover:bg-[#0f7415]"
                                      }`}
                                    >
                                      {alreadyAdded ? `${skill} added` : `Add ${skill}`}
                                    </button>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-zinc-500">No additional suggestions right now.</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">What to fix next</p>
                            <div className="mt-3 space-y-2">
                              {(suggestionFocusAreas.length > 0
                                ? suggestionFocusAreas
                                : suggestionReasons).map((reason) => (
                                <p key={reason} className="text-sm leading-6 text-zinc-700">{reason}</p>
                              ))}
                            </div>
                          </div>

                          {suggestionAcademyCourses.length > 0 ? (
                            <div className="space-y-3">
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Recommended from LXD Guild Academy</p>
                              {suggestionAcademyCourses.map((course) => (
                                <a
                                  key={course.code}
                                  href={course.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-2xl bg-[#fbfdf8] p-4 transition hover:-translate-y-0.5"
                                >
                                  <p className="text-sm font-semibold text-[#111827]">{course.title}</p>
                                  <p className="mt-2 text-sm leading-6 text-zinc-600">{course.description}</p>
                                  {course.recommendedFor.length > 0 ? (
                                    <p className="mt-3 text-sm leading-6 text-zinc-600">
                                      Recommended for: {course.recommendedFor.join(", ")}
                                    </p>
                                  ) : null}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <div className="px-0 py-1 text-sm leading-7 text-[#6d7d68]">
                              Course recommendations will appear here when we detect strong skill-gap matches from the resume.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {false ? (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <div className="space-y-4 rounded-[1.7rem] border border-[#e4ebdf] bg-[#fbfdf8] p-5">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Detected from resume</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {resumeSkillSuggestions!.detectedSkills.length > 0 ? (
                          resumeSkillSuggestions!.detectedSkills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-[#e4ebdf] bg-white px-3 py-1 text-xs font-medium text-zinc-700"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-zinc-500">No structured skills were detected from this resume yet.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Suggested skills to add or learn</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {resumeSkillSuggestions!.recommendedSkills.length > 0 ? (
                          resumeSkillSuggestions!.recommendedSkills.map((skill) => {
                            const alreadyAdded = (profile.skills || []).includes(skill);
                            return (
                              <button
                                key={skill}
                                type="button"
                                disabled={alreadyAdded}
                                onClick={() =>
                                  setProfile((current) => ({
                                    ...current,
                                    skills: alreadyAdded ? current.skills : [...(current.skills || []), skill],
                                  }))
                                }
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                  alreadyAdded
                                    ? "bg-[#dff4d8] text-[#138d1a]"
                                    : "bg-[#138d1a] text-white hover:bg-[#0f7415]"
                                }`}
                              >
                                {alreadyAdded ? `${skill} added` : `Add ${skill}`}
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-sm text-zinc-500">No additional suggestions right now.</p>
                        )}
                      </div>
                    </div>

                    {resumeSkillSuggestions!.suggestionReasons.length > 0 ? (
                      <div className="space-y-2 rounded-2xl border border-[#e4ebdf] bg-white p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Why these suggestions</p>
                        {resumeSkillSuggestions!.suggestionReasons.map((reason) => (
                          <p key={reason} className="text-sm leading-6 text-zinc-600">
                            {reason}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4 rounded-[1.7rem] border border-[#e4ebdf] bg-[#fbfdf8] p-5">
                    {resumeSkillSuggestions!.academyCourseRecommendations.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Recommended from LXD Guild Academy</p>
                        {resumeSkillSuggestions!.academyCourseRecommendations.map((course) => (
                          <a
                            key={course.code}
                            href={course.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-2xl border border-[#e4ebdf] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#c8ddbf]"
                          >
                            <div>
                              <p className="text-sm font-semibold text-[#111827]">{course.title}</p>
                              <p className="mt-2 text-sm leading-6 text-zinc-600">{course.description}</p>
                            </div>
                            {course.recommendedFor.length > 0 ? (
                              <p className="mt-3 text-sm leading-6 text-zinc-600">
                                Recommended for: {course.recommendedFor.join(", ")}
                              </p>
                            ) : null}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#dbe4d5] bg-white px-4 py-5 text-sm leading-7 text-[#6d7d68]">
                        Course recommendations will appear here when we detect strong skill-gap matches from the resume.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {resumeOptimization ? (
                <div className="space-y-4 rounded-[1.8rem] border border-[#dbe6d7] bg-[linear-gradient(135deg,#f4fbf0,#ffffff_65%)] p-5 shadow-[0_16px_34px_rgba(87,108,67,0.06)]">
                  <div className="flex items-start gap-3 border-b border-[#e4ece0] pb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] text-[#091737] shadow-[0_10px_22px_rgba(52,205,47,0.18)]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Step 3 - Auto Resume Optimizer</p>
                      <h3 className="mt-1 text-lg font-bold text-[#111827]">See exactly how much we’re improving the draft.</h3>
                      <p className="mt-1 text-sm leading-6 text-[#667085]">
                        {resumeOptimization!.note || "We turned your skill-gap insight into cleaner, ATS-friendlier resume content."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: "Original score", value: resumeOptimization.beforeScore },
                      { label: "Fixed score", value: resumeOptimization.afterScore },
                      { label: "Improvement", value: resumeOptimization.improvementPercent },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[#11203b]">{item.label}</p>
                          <span className="rounded-xl bg-[#475569] px-2.5 py-1 text-xs font-semibold text-white [color:#fff] [-webkit-text-fill-color:#fff]">
                            {item.label === "Improvement" ? `+${item.value}%` : `${item.value}%`}
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-[#edf2ed]">
                          <div
                            className="h-3 rounded-full bg-[linear-gradient(90deg,#7ee46b_0%,#138d1a_100%)]"
                            style={{ width: `${Math.max(0, Math.min(item.value, 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-[#e4ebdf] bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Rewritten summary</p>
                      <p className="mt-3 text-sm leading-7 text-zinc-700">{resumeOptimization!.summary}</p>
                    </div>

                    <div className="rounded-2xl border border-[#e4ebdf] bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">ATS-ready skills section</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {resumeOptimization!.skillsSection.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-[#e4ebdf] bg-[#f7fbf4] px-3 py-1 text-xs font-medium text-zinc-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#e4ebdf] bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Rewritten bullet points</p>
                      <div className="mt-3 space-y-2">
                        {resumeOptimization!.bulletPoints.map((point) => (
                          <p key={point} className="text-sm leading-7 text-zinc-700">
                            - {point}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#e4ebdf] bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">ATS-friendly formatting</p>
                      <div className="mt-3 space-y-2">
                        {resumeOptimization!.atsFormattingTips.map((tip) => (
                          <p key={tip} className="text-sm leading-7 text-zinc-700">
                            - {tip}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dbe6d7] bg-[#fbfdf8] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d7d68]">
                      Generated via {resumeOptimization!.source === "ai" ? "AI action engine" : "smart template engine"}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          [
                            "SUMMARY",
                            resumeOptimization!.summary,
                            "",
                            "SKILLS",
                            resumeOptimization!.skillsSection.join(", "),
                            "",
                            "BULLET POINTS",
                            ...resumeOptimization!.bulletPoints.map((point) => `- ${point}`),
                            "",
                            "ATS FORMATTING TIPS",
                            ...resumeOptimization!.atsFormattingTips.map((tip) => `- ${tip}`),
                          ].join("\n")
                        );
                        setCopiedOptimization(true);
                        window.setTimeout(() => setCopiedOptimization(false), 1800);
                      }}
                      className="rounded-xl border border-[#dbe4d5] bg-white px-3 py-2 text-xs font-semibold text-[#138d1a] hover:bg-[#f4f7f1]"
                    >
                      {copiedOptimization ? "Copied" : "Copy optimized draft"}
                    </button>
                  </div>
                </div>
              ) : null}

              {coverLetterDraft ? (
                <div className="space-y-5 px-1 py-2">
                  <div className="flex items-start gap-3 pb-1">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#edf8ea,#ffffff)] text-[#138d1a] shadow-[0_10px_22px_rgba(87,108,67,0.1)]">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Cover letter draft</p>
                      <h3 className="mt-1 text-lg font-bold text-[#111827]">Turn the resume into an employer-ready introduction.</h3>
                      <p className="mt-1 text-sm leading-6 text-[#667085]">{coverLetterDraft.note}</p>
                    </div>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Subject</p>
                      <p className="text-sm font-semibold leading-6 text-zinc-800">{coverLetterDraft.subject}</p>
                    </div>

                    <div className="space-y-3 border-l-0 border-[#e4ebdf] pl-0 xl:border-l xl:pl-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Draft preview</p>
                      <div className="space-y-3 text-sm leading-7 text-zinc-700">
                        <p>{coverLetterDraft.intro}</p>
                        {coverLetterDraft.body.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                        <p>{coverLetterDraft.closing}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-[#e4ece0] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d7d68]">
                      Generated via {coverLetterDraft.source === "ai" ? "AI draft engine" : "smart template engine"}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          [
                            coverLetterDraft.subject,
                            "",
                            coverLetterDraft.intro,
                            "",
                            ...coverLetterDraft.body,
                            "",
                            coverLetterDraft.closing,
                          ].join("\n")
                        );
                        setCopiedCoverLetter(true);
                        window.setTimeout(() => setCopiedCoverLetter(false), 1800);
                      }}
                      className="w-full rounded-xl border border-[#dbe4d5] bg-white px-3 py-2 text-xs font-semibold text-[#138d1a] hover:bg-[#f4f7f1] sm:w-auto"
                    >
                      {copiedCoverLetter ? "Copied" : "Copy cover letter"}
                    </button>
                  </div>
                </div>
              ) : null}

              {false ? (
                <div className="space-y-4 rounded-[1.8rem] border border-[#dbe6d7] bg-[linear-gradient(135deg,#f8fcf5,#ffffff_68%)] p-5 shadow-[0_16px_34px_rgba(87,108,67,0.06)]">
                  <div className="flex items-start gap-3 border-b border-[#e4ece0] pb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#e8f6e6,#ffffff)] text-[#138d1a] shadow-[0_10px_22px_rgba(87,108,67,0.1)]">
                      <Compass className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Step 5 - Career Path Predictor</p>
                      <h3 className="mt-1 text-lg font-bold text-[#111827]">Linear next moves from where you are now</h3>
                      <p className="mt-1 text-sm leading-6 text-[#667085]">
                        Use this as your transition map: where you can move next, what skills are still missing, and how long the shift could realistically take.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {careerPathPredictions!.paths.map((path, index) => (
                      <div key={`${path.title}-${path.timeline}`} className="grid gap-4 rounded-2xl border border-[#e4ebdf] bg-white p-4 md:grid-cols-[88px_minmax(0,1fr)]">
                        <div className="flex flex-col items-start gap-2">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef7e9] text-sm font-bold text-[#138d1a]">
                            {index + 1}
                          </div>
                          <div className="rounded-full bg-[#f4f7f1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#138d1a]">
                            {path.timeline}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-lg font-bold text-[#111827]">{path.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-zinc-600">{path.rationale}</p>
                          <div className="mt-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Skills to build</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {path.requiredSkills.map((skill) => (
                                <span
                                  key={`${path.title}-${skill}`}
                                  className="rounded-full border border-[#e4ebdf] bg-[#f7fbf4] px-3 py-1 text-xs font-medium text-zinc-700"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dbe6d7] bg-[#fbfdf8] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d7d68]">
                      Generated via {careerPathPredictions!.source === "ai" ? "AI predictor" : "career path rule engine"}
                    </p>
                  </div>
                </div>
              ) : null}

              {false ? (
                <div className="space-y-4 rounded-[1.8rem] border border-[#dbe6d7] bg-[linear-gradient(135deg,#f4fbf0,#ffffff_65%)] p-5 shadow-[0_16px_34px_rgba(87,108,67,0.06)]">
                  <div className="flex items-start gap-3 border-b border-[#e4ece0] pb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] text-[#091737] shadow-[0_10px_22px_rgba(52,205,47,0.18)]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Auto Resume Optimizer</p>
                      <h3 className="mt-1 text-lg font-bold text-[#111827]">Execution-ready resume upgrade</h3>
                      <p className="mt-1 text-sm leading-6 text-[#667085]">
                        {resumeOptimization!.note || "We turned your skill-gap insight into cleaner, ATS-friendlier resume content."}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-[#e4ebdf] bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Rewritten summary</p>
                      <p className="mt-3 text-sm leading-7 text-zinc-700">{resumeOptimization!.summary}</p>
                    </div>

                    <div className="rounded-2xl border border-[#e4ebdf] bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">ATS-ready skills section</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {resumeOptimization!.skillsSection.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-[#e4ebdf] bg-[#f7fbf4] px-3 py-1 text-xs font-medium text-zinc-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#e4ebdf] bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Rewritten bullet points</p>
                      <div className="mt-3 space-y-2">
                        {resumeOptimization!.bulletPoints.map((point) => (
                          <p key={point} className="text-sm leading-7 text-zinc-700">
                            • {point}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#e4ebdf] bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">ATS-friendly formatting</p>
                      <div className="mt-3 space-y-2">
                        {resumeOptimization!.atsFormattingTips.map((tip) => (
                          <p key={tip} className="text-sm leading-7 text-zinc-700">
                            • {tip}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dbe6d7] bg-[#fbfdf8] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d7d68]">
                      Generated via {resumeOptimization!.source === "ai" ? "AI action engine" : "smart template engine"}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          [
                            "SUMMARY",
                            resumeOptimization!.summary,
                            "",
                            "SKILLS",
                            resumeOptimization!.skillsSection.join(", "),
                            "",
                            "BULLET POINTS",
                            ...resumeOptimization!.bulletPoints.map((point) => `- ${point}`),
                            "",
                            "ATS FORMATTING TIPS",
                            ...resumeOptimization!.atsFormattingTips.map((tip) => `- ${tip}`),
                          ].join("\n")
                        );
                        setCopiedOptimization(true);
                        window.setTimeout(() => setCopiedOptimization(false), 1800);
                      }}
                      className="rounded-xl border border-[#dbe4d5] bg-white px-3 py-2 text-xs font-semibold text-[#138d1a] hover:bg-[#f4f7f1]"
                    >
                      {copiedOptimization ? "Copied" : "Copy optimized draft"}
                    </button>
                  </div>
                </div>
              ) : null}

              {careerPathPredictions && careerPathPredictions.paths.length > 0 ? (
                <div className="space-y-4 px-1 py-2">
                  <div className="flex items-start gap-3 pb-4">
                    <Compass className="mt-0.5 h-5 w-5 text-[#138d1a]" />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Learning path</p>
                      <h3 className="mt-1 text-lg font-bold text-[#111827]">Map the next learning path, not just isolated roles.</h3>
                      <p className="mt-1 text-sm leading-6 text-[#667085]">
                        Follow the sequence below to see the most realistic next moves and the skills each move still needs.
                      </p>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[2rem] border border-[#dbe6d7] bg-[linear-gradient(180deg,#f7fcf4_0%,#ffffff_100%)] p-5 shadow-[0_18px_42px_rgba(87,108,67,0.08)]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,205,47,0.10),transparent_26%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(95,213,255,0.06),transparent_22%)]" />

                    <div className="relative grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                      <div className="space-y-4 rounded-[1.6rem] border border-[#e3ebde] bg-white/82 p-4 backdrop-blur-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Roadmap view</p>
                        <h4 className="text-xl font-bold text-[#111827]">See your growth like a guided journey.</h4>
                        <p className="text-sm leading-7 text-[#667085]">
                          Each stop shows a realistic next role, the expected timeline, and the skills that unlock the move.
                        </p>

                        <div className="space-y-3 pt-2">
                          {[
                            "Role progression checkpoints",
                            "Skill-building milestones",
                            "Time horizon for each move",
                          ].map((item) => (
                            <div key={item} className="flex items-start gap-3">
                              <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#eaf8e3] text-[#138d1a]">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </span>
                              <p className="text-sm leading-6 text-[#50604e]">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="relative min-h-[420px] overflow-hidden rounded-[1.8rem] border border-[#dbe6d7] bg-[linear-gradient(180deg,#f4fbef_0%,#ffffff_100%)] p-4 pb-28 sm:min-h-[500px] sm:pb-28 lg:min-h-[470px] lg:pb-24">
                        <div className="absolute left-4 top-4 z-10 rounded-full border border-white/80 bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5d6d58] shadow-[0_8px_20px_rgba(87,108,67,0.08)] backdrop-blur-sm">
                          Tap a stage to preview details
                        </div>
                        <svg
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                          className="pointer-events-none absolute inset-0 h-full w-full"
                          aria-hidden="true"
                        >
                          <defs>
                            <linearGradient id="learning-road" x1="0%" y1="100%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#7ee46b" />
                              <stop offset="55%" stopColor="#25b52a" />
                              <stop offset="100%" stopColor="#138d1a" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 10 80 C 22 72, 28 60, 38 56 S 56 50, 62 38 S 74 24, 90 18"
                            fill="none"
                            stroke="rgba(213,232,205,0.95)"
                            strokeWidth="13"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 10 80 C 22 72, 28 60, 38 56 S 56 50, 62 38 S 74 24, 90 18"
                            fill="none"
                            stroke="url(#learning-road)"
                            strokeWidth="9"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 10 80 C 22 72, 28 60, 38 56 S 56 50, 62 38 S 74 24, 90 18"
                            fill="none"
                            stroke="rgba(255,255,255,0.55)"
                            strokeWidth="1.4"
                            strokeDasharray="2.2 4"
                            strokeLinecap="round"
                          />
                        </svg>

                        {careerPathPredictions.paths.map((path, index) => {
                          const point = ROADMAP_POSITIONS[Math.min(index, ROADMAP_POSITIONS.length - 1)];
                          const isActive = activeRoadmapIndex === index;

                          return (
                            <div key={`${path.title}-${path.timeline}-details`}>
                              <button
                                type="button"
                                aria-label={`Open roadmap details for ${path.title}`}
                                aria-expanded={isActive}
                                onClick={() => setActiveRoadmapIndex((current) => (current === index ? null : index))}
                                className={`absolute z-20 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white text-sm font-bold text-white shadow-[0_16px_30px_rgba(19,141,26,0.22)] transition duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#b9efaa] ${
                                  isActive
                                    ? "bg-[linear-gradient(135deg,#0f172a,#138d1a)]"
                                    : "bg-[linear-gradient(135deg,#34cd2f,#138d1a)]"
                                }`}
                                style={{ left: point.left, top: point.top }}
                              >
                                {index + 1}
                              </button>

                              <div
                                className="pointer-events-none absolute z-10 -translate-x-1/2 text-center"
                                style={{ left: point.left, top: `calc(${point.top} - 4.2rem)` }}
                              >
                                <span className="inline-flex max-w-[120px] rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-semibold leading-4 text-[#2b3a2a] shadow-[0_8px_20px_rgba(87,108,67,0.08)] backdrop-blur-sm sm:max-w-[148px]">
                                  {path.title}
                                </span>
                              </div>

                              {isActive ? (
                                <div
                                  className="absolute z-20 hidden max-w-[240px] rounded-[1.35rem] border border-[#e2ebde] bg-white/96 p-4 shadow-[0_14px_34px_rgba(87,108,67,0.12)] backdrop-blur-sm md:block"
                                  style={{
                                    left: index % 2 === 0 ? `calc(${point.left} + 1.5rem)` : undefined,
                                    right: index % 2 === 1 ? `calc(100% - ${point.left} + 1.2rem)` : undefined,
                                    top: `calc(${point.top} - ${index % 2 === 0 ? "3.4rem" : "1rem"})`,
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="text-base font-bold text-[#111827]">{path.title}</h4>
                                      <span className="rounded-full bg-[#edf7e8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#138d1a]">
                                        {path.timeline}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      aria-label={`Close roadmap details for ${path.title}`}
                                      onClick={() => setActiveRoadmapIndex(null)}
                                      className="rounded-full border border-[#dde7d8] p-1 text-[#6d7d68] transition hover:bg-[#f4f7f1]"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <p className="mt-2 text-sm leading-6 text-zinc-600">{path.rationale}</p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {path.requiredSkills.slice(0, 3).map((skill) => (
                                      <span
                                        key={`${path.title}-${skill}`}
                                        className="rounded-full bg-[#f4f6f8] px-3 py-1 text-[11px] font-medium text-zinc-700"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}

                        {activeRoadmapIndex !== null ? (
                          <div className="absolute inset-x-4 bottom-24 z-20 rounded-[1.4rem] border border-[#dbe6d7] bg-white/96 p-4 shadow-[0_16px_38px_rgba(87,108,67,0.14)] backdrop-blur-sm md:hidden">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-base font-bold text-[#111827]">
                                    {careerPathPredictions.paths[activeRoadmapIndex]?.title}
                                  </h4>
                                  <span className="rounded-full bg-[#edf7e8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#138d1a]">
                                    {careerPathPredictions.paths[activeRoadmapIndex]?.timeline}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-zinc-600">
                                  {careerPathPredictions.paths[activeRoadmapIndex]?.rationale}
                                </p>
                              </div>
                              <button
                                type="button"
                                aria-label="Close roadmap details"
                                onClick={() => setActiveRoadmapIndex(null)}
                                className="rounded-full border border-[#dde7d8] p-1 text-[#6d7d68] transition hover:bg-[#f4f7f1]"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {careerPathPredictions.paths[activeRoadmapIndex]?.requiredSkills.slice(0, 4).map((skill) => (
                                <span
                                  key={`${careerPathPredictions.paths[activeRoadmapIndex]?.title}-${skill}`}
                                  className="rounded-full bg-[#f4f6f8] px-3 py-1 text-[11px] font-medium text-zinc-700"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="absolute inset-x-4 bottom-4 rounded-[1.2rem] border border-[#dbe6d7] bg-white/90 px-4 py-3 backdrop-blur-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d7d68]">
                            Generated via {careerPathPredictions.source === "ai" ? "AI predictor" : "career path rule engine"}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[#667085]">
                            This roadmap helps you see the sequence, not just the destination.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
