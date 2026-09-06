// Single API client for the Django REST backend.
// - access token in memory, refresh token in localStorage
// - one transparent 401 -> refresh -> retry
// - normalizes DRF error shapes ({detail} vs {field:[msgs]})
import { API_BASE_URL } from "./env";
import type {
  User,
  RegisterRequest,
  UserUpdateRequest,
  Class,
  ClassRequest,
  ClassStudent,
  LearningModule,
  LearningModuleRequest,
  Assignment,
  AssignmentRequest,
  LessonPlan,
  LessonPlanRequest,
  Exercise,
  ExerciseRequest,
  Submission,
  SubmissionRequest,
  Feedback,
  FeedbackRequest,
  FeedbackReview,
  FeedbackReviewRequest,
  AiInsight,
  Progress,
  StudyMaterial,
  StudyMaterialRequest,
  SubmissionInbox,
  AiPracticeRequest,
  DashboardEnvelope,
  TestFormat,
  MockTestTemplate,
  AttemptMode,
  TestAttempt,
  TestAttemptListItem,
  SectionAttempt,
  TestAttemptReport,
  SectionDraftRequest,
  SectionSubmitRequest,
  RubricTemplate,
  WritingAnnotation,
  WritingAnnotationRequest,
  PronunciationDrill,
  PronunciationDrillRequest,
  PronunciationAttempt,
  DrillType,
  DifficultyLevel,
} from "./types";

const REFRESH_STORAGE_KEY = "elw_refresh_token";

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
export function getAccessToken(): string | null {
  return accessToken;
}
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_STORAGE_KEY);
}
export function setRefreshToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(REFRESH_STORAGE_KEY, token);
  else window.localStorage.removeItem(REFRESH_STORAGE_KEY);
}
export function clearTokens(): void {
  setAccessToken(null);
  setRefreshToken(null);
}

export class ApiError extends Error {
  readonly status: number;
  readonly detail?: string;
  readonly fieldErrors?: Record<string, string[]>;
  constructor(
    status: number,
    message: string,
    opts?: { detail?: string; fieldErrors?: Record<string, string[]> },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = opts?.detail;
    this.fieldErrors = opts?.fieldErrors;
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON error body */
  }
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.detail === "string") {
      return new ApiError(res.status, b.detail, { detail: b.detail });
    }
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(b)) {
      if (Array.isArray(value)) fieldErrors[key] = value.map(String);
      else if (typeof value === "string") fieldErrors[key] = [value];
    }
    const first = Object.values(fieldErrors)[0]?.[0];
    return new ApiError(res.status, first ?? `Request failed (${res.status})`, {
      fieldErrors,
    });
  }
  return new ApiError(res.status, `Request failed (${res.status})`);
}

