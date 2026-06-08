// Friendly aliases over the OpenAPI-generated types in ./api.d.ts.
// Regenerate api.d.ts with `yarn gen:api` whenever the backend schema changes.
import type { components } from "./api";

type S = components["schemas"];

// Resources
export type User = S["User"];
export type Role = S["RoleEnum"]; // "student" | "teacher" | "admin"
export type UserStatus = S["StatusEnum"]; // "active" | "suspended" | "inactive"
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
