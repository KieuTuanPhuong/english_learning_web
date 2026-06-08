// TanStack Query hooks. One per resource/action.
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as api from "./api";
import { qk } from "./query-keys";
import type {
  AssignmentRequest,
  Class,
  ClassRequest,
  ExerciseRequest,
  FeedbackRequest,
  LearningModuleRequest,
  LessonPlanRequest,
  Submission,
  SubmissionRequest,
} from "./types";

// Classes
export function useClasses() {
  return useQuery({ queryKey: qk.classes, queryFn: api.listClasses });
}
export function useClass(id: number) {
  return useQuery({
    queryKey: qk.class(id),
    queryFn: () => api.getClass(id),
    enabled: Number.isFinite(id),
  });
}
export function useClassAssignments(id: number) {
  return useQuery({
    queryKey: qk.classAssignments(id),
    queryFn: () => api.listClassAssignments(id),
    enabled: Number.isFinite(id),
  });
}
export function useClassLessonPlans(id: number) {
  return useQuery({
    queryKey: qk.classLessonPlans(id),
    queryFn: () => api.listClassLessonPlans(id),
    enabled: Number.isFinite(id),
  });
}
export function useClassStudents(id: number) {
  return useQuery({
    queryKey: qk.classStudents(id),
    queryFn: () => api.listClassStudents(id),
    enabled: Number.isFinite(id),
  });
}

// Modules & exercises
export function useModules() {
  return useQuery({ queryKey: qk.modules, queryFn: api.listModules });
}
export function useModule(id: number) {
  return useQuery({
    queryKey: qk.module(id),
    queryFn: () => api.getModule(id),
    enabled: Number.isFinite(id),
  });
}
export function useModuleExercises(id: number) {
  return useQuery({
    queryKey: qk.moduleExercises(id),
    queryFn: () => api.listModuleExercises(id),
    enabled: Number.isFinite(id),
  });
}
export function useExercise(id: number) {
  return useQuery({
    queryKey: qk.exercise(id),
    queryFn: () => api.getExercise(id),
    enabled: Number.isFinite(id),
  });
}

// Submissions, feedback, progress
export function useMySubmissions() {
  return useQuery({ queryKey: qk.mySubmissions, queryFn: api.listMySubmissions });
}
export function useSubmissionFeedback(id: number) {
  return useQuery({
    queryKey: qk.submissionFeedback(id),
    queryFn: () => api.listSubmissionFeedback(id),
    enabled: Number.isFinite(id),
  });
}
export function useMyProgress() {
  return useQuery({ queryKey: qk.myProgress, queryFn: api.listMyProgress });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmissionRequest) => api.createSubmission(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.mySubmissions });
    },
  });
}

// Student dashboard "due soon": no aggregate endpoint exists, so fan out
// classes -> per-class assignments and flatten (see plan §9 M2 note).
export function useDueAssignments() {
  const classes = useClasses();
  const classList = classes.data ?? [];
  const assignmentQueries = useQueries({
    queries: classList.map((c) => ({
      queryKey: qk.classAssignments(c.id),
      queryFn: () => api.listClassAssignments(c.id),
      enabled: classes.isSuccess,
    })),
  });
  const isLoading =
    classes.isLoading || assignmentQueries.some((q) => q.isLoading);
  const isError = classes.isError || assignmentQueries.some((q) => q.isError);
  const items = classList.flatMap((c, i) =>
    (assignmentQueries[i]?.data ?? []).map((assignment) => ({
      assignment,
      klass: c,
    })),
  );
  return { items, isLoading, isError };
}

export function useExerciseSubmissions(id: number) {
  return useQuery({
    queryKey: qk.exerciseSubmissions(id),
    queryFn: () => api.listExerciseSubmissions(id),
    enabled: Number.isFinite(id),
  });
}

