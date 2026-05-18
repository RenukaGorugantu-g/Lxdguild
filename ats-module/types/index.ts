export type ParsedResume = {
  fileName: string;
  mimeType: string;
  text: string;
  skills: string[];
  yearsOfExperience: number;
  roles: string[];
  keywords: string[];
};

export type JobInput = {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  minimumYearsOfExperience?: number;
  keywords?: string[];
};

export type ScoreBreakdown = {
  score: number;
  skillMatch: number;
  experienceMatch: number;
  keywordMatch: number;
  roleAlignment: number;
  missingSkills: string[];
  strengths: string[];
};

export type ScoreCandidateInput = {
  job: JobInput;
  resume: ParsedResume;
};

export type ScoreCandidateJson = {
  score: number;
  skillMatch: number;
  experienceMatch: number;
  keywordMatch: number;
  roleAlignment: number;
  missingSkills: string[];
  strengths: string[];
};

export type ScoreCandidateRequestBody = {
  job: JobInput;
  resumeText?: string;
  resumeFileName?: string;
  resumeMimeType?: string;
};
