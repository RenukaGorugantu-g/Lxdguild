# ATS Resume Scoring

The scoring module parses PDF, DOCX, and TXT resumes, extracts resume and job signals, and returns an explainable match breakdown. The application uses the same scoring pipeline when candidates apply and when they analyze a saved resume against a target job.

## Folder Structure

```text
ats-module/
  api/
    index.ts
    score-candidate.ts
    score-candidate-upload.ts
  parser/
    docx.ts
    extract-job-input.ts
    extract-signals.ts
    parse-resume-file.ts
    pdf.ts
  scoring/
    matchers.ts
    score-candidate.ts
  types/
    index.ts
  utils/
    constants.ts
    text.ts
  index.ts
  README.md
```

## What It Does

1. Parses resume text or files
2. Extracts:
   - skills
   - years of experience
   - likely roles
   - keywords
3. Scores candidate against a job description
4. Returns an explainable score and matched/missing skills and keywords:

```json
{
  "score": 82,
  "skillMatch": 90,
  "experienceMatch": 75,
  "keywordMatch": 70,
  "roleAlignment": 80,
  "matchedSkills": ["instructional design", "storyboarding"],
  "missingSkills": ["scorm"],
  "matchedKeywords": ["storyboarding", "learner outcomes"],
  "missingKeywords": ["scorm"]
}
```

## Scoring Formula

```text
Score = weighted average of the available job-specific signals:
- Skills: 40% when the job description contains recognized skill requirements
- Experience: 20% when an experience requirement is detected (10% neutral weight otherwise)
- Keywords: 30%
- Role alignment: 20%
```

Weights are normalized to the sum of the signals that apply. This prevents a missing job requirement from being treated as a perfect match. Scores are estimates for candidate guidance, not a guarantee of how another employer's ATS will rank a resume.

## Application Routes

- `POST /api/resume-score` analyzes a candidate-owned saved resume against `resumeId`, `jobTitle`, and `jobDescription`.
- `POST /api/notifications/job-application` uses the same `buildJobInput` and scoring engine during application processing.
- `POST /api/resumes/optimize` accepts an optional `jobDescription` so improvement suggestions can prioritize a target role without inventing candidate experience.

The saved-resume route requires an authenticated user and verifies that the resume belongs to that user. Job descriptions are limited to 30,000 characters. Parsing supports PDF, DOCX, and TXT through the existing `pdfjs-dist` and `mammoth` dependencies.