// ---- Teacher mutations ----------------------------------------------------
export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ClassRequest) => api.createClass(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.classes }),
  });
}
export function useUpdateClass(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ClassRequest>) => api.updateClass(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.classes });
      queryClient.invalidateQueries({ queryKey: qk.class(id) });
    },
  });
}
export function useEnrollStudent(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: number) => api.enrollStudent(classId, studentId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.classStudents(classId) }),
  });
}
export function useRemoveStudent(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: number) => api.removeStudent(classId, studentId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.classStudents(classId) }),
  });
}
export function useCreateAssignment(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignmentRequest) => api.createAssignment(classId, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.classAssignments(classId) }),
  });
}
export function useCreateLessonPlan(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LessonPlanRequest) => api.createLessonPlan(classId, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.classLessonPlans(classId) }),
  });
}
export function useCreateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LearningModuleRequest) => api.createModule(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.modules }),
  });
}
export function useUpdateModule(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<LearningModuleRequest>) =>
      api.updateModule(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.modules });
      queryClient.invalidateQueries({ queryKey: qk.module(id) });
    },
  });
}
export function useDeleteModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteModule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.modules }),
  });
}
export function useCreateExercise(moduleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ExerciseRequest) => api.createExercise(moduleId, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.moduleExercises(moduleId) }),
  });
}
export function useDeleteExercise(moduleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteExercise(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.moduleExercises(moduleId) }),
  });
}
export function useCreateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FeedbackRequest) => api.createFeedback(body),
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({
        queryKey: qk.submissionFeedback(vars.submission_id),
      }),
  });
}

// Teacher grading queue: no aggregate submissions endpoint, so fan out
// classes -> assignments -> unique exercise_ids -> submissions, and resolve
// student names from class rosters (GET /users/ is 403 for teachers).
export type QueueItem = {
  submission: Submission;
  klass: Class;
  studentName?: string;
};

export function useGradingQueue() {
  const classes = useClasses();
  const classList = classes.data ?? [];

  const assignmentQs = useQueries({
    queries: classList.map((c) => ({
      queryKey: qk.classAssignments(c.id),
      queryFn: () => api.listClassAssignments(c.id),
      enabled: classes.isSuccess,
    })),
  });
  const rosterQs = useQueries({
    queries: classList.map((c) => ({
      queryKey: qk.classStudents(c.id),
      queryFn: () => api.listClassStudents(c.id),
      enabled: classes.isSuccess,
    })),
  });

  const studentName = new Map<number, string>();
  rosterQs.forEach((q) =>
    (q.data ?? []).forEach((u) => studentName.set(u.id, u.full_name)),
  );

  const exerciseClass = new Map<number, Class>();
  classList.forEach((c, i) =>
    (assignmentQs[i]?.data ?? []).forEach((a) => {
      if (a.exercise_id != null) exerciseClass.set(a.exercise_id, c);
    }),
  );
  const exerciseIds = Array.from(exerciseClass.keys());

  const submissionQs = useQueries({
    queries: exerciseIds.map((eid) => ({
      queryKey: qk.exerciseSubmissions(eid),
      queryFn: () => api.listExerciseSubmissions(eid),
      enabled: classes.isSuccess,
    })),
  });

  const items: QueueItem[] = exerciseIds.flatMap((eid, i) =>
    (submissionQs[i]?.data ?? []).map((submission) => ({
      submission,
      klass: exerciseClass.get(eid) as Class,
      studentName: studentName.get(submission.student_id),
    })),
  );

  const isLoading =
    classes.isLoading ||
    assignmentQs.some((q) => q.isLoading) ||
    rosterQs.some((q) => q.isLoading) ||
    submissionQs.some((q) => q.isLoading);
  const isError =
    classes.isError ||
    assignmentQs.some((q) => q.isError) ||
    submissionQs.some((q) => q.isError);

  return { items, isLoading, isError };
}

// Graded status for a set of submissions (no bulk feedback endpoint).
export function useFeedbackMap(submissionIds: number[]) {
  const queries = useQueries({
    queries: submissionIds.map((id) => ({
      queryKey: qk.submissionFeedback(id),
      queryFn: () => api.listSubmissionFeedback(id),
      enabled: Number.isFinite(id),
    })),
  });
  const map = new Map<number, { graded: boolean; score: string | null }>();
  submissionIds.forEach((id, i) => {
    const fb = queries[i]?.data ?? [];
    map.set(id, { graded: fb.length > 0, score: fb[fb.length - 1]?.score ?? null });
  });
  return { map, isLoading: queries.some((q) => q.isLoading) };
}
