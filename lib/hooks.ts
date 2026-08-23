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
  AttemptMode,
  ClassRequest,
  ExerciseRequest,
  FeedbackRequest,
  LearningModuleRequest,
  LessonPlanRequest,
  SubmissionRequest,
  StudyMaterialRequest,
  SectionDraftRequest,
  SectionSubmitRequest,
  WritingAnnotationRequest,
  PronunciationDrillRequest,
  DrillType,
  DifficultyLevel,
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
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: qk.submissionFeedback(vars.submission_id),
      });
      // A rubric grade flips the submission to `graded` — refresh the inbox and
      // dashboard the same way useAiEvaluate does.
      queryClient.invalidateQueries({ queryKey: qk.submissionsInbox() });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
    },
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

// ---- Mock tests ----
export function useMockTestTemplates() {
  return useQuery({
    queryKey: qk.mockTestTemplates,
    queryFn: api.listMockTestTemplates,
  });
}
export function useMockTestTemplate(id: number) {
  return useQuery({
    queryKey: qk.mockTestTemplate(id),
    queryFn: () => api.getMockTestTemplate(id),
    enabled: Number.isFinite(id),
  });
}
export function useMyTestAttempts() {
  return useQuery({
    queryKey: qk.myTestAttempts,
    queryFn: api.listMyTestAttempts,
  });
}
export function useTestAttempt(id: number) {
  return useQuery({
    queryKey: qk.testAttempt(id),
    queryFn: () => api.getTestAttempt(id),
    enabled: Number.isFinite(id),
    // The runner is the only writer of this data; a background refetch
    // mid-section would clobber in-flight answers with a stale draft.
    refetchOnWindowFocus: false,
  });
}
export function useCreateTestAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { templateId: number; mode?: AttemptMode }) =>
      api.createTestAttempt(vars.templateId, vars.mode),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.myTestAttempts }),
  });
}
export function useStartSection(attemptId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sectionAttemptId: number) =>
      api.startSection(attemptId, sectionAttemptId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.testAttempt(attemptId) }),
  });
}
// No invalidation on purpose: local state is authoritative mid-section, so
// refetching the draft we just wrote would fight the student's typing.
export function useAutosaveSection(attemptId: number) {
  return useMutation({
    mutationFn: (vars: { sectionAttemptId: number; draft: SectionDraftRequest }) =>
      api.autosaveSection(attemptId, vars.sectionAttemptId, vars.draft),
    retry: 1,
  });
}
// Closing a part IS a state change the server owns, so unlike autosave this one
// does invalidate: the response carries the newly opened part.
export function useAdvanceSectionItem(attemptId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { sectionAttemptId: number; exerciseId: number }) =>
      api.advanceSectionItem(attemptId, vars.sectionAttemptId, vars.exerciseId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.testAttempt(attemptId) }),
  });
}
export function useUploadMockTestAudio(attemptId: number) {
  return useMutation({
    mutationFn: (vars: { audio: Blob; mimeType: string; exerciseId: number }) =>
      api.uploadMockTestAudio(vars.audio, vars.mimeType, {
        attemptId,
        exerciseId: vars.exerciseId,
      }),
  });
}
export function useSubmitSection(attemptId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { sectionAttemptId: number; body: SectionSubmitRequest }) =>
      api.submitSection(attemptId, vars.sectionAttemptId, vars.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.testAttempt(attemptId) });
      qc.invalidateQueries({ queryKey: qk.testAttemptReport(attemptId) });
      qc.invalidateQueries({ queryKey: qk.myTestAttempts });
      // The section's answers are now ordinary submissions in the inbox/history.
      qc.invalidateQueries({ queryKey: qk.mySubmissions });
    },
  });
}
export function useTestAttemptReport(id: number) {
  return useQuery({
    queryKey: qk.testAttemptReport(id),
    queryFn: () => api.getTestAttemptReport(id),
    enabled: Number.isFinite(id),
    // Writing/Speaking bands land whenever a teacher or the AI grades them.
    refetchInterval: (query) => (query.state.data?.partial ? 30_000 : false),
  });
}

