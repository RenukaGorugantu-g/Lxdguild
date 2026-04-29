export const TARGET_ROLE_TO_BUCKET_MAP = {
  "Junior ID": "Beginner",
  "L&D Coordinator": "Beginner",
  "Training Assistant": "Beginner",
  "Instructional Designer": "Intermediate",
  "eLearning Developer": "Intermediate",
  "Curriculum Developer": "Intermediate",
  "Senior ID": "Senior",
  "LX Designer": "Senior",
  "L&D Manager": "Senior",
  "Learning Strategist": "Senior",
  CLO: "Leader",
  "Head of L&D": "Leader",
  "Director of Talent Development": "Leader",
} as const;

export const TARGET_ROLE_OPTIONS = Object.keys(TARGET_ROLE_TO_BUCKET_MAP) as Array<
  keyof typeof TARGET_ROLE_TO_BUCKET_MAP
>;

export const DESIGNATION_BUCKETS = ["Beginner", "Intermediate", "Senior", "Leader"] as const;
export const QUESTION_SET_ORDER = ["set1", "set2", "set3", "set4"] as const;
export const QUESTION_SET_WEIGHTS: Record<(typeof QUESTION_SET_ORDER)[number], number> = {
  set1: 25,
  set2: 25,
  set3: 25,
  set4: 25,
};
export const DEFAULT_TOTAL_QUESTIONS = 20;
export const PASS_THRESHOLD = 60;
export const COURSE_PROFICIENCY_THRESHOLD = 80;

export type TargetRole = keyof typeof TARGET_ROLE_TO_BUCKET_MAP;
export type DesignationBucket = (typeof DESIGNATION_BUCKETS)[number];
export type QuestionSetKey = (typeof QUESTION_SET_ORDER)[number];
export type AssessmentTier = "proficient" | "needs_development";
export type CoursePriority = "recommended" | "suggested" | "optional";

type AssessmentProfile = {
  candidate_target_role?: string | null;
  candidate_designation?: string | null;
  designation_level?: string | null;
};

type AssessmentQuestion = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  skill_tag?: string | null;
  section_name?: string | null;
  question_set?: string | null;
  designation_bucket?: string | null;
  set_weight?: number | null;
  designation_level?: string | null;
};

const BUCKET_TO_LEGACY_LEVEL: Record<DesignationBucket, string> = {
  Beginner: "Level 1",
  Intermediate: "Level 2",
  Senior: "Level 4",
  Leader: "Level 5",
};

const BUCKET_TO_SET_LABEL: Record<DesignationBucket, string> = {
  Beginner: "Set 1 - Beginner ID",
  Intermediate: "Set 2 - Intermediate ID",
  Senior: "Set 3 - Senior ID / LXD",
  Leader: "Set 4 - L&D Leader",
};

const BUCKET_TO_SET_KEY: Record<DesignationBucket, QuestionSetKey> = {
  Beginner: "set1",
  Intermediate: "set2",
  Senior: "set3",
  Leader: "set4",
};

export const COURSE_CATALOG = {
  C1: {
    code: "C1",
    title: "Mastering AI in Instructional Design",
    description: "Use AI for content creation, personalization, evaluation, and future-ready instructional design workflows.",
    externalLink: "https://lxdguildacademy.com/mastering-ai-in-instructional-design/",
  },
  C2: {
    code: "C2",
    title: "Certified Learning Experience Designer (CLXD)",
    description: "A structured boot camp to strengthen learning experience design capability with projects, practice, and certification.",
    externalLink: "https://lxdguildacademy.com/certified-learning-experience-designerclxd/",
  },
  C3: {
    code: "C3",
    title: "Mastering Instructional Design Authoring Tools",
    description: "Hands-on mastery of Storyline 360, Vyond, Camtasia, and Synthesia for modern digital learning production.",
    externalLink: "https://lxdguildacademy.com/id-authoring-tools/",
  },
  C4: {
    code: "C4",
    title: "CLXD Capstone",
    description: "Apply learning experience design skills in a real-world capstone project with portfolio-ready output.",
    externalLink: "https://lxdguildacademy.com/capstone/",
  },
} as const;

