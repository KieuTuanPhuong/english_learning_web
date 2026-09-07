// Friendly aliases over the OpenAPI-generated types in ./api.d.ts.
// Regenerate api.d.ts with `yarn gen:api` whenever the backend schema changes.
import type { components } from "./api";

type S = components["schemas"];

// Resources
export type User = S["User"];
export type Role = S["UserRoleEnum"]; // "student" | "teacher" | "admin"
export type UserStatus = S["Status36eEnum"]; // "active" | "suspended" | "inactive"
export type Class = S["Class"];
export type ClassStudent = S["ClassStudent"];
// Widened with band/topic (feature 06) until `yarn gen:api` regenerates —
// then replace with the plain S[...] aliases (expect BandEnum/TopicEnum).
export type LearningModule = S["LearningModule"] & {
  band?: BandLevel | null;
  topic?: Topic | null;
};
export type Exercise = S["Exercise"] & {
  band?: BandLevel | null;
  topic?: Topic | null;
};
export type Question = S["Question"];
export type QuestionOption = S["QuestionOption"];
export type Submission = S["Submission"];
// Feedback is widened with rubric fields (see PROVISIONAL block below) until
// `yarn gen:api` regenerates them from the backend schema.
export type Feedback = S["Feedback"] & {
  criterion_scores?: CriterionScore[];
  rubric_template_id?: number | null;
  rubric_overall?: string | null;
};
export type Progress = S["Progress"];
export type LessonPlan = S["LessonPlan"];
export type Assignment = S["Assignment"];
export type SkillType = S["SkillTypeEnum"]; // writing|speaking|reading|listening|quiz
export type DifficultyLevel = S["DifficultyLevelEnum"]; // beginner|intermediate|advanced

// Request bodies
export type RegisterRequest = S["RegisterRequest"];
export type LoginRequest = S["LoginRequest"];
export type SubmissionRequest = S["SubmissionRequest"];
// `criterion_scores` is in the generated schema now, so the old local widening
// is gone — it was fighting the generator over `score`, which crosses the wire
// as a string (DRF COERCE_DECIMAL_TO_STRING), not a number.
export type FeedbackRequest = S["FeedbackRequest"];
export type ClassRequest = S["ClassRequest"];
// Widened with band/topic (feature 06) — see LearningModule/Exercise above.
export type LearningModuleRequest = S["LearningModuleRequest"] & {
  band?: BandLevel | null;
  topic?: Topic | null;
};
export type ExerciseRequest = S["ExerciseRequest"] & {
  band?: BandLevel | null;
  topic?: Topic | null;
};
export type LessonPlanRequest = S["LessonPlanRequest"];
export type AssignmentRequest = S["AssignmentRequest"];
export type EnrollRequest = S["EnrollRequest"];
export type ProgressUpsertRequest = S["ProgressUpsertRequest"];
export type UserUpdateRequest = S["UserUpdateRequest"];

// --- ILLMS upgrade ---
export type SubmissionStatus = S["StatusD4fEnum"]; // "pending" | "graded" | "ai_graded"
export type StudyMaterial = S["StudyMaterial"];
export type StudyMaterialRequest = S["StudyMaterialRequest"];
export type SubmissionInbox = S["SubmissionInbox"];
export type AiPracticeRequest = S["AiPracticeRequest"];

// --- Mock tests (docs/research/01-mock-tests-frontend.md) ---
export type TestFormat = S["TestFormat"];
export type MockTestTemplate = S["MockTestTemplate"];
export type MockTestTemplateRequest = S["MockTestTemplateRequest"];
export type TestSection = S["TestSection"];
export type TestSectionExercise = S["TestSectionExercise"];
export type TestAttempt = S["TestAttempt"];
export type TestAttemptListItem = S["TestAttemptList"];
// "exam" = sections in the template's order; "practice" = start with any one.
export type AttemptMode = S["ModeEnum"];
export type SectionAttempt = S["SectionAttempt"];
export type TestAttemptReport = S["TestAttemptReport"];
export type SectionScore = S["SectionScore"];
export type SectionSkill = S["SkillEnum"]; // listening|reading|writing|speaking
export type AttemptStatus = S["AttemptStatusEnum"]; // in_progress|completed|abandoned
export type SectionStatus = S["SectionStatusEnum"]; // not_started|in_progress|completed
// The runner's answer-blind payload: no `is_correct`, `[[answer]]` masked to `[[]]`.
export type TestRunnerExercise = S["TestRunnerExercise"];
export type TestRunnerQuestion = S["TestRunnerQuestion"];
export type SectionDraftRequest = S["SectionDraftRequest"];
export type SectionSubmitRequest = S["SectionSubmitRequest"];

