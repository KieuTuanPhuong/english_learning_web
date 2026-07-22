import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as api from "./api";
import { qk } from "./query-keys";
import { openSocket } from "./ws";
import type {
  AssignmentRequest,
  ClassRequest,
  ExerciseRequest,
  FeedbackRequest,
  LearningModuleRequest,
  LessonPlanRequest,
  SubmissionRequest,
  StudyMaterialRequest,
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

// Dashboard & Submissions Inbox
export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: api.getDashboard });
}

export function useSubmissionsInbox(filters?: {
  status?: string;
  class_id?: number;
  exercise_id?: number;
}) {
  return useQuery({
    queryKey: qk.submissionsInbox(filters),
    queryFn: () => api.listSubmissionsInbox(filters),
  });
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

// ---- Study Materials ----
export function useStudyMaterials() {
  return useQuery({ queryKey: qk.studyMaterials, queryFn: api.listStudyMaterials });
}
export function useStudyMaterial(id: number) {
  return useQuery({
    queryKey: qk.studyMaterial(id),
    queryFn: () => api.getStudyMaterial(id),
    enabled: Number.isFinite(id),
  });
}
export function useCreateStudyMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createStudyMaterial,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.studyMaterials }),
  });
}
export function useUpdateStudyMaterial(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: Partial<StudyMaterialRequest>) => api.updateStudyMaterial(id, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.studyMaterials });
      qc.invalidateQueries({ queryKey: qk.studyMaterial(id) });
    },
  });
}
export function useDeleteStudyMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteStudyMaterial(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.studyMaterials }),
  });
}

// ---- AI Tools ----
export function useAiPractice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.aiPractice,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.mySubmissions }),
  });
}
export function useAiEvaluate(submissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.aiEvaluateSubmission(submissionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.submissionFeedback(submissionId) });
      qc.invalidateQueries({ queryKey: qk.submissionsInbox() });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

// ---- Realtime WebSockets ----
export function useRealtimeNotifications() {
  const qc = useQueryClient();
  useEffect(() => {
    const ws = openSocket("/ws/notifications/", (msg) => {
      const m = msg as { event?: string };
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.submissionsInbox() });
      if (m.event === "assignment_created") qc.invalidateQueries({ queryKey: qk.classes });
      if (m.event === "feedback_posted") qc.invalidateQueries({ queryKey: qk.mySubmissions });
    });
    return () => ws.close();
  }, [qc]);
}
