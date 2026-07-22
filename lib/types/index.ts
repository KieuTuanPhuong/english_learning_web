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
export type Feedback = S["Feedback"];
export type Progress = S["Progress"];
export type LessonPlan = S["LessonPlan"];
export type Assignment = S["Assignment"];
export type SkillType = S["SkillTypeEnum"]; // writing|speaking|reading|listening|quiz
export type DifficultyLevel = S["DifficultyLevelEnum"]; // beginner|intermediate|advanced

// Request bodies
export type RegisterRequest = S["RegisterRequest"];
export type LoginRequest = S["LoginRequest"];
export type SubmissionRequest = S["SubmissionRequest"];
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