export type DashboardEnvelope = { role: Role; generated_at: string; data: unknown };
export type StudentDashboard = {
  due_assignments: Assignment[];
  in_progress_modules: Progress[];
  recent_feedback: Feedback[];
};
export type TeacherDashboard = {
  class_count: number;
  enrolled_student_count: number;
  ungraded_submission_count: number;
  classes: Class[];
  recent_ungraded: Submission[];
};

// ===========================================================================
// PROVISIONAL types — features 02 (rubrics), 03 (annotations), 04 (pronunciation)
// ---------------------------------------------------------------------------
// These backends are not yet in `/api/schema/`, so `yarn gen:api` cannot emit
// them and the shapes below are hand-authored from the backend research docs
// (english-learning-api/docs/research/02..04). When each backend lands and
// `yarn gen:api` runs, REPLACE each block with `S["..."]` aliases (verify the
// generated names — enums often come out as `CategoryEnum`, decimals as string)
// and delete the hand-written interfaces. Nothing else in the app should need
// to change: the field names here match the documented serializers exactly.
// ===========================================================================

// --- AI coaching (backend core/ai/assist.py): teacher-feedback review and
// student mistake explanation. Shapes mirror FeedbackReviewSerializer /
// AiInsightSerializer; replace with S["..."] after `yarn gen:api`.
export type AiReviewArea =
  | "specificity"
  | "tone"
  | "actionability"
  | "accuracy"
  | "coverage"
  | "score_alignment"
  | "language_level";

export interface AiRecommendation {
  area: AiReviewArea;
  issue: string;
  suggestion: string;
}

export interface FeedbackReview {
  summary: string;
  rating: number; // 1-5
  strengths: string[];
  recommendations: AiRecommendation[];
  score_alignment: string;
  suggested_comment: string;
  engine: string; // "mock" | "gemini:<model>"
}

export interface FeedbackReviewRequest {
  score?: string | null;
  comments?: string;
  criterion_scores?: { criterion_id: number; score: string; note?: string }[];
}

export type AiMistakeCategory =
  | "grammar"
  | "vocabulary"
  | "spelling"
  | "punctuation"
  | "coherence"
  | "task_response"
  | "comprehension"
  | "inference"
  | "detail"
  | "other";

export interface AiMistake {
  location: string;
  student_answer: string;
  correction: string;
  category: AiMistakeCategory;
  explanation: string;
  tip: string;
}

export interface MistakeExplanation {
  summary: string;
  mistakes: AiMistake[];
  strengths: string[];
  practice_suggestions: string[];
  engine: string;
}

export interface AiInsight {
  id: number;
  submission_id: number;
  kind: "mistake_explanation" | "feedback_review";
  payload: MistakeExplanation;
  engine: string;
  created_at: string;
}

// --- Feature 02: Scoring rubrics (backend doc 02 §4.1/§4.3) ---
export type RubricAggregation =
  | "mean_down_half"
  | "mean_nearest_half"
  | "mean"
  | "sum";

export interface RubricBandDescriptor {
  id: number;
  band_value: string; // DRF Decimal -> string, e.g. "6.5"
  label: string; // "Band 7" / "Level 8 (190–200)" / "C1"
  descriptor: string;
}

export interface RubricCriterion {
  id: number;
  name: string;
  code: string; // stable analytics key, e.g. "grammatical_range"
  description?: string | null;
  weight: string; // Decimal -> string (all seeds "1")
  order: number;
  band_descriptors: RubricBandDescriptor[];
}

export interface RubricTemplate {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  exercise_type: string; // writing | speaking
  is_default_for_type: boolean;
  scale_min: string; // Decimal -> string
  scale_max: string;
  score_step: string;
  aggregation: RubricAggregation;
  is_active: boolean;
  created_by?: number | null;
  created_at: string;
  criteria: RubricCriterion[];
}

// Read side (embedded on Feedback rows).
export interface CriterionScore {
  id: number;
  criterion_id: number;
  score: string; // Decimal -> string on the wire
  note?: string | null;
}

// Write side (posted inside FeedbackRequest.criterion_scores). Generated, so
// `score` is a decimal-as-string — the shape the API actually accepts.
export type CriterionScoreInput = S["CriterionScoreRequest"];