function buildRequest(
  path: string,
  init: RequestInit | undefined,
  withAuth: boolean,
): Request {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  // Never force JSON on a FormData body — the browser must set the multipart
  // boundary itself (pronunciation audio upload, feature 04 WF7).
  if (
    init?.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (withAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return new Request(`${API_BASE_URL}${path}`, { ...init, headers });
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccess(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new ApiError(401, "Session expired");
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(
        buildRequest(
          "/api/auth/token/refresh",
          { method: "POST", body: JSON.stringify({ refresh }) },
          false,
        ),
      );
      if (!res.ok) {
        clearTokens();
        throw await toApiError(res);
      }
      const data = (await res.json()) as { access: string; refresh?: string };
      setAccessToken(data.access);
      if (data.refresh) setRefreshToken(data.refresh); // refresh rotation
      return data.access;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type FetchOptions = RequestInit & { auth?: boolean };

export async function apiFetch<T>(
  path: string,
  init?: FetchOptions,
): Promise<T> {
  const withAuth = init?.auth ?? true;
  let res = await fetch(buildRequest(path, init, withAuth));

  if (res.status === 401 && withAuth && getRefreshToken()) {
    try {
      await refreshAccess();
      res = await fetch(buildRequest(path, init, true));
    } catch {
      throw new ApiError(401, "Session expired");
    }
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---- Auth -----------------------------------------------------------------

// /api/auth/login returns access_token/refresh_token (NOT access/refresh).
type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export async function login(email: string, password: string): Promise<User> {
  const tokens = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    auth: false,
  });
  setAccessToken(tokens.access_token);
  setRefreshToken(tokens.refresh_token);
  return getMe();
}

export async function register(body: RegisterRequest): Promise<User> {
  // register returns the User but no token, so log in afterwards.
  await apiFetch<User>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });
  return login(body.email, body.password);
}

export function logout(): void {
  clearTokens();
}

// Restore a session on app boot from a stored refresh token.
export async function bootstrapSession(): Promise<User | null> {
  if (!getRefreshToken()) return null;
  try {
    await refreshAccess();
    return await getMe();
  } catch {
    clearTokens();
    return null;
  }
}

// ---- Resources (extended per screen in M1/M2) -----------------------------

export function getMe(): Promise<User> {
  return apiFetch<User>("/api/users/me/");
}

export function updateMe(body: UserUpdateRequest): Promise<User> {
  return apiFetch<User>("/api/users/me/", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// Classes
export function listClasses(): Promise<Class[]> {
  return apiFetch<Class[]>("/api/classes/");
}
export function getClass(id: number): Promise<Class> {
  return apiFetch<Class>(`/api/classes/${id}/`);
}
export function listClassAssignments(id: number): Promise<Assignment[]> {
  return apiFetch<Assignment[]>(`/api/classes/${id}/assignments/`);
}
export function listClassLessonPlans(id: number): Promise<LessonPlan[]> {
  return apiFetch<LessonPlan[]>(`/api/classes/${id}/lesson-plans/`);
}
export function listClassStudents(id: number): Promise<User[]> {
  // NOTE: returns User[] (the enrolled students), not ClassStudent[].
  return apiFetch<User[]>(`/api/classes/${id}/students/`);
}

// Modules & exercises
export function listModules(): Promise<LearningModule[]> {
  return apiFetch<LearningModule[]>("/api/modules/");
}
export function getModule(id: number): Promise<LearningModule> {
  return apiFetch<LearningModule>(`/api/modules/${id}/`);
}
export function listModuleExercises(id: number): Promise<Exercise[]> {
  return apiFetch<Exercise[]>(`/api/modules/${id}/exercises/`);
}
export function getExercise(id: number): Promise<Exercise> {
  return apiFetch<Exercise>(`/api/exercises/${id}/`);
}

// Submissions & feedback
// Create is POST /api/submissions/ with exercise_id in the body (verified;
// nested POST /api/exercises/{id}/submissions/ returns 405).
export function createSubmission(body: SubmissionRequest): Promise<Submission> {
  return apiFetch<Submission>("/api/submissions/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export function listMySubmissions(): Promise<Submission[]> {
  return apiFetch<Submission[]>("/api/submissions/me/");
}
export function listSubmissionFeedback(id: number): Promise<Feedback[]> {
  return apiFetch<Feedback[]>(`/api/submissions/${id}/feedback/`);
}

export function listExerciseSubmissions(id: number): Promise<Submission[]> {
  return apiFetch<Submission[]>(`/api/exercises/${id}/submissions/`);
}

// Progress
export function listMyProgress(): Promise<Progress[]> {
  return apiFetch<Progress[]>("/api/progress/me/");
}

// ---- Teacher mutations ----------------------------------------------------
// teacher_id is set server-side from the creator; don't send it.
export function createClass(body: ClassRequest): Promise<Class> {
  return apiFetch<Class>("/api/classes/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export function updateClass(
  id: number,
  body: Partial<ClassRequest>,
): Promise<Class> {
  return apiFetch<Class>(`/api/classes/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
export function enrollStudent(
  classId: number,
  studentId: number,
): Promise<ClassStudent> {
  return apiFetch<ClassStudent>(`/api/classes/${classId}/students/`, {
    method: "POST",
    body: JSON.stringify({ student_id: studentId }),
  });
}
export function removeStudent(
  classId: number,
  studentId: number,
): Promise<void> {
  return apiFetch<void>(`/api/classes/${classId}/students/${studentId}/`, {
    method: "DELETE",
  });
}
export function createAssignment(
  classId: number,
  body: AssignmentRequest,
): Promise<Assignment> {
  return apiFetch<Assignment>(`/api/classes/${classId}/assignments/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export function createLessonPlan(
  classId: number,
  body: LessonPlanRequest,
): Promise<LessonPlan> {
  return apiFetch<LessonPlan>(`/api/classes/${classId}/lesson-plans/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export function createModule(body: LearningModuleRequest): Promise<LearningModule> {
  return apiFetch<LearningModule>("/api/modules/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export function updateModule(
  id: number,
  body: Partial<LearningModuleRequest>,
): Promise<LearningModule> {
  return apiFetch<LearningModule>(`/api/modules/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
export function deleteModule(id: number): Promise<void> {
  return apiFetch<void>(`/api/modules/${id}/`, { method: "DELETE" });
}
// Exercises are create + delete only (PATCH /exercises/{id}/ returns 405).
export function createExercise(
  moduleId: number,
  body: ExerciseRequest,
): Promise<Exercise> {
  return apiFetch<Exercise>(`/api/modules/${moduleId}/exercises/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export function deleteExercise(id: number): Promise<void> {
  return apiFetch<void>(`/api/exercises/${id}/`, { method: "DELETE" });
}
// Grading: POST /api/feedback/ with submission_id (nested path is 405).
export function createFeedback(body: FeedbackRequest): Promise<Feedback> {
  return apiFetch<Feedback>("/api/feedback/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ---- ILLMS Upgrade Endpoints ----

// Dashboard (role-aware; data shape depends on me.role)
export function getDashboard(): Promise<DashboardEnvelope> {
  return apiFetch<DashboardEnvelope>("/api/dashboard/");
}

// Teacher inbox — replaces the client-side grading-queue fan-out (see brief 02)
export function listSubmissionsInbox(params?: {
  status?: string;
  class_id?: number;
  exercise_id?: number;
}): Promise<SubmissionInbox[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.class_id != null) qs.set("class_id", String(params.class_id));
  if (params?.exercise_id != null) qs.set("exercise_id", String(params.exercise_id));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch<SubmissionInbox[]>(`/api/submissions/inbox/${suffix}`);
}

// AI evaluation (teacher/admin triggers AI grading on an existing submission)
export function aiEvaluateSubmission(id: number): Promise<Feedback> {
  return apiFetch<Feedback>(`/api/submissions/${id}/ai-evaluate/`, { method: "POST" });
}

// AI coaching (core/ai/assist.py). Draft review is stateless; the mistake
// explanation is stored server-side (GET newest / POST regenerate).
export function aiReviewFeedback(
  submissionId: number,
  body: FeedbackReviewRequest,
): Promise<FeedbackReview> {
  return apiFetch<FeedbackReview>(`/api/submissions/${submissionId}/ai-review-feedback/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export async function getMistakeExplanation(submissionId: number): Promise<AiInsight | null> {
  try {
    return await apiFetch<AiInsight>(`/api/submissions/${submissionId}/ai-explain/`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
export function generateMistakeExplanation(submissionId: number): Promise<AiInsight> {
  return apiFetch<AiInsight>(`/api/submissions/${submissionId}/ai-explain/`, { method: "POST" });
}

// AI practice (student): returns { submission, feedback }
export function aiPractice(body: AiPracticeRequest): Promise<{ submission: Submission; feedback: Feedback }> {
  return apiFetch("/api/submissions/ai-practice/", { method: "POST", body: JSON.stringify(body) });
}

// Study materials
export function listStudyMaterials(): Promise<StudyMaterial[]> {
  return apiFetch<StudyMaterial[]>("/api/study-materials/");
}
export function getStudyMaterial(id: number): Promise<StudyMaterial> {
  return apiFetch<StudyMaterial>(`/api/study-materials/${id}/`);
}
export function createStudyMaterial(body: StudyMaterialRequest): Promise<StudyMaterial> {
  return apiFetch<StudyMaterial>("/api/study-materials/", { method: "POST", body: JSON.stringify(body) });
}
export function updateStudyMaterial(id: number, body: Partial<StudyMaterialRequest>): Promise<StudyMaterial> {
  return apiFetch<StudyMaterial>(`/api/study-materials/${id}/`, { method: "PATCH", body: JSON.stringify(body) });
}
export function deleteStudyMaterial(id: number): Promise<void> {
  return apiFetch<void>(`/api/study-materials/${id}/`, { method: "DELETE" });
}

// ---- Mock tests ------------------------------------------------------------
// Only the student-facing endpoints get a client: template authoring and
// conversion-table admin have no MVP UI (teachers use the API/Django admin).

export function listTestFormats(): Promise<TestFormat[]> {
  return apiFetch<TestFormat[]>("/api/mock-tests/formats/");
}
export function listMockTestTemplates(): Promise<MockTestTemplate[]> {
  return apiFetch<MockTestTemplate[]>("/api/mock-tests/templates/");
}
export function getMockTestTemplate(id: number): Promise<MockTestTemplate> {
  return apiFetch<MockTestTemplate>(`/api/mock-tests/templates/${id}/`);
}
// Returns the existing unfinished attempt if there is one, so this doubles as
// "resume" — the server refuses to duplicate half-finished work.
// `exam` sits the sections in the template's order; `practice` lets the student
// begin with whichever skill they came to work on. Omitting the mode gets the
// real sitting — the strict rule is what you get by saying nothing.
export function createTestAttempt(
  templateId: number,
  mode: AttemptMode = "exam",
): Promise<TestAttempt> {
  return apiFetch<TestAttempt>(`/api/mock-tests/templates/${templateId}/attempts/`, {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}
export function listMyTestAttempts(): Promise<TestAttemptListItem[]> {
  return apiFetch<TestAttemptListItem[]>("/api/mock-tests/attempts/me/");
}
export function getTestAttempt(id: number): Promise<TestAttempt> {
  return apiFetch<TestAttempt>(`/api/mock-tests/attempts/${id}/`);
}
// Starting a section is what starts the server clock — not attempt creation.
export function startSection(
  attemptId: number,
  sectionAttemptId: number,
): Promise<SectionAttempt> {
  return apiFetch<SectionAttempt>(
    `/api/mock-tests/attempts/${attemptId}/sections/${sectionAttemptId}/start/`,
    { method: "POST" },
  );
}
// Throws ApiError(409, code "section_expired") once time is up. Callers treat
// that as a state transition (lock the UI), not an error toast.
export function autosaveSection(
  attemptId: number,
  sectionAttemptId: number,
  draft: SectionDraftRequest,
): Promise<SectionAttempt> {
  return apiFetch<SectionAttempt>(
    `/api/mock-tests/attempts/${attemptId}/sections/${sectionAttemptId}/answers/`,
    { method: "PATCH", body: JSON.stringify(draft) },
  );
}
export function submitSection(
  attemptId: number,
  sectionAttemptId: number,
  body: SectionSubmitRequest,
): Promise<SectionAttempt> {
  return apiFetch<SectionAttempt>(
    `/api/mock-tests/attempts/${attemptId}/sections/${sectionAttemptId}/submit/`,
    { method: "POST", body: JSON.stringify(body) },
  );
}
// Closes the current part of a `sequential` section (a Listening recording, a
// Speaking part) and opens the next. Idempotent server-side, so a double tap
// cannot skip one.
export function advanceSectionItem(
  attemptId: number,
  sectionAttemptId: number,
  exerciseId: number,
): Promise<SectionAttempt> {
  return apiFetch<SectionAttempt>(
    `/api/mock-tests/attempts/${attemptId}/sections/${sectionAttemptId}/advance/`,
    { method: "POST", body: JSON.stringify({ exercise_id: exerciseId }) },
  );
}
// Speaking answers upload as files and are submitted as URLs. The old path put
// a base64 data URL in the submit body; three IELTS Speaking parts of up to
// five minutes each would be tens of megabytes of JSON in a single request.
export function uploadMockTestAudio(
  audio: Blob,
  mimeType: string,
  context?: { attemptId: number; exerciseId: number },
): Promise<{ url: string }> {
  const form = new FormData();
  form.append("audio", audio, `answer.${extFromMime(mimeType)}`);
  if (context) {
    // Lets the server apply this part's own max_record_seconds on top of the
    // global cap — an IELTS Part 2 long turn really is capped at two minutes.
    form.append("attempt_id", String(context.attemptId));
    form.append("exercise_id", String(context.exerciseId));
  }
  return apiFetch<{ url: string }>("/api/media/audio", {
    method: "POST",
    body: form,
  });
}
export function getTestAttemptReport(id: number): Promise<TestAttemptReport> {
  return apiFetch<TestAttemptReport>(`/api/mock-tests/attempts/${id}/report/`);
}

// ---- Rubrics (feature 02) --------------------------------------------------
export function listRubrics(): Promise<RubricTemplate[]> {
  return apiFetch<RubricTemplate[]>("/api/rubrics/");
}
export function getRubric(id: number): Promise<RubricTemplate> {
  return apiFetch<RubricTemplate>(`/api/rubrics/${id}/`);
}
// 200 with a null body when no rubric resolves for the exercise (doc 02 §4.2).
export function getExerciseRubric(exerciseId: number): Promise<RubricTemplate | null> {
  return apiFetch<RubricTemplate | null>(`/api/exercises/${exerciseId}/rubric/`);
}

// ---- Writing annotations (feature 03) --------------------------------------
// Nested read, top-level writes — mirrors the Feedback split.
export function listSubmissionAnnotations(id: number): Promise<WritingAnnotation[]> {
  return apiFetch<WritingAnnotation[]>(`/api/submissions/${id}/annotations/`);
}
export function createAnnotation(
  body: WritingAnnotationRequest,
): Promise<WritingAnnotation> {
  return apiFetch<WritingAnnotation>("/api/annotations/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export function updateAnnotation(
  id: number,
  body: Partial<WritingAnnotationRequest>,
): Promise<WritingAnnotation> {
  return apiFetch<WritingAnnotation>(`/api/annotations/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
export function deleteAnnotation(id: number): Promise<void> {
  return apiFetch<void>(`/api/annotations/${id}/`, { method: "DELETE" });
}
// Phase 2 — student marks an annotation as read.
export function acknowledgeAnnotation(id: number): Promise<WritingAnnotation> {
  return apiFetch<WritingAnnotation>(`/api/annotations/${id}/acknowledge/`, {
    method: "POST",
  });
}

// ---- Pronunciation practice (feature 04) -----------------------------------
function pronunciationDrillQuery(params?: {
  drill_type?: DrillType;
  difficulty?: DifficultyLevel;
  module_id?: number;
}): string {
  const qs = new URLSearchParams();
  if (params?.drill_type) qs.set("drill_type", params.drill_type);
  if (params?.difficulty) qs.set("difficulty", params.difficulty);
  if (params?.module_id != null) qs.set("module_id", String(params.module_id));
  return qs.toString() ? `?${qs}` : "";
}

export function listPronunciationDrills(params?: {
  drill_type?: DrillType;
  difficulty?: DifficultyLevel;
  module_id?: number;
}): Promise<PronunciationDrill[]> {
  return apiFetch<PronunciationDrill[]>(
    `/api/pronunciation/drills/${pronunciationDrillQuery(params)}`,
  );
}
export function getPronunciationDrill(id: number): Promise<PronunciationDrill> {
  return apiFetch<PronunciationDrill>(`/api/pronunciation/drills/${id}/`);
}
export function createPronunciationDrill(
  body: PronunciationDrillRequest,
): Promise<PronunciationDrill> {
  return apiFetch<PronunciationDrill>("/api/pronunciation/drills/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
export function updatePronunciationDrill(
  id: number,
  body: Partial<PronunciationDrillRequest>,
): Promise<PronunciationDrill> {
  return apiFetch<PronunciationDrill>(`/api/pronunciation/drills/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
export function deletePronunciationDrill(id: number): Promise<void> {
  return apiFetch<void>(`/api/pronunciation/drills/${id}/`, { method: "DELETE" });
}

/** File extension for the recorded blob's mime type (server transcodes anyway). */
export function extFromMime(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

export function createPronunciationAttempt(
  drillId: number,
  audio: Blob,
  mimeType: string,
): Promise<PronunciationAttempt> {
  const form = new FormData();
  form.append("audio", audio, `attempt.${extFromMime(mimeType)}`);
  return apiFetch<PronunciationAttempt>(
    `/api/pronunciation/drills/${drillId}/attempts/`,
    { method: "POST", body: form },
  );
}
export function listDrillAttempts(drillId: number): Promise<PronunciationAttempt[]> {
  return apiFetch<PronunciationAttempt[]>(
    `/api/pronunciation/drills/${drillId}/attempts/`,
  );
}
export function listMyPronunciationAttempts(params?: {
  drill_id?: number;
}): Promise<PronunciationAttempt[]> {
  const qs = new URLSearchParams();
  if (params?.drill_id != null) qs.set("drill_id", String(params.drill_id));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch<PronunciationAttempt[]>(
    `/api/pronunciation/attempts/me/${suffix}`,
  );
}

// CSV/binary download — apiFetch can't be used (it does res.json()).
export async function downloadGradeReport(classId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/reports/grades?class_id=${classId}&format=csv`, {
    headers: {
      Accept: "text/csv",
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
    },
  });
  if (!res.ok) throw await toApiError(res); // reuse existing error normalizer (403 "Not your class", 404)
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `grades_class_${classId}.csv`; // backend sets Content-Disposition too
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

