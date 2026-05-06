# ATS Resume Scoring Module

This module is fully isolated and does not touch the current application routes, UI, or database.

## Folder Structure

```text
ats-module/
  api/
    index.ts
    score-candidate.ts
    score-candidate-upload.ts
  parser/
    docx.ts
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
4. Returns strict JSON:

```json
{
  "score": 82,
  "skillMatch": 90,
  "experienceMatch": 75,
  "keywordMatch": 70,
  "missingSkills": ["scorm"],
  "strengths": ["Matched required skills: instructional design, storyboarding."]
}
```

## Scoring Formula

```text
Score =
(0.5 * Skill Match) +
(0.3 * Experience Match) +
(0.2 * Keyword Relevance)
```

## Available API Handlers

These are isolated handlers only. They are not mounted to your app.

- `postScoreCandidate(request)`
  - expects JSON body
- `postScoreCandidateUpload(request)`
  - expects `multipart/form-data`
  - fields:
    - `job`: JSON string
    - `resume`: file

## Manual Integration Later

### Future route example

Create a route later, for example `src/app/api/ats/score-candidate/route.ts`:

```ts
import { postScoreCandidateUpload } from "../../../../../ats-module";

export async function POST(request: Request) {
  return postScoreCandidateUpload(request);
}
```

### Example multipart request

Use a future client or backend to send:

- `job`

```json
{
  "title": "Senior Instructional Designer",
  "description": "Need instructional design, storyboarding, articulate 360, and learning strategy experience.",
  "requiredSkills": ["instructional design", "storyboarding", "articulate 360"],
  "preferredSkills": ["learning strategy", "analytics"],
  "minimumYearsOfExperience": 5,
  "keywords": ["leadership development", "enterprise learning"]
}
```

- `resume`
  - PDF file
  - DOCX file

## Important Note About DOCX

This repo already includes a working PDF parser through `pdfjs-dist`, so PDF parsing works in this module.

DOCX parsing is scaffolded through `parser/docx.ts`, but it intentionally throws until you later install and wire a DOCX parser adapter such as `mammoth`. This keeps the current repo untouched and avoids modifying existing dependency files.
