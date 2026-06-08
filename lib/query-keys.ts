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
  myProgress: ["progress", "me"] as const,
};
