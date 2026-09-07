// Central TanStack Query key factory. Keep keys stable so invalidation is reliable.
export const qk = {
  me: ["me"] as const,
  classes: ["classes"] as const,
  class: (id: number) => ["classes", id] as const,
  classAssignments: (id: number) => ["classes", id, "assignments"] as const,
  classStudents: (id: number) => ["classes", id, "students"] as const,
  classLessonPlans: (id: number) => ["classes", id, "lesson-plans"] as const,
  modules: ["modules"] as const,
  module: (id: number) => ["modules", id] as const,
  moduleExercises: (id: number) => ["modules", id, "exercises"] as const,
  exercise: (id: number) => ["exercises", id] as const,
  exerciseSubmissions: (id: number) => ["exercises", id, "submissions"] as const,
  mySubmissions: ["submissions", "me"] as const,
  submissionFeedback: (id: number) => ["submissions", id, "feedback"] as const,
  mistakeExplanation: (id: number) => ["submissions", id, "ai-explain"] as const,
  myProgress: ["progress", "me"] as const,
  dashboard: ["dashboard"] as const,
  submissionsInbox: (f?: { status?: string; class_id?: number; exercise_id?: number }) =>
    ["submissions", "inbox", f ?? {}] as const,
  studyMaterials: ["study-materials"] as const,
  studyMaterial: (id: number) => ["study-materials", id] as const,
  // Mock tests
  mockTestFormats: ["mock-tests", "formats"] as const,
  mockTestTemplates: ["mock-tests", "templates"] as const,
  mockTestTemplate: (id: number) => ["mock-tests", "templates", id] as const,
  myTestAttempts: ["mock-tests", "attempts", "me"] as const,
  testAttempt: (id: number) => ["mock-tests", "attempts", id] as const,
  testAttemptReport: (id: number) => ["mock-tests", "attempts", id, "report"] as const,
  // Rubrics (feature 02)
  rubrics: ["rubrics"] as const,
  rubric: (id: number) => ["rubrics", id] as const,
  exerciseRubric: (exerciseId: number) => ["exercises", exerciseId, "rubric"] as const,
  // Writing annotations (feature 03)
  submissionAnnotations: (id: number) => ["submissions", id, "annotations"] as const,
  // Pronunciation practice (feature 04)
  pronunciationDrills: (f?: { drill_type?: string; difficulty?: string; module_id?: number }) =>
    ["pronunciation", "drills", f ?? {}] as const,
  pronunciationDrill: (id: number) => ["pronunciation", "drills", id] as const,
  drillAttempts: (drillId: number) => ["pronunciation", "drills", drillId, "attempts"] as const,
  myPronunciationAttempts: (f?: { drill_id?: number }) =>
    ["pronunciation", "attempts", "me", f ?? {}] as const,
};