// ---- Rubrics (feature 02) ----
export function useRubrics() {
  return useQuery({
    queryKey: qk.rubrics,
    queryFn: api.listRubrics,
    staleTime: 5 * 60_000, // templates change ~never
  });
}
export function useRubric(id: number | undefined) {
  return useQuery({
    queryKey: qk.rubric(id ?? NaN),
    queryFn: () => api.getRubric(id!),
    enabled: id != null && Number.isFinite(id),
    staleTime: 5 * 60_000,
  });
}
export function useExerciseRubric(exerciseId: number) {
  return useQuery({
    queryKey: qk.exerciseRubric(exerciseId),
    queryFn: () => api.getExerciseRubric(exerciseId),
    enabled: Number.isFinite(exerciseId),
    staleTime: 5 * 60_000,
  });
}

// ---- Writing annotations (feature 03) ----
export function useSubmissionAnnotations(id: number) {
  return useQuery({
    queryKey: qk.submissionAnnotations(id),
    queryFn: () => api.listSubmissionAnnotations(id),
    enabled: Number.isFinite(id),
  });
}
export function useCreateAnnotation(submissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: WritingAnnotationRequest) => api.createAnnotation(body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.submissionAnnotations(submissionId) }),
  });
}
export function useUpdateAnnotation(submissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; body: Partial<WritingAnnotationRequest> }) =>
      api.updateAnnotation(vars.id, vars.body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.submissionAnnotations(submissionId) }),
  });
}
export function useDeleteAnnotation(submissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteAnnotation(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.submissionAnnotations(submissionId) }),
  });
}
export function useAcknowledgeAnnotation(submissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.acknowledgeAnnotation(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.submissionAnnotations(submissionId) }),
  });
}

// ---- Pronunciation practice (feature 04) ----
export function usePronunciationDrills(filters?: {
  drill_type?: DrillType;
  difficulty?: DifficultyLevel;
  module_id?: number;
}) {
  return useQuery({
    queryKey: qk.pronunciationDrills(filters),
    queryFn: () => api.listPronunciationDrills(filters),
  });
}
export function usePronunciationDrill(id: number) {
  return useQuery({
    queryKey: qk.pronunciationDrill(id),
    queryFn: () => api.getPronunciationDrill(id),
    enabled: Number.isFinite(id),
  });
}
export function useDrillAttempts(drillId: number) {
  return useQuery({
    queryKey: qk.drillAttempts(drillId),
    queryFn: () => api.listDrillAttempts(drillId),
    enabled: Number.isFinite(drillId),
  });
}
export function useMyPronunciationAttempts(filters?: { drill_id?: number }) {
  return useQuery({
    queryKey: qk.myPronunciationAttempts(filters),
    queryFn: () => api.listMyPronunciationAttempts(filters),
  });
}
export function useSubmitAttempt(drillId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { audio: Blob; mimeType: string }) =>
      api.createPronunciationAttempt(drillId, vars.audio, vars.mimeType),
    onSuccess: () => {
      // The 201 IS the fully scored attempt (synchronous assessment): drop the
      // list caches and let them refetch with the new row at the top.
      qc.invalidateQueries({ queryKey: qk.drillAttempts(drillId) });
      qc.invalidateQueries({ queryKey: qk.myPronunciationAttempts() });
    },
  });
}
export function useCreatePronunciationDrill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PronunciationDrillRequest) =>
      api.createPronunciationDrill(body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["pronunciation", "drills"] }),
  });
}
export function useUpdatePronunciationDrill(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<PronunciationDrillRequest>) =>
      api.updatePronunciationDrill(id, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["pronunciation", "drills"] }),
  });
}
export function useDeletePronunciationDrill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deletePronunciationDrill(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["pronunciation", "drills"] }),
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
      // Feature 03 Phase 2: coarse refresh of any open submission view.
      if (m.event === "annotation_posted") qc.invalidateQueries({ queryKey: ["submissions"] });
    });
    return () => ws.close();
  }, [qc]);
}