// --- Feature 03: Writing annotations (backend doc 03 §4.1/§4.3) ---
export type AnnotationCategory =
  | "grammar"
  | "vocabulary"
  | "spelling"
  | "coherence"
  | "task_response"
  | "praise"
  | "other";

export interface WritingAnnotation {
  id: number;
  submission_id: number;
  author_id: number | null;
  start_offset: number; // Unicode code points, inclusive
  end_offset: number; // exclusive
  quoted_text: string;
  category: AnnotationCategory;
  comment: string;
  suggested_correction?: string | null;
  is_acknowledged: boolean;
  created_at: string;
  updated_at: string;
}

export interface WritingAnnotationRequest {
  submission_id: number;
  start_offset: number;
  end_offset: number;
  quoted_text: string;
  category: AnnotationCategory;
  comment: string;
  suggested_correction?: string | null;
}

// --- Feature 04: Pronunciation practice (backend doc 04 §4.1/§4.3) ---
export type DrillType = "word" | "sentence" | "minimal_pair";
export type PronunciationErrorType =
  | "None"
  | "Omission"
  | "Insertion"
  | "Mispronunciation";
export type Strictness = "lenient" | "standard" | "strict";

export interface PronunciationDrill {
  id: number;
  target_text: string;
  contrast_text?: string | null;
  phoneme_hint?: string | null;
  drill_type: DrillType;
  difficulty_level?: DifficultyLevel | null;
  module_id?: number | null;
  created_by?: number | null;
  created_at: string;
}

export interface PronunciationDrillRequest {
  target_text: string;
  contrast_text?: string | null;
  phoneme_hint?: string | null;
  drill_type: DrillType;
  difficulty_level?: DifficultyLevel | null;
  module_id?: number | null;
}

export interface PronunciationAttempt {
  id: number;
  drill_id: number;
  student_id?: number;
  audio_url: string | null;
  overall_score: string | null; // Decimal -> string
  accuracy_score: string | null;
  fluency_score: string | null;
  completeness_score: string | null;
  prosody_score: string | null; // en-US only; often null
  word_results: unknown; // JSONField — zod-validated in lib/pronunciation.ts
  strictness?: Strictness;
  engine?: string;
  created_at: string;
}

// --- Feature 06: catalog grading — band ranges + topics (backend core.models) ---
export type BandLevel =
  | "band_4_5"
  | "band_5_6"
  | "band_6_7"
  | "band_7_8"
  | "band_8_9";

export type Topic =
  | "life"
  | "sports"
  | "education"
  | "work"
  | "travel"
  | "environment"
  | "technology"
  | "health"
  | "culture";

export const BAND_LEVELS: BandLevel[] = [
  "band_4_5",
  "band_5_6",
  "band_6_7",
  "band_7_8",
  "band_8_9",
];

// Catalog row from GET /api/exercises/ — deliberately without `questions`, so
// an answer key never reaches a browse list (backend ExerciseListSerializer).
export interface ExerciseListItem {
  id: number;
  module_id: number | null;
  module_title: string | null;
  title: string;
  exercise_type: SkillType;
  band: BandLevel | null;
  topic: Topic | null;
  question_count: number;
  created_at: string;
}

// GET /api/exercises/facets/ — how many exercises sit behind each choice.
// Each dimension ignores its own filter, so counts show what switching gives.
export interface ExerciseFacets {
  total: number;
  bands: Partial<Record<BandLevel, number>>;
  topics: Partial<Record<Topic, number>>;
  types: Partial<Record<SkillType, number>>;
}

export interface ExerciseCatalogFilters {
  band?: BandLevel;
  topic?: Topic;
  type?: SkillType;
  module_id?: number;
  q?: string;
}

export const TOPICS: Topic[] = [
  "life",
  "sports",
  "education",
  "work",
  "travel",
  "environment",
  "technology",
  "health",
  "culture",
];

// --- Feature 05: P2P meetings (WebRTC) — backend core.views.MeetingViewSet ---
export type MeetingStatus = "scheduled" | "active" | "ended";

export interface Meeting {
  id: number;
  class_id: number;
  class_name: string;
  title: string;
  status: MeetingStatus;
  // Teacher's booking; null for start-now rooms.
  scheduled_at: string | null;
  // Stamped when the first peer joins — the live timer's origin.
  started_at: string | null;
  // Live elapsed seconds while running, final length once ended, null before
  // anyone joins. Server-computed so both peers agree.
  duration_seconds: number | null;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  ended_at: string | null;
}

export interface MeetingRequest {
  class_id: number;
  title: string;
  // Omit (or null) to open the room immediately.
  scheduled_at?: string | null;
}

