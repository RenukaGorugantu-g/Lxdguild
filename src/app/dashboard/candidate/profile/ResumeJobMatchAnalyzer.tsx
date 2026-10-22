"use client";

import { useState } from "react";
import { BarChart3, Loader2, Sparkles } from "lucide-react";

type AtsResult = {
  score: number;
  skillMatch: number;
  experienceMatch: number;
  keywordMatch: number;
  roleAlignment: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
};

type OptimizationResult = {
  source: "ai" | "template";
  summary: string;
  skillsSection: string[];
  bulletPoints: string[];
  atsFormattingTips: string[];
};

export default function ResumeJobMatchAnalyzer({
  resumeId,
  resumeName,
}: {
  resumeId: string;
  resumeName: string;
}) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<AtsResult | null>(null);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState<"analyze" | "improve" | null>(null);

  async function submit(action: "analyze" | "improve") {
    setError("");
    setBusyAction(action);

    try {
      const response = await fetch(
        action === "analyze" ? "/api/resume-score" : "/api/resumes/optimize",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeId,
            jobTitle: jobTitle.trim(),
            jobDescription: jobDescription.trim(),
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Resume analysis failed.");

      if (action === "analyze") {
        setAnalysis(result as AtsResult);
      } else {
        setOptimization(result as OptimizationResult);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Resume analysis failed.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[#dce8d6] bg-[#f8fcf5] p-4">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
          <BarChart3 className="h-4 w-4 text-[#138d1a]" />
          Match {resumeName} to a job
        </div>
        <p className="mt-1 text-xs leading-5 text-[#667085]">
          Your score is calculated from this resume and the target job description, not a general resume-readiness score.
        </p>
      </div>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-[#425243]">Target job title</span>
        <input
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
          maxLength={160}
          placeholder="e.g. Senior Instructional Designer"
          className="w-full rounded-xl border border-[#dbe4d5] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:ring-2 focus:ring-[#8fd97e]"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-[#425243]">Job description</span>
        <textarea
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          maxLength={30000}
          rows={5}
          placeholder="Paste the complete job description, including required skills and experience."
          className="w-full resize-y rounded-xl border border-[#dbe4d5] bg-white px-3 py-2.5 text-sm leading-6 text-[#111827] outline-none focus:ring-2 focus:ring-[#8fd97e]"
        />
        <span className="block text-right text-[11px] text-[#7a8a74]">
          {jobDescription.length.toLocaleString("en-US")} / 30,000
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submit("analyze")}
          disabled={busyAction !== null || jobDescription.trim().length < 40}
          className="inline-flex items-center gap-2 rounded-full bg-[#138d1a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b7f14] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyAction === "analyze" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
          Calculate ATS match
        </button>
        <button
          type="button"
          onClick={() => submit("improve")}
          disabled={busyAction !== null || jobDescription.trim().length < 40}
          className="inline-flex items-center gap-2 rounded-full border border-[#cfe0c7] bg-white px-4 py-2.5 text-sm font-semibold text-[#2c3d29] transition hover:bg-[#f1f8ed] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyAction === "improve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Tailor resume to job
        </button>
      </div>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}

      {analysis ? (
        <div className="space-y-4 rounded-xl border border-[#dce8d6] bg-white p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6d7d68]">Job-specific ATS match</p>
              <p className="mt-1 text-3xl font-bold text-[#138d1a]">{analysis.score}%</p>
            </div>
            <p className="max-w-md text-xs leading-5 text-[#667085]">
              A keyword-fit estimate for prioritizing edits, not a hiring decision or a guarantee of passing another employer&apos;s ATS.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Skills", analysis.skillMatch],
              ["Experience", analysis.experienceMatch],
              ["Keywords", analysis.keywordMatch],
              ["Role", analysis.roleAlignment],
            ].map(([label, score]) => (
              <div key={label} className="rounded-lg bg-[#f8fcf5] p-3">
                <p className="text-[11px] text-[#6d7d68]">{label}</p>
                <p className="mt-1 text-lg font-semibold text-[#111827]">{score}%</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <KeywordList title="Matched terms" values={[...analysis.matchedSkills, ...analysis.matchedKeywords]} />
            <KeywordList title="Terms to address" values={[...analysis.missingSkills, ...analysis.missingKeywords]} />
          </div>
        </div>
      ) : null}

      {optimization ? (
        <div className="space-y-3 rounded-xl border border-[#dce8d6] bg-white p-4">
          <p className="text-sm font-semibold text-[#111827]">Job-tailored improvement suggestions</p>
          <p className="text-sm leading-6 text-[#5b6757]">{optimization.summary}</p>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6d7d68]">Experience bullet rewrites</p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-[#425243]">
              {optimization.bulletPoints.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
            </ul>
          </div>
          <p className="text-xs text-[#7a8a74]">
            Generated with {optimization.source === "ai" ? "AI" : "the local template engine"}. Verify every suggestion and keep only claims supported by your actual experience.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function KeywordList({ title, values }: { title: string; values: string[] }) {
  const uniqueValues = [...new Set(values)].slice(0, 18);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#6d7d68]">{title}</p>
      {uniqueValues.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {uniqueValues.map((value) => (
            <span key={value} className="rounded-full bg-[#f2f7ef] px-2.5 py-1 text-xs text-[#425243]">{value}</span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-[#7a8a74]">No terms detected for this section.</p>
      )}
    </div>
  );
}