export const COURSE_RECOMMENDATION_MATRIX: Record<
  DesignationBucket,
  Record<AssessmentTier, { rationale: string; courses: Array<{ code: keyof typeof COURSE_CATALOG; priority: CoursePriority }> }>
> = {
  Beginner: {
    proficient: {
      rationale:
        "Strong applied foundations. LXD Boot Camp formalizes design thinking; AI in ID builds a future-ready skill set early in career.",
      courses: [
        { code: "C1", priority: "recommended" },
        { code: "C2", priority: "recommended" },
        { code: "C3", priority: "optional" },
      ],
    },
    needs_development: {
      rationale:
        "Core gaps in applied ID thinking. Authoring Tools helps with production skills; LXD Boot Camp strengthens methodology and real-world ID practice.",
      courses: [
        { code: "C1", priority: "optional" },
        { code: "C2", priority: "recommended" },
        { code: "C3", priority: "recommended" },
      ],
    },
  },
  Intermediate: {
    proficient: {
      rationale:
        "Ready for advanced work. CLXD Capstone helps apply expertise in a real project; AI in ID supports modern tool integration.",
      courses: [
        { code: "C1", priority: "recommended" },
        { code: "C4", priority: "recommended" },
      ],
    },
    needs_development: {
      rationale:
        "Gaps in applied LXD strategy or design judgment. Boot Camp rebuilds design thinking; Authoring Tools helps execution.",
      courses: [
        { code: "C1", priority: "optional" },
        { code: "C2", priority: "recommended" },
        { code: "C3", priority: "suggested" },
      ],
    },
  },
  Senior: {
    proficient: {
      rationale:
        "Strong strategic performance. AI in ID supports organizational differentiation; CLXD Capstone demonstrates senior mastery in a complex scenario.",
      courses: [
        { code: "C1", priority: "recommended" },
        { code: "C4", priority: "recommended" },
      ],
    },
    needs_development: {
      rationale:
        "Strategic and consulting gaps identified. LXD Boot Camp helps reframe advanced design approaches; AI in ID builds emerging capability.",
      courses: [
        { code: "C1", priority: "recommended" },
        { code: "C2", priority: "recommended" },
      ],
    },
  },
  Leader: {
    proficient: {
      rationale:
        "Strong organizational learning leadership. AI in ID is the highest-leverage investment to operationalize an AI agenda at scale.",
      courses: [
        { code: "C1", priority: "recommended" },
        { code: "C4", priority: "suggested" },
      ],
    },
    needs_development: {
      rationale:
        "Gaps in strategic L&D thinking. AI in ID supports modern leadership direction; LXD Boot Camp reconnects leaders with evidence-based design practice.",
      courses: [
        { code: "C1", priority: "recommended" },
        { code: "C2", priority: "recommended" },
        { code: "C4", priority: "optional" },
      ],
    },
  },
};

export function getBucketForTargetRole(targetRole?: string | null): DesignationBucket {
  const bucket = targetRole ? TARGET_ROLE_TO_BUCKET_MAP[targetRole as TargetRole] : null;
  return bucket || "Intermediate";
}

export function getLegacyDesignationLevel(bucket?: string | null) {
  return BUCKET_TO_LEGACY_LEVEL[(bucket as DesignationBucket) || "Intermediate"] || "Level 2";
}

export function getAssessmentSetLabel(bucket?: string | null) {
  return BUCKET_TO_SET_LABEL[(bucket as DesignationBucket) || "Intermediate"] || BUCKET_TO_SET_LABEL.Intermediate;
}

export function getAssessmentSetKey(bucket?: string | null): QuestionSetKey {
  return BUCKET_TO_SET_KEY[(bucket as DesignationBucket) || "Intermediate"] || "set2";
}

export function getRequiredScoreForBucket() {
  return PASS_THRESHOLD;
}

export function getCourseAssessmentTier(score: number): AssessmentTier {
  return score >= COURSE_PROFICIENCY_THRESHOLD ? "proficient" : "needs_development";
}

