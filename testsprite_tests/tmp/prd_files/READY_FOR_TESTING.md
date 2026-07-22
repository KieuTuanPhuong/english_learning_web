# Ready for Testing

_Snapshot: 2026-06-15 · branch `main` · `tsc --noEmit` passes clean_

This document lists what is built and testable right now, what is **not** yet built, and how to run it.

## TL;DR

The **entire student experience** is built and wired to the live API end-to-end — registration, login, browsing modules, submitting exercises, and viewing graded feedback. The **teacher experience is not built yet**: every teacher screen currently renders a "coming soon" placeholder. Admin is deferred entirely.

So: log in as a **student** and you can test a full workflow. Log in as a **teacher** and you'll see the app shell (sidebar, role badge) but each page is a placeholder.

## Prerequisites

1. **Backend must be running** at `http://127.0.0.1:8000` (the Django REST API). The frontend talks to it directly from the browser.
   - Override with `NEXT_PUBLIC_API_URL` in `.env.local` if it lives elsewhere.
2. Install and run the frontend:
   ```bash
   npm install
   npm run dev      # http://localhost:3000
   ```
3. You need at least one **student** account and some seeded data (modules, exercises, a class with assignments) to test the full flow. Register a fresh student via the UI, or use existing backend credentials.

---

## ✅ Ready to test

### Authentication & session (all roles)
| Flow | Where | Notes |
|------|-------|-------|
| Register | `/register` | Choose student or teacher. Auto-logs-in on success. |
| Log in | `/login` | Email + password against `POST /api/auth/login`. |
| Session persistence | — | Refresh-token in `localStorage`; reload the page and you stay logged in. |
| Auto token refresh | — | Expired access token is silently refreshed once, then the request retries. |
| Route guard | `(app)/*` | Hitting any app route while logged out redirects to `/login`. |
| Log out | Profile page / desktop header | Clears tokens and cache, returns to `/login`. |
| Role theming | — | UI accent + navigation switch by role: students get a mobile layout (bottom tabs), teachers get a desktop layout (sidebar). |

### Student flow (fully built — this is the testable product)
| Screen | Route | What works |
|--------|-------|-----------|
| Dashboard | `/dashboard` | "Due soon" assignments, "Continue learning" (in-progress module), recent submissions with graded/submitted badges. |
| My Classes | `/classes` | List of enrolled classes; empty state links to module catalog. |
| Class detail | `/classes/[id]` | Tabs: Assignments, Lesson plans, Roster (with student avatars/emails). |
| Module catalog | `/modules` | Search by title + filter by difficulty (beginner/intermediate/advanced); per-module progress bars. |
| Module detail | `/modules/[id]` | Module info, progress, exercise list with ✓ marks on completed exercises. |
| Exercise viewer | `/exercises/[id]` | Reads prompt; **writing** exercises get a textarea + live word count + local "Save draft"; **speaking** exercises take an audio URL. Submit creates a real submission and redirects. |
| My Submissions | `/submissions` | List filtered by All / Graded / Awaiting; graded items show the score. |
| Submission detail | `/submissions/[id]` | Original prompt, your answer (text or audio player), and teacher feedback + score once graded. |
| Profile | `/profile` | Edit full name + avatar URL, save, and log out. |

Every student screen has **loading, empty, and error states**.

### Suggested student test path (happy path)
1. Register a new student → lands on Dashboard.
2. Go to **Modules**, search/filter, open a module.
3. Open an exercise, type a response (watch the word count), **Save draft**, reload to confirm the draft persists, then **Submit**.
4. Go to **Submissions** → the new submission appears as "Awaiting".
5. (After a teacher/admin grades it on the backend) reopen it → score + feedback show, and the **Graded** filter now includes it.
6. Edit your **Profile** name, save, confirm the header avatar/name update.

---

## 🚧 Not built yet

### Teacher screens — placeholders only
The teacher navigation and shell render, but every teacher page shows a "coming soon" placeholder instead of real functionality. **Nothing teacher-specific is testable yet.** Affected: Teacher Dashboard, My Classes, Class detail, Modules (authoring), Submissions inbox, and the **grading** screen.

> Note: the data-layer hooks and API functions for teachers (`useGradingQueue`, `useCreateClass`, `useCreateModule`, `useCreateFeedback`, enroll/assign, etc.) are already written — only the teacher UI screens are missing.

### Admin — deferred
Not started (out of scope for the current milestone).

---

## ⚠️ Known constraints & gotchas (verified against the live API)

- **Drafts are local-only.** "Save draft" writes to `localStorage`; there is no draft endpoint and **resubmission is unsupported** by the backend.
- **No file uploads.** Avatar and audio are **URL paste only** — there is no upload widget.
- **No quiz UI.** Quiz-type exercises aren't wireframed/built; only writing and speaking submissions work.
- **No password reset.**
- **Backend security issue (report to backend team):** `POST /api/auth/register {role:"admin"}` returns 201 — self-registration as admin is possible server-side. The frontend register form only offers student/teacher, but the backend does not block it.
- **Teacher data limits (relevant once teacher UI is built):** `GET /api/users/` is 403 for teachers (no student search — enrollment would be by student-ID), exercises are create+delete only (`PATCH` is 405), and there is no teacher-wide submission list (the grading queue fans out across classes → assignments → exercise submissions).

---

## Build health

- `npm run typecheck` (`tsc --noEmit`) — **passes**.
- `npm run lint` — eslint over `app lib components`.
- Milestone status: **M0 (foundation)** and **M1 (student flow)** complete; **M2 (teacher)** not started; **M3 (admin)** deferred.

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) and [BUILD_WORKFLOW.md](BUILD_WORKFLOW.md) for full detail.
