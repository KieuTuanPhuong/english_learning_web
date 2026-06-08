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
  Progress,
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
  if (init?.body && !headers.has("Content-Type")) {
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