export function getCourseRecommendations(bucket?: string | null, score = 0) {
  const resolvedBucket = ((bucket as DesignationBucket) || "Intermediate");
  const tier = getCourseAssessmentTier(score);
  const plan = COURSE_RECOMMENDATION_MATRIX[resolvedBucket][tier];
  return {
    bucket: resolvedBucket,
    tier,
    setLabel: getAssessmentSetLabel(resolvedBucket),
    rationale: plan.rationale,
    courses: plan.courses.map((course) => ({
      ...COURSE_CATALOG[course.code],
      priority: course.priority,
    })),
  };
}

export function resolveAssessmentBucket(profile: AssessmentProfile | null | undefined) {
  const targetRole = profile?.candidate_target_role || "Instructional Designer";
  const designationBucket =
    (profile?.candidate_designation as DesignationBucket | null) ||
    getBucketForTargetRole(targetRole) ||
    (profile?.designation_level === "Level 1"
      ? "Beginner"
      : profile?.designation_level === "Level 2" || profile?.designation_level === "Level 3"
        ? "Intermediate"
        : profile?.designation_level === "Level 4"
          ? "Senior"
          : "Leader");

  return {
    targetRole,
    designationBucket,
  };
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function calculateQuestionCounts(totalQuestions: number) {
  const counts = QUESTION_SET_ORDER.reduce(
    (acc, setKey) => {
      acc[setKey] = Math.floor((totalQuestions * QUESTION_SET_WEIGHTS[setKey]) / 100);
      return acc;
    },
    {} as Record<QuestionSetKey, number>
  );

  let assigned = Object.values(counts).reduce((sum, count) => sum + count, 0);
  let index = 0;
  while (assigned < totalQuestions) {
    const setKey = QUESTION_SET_ORDER[index % QUESTION_SET_ORDER.length];
    counts[setKey] += 1;
    assigned += 1;
    index += 1;
  }

  return counts;
}

export function buildWeightedAssessment(
  questions: AssessmentQuestion[],
  totalQuestions = DEFAULT_TOTAL_QUESTIONS
) {
  const grouped = new Map<QuestionSetKey, AssessmentQuestion[]>();
  for (const setKey of QUESTION_SET_ORDER) grouped.set(setKey, []);

  for (const question of questions) {
    const setKey = (question.question_set?.toLowerCase() as QuestionSetKey | undefined) || "set1";
    const bucket = grouped.get(setKey) || [];
    bucket.push(question);
    grouped.set(setKey, bucket);
  }

  const counts = calculateQuestionCounts(totalQuestions);
  const selected: AssessmentQuestion[] = [];
  const leftovers: AssessmentQuestion[] = [];

  for (const setKey of QUESTION_SET_ORDER) {
    const randomized = shuffle(grouped.get(setKey) || []);
    const needed = counts[setKey];
    selected.push(...randomized.slice(0, needed));
    leftovers.push(...randomized.slice(needed));
  }

  if (selected.length < totalQuestions) {
    const selectedIds = new Set(selected.map((item) => item.id));
    const fillerPool = shuffle(
      questions.filter((question) => !selectedIds.has(question.id))
    );
    selected.push(...fillerPool.slice(0, totalQuestions - selected.length));
  }

  const deduped = selected.filter(
    (question, index, array) => array.findIndex((item) => item.id === question.id) === index
  );

  return shuffle(deduped.slice(0, Math.min(totalQuestions, deduped.length)));
}

export function buildRoleMatchedAssessment(
  questions: AssessmentQuestion[],
  bucket?: string | null,
  totalQuestions = DEFAULT_TOTAL_QUESTIONS
) {
  const targetSet = getAssessmentSetKey(bucket);
  const matchedQuestions = questions.filter((question) => {
    const setKey = (question.question_set?.toLowerCase() as QuestionSetKey | undefined) || "set1";
    return setKey === targetSet;
  });

  const source = matchedQuestions.length > 0 ? matchedQuestions : questions;
  return shuffle(source).slice(0, Math.min(totalQuestions, source.length));
}

export function getRecommendationType(score: number) {
  return score < PASS_THRESHOLD ? "improvement" : "next_level";
}
