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
export type LearningModule = S["LearningModule"];
export type Exercise = S["Exercise"];
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
export type LearningModuleRequest = S["LearningModuleRequest"];
export type ExerciseRequest = S["ExerciseRequest"];
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

