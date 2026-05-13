"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User, Briefcase, MapPin, AlignLeft, Award, FileText, Upload, Save, Loader2, Link as LinkIcon, Trash2, Sparkles, Wand2, Compass, Mail, CheckCircle2, X, AlertTriangle, CheckCircle } from "lucide-react";
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
  originalPreview: {
    name: string;
    headline: string;
    summary: string;
    bulletPoints: string[];
    skills: string[];
  };
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

type ResumeReportPanel = "skills" | "optimize" | "career" | "cover" | null;
type FeedbackTone = "error" | "success" | "info";
type FeedbackModalState = {
  title: string;
  message: string;
  tone: FeedbackTone;
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

function bulletize(values: string[]) {
  return values.map((value) => `- ${value}`);
}

function getExperienceLevelLabel(years?: number | null) {
  if (!years || years <= 0) return "Building foundation";
  if (years <= 2) return "0-2 Years";
  if (years <= 5) return "2-5 Years";
  if (years <= 8) return "5-8 Years";
  return "8+ Years";
}

const SKILL_CATEGORY_RULES = [
  { label: "Technical", keywords: ["articulate", "rise", "captivate", "scorm", "xapi", "sql", "analytics", "data", "visualization", "lms"] },
  { label: "Facilitation", keywords: ["facilitation", "training", "workshop", "delivery", "onboarding"] },
  { label: "Strategy", keywords: ["strategy", "curriculum", "needs analysis", "evaluation", "consulting", "product"] },
  { label: "Operations", keywords: ["project management", "program management", "reporting", "operations"] },
  { label: "Stakeholder", keywords: ["stakeholder", "communication", "leadership", "influence"] },
] as const;

function getSkillCategoryBreakdown(detectedSkills: string[], recommendedSkills: string[]) {
  return SKILL_CATEGORY_RULES.map((category) => {
    const detected = detectedSkills.filter((skill) =>
      category.keywords.some((keyword) => skill.toLowerCase().includes(keyword))
    ).length;
    const recommended = recommendedSkills.filter((skill) =>
      category.keywords.some((keyword) => skill.toLowerCase().includes(keyword))
    ).length;
    const total = detected + recommended;
    const value = total > 0 ? Math.round((detected / total) * 100) : 55;

    return {
      label: category.label,
      value: Math.max(35, Math.min(value, 100)),
    };
  });
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
  const [resumeOptimizerTab, setResumeOptimizerTab] = useState<"suggestions" | "enhancements" | "summary">("suggestions");
  const [activeResumeReport, setActiveResumeReport] = useState<ResumeReportPanel>(null);
  const [resumeSkillSuggestions, setResumeSkillSuggestions] = useState<ResumeSkillSuggestionState>(null);
  const [resumeOptimization, setResumeOptimization] = useState<ResumeOptimizationState>(null);
  const [careerPathPredictions, setCareerPathPredictions] = useState<CareerPathPredictionState>(null);
  const [coverLetterDraft, setCoverLetterDraft] = useState<CoverLetterState>(null);
  const [activeRoadmapIndex, setActiveRoadmapIndex] = useState<number | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>(null);
  const reportPanelRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const showFeedback = (title: string, message: string, tone: FeedbackTone = "info") => {
    setFeedbackModal({ title, message, tone });
  };

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

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth >= 768) return;
    if (!activeResumeReport || !reportPanelRef.current) return;

    const timeoutId = window.setTimeout(() => {
      reportPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [activeResumeReport, careerPathPredictions, coverLetterDraft, resumeOptimization, resumeSkillSuggestions]);

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
      setActiveResumeReport("skills");
    } catch (error: unknown) {
      showFeedback("Could not analyze this file", getErrorMessage(error), "error");
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
        originalPreview:
          result.originalPreview && typeof result.originalPreview === "object"
            ? {
                name:
                  typeof result.originalPreview.name === "string" && result.originalPreview.name.trim()
                    ? result.originalPreview.name
                    : "Resume Draft",
                headline:
                  typeof result.originalPreview.headline === "string" && result.originalPreview.headline.trim()
                    ? result.originalPreview.headline
                    : "Learning and Development Professional",
                summary:
                  typeof result.originalPreview.summary === "string" && result.originalPreview.summary.trim()
                    ? result.originalPreview.summary
                    : "Original resume preview unavailable.",
                bulletPoints: Array.isArray(result.originalPreview.bulletPoints)
                  ? result.originalPreview.bulletPoints.filter((item: unknown): item is string => typeof item === "string")
                  : [],
                skills: Array.isArray(result.originalPreview.skills)
                  ? result.originalPreview.skills.filter((item: unknown): item is string => typeof item === "string")
                  : [],
              }
            : {
                name: "Resume Draft",
                headline: "Learning and Development Professional",
                summary: "Original resume preview unavailable.",
                bulletPoints: [],
                skills: [],
              },
      });
      setResumeOptimizerTab("suggestions");
      setActiveResumeReport("optimize");
    } catch (error: unknown) {
      showFeedback("Could not optimize this resume", getErrorMessage(error), "error");
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
      setActiveResumeReport("career");
    } catch (error: unknown) {
      showFeedback("Could not predict career paths", getErrorMessage(error), "error");
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
      setActiveResumeReport("cover");
    } catch (error: unknown) {
      showFeedback("Could not generate cover letter", getErrorMessage(error), "error");
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
  const skillCategoryBreakdown = getSkillCategoryBreakdown(suggestionDetectedSkills, suggestionRecommendedSkills);
  const mobileRecommendedSkills = suggestionRecommendedSkills.slice(0, 3);
  const desktopRecommendedSkills = suggestionRecommendedSkills.slice(0, 6);
  const mobileCategoryBreakdown = skillCategoryBreakdown.slice(0, 3);
  const mobileStrengthSignals = (suggestionStrengthSignals.length > 0
    ? suggestionStrengthSignals
    : ["Resume has enough baseline signal to start improving."]).slice(0, 2);
  const mobileCourseRecommendations = suggestionAcademyCourses.slice(0, 1);
  const mobileCareerStages = careerPathPredictions?.paths.slice(0, 3) ?? [];
  const coverLetterPreviewParagraphs = [coverLetterDraft?.intro, ...(coverLetterDraft?.body ?? []), coverLetterDraft?.closing]
    .filter((paragraph): paragraph is string => Boolean(paragraph))
    .slice(0, 2);

  const handleSave = async () => {
    if (!profile.id) {
      showFeedback("Profile still loading", "Please refresh the page and try again in a moment.", "info");
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

      showFeedback("Profile updated", "Your profile details were saved successfully.", "success");
      router.refresh();
    } catch (err: unknown) {
      showFeedback("Could not update profile", getErrorMessage(err), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (!isSupportedResumeFile(file)) {
      showFeedback("Unsupported file", "Please upload a PDF or DOCX resume file.", "info");
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
      showFeedback("Resume uploaded", "Your resume was uploaded and analyzed successfully.", "success");
    } catch (err: unknown) {
      showFeedback("Could not upload resume", getErrorMessage(err), "error");
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
      showFeedback("Could not delete resume", getErrorMessage(err), "error");
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
        <div className="space-y-5 rounded-[1.6rem] border border-[#dde7d8] bg-[#fbfdf8] p-4 shadow-[0_16px_40px_rgba(87,108,67,0.06)] sm:space-y-6 sm:rounded-[1.9rem] sm:p-8">
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

          <div className="min-w-0 overflow-hidden grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-3 lg:col-span-2">
              {resumes.map((resume) => (
                <div key={resume.id} className="min-w-0 overflow-hidden space-y-3 rounded-2xl border border-[#e4ebdf] bg-white p-3.5 sm:space-y-4 sm:p-4">
                  <div className="group flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3 overflow-hidden">
                      <FileText className="h-4 w-4 shrink-0 text-[#138d1a]" />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="max-w-full break-all text-sm font-medium leading-5 text-[#111827] sm:truncate">
                          {resume.file_name || "Resume"}
                        </p>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">Uploaded resume</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 self-end opacity-100 transition-opacity sm:self-auto sm:opacity-0 sm:group-hover:opacity-100">
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

                  <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        key: "skills" as const,
                        title: isAnalyzingResume && resumeSkillSuggestions?.resumeId === resume.id ? "Analyzing..." : "Suggest skills from this resume",
                        icon: <CheckCircle2 className="h-4 w-4" />,
                        active: activeResumeReport === "skills" && resumeSkillSuggestions?.resumeId === resume.id,
                        onClick: () =>
                          resumeSkillSuggestions?.resumeId === resume.id
                            ? setActiveResumeReport("skills")
                            : fetchResumeSkillSuggestions(resume.id),
                        disabled: isAnalyzingResume,
                      },
                      {
                        key: "optimize" as const,
                        title: isOptimizingResume && resumeOptimization?.resumeId === resume.id ? "Fixing..." : "Fix my resume",
                        icon:
                          isOptimizingResume && resumeOptimization?.resumeId === resume.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4" />
                          ),
                        active: activeResumeReport === "optimize" && resumeOptimization?.resumeId === resume.id,
                        onClick: () =>
                          resumeOptimization?.resumeId === resume.id
                            ? setActiveResumeReport("optimize")
                            : optimizeResume(resume.id),
                        disabled: isOptimizingResume,
                      },
                      {
                        key: "career" as const,
                        title:
                          isPredictingCareerPaths && careerPathPredictions?.resumeId === resume.id
                            ? "Predicting..."
                            : "Predict career paths",
                        icon:
                          isPredictingCareerPaths && careerPathPredictions?.resumeId === resume.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Compass className="h-4 w-4" />
                          ),
                        active: activeResumeReport === "career" && careerPathPredictions?.resumeId === resume.id,
                        onClick: () =>
                          careerPathPredictions?.resumeId === resume.id
                            ? setActiveResumeReport("career")
                            : predictCareerPaths(resume.id),
                        disabled: isPredictingCareerPaths,
                      },
                      {
                        key: "cover" as const,
                        title:
                          isGeneratingCoverLetter && coverLetterDraft?.resumeId === resume.id
                            ? "Drafting..."
                            : "Create cover letter",
                        icon:
                          isGeneratingCoverLetter && coverLetterDraft?.resumeId === resume.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          ),
                        active: activeResumeReport === "cover" && coverLetterDraft?.resumeId === resume.id,
                        onClick: () =>
                          coverLetterDraft?.resumeId === resume.id
                            ? setActiveResumeReport("cover")
                            : generateCoverLetter(resume.id),
                        disabled: isGeneratingCoverLetter,
                      },
                    ].map((action) => (
                      <button
                        key={action.key}
                        type="button"
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={`flex w-full min-w-0 items-center gap-2 rounded-[1.1rem] border px-3 py-3 text-left text-sm font-semibold transition sm:rounded-full sm:px-4 sm:py-2.5 ${
                          action.active
                            ? "border-[#8fd97e] bg-[#eef9e9] text-[#138d1a] shadow-[0_10px_20px_rgba(87,108,67,0.08)]"
                            : "border-[#dbe4d5] bg-white text-[#425243] hover:bg-[#f7fbf4]"
                        } disabled:opacity-60`}
                      >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${action.active ? "bg-[#138d1a] text-white" : "bg-[#eef7e9] text-[#138d1a]"}`}>
                          {action.icon}
                        </span>
                        <span className="min-w-0 flex-1 leading-5">
                          {action.key === "skills"
                            ? "Suggest skills"
                            : action.key === "optimize"
                              ? "Fix resume"
                              : action.key === "career"
                                ? "Career path"
                                : "Cover letter"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <label className="block w-full cursor-pointer">
                <div className="flex flex-col items-center justify-center rounded-[1.25rem] border-2 border-dashed border-[#dbe4d5] px-4 py-6 transition-all hover:border-[#8fd97e] hover:bg-[#f7fbf4] sm:rounded-[1.6rem] sm:py-8">
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

          <div ref={reportPanelRef} className="rounded-[1.6rem] border border-[#e4ebdf] bg-white p-5">
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
              {activeResumeReport ? (
                <div className="rounded-2xl bg-[#f7fbf4] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#5b6d58] sm:hidden">
                  Viewing: {activeResumeReport === "skills" ? "Skill gap report" : activeResumeReport === "optimize" ? "Resume fixer" : activeResumeReport === "career" ? "Career path" : "Cover letter"}
                </div>
              ) : null}

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

              {!resumeSkillSuggestions && !resumeOptimization && !coverLetterDraft && !careerPathPredictions ? (
                <div className="rounded-2xl border border-dashed border-[#dbe4d5] bg-[#fbfdf8] px-4 py-5 text-sm leading-7 text-[#6d7d68]">
                  <span className="sm:hidden">Upload a resume and open one card at a time to keep mobile clean.</span>
                  <span className="hidden sm:inline">Upload a resume, then open one of the four action cards above. We will keep only the selected detailed report open so the workspace stays clean.</span>
                </div>
              ) : null}

              {(resumeSkillSuggestions || resumeOptimization || coverLetterDraft || careerPathPredictions) ? (
                <div className="space-y-5">
                  {(resumeSkillSuggestions || resumeOptimization) &&
                  (activeResumeReport === "skills" || activeResumeReport === "optimize") ? (
                    <div className="px-1 py-2">
                      <div className="rounded-[1.4rem] border border-[#e4ebdf] bg-[#fbfdf8] p-4 sm:border-0 sm:bg-transparent sm:p-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Current readiness</p>
                          <h3 className="mt-1 text-base font-bold text-[#111827] sm:text-lg">See the baseline before you rewrite anything.</h3>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:hidden">
                          {[
                            {
                              label: "Current",
                              value: `${resumeOptimization ? resumeOptimization.beforeScore : resumeSkillSuggestions?.resumeReadinessScore || 0}%`,
                            },
                            ...(resumeOptimization
                              ? [
                                  { label: "Projected", value: `${resumeOptimization.afterScore}%` },
                                  { label: "Boost", value: `+${resumeOptimization.improvementPercent}%` },
                                ]
                              : []),
                          ].map((item) => (
                            <div key={item.label} className="rounded-2xl bg-white px-3 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7a8a74]">{item.label}</p>
                              <p className="mt-1 text-xl font-bold text-[#11203b]">{item.value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 hidden w-full max-w-xl space-y-4 sm:block">
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
                      </div>
                      </div>

                      {suggestionScoreBreakdown.length ? (
                        <div className="mt-4 hidden space-y-4 sm:block">
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

                  {resumeSkillSuggestions && activeResumeReport === "skills" ? (
                    <div className="space-y-5 px-1 py-2">
                      <div className="space-y-4 rounded-[1.45rem] border border-[#dbe6d7] bg-[linear-gradient(180deg,#f9fcf7_0%,#ffffff_100%)] p-4 shadow-[0_18px_40px_rgba(87,108,67,0.08)] sm:hidden">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Skill gap overview</p>
                            <h3 className="mt-1 text-lg font-bold text-[#111827]">Your match snapshot</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const report = [
                                "LXD GUILD SKILL GAP REPORT",
                                "",
                                `Overall Match: ${resumeSkillSuggestions.resumeReadinessScore}%`,
                                `Missing Skills: ${suggestionRecommendedSkills.length}`,
                              ].join("\n");
                              const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = "lxd-skill-gap-report.txt";
                              link.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="rounded-full border border-[#dbe4d5] bg-white px-3 py-2 text-[11px] font-semibold text-[#11203b]"
                          >
                            Download
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <div
                              className="relative flex h-24 w-24 items-center justify-center rounded-full"
                              style={{
                                background: `conic-gradient(#39c426 0 ${resumeSkillSuggestions.resumeReadinessScore}%, #e9edf0 ${resumeSkillSuggestions.resumeReadinessScore}% 100%)`,
                              }}
                            >
                              <div className="flex h-[4.35rem] w-[4.35rem] flex-col items-center justify-center rounded-full bg-white shadow-inner">
                                <p className="text-2xl font-bold text-[#111827]">{resumeSkillSuggestions.resumeReadinessScore}%</p>
                                <p className="text-[10px] font-semibold text-[#39a02f]">Match</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-sm leading-6 text-[#667085]">
                              Focus on the top missing skills first so your resume aligns faster.
                            </p>
                            <div className="mt-3 flex flex-wrap justify-center gap-2">
                              <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#11203b]">
                                Role: {profile.headline || "L&D Professional"}
                              </span>
                              <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#11203b]">
                                {getExperienceLevelLabel(profile.experience_years)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-[#e4ece0] pt-4">
                          <p className="text-sm font-semibold text-[#111827]">Top missing skills</p>
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            {suggestionRecommendedSkills.length > 0 ? suggestionRecommendedSkills.map((skill) => {
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
                                  className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold leading-6 ${
                                    alreadyAdded
                                      ? "border-[#cfe9c8] bg-[#eaf8e3] text-[#138d1a]"
                                      : "border-[#dbe6d7] bg-white text-[#11203b]"
                                  }`}
                                >
                                  <span className="block break-words whitespace-normal">{skill}</span>
                                </button>
                              );
                            }) : <p className="col-span-2 text-sm text-zinc-500">No additional suggestions right now.</p>}
                          </div>
                        </div>

                        <div className="border-t border-[#e4ece0] pt-4">
                          <p className="text-sm font-semibold text-[#111827]">Strength signals</p>
                          <div className="mt-3 space-y-2">
                            {mobileStrengthSignals.map((item) => (
                              <p key={item} className="text-sm leading-6 text-zinc-700">• {item}</p>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-[#e4ece0] pt-4">
                          <p className="text-sm font-semibold text-[#111827]">Skill categories</p>
                          <div className="mt-3 space-y-3">
                            {skillCategoryBreakdown.map((category) => (
                              <div key={category.label}>
                                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm text-[#11203b]">
                                  <span>{category.label}</span>
                                  <span className="font-semibold text-[#138d1a]">{category.value}%</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-[#edf2ed]">
                                  <div
                                    className="h-2.5 rounded-full bg-[linear-gradient(90deg,#9be27c_0%,#34cd2f_55%,#138d1a_100%)]"
                                    style={{ width: `${category.value}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {suggestionAcademyCourses.length > 0 ? (
                          <div className="border-t border-[#e4ece0] pt-4">
                            <p className="text-sm font-semibold text-[#111827]">Recommended courses</p>
                            <div className="mt-3 space-y-3">
                              {suggestionAcademyCourses.map((course) => (
                                <a
                                  key={course.code}
                                  href={course.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex flex-col items-start gap-3 rounded-[1.2rem] border border-[#dbe6d7] bg-white px-3 py-3 shadow-[0_10px_24px_rgba(87,108,67,0.08)]"
                                >
                                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#eaf8e3,#c8f3b7)] text-[#138d1a]">
                                    <Award className="h-6 w-6" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a8a74]">LXD Guild course</p>
                                    <p className="mt-1 text-sm font-semibold leading-5 text-[#111827]">{course.title}</p>
                                    {course.description ? (
                                      <p className="mt-1 text-xs leading-5 text-[#667085] line-clamp-2">{course.description}</p>
                                    ) : null}
                                    <span className="mt-3 inline-flex rounded-full bg-[#138d1a] px-3 py-1.5 text-[11px] font-semibold text-white">
                                      Enroll Now
                                    </span>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="hidden flex-col gap-4 rounded-[1.5rem] border border-[#dbe6d7] bg-[linear-gradient(180deg,#f9fcf7_0%,#ffffff_100%)] p-4 shadow-[0_18px_40px_rgba(87,108,67,0.08)] sm:flex sm:rounded-[2rem] sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-[1.1rem] bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] text-[#091737] shadow-[0_10px_22px_rgba(52,205,47,0.18)] sm:h-11 sm:w-11 sm:rounded-2xl">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-[#111827] sm:text-xl">Your Skill Gap Overview</h3>
                              <p className="mt-1 text-sm leading-6 text-[#667085] sm:hidden">
                                See your match score, missing skills, and next learning moves.
                              </p>
                              <p className="mt-1 hidden text-sm leading-6 text-[#667085] sm:block">
                                AI insights to help you grow faster and improve your resume-to-role match.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const report = [
                                "LXD GUILD SKILL GAP REPORT",
                                "",
                                `Overall Match: ${resumeSkillSuggestions.resumeReadinessScore}%`,
                                `Missing Skills: ${suggestionRecommendedSkills.length}`,
                                `Target Role: ${profile.headline || "Learning and Development Professional"}`,
                                `Experience Level: ${getExperienceLevelLabel(profile.experience_years)}`,
                                "",
                                "TOP MISSING SKILLS",
                                ...suggestionRecommendedSkills.map((skill) => `- ${skill}`),
                                "",
                                "STRENGTH SIGNALS",
                                ...suggestionStrengthSignals.map((item) => `- ${item}`),
                                "",
                                "FOCUS AREAS",
                                ...(suggestionFocusAreas.length > 0 ? suggestionFocusAreas : suggestionReasons).map((item) => `- ${item}`),
                              ].join("\n");
                              const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = "lxd-skill-gap-report.txt";
                              link.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="inline-flex items-center gap-2 self-start rounded-2xl border border-[#dbe4d5] bg-white px-3 py-2.5 text-xs font-semibold text-[#11203b] shadow-sm hover:bg-[#f7fbf4] sm:px-4 sm:py-3 sm:text-sm"
                          >
                            <Save className="h-4 w-4 text-[#138d1a]" />
                            <span className="sm:hidden">Download</span>
                            <span className="hidden sm:inline">Download Report</span>
                          </button>
                        </div>

                        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                          <div className="rounded-[1.4rem] border border-[#e4ebdf] bg-white p-4 sm:rounded-[1.8rem] sm:p-5">
                            <div className="grid gap-4 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
                              <div className="flex justify-center">
                                <div
                                  className="relative flex h-28 w-28 items-center justify-center rounded-full sm:h-40 sm:w-40"
                                  style={{
                                    background: `conic-gradient(#39c426 0 ${resumeSkillSuggestions.resumeReadinessScore}%, #e9edf0 ${resumeSkillSuggestions.resumeReadinessScore}% 100%)`,
                                  }}
                                >
                                  <div className="flex flex-col items-center justify-center rounded-full bg-white shadow-inner" style={{ width: "6rem", height: "6rem" }}>
                                    <p className="text-3xl font-bold text-[#111827] sm:text-4xl">{resumeSkillSuggestions.resumeReadinessScore}%</p>
                                    <p className="mt-1 text-xs font-semibold text-[#39a02f]">Good Match</p>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-[#111827]">
                                  You&apos;re missing {suggestionRecommendedSkills.length} important skill{suggestionRecommendedSkills.length === 1 ? "" : "s"}
                                </p>
                                <p className="mt-2 hidden text-sm leading-6 text-[#667085] sm:block">
                                  Focus on these skills to improve your match and boost your career opportunities.
                                </p>

                                <div className="mt-4 grid gap-2 sm:mt-5 sm:gap-3 sm:grid-cols-2">
                                  <div className="rounded-2xl bg-[#f8fbf6] px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a8a74]">Target Role</p>
                                    <p className="mt-2 text-sm font-semibold text-[#111827]">
                                      {profile.headline || "Learning and Development Professional"}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl bg-[#f8fbf6] px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a8a74]">Experience Level</p>
                                    <p className="mt-2 text-sm font-semibold text-[#111827]">
                                      {getExperienceLevelLabel(profile.experience_years)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-[1.4rem] border border-[#e4ebdf] bg-white p-4 sm:rounded-[1.8rem] sm:p-5">
                            <p className="text-sm font-semibold text-[#111827]">Top Missing Skills</p>
                            <div className="mt-4 space-y-2.5 sm:space-y-3">
                              {suggestionRecommendedSkills.length > 0 ? (
                                <>
                                  <div className="space-y-2.5 sm:hidden">
                                    {mobileRecommendedSkills.map((skill, index) => {
                                      const priority =
                                        index < 2 ? { label: "High", tone: "bg-[#fff1f0] text-[#d94d3f]" }
                                        : { label: "Medium", tone: "bg-[#fff6ea] text-[#dd8a1a]" };
                                      const alreadyAdded = (profile.skills || []).includes(skill);

                                      return (
                                        <div key={skill} className="flex items-center justify-between gap-2 rounded-2xl bg-[#fbfdf8] px-3 py-3">
                                          <p className="min-w-0 truncate text-sm font-medium text-[#111827]">{skill}</p>
                                          <div className="flex items-center gap-2">
                                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${priority.tone}`}>
                                              {priority.label}
                                            </span>
                                            <button
                                              type="button"
                                              disabled={alreadyAdded}
                                              onClick={() =>
                                                setProfile((current) => ({
                                                  ...current,
                                                  skills: alreadyAdded ? current.skills : [...(current.skills || []), skill],
                                                }))
                                              }
                                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                                alreadyAdded ? "bg-[#dff4d8] text-[#138d1a]" : "bg-[#138d1a] text-white"
                                              }`}
                                            >
                                              {alreadyAdded ? "Added" : "Add"}
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="hidden space-y-3 sm:block">
                                    {desktopRecommendedSkills.map((skill, index) => {
                                  const priority =
                                    index < 2 ? { label: "High", tone: "bg-[#fff1f0] text-[#d94d3f]" }
                                    : index < 4 ? { label: "Medium", tone: "bg-[#fff6ea] text-[#dd8a1a]" }
                                    : { label: "Low", tone: "bg-[#eef8ea] text-[#4d9f2e]" };
                                  const alreadyAdded = (profile.skills || []).includes(skill);

                                  return (
                                    <div key={skill} className="flex items-center justify-between gap-3 rounded-2xl bg-[#fbfdf8] px-4 py-3">
                                      <div className="flex items-center gap-3">
                                        <span className={`h-2.5 w-2.5 rounded-full ${index < 2 ? "bg-[#ef4444]" : index < 4 ? "bg-[#f59e0b]" : "bg-[#eab308]"}`} />
                                        <p className="text-sm font-medium text-[#111827]">{skill}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priority.tone}`}>
                                          {priority.label}
                                        </span>
                                        <button
                                          type="button"
                                          disabled={alreadyAdded}
                                          onClick={() =>
                                            setProfile((current) => ({
                                              ...current,
                                              skills: alreadyAdded ? current.skills : [...(current.skills || []), skill],
                                            }))
                                          }
                                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                            alreadyAdded ? "bg-[#dff4d8] text-[#138d1a]" : "bg-[#138d1a] text-white"
                                          }`}
                                        >
                                          {alreadyAdded ? "Added" : "Add"}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                    })}
                                  </div>
                                </>
                              ) : (
                                <p className="text-sm text-zinc-500">No additional gap skills were found right now.</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                          <div className="rounded-[1.4rem] border border-[#e4ebdf] bg-white p-4 sm:rounded-[1.8rem] sm:p-5">
                            <p className="text-sm font-semibold text-[#111827]">Skill Category Breakdown</p>
                            <div className="mt-4 grid gap-2 sm:hidden">
                              {mobileCategoryBreakdown.map((category) => (
                                <div key={category.label} className="rounded-2xl bg-[#fbfdf8] px-3 py-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium text-[#11203b]">{category.label}</p>
                                    <span className="text-sm font-semibold text-[#39a02f]">{category.value}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-5 hidden space-y-4 sm:block">
                              {skillCategoryBreakdown.map((category) => (
                                <div key={category.label}>
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium text-[#11203b]">{category.label}</p>
                                    <span className="text-sm font-semibold text-[#39a02f]">{category.value}%</span>
                                  </div>
                                  <div className="h-2.5 rounded-full bg-[#edf2ed]">
                                    <div
                                      className="h-2.5 rounded-full bg-[linear-gradient(90deg,#9be27c_0%,#34cd2f_55%,#138d1a_100%)]"
                                      style={{ width: `${category.value}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="mt-4 rounded-2xl bg-[#fbfdf8] px-4 py-4 sm:mt-5">
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Detected strengths</p>
                              <div className="mt-3 space-y-2">
                                <div className="space-y-2 sm:hidden">
                                  {mobileStrengthSignals.map((item) => (
                                    <p key={item} className="text-sm leading-6 text-zinc-700">{item}</p>
                                  ))}
                                </div>
                                <div className="hidden space-y-2 sm:block">
                                  {(suggestionStrengthSignals.length > 0
                                    ? suggestionStrengthSignals
                                    : ["Resume has enough baseline signal to start improving."]).slice(0, 3).map((item) => (
                                    <p key={item} className="text-sm leading-6 text-zinc-700">{item}</p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-[1.4rem] border border-[#e4ebdf] bg-white p-4 sm:rounded-[1.8rem] sm:p-5">
                            <p className="text-sm font-semibold text-[#111827]">Recommended Learning Path</p>
                            <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:grid-cols-4 sm:gap-4">
                              {[
                                { title: "Learn Basics", copy: "2-3 Weeks" },
                                { title: "Practice Skills", copy: "3-4 Weeks" },
                                { title: "Real Projects", copy: "4-6 Weeks" },
                                { title: "Get Certified", copy: "2-3 Weeks" },
                              ].map((step, index) => (
                                <div key={step.title} className="rounded-2xl bg-[#fbfdf8] px-3 py-3 text-center sm:px-4 sm:py-4">
                                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf8e3] text-[#138d1a] sm:h-11 sm:w-11">
                                    <Award className="h-4 w-4" />
                                  </div>
                                  <p className="mt-3 text-sm font-semibold text-[#111827]">{step.title}</p>
                                  <p className="mt-1 text-xs text-[#667085]">{step.copy}</p>
                                  {index < 3 ? <p className="mt-2 hidden text-xs text-[#a7b3ac] sm:block">Next</p> : null}
                                </div>
                              ))}
                            </div>

                            <div className="mt-5">
                              <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#7a8a74]">
                                <span>Your Progress</span>
                                <span>{Math.min(100, resumeSkillSuggestions.resumeReadinessScore)}% completed</span>
                              </div>
                              <div className="mt-3 h-2.5 rounded-full bg-[#edf2ed]">
                                <div
                                  className="h-2.5 rounded-full bg-[linear-gradient(90deg,#7ee46b_0%,#138d1a_100%)]"
                                  style={{ width: `${Math.min(100, resumeSkillSuggestions.resumeReadinessScore)}%` }}
                                />
                              </div>
                            </div>

                            {suggestionAcademyCourses.length > 0 ? (
                              <div className="mt-5 space-y-3">
                                <div className="space-y-3 sm:hidden">
                                  {mobileCourseRecommendations.map((course) => (
                                    <a
                                      key={course.code}
                                      href={course.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block rounded-2xl border border-[#e4ebdf] bg-[#fbfdf8] p-4 transition hover:-translate-y-0.5 hover:border-[#c8ddbf]"
                                    >
                                      <p className="text-sm font-semibold text-[#111827]">{course.title}</p>
                                    </a>
                                  ))}
                                </div>
                                <div className="hidden space-y-3 sm:block">
                                  {suggestionAcademyCourses.slice(0, 2).map((course) => (
                                    <a
                                      key={course.code}
                                      href={course.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block rounded-2xl border border-[#e4ebdf] bg-[#fbfdf8] p-4 transition hover:-translate-y-0.5 hover:border-[#c8ddbf]"
                                    >
                                      <p className="text-sm font-semibold text-[#111827]">{course.title}</p>
                                      <p className="mt-2 text-sm leading-6 text-zinc-600">{course.description}</p>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-5 text-sm leading-7 text-[#6d7d68]">
                                Course recommendations will appear here when we detect strong skill-gap matches from the resume.
                              </div>
                            )}
                          </div>
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

              {resumeOptimization && activeResumeReport === "optimize" ? (
                <div className="rounded-[1.5rem] border border-[#dbe6d7] bg-[linear-gradient(180deg,#f8fcf5_0%,#ffffff_100%)] p-4 shadow-[0_20px_44px_rgba(87,108,67,0.08)] sm:rounded-[2rem] sm:p-5">
                  <div className="flex flex-col gap-4 border-b border-[#e4ece0] pb-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[1.1rem] bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] text-[#091737] shadow-[0_10px_22px_rgba(52,205,47,0.18)] sm:h-12 sm:w-12 sm:rounded-2xl">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#111827] sm:text-xl">Fix My Resume</h3>
                        <p className="mt-1 text-sm leading-6 text-[#667085] sm:hidden">
                          Before and after improvements, simplified for a quick mobile review.
                        </p>
                        <p className="mt-1 hidden text-sm leading-6 text-[#667085] sm:block">
                          {resumeOptimization.note || "AI suggestions to improve your resume with a clearer before-and-after view."}
                        </p>
                      </div>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2 self-start rounded-2xl border border-[#dbe4d5] bg-white px-3 py-2.5 text-xs font-semibold text-[#11203b] shadow-sm hover:bg-[#f7fbf4] sm:px-4 sm:py-3 sm:text-sm">
                      <Upload className="h-4 w-4 text-[#138d1a]" />
                      Upload New Resume
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx"
                        onChange={handleResumeUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
                    {[
                      { key: "suggestions", label: "AI Suggestions" },
                      { key: "enhancements", label: "Content Enhancements" },
                      { key: "summary", label: "Summary" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setResumeOptimizerTab(tab.key as "suggestions" | "enhancements" | "summary")}
                        className={`rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                          resumeOptimizerTab === tab.key
                            ? "bg-[#e5f8dd] text-[#138d1a]"
                            : "bg-white text-[#667085] hover:bg-[#f4f7f1]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 xl:mt-8 xl:grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] xl:items-center xl:gap-6">
                    <div className="rounded-[1.35rem] border border-[#e8ede5] bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:rounded-[1.8rem] sm:p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d05f5f]">Before</p>
                      <div className="mt-4 border-b border-[#eef2ee] pb-4 sm:mt-5 sm:pb-5">
                        <h4 className="text-xl font-bold text-[#111827] sm:text-2xl">{resumeOptimization.originalPreview.name}</h4>
                        <p className="mt-1 text-sm font-medium text-[#667085]">{resumeOptimization.originalPreview.headline}</p>
                      </div>

                      {resumeOptimizerTab === "suggestions" ? (
                        <div className="mt-5 space-y-5">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Summary</p>
                            <p className="mt-3 text-sm leading-6 text-zinc-600 sm:leading-7">{resumeOptimization.originalPreview.summary}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Experience</p>
                            <div className="mt-3 space-y-2">
                              {bulletize(
                                (resumeOptimization.originalPreview.bulletPoints.length > 0
                                  ? resumeOptimization.originalPreview.bulletPoints
                                  : [
                                      "Experience bullets are present but need stronger impact language.",
                                      "Keywords and tools can be surfaced more clearly.",
                                      "Outcomes can be made easier for ATS and recruiters to scan.",
                                    ]).slice(0, 2)
                              ).map((point) => (
                                <p key={point} className="text-sm leading-6 text-zinc-600 sm:leading-7">{point}</p>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Skills</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(resumeOptimization.originalPreview.skills.length > 0
                                ? resumeOptimization.originalPreview.skills
                                : ["Resume draft"]).map((skill) => (
                                <span key={skill} className="rounded-full bg-[#f5f7f8] px-3 py-1 text-xs font-medium text-zinc-600">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : resumeOptimizerTab === "enhancements" ? (
                        <div className="mt-5 space-y-3">
                          {(resumeOptimization.focusAreas.length > 0
                            ? resumeOptimization.focusAreas
                            : ["This resume has good baseline signal but still needs clearer positioning and better ATS phrasing."]).map((item) => (
                            <p key={item} className="text-sm leading-6 text-zinc-600 sm:leading-7">{item}</p>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-5 space-y-4">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Current score</p>
                            <p className="mt-2 text-4xl font-bold text-[#111827]">{resumeOptimization.beforeScore}%</p>
                          </div>
                          <p className="text-sm leading-6 text-zinc-600 sm:leading-7">
                            This is the current baseline before cleaner summary language, stronger bullet structure, and ATS-friendly keyword surfacing.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="hidden items-center justify-center xl:flex">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#ffffff,#eef8e9)] shadow-[0_10px_24px_rgba(87,108,67,0.12)]">
                        <Sparkles className="h-8 w-8 text-[#34cd2f]" />
                      </div>
                    </div>

                    <div className="rounded-[1.35rem] border border-[#ddedd8] bg-white p-4 shadow-[0_16px_32px_rgba(52,205,47,0.08)] sm:rounded-[1.8rem] sm:p-5">
                      <div className="flex items-start justify-between gap-3 border-b border-[#eef5eb] pb-5">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#138d1a]">After</p>
                          <h4 className="mt-3 text-xl font-bold text-[#111827] sm:text-2xl">{profile.name || resumeOptimization.originalPreview.name}</h4>
                          <p className="mt-1 text-sm font-semibold text-[#2aa82b]">{profile.headline || resumeOptimization.originalPreview.headline}</p>
                        </div>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f8e3] text-[#138d1a]">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                      </div>

                      {resumeOptimizerTab === "suggestions" ? (
                        <div className="mt-5 space-y-5">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Professional summary</p>
                            <div className="mt-3">
                              <p className="text-sm leading-6 text-[#138d1a] sm:leading-7">{resumeOptimization.summary}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Experience</p>
                            <div className="mt-3 space-y-2">
                              {bulletize(resumeOptimization.bulletPoints.slice(0, 3)).map((point) => (
                                <p key={point} className="text-sm leading-6 text-[#138d1a] sm:leading-7">{point}</p>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Skills</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {resumeOptimization.skillsSection.slice(0, 8).map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-[linear-gradient(135deg,#c8f3b7,#ecfae7)] px-3 py-1.5 text-xs font-semibold text-[#138d1a] shadow-[0_6px_16px_rgba(52,205,47,0.12)] ring-1 ring-[#d7f1cd]"
                                >
                                  {skill}
                                </span>
                              ))}
                              {resumeOptimization.skillsSection.length > 8 ? (
                                <span className="rounded-full bg-[#f4f7f1] px-3 py-1 text-xs font-medium text-zinc-600">
                                  + {resumeOptimization.skillsSection.length - 8} more
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : resumeOptimizerTab === "enhancements" ? (
                        <div className="mt-5 space-y-5">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">What improved</p>
                            <div className="mt-3 space-y-2">
                              {(resumeOptimization.strengths.length > 0
                                ? resumeOptimization.strengths
                                : ["This version is clearer, stronger, and better aligned for ATS scanning."]).map((item) => (
                                <p key={item} className="text-sm leading-6 text-[#138d1a] sm:leading-7">{item}</p>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">ATS formatting</p>
                            <div className="mt-3 space-y-2">
                              {bulletize(resumeOptimization.atsFormattingTips.slice(0, 2)).map((tip) => (
                                <p key={tip} className="text-sm leading-6 text-[#138d1a] sm:leading-7">{tip}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 space-y-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {[
                              { label: "Improvements", value: resumeOptimization.bulletPoints.length + resumeOptimization.atsFormattingTips.length },
                              { label: "Readability Score", value: `${resumeOptimization.afterScore}%` },
                              { label: "ATS Score Boost", value: `+${resumeOptimization.improvementPercent}%` },
                            ].map((item) => (
                              <div key={item.label} className="rounded-2xl bg-[#f8fbf6] px-4 py-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a8a74]">{item.label}</p>
                                <p className="mt-2 text-2xl font-bold text-[#111827]">{item.value}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm leading-6 text-zinc-700 sm:leading-7">
                            This optimized version is designed to read more clearly, surface stronger keywords, and make your best experience easier for both recruiters and ATS systems to understand.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 rounded-[1.3rem] border border-[#dbe6d7] bg-[#fbfdf8] p-3 sm:grid-cols-2 sm:rounded-[1.6rem] sm:p-4 lg:grid-cols-4">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a8a74]">Improvements</p>
                      <p className="mt-2 text-2xl font-bold text-[#111827]">
                        {resumeOptimization.bulletPoints.length + resumeOptimization.atsFormattingTips.length}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a8a74]">Readability Score</p>
                      <p className="mt-2 text-2xl font-bold text-[#111827]">{resumeOptimization.afterScore}%</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a8a74]">ATS Score Boost</p>
                      <p className="mt-2 text-2xl font-bold text-[#138d1a]">+{resumeOptimization.improvementPercent}%</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a8a74]">Impact Level</p>
                      <p className="mt-2 text-2xl font-bold text-[#111827]">
                        {resumeOptimization.improvementPercent >= 25 ? "High" : resumeOptimization.improvementPercent >= 12 ? "Medium" : "Low"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 border-t border-[#e4ece0] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d7d68]">
                      Generated via {resumeOptimization.source === "ai" ? "AI action engine" : "smart template engine"}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          [
                            "SUMMARY",
                            resumeOptimization.summary,
                            "",
                            "SKILLS",
                            resumeOptimization.skillsSection.join(", "),
                            "",
                            "BULLET POINTS",
                            ...resumeOptimization.bulletPoints.map((point) => `- ${point}`),
                            "",
                            "ATS FORMATTING TIPS",
                            ...resumeOptimization.atsFormattingTips.map((tip) => `- ${tip}`),
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

              {false && resumeOptimization ? (
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
                      { label: "Original score", value: resumeOptimization!.beforeScore },
                      { label: "Fixed score", value: resumeOptimization!.afterScore },
                      { label: "Improvement", value: resumeOptimization!.improvementPercent },
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

              {coverLetterDraft && activeResumeReport === "cover" ? (
                <div className="space-y-4 px-1 py-2">
                  <div className="flex items-start gap-3 pb-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[1.1rem] bg-[linear-gradient(135deg,#edf8ea,#ffffff)] text-[#138d1a] shadow-[0_10px_22px_rgba(87,108,67,0.1)] sm:h-11 sm:w-11 sm:rounded-2xl">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Cover letter draft</p>
                      <h3 className="mt-1 text-base font-bold text-[#111827] sm:text-lg">Turn the resume into an employer-ready introduction.</h3>
                      <p className="mt-1 text-sm leading-6 text-[#667085] sm:hidden">A shorter preview for mobile, with the full draft ready to copy.</p>
                      <p className="mt-1 hidden text-sm leading-6 text-[#667085] sm:block">{coverLetterDraft.note}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-[1.4rem] border border-[#e4ebdf] bg-white p-4 xl:grid-cols-[240px_minmax(0,1fr)]">
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Subject</p>
                      <p className="text-sm font-semibold leading-6 text-zinc-800">{coverLetterDraft.subject}</p>
                    </div>

                    <div className="space-y-3 border-l-0 border-[#e4ebdf] pl-0 xl:border-l xl:pl-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Draft preview</p>
                      <div className="hidden space-y-3 text-sm leading-7 text-zinc-700 sm:block">
                        <p>{coverLetterDraft.intro}</p>
                        {coverLetterDraft.body.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                        <p>{coverLetterDraft.closing}</p>
                      </div>
                      <div className="space-y-3 text-sm leading-6 text-zinc-700 sm:hidden">
                        {coverLetterPreviewParagraphs.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
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

              {careerPathPredictions && careerPathPredictions.paths.length > 0 && activeResumeReport === "career" ? (
                <div className="space-y-4 px-1 py-2">
                  <div className="flex items-start gap-3 pb-4">
                    <Compass className="mt-0.5 h-5 w-5 text-[#138d1a]" />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Learning path</p>
                      <h3 className="mt-1 text-base font-bold text-[#111827] sm:text-lg">Map the next learning path, not just isolated roles.</h3>
                      <p className="mt-1 hidden text-sm leading-6 text-[#667085] sm:block">
                        Follow the sequence below to see the most realistic next moves and the skills each move still needs.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 sm:hidden">
                    <div className="relative h-40 overflow-visible bg-[linear-gradient(180deg,#0e2216_0%,#102919_50%,#163521_100%)] px-2">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(126,228,107,0.12),transparent_28%)]" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(116,211,255,0.08),transparent_24%)]" />
                      <div className="relative h-full">
                        <svg
                          viewBox="0 0 320 140"
                          className="absolute inset-0 h-full w-full"
                          aria-hidden="true"
                        >
                          <defs>
                            <linearGradient id="mobile-career-line" x1="0%" y1="100%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#7ee46b" />
                              <stop offset="55%" stopColor="#74d3ff" />
                              <stop offset="100%" stopColor="#ffd86b" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 14 126 C 52 126, 88 104, 144 82 S 228 54, 306 20"
                            fill="none"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="10"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 14 126 C 52 126, 88 104, 144 82 S 228 54, 306 20"
                            fill="none"
                            stroke="url(#mobile-career-line)"
                            strokeWidth="5"
                            strokeLinecap="round"
                          />
                          <path d="M 36 120 L 36 136" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeDasharray="3 4" />
                          <path d="M 158 82 L 158 136" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeDasharray="3 4" />
                          <path d="M 286 20 L 286 136" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeDasharray="3 4" />
                        </svg>

                        {mobileCareerStages[0] ? (
                          <div className="absolute left-[10%] top-[72%] -translate-x-1/2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 shadow-[0_0_22px_rgba(126,228,107,0.28)]">
                              <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-[#7ee46b] shadow-[0_0_18px_rgba(126,228,107,0.8)]" />
                            </div>
                          </div>
                        ) : null}
                        {mobileCareerStages[1] ? (
                          <div className="absolute left-1/2 top-[44%] -translate-x-1/2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 shadow-[0_0_22px_rgba(116,211,255,0.24)]">
                              <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-[#74d3ff] shadow-[0_0_18px_rgba(116,211,255,0.75)]" />
                            </div>
                          </div>
                        ) : null}
                        {mobileCareerStages[2] ? (
                          <div className="absolute left-[88%] top-[10%] -translate-x-1/2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 shadow-[0_0_22px_rgba(255,216,107,0.22)]">
                              <div className="h-3.5 w-3.5 rounded-full border-2 border-white bg-[#ffd86b] shadow-[0_0_18px_rgba(255,216,107,0.78)]" />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {mobileCareerStages.map((path, index) => {
                        const tones = [
                          "bg-[#7ee46b] text-[#0d2512]",
                          "bg-[#74d3ff] text-[#0b2231]",
                          "bg-[#ffd86b] text-[#342200]",
                        ];

                        return (
                          <div key={`${path.title}-${path.timeline}-mobile-summary`} className="text-center">
                            <div className="flex flex-col items-center gap-2">
                              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${tones[index] || tones[0]}`}>
                                {index + 1}
                              </span>
                              <p className="text-[11px] font-semibold leading-4 text-[#111827]">{path.title}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="relative hidden overflow-hidden rounded-[1.5rem] border border-[#dbe6d7] bg-[linear-gradient(180deg,#f7fcf4_0%,#ffffff_100%)] p-4 shadow-[0_18px_42px_rgba(87,108,67,0.08)] sm:block sm:rounded-[2rem] sm:p-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,205,47,0.10),transparent_26%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(95,213,255,0.06),transparent_22%)]" />

                    <div className="relative grid gap-4 sm:gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                      <div className="hidden space-y-4 rounded-[1.6rem] border border-[#e3ebde] bg-white/82 p-4 backdrop-blur-sm lg:block">
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

                      <div className="relative min-h-[340px] overflow-hidden rounded-[1.4rem] border border-[#dbe6d7] bg-[linear-gradient(180deg,#f4fbef_0%,#ffffff_100%)] p-3 pb-24 sm:min-h-[500px] sm:rounded-[1.8rem] sm:p-4 sm:pb-28 lg:min-h-[470px] lg:pb-24">
                        <div className="absolute left-3 top-3 z-10 rounded-full border border-white/80 bg-white/88 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5d6d58] shadow-[0_8px_20px_rgba(87,108,67,0.08)] backdrop-blur-sm sm:left-4 sm:top-4 sm:text-[11px]">
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
                                className={`absolute ${isActive ? "z-30" : "z-20"} flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white text-sm font-bold text-white shadow-[0_16px_30px_rgba(19,141,26,0.22)] transition duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#b9efaa] sm:h-12 sm:w-12 ${
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
                                style={{ left: point.left, top: `calc(${point.top} - 3.7rem)` }}
                              >
                                <span className="inline-flex max-w-[94px] rounded-full bg-white/92 px-2 py-1 text-[9px] font-semibold leading-3 text-[#2b3a2a] shadow-[0_8px_20px_rgba(87,108,67,0.08)] backdrop-blur-sm sm:max-w-[148px] sm:px-2.5 sm:text-[10px] sm:leading-4">
                                  {path.title}
                                </span>
                              </div>

                              {isActive ? (
                                <div
                                  className="absolute z-40 hidden w-[320px] max-w-[320px] rounded-[1.35rem] border border-[#e2ebde] bg-white/96 p-4 shadow-[0_14px_34px_rgba(87,108,67,0.12)] backdrop-blur-sm md:block"
                                  style={{
                                    left:
                                      index === careerPathPredictions.paths.length - 1
                                        ? undefined
                                        : `calc(${point.left} + 2.8rem)`,
                                    right:
                                      index === careerPathPredictions.paths.length - 1
                                        ? `calc(100% - ${point.left} + 2.8rem)`
                                        : undefined,
                                    top:
                                      index === 0
                                        ? `calc(${point.top} - 5.5rem)`
                                        : index === careerPathPredictions.paths.length - 1
                                          ? `calc(${point.top} - 10.5rem)`
                                          : `calc(${point.top} - 7.5rem)`,
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

      {feedbackModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#09111f]/45 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[2rem] border border-[#dbe6d7] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:p-7">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  feedbackModal.tone === "error"
                    ? "bg-[#fff1ef] text-[#d64545]"
                    : feedbackModal.tone === "success"
                      ? "bg-[#eaf8e3] text-[#138d1a]"
                      : "bg-[#eef4ff] text-[#4569d6]"
                }`}
              >
                {feedbackModal.tone === "error" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : feedbackModal.tone === "success" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Resume workspace</p>
                <h3 className="mt-2 text-xl font-bold text-[#111827]">{feedbackModal.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5f6876]">{feedbackModal.message}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setFeedbackModal(null)}
                className={`inline-flex min-w-[132px] items-center justify-center rounded-full px-5 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(15,23,42,0.12)] transition hover:scale-[1.01] ${
                  feedbackModal.tone === "error"
                    ? "bg-[#111827] hover:bg-[#1f2937]"
                    : feedbackModal.tone === "success"
                      ? "bg-[linear-gradient(135deg,#118118,#2aa82b)] hover:brightness-105"
                      : "bg-[#4569d6] hover:bg-[#3556bb]"
                }`}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
