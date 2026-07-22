# engl.app — User Guide

A walkthrough of every feature in the English Learning app, organized by what you want to do. Find your role below and follow the workflows.

- **Students** — learn, practice, submit work, read feedback.
- **Teachers** — run classes, grade student work, export grades.
- **Admins** — manage the shared study-materials library.

> **Before you start:** the app talks to a backend API. Make sure the backend is running (default `http://127.0.0.1:8000`) and you have an account. The frontend runs at `http://localhost:3000` (`npm run dev`).

---

## Table of contents

1. [Getting started — register & log in](#1-getting-started)
2. [Finding your way around](#2-finding-your-way-around)
3. [Student guide](#3-student-guide)
4. [Teacher guide](#4-teacher-guide)
5. [Admin guide](#5-admin-guide)
6. [AI features explained](#6-ai-features-explained)
7. [Your profile & logging out](#7-your-profile--logging-out)
8. [Tips & things to know](#8-tips--things-to-know)

---

## 1. Getting started

### Create an account

1. Go to **`/register`** (or click **Create one** from the login page).
2. Fill in:
   - **Full name**
   - **Email**
   - **Password** (at least 6 characters)
3. Pick your role — tap **student** or **teacher** (the button highlights when selected).
4. Click **Create account**.
5. You're logged in automatically and dropped on your **Dashboard**.

### Log in

1. Go to **`/login`**.
2. Enter your **email** and **password**.
3. Click **Log in** → you land on your **Dashboard**.

If something's wrong (bad password, etc.), a red message appears under the form.

### Staying logged in

- The app remembers you across page reloads — no need to log in again each visit.
- Your session refreshes silently in the background, so you won't get kicked out mid-task.
- Visiting any app page while logged out sends you back to **`/login`**.

---

## 2. Finding your way around

Your navigation changes based on your role:

- **Students** get a **mobile-style layout** with a **bottom tab bar**: Home, Classes, Modules, Materials, Submissions, Me.
- **Teachers & Admins** get a **desktop layout** with a **left sidebar**: Dashboard, Classes, Modules, Materials, Submissions, Profile.

The header always shows the **engl.app** logo, your **role badge**, and your **avatar**. The active page is highlighted in the nav.

---

## 3. Student guide

### Your Dashboard (`/dashboard`)

Your home base. It greets you by first name and shows three sections:

- **Due soon** — up to 4 upcoming assignments with class name and a due-date label ("Due tomorrow", "Overdue", "Due in 3 days"). Tap one to open its class. If nothing's due, you'll see a link to **Browse modules**.
- **Continue learning** — your most recent in-progress module with a progress bar. Tap to jump back in.
- **Recent feedback** — your latest graded work, each tagged **AI Feedback** or **Teacher Feedback**, with a score badge (e.g. `85/100`). Tap to read the full feedback.

### Workflow: Complete an exercise and get feedback

This is the core student loop.

1. **Find an exercise.** Either tap a **Due soon** assignment on your dashboard, or go to **Modules**.
2. **Browse the module catalog** (`/modules`):
   - Search by title in the **Search modules…** box (filters live as you type).
   - Filter by difficulty: **all / beginner / intermediate / advanced**.
   - Each card shows a difficulty badge and your progress bar.
3. **Open a module** (`/modules/[id]`) to see its exercise list. Completed exercises have a green ✓; not-yet-done ones show an empty ○. Each exercise shows its type badge (writing, speaking, reading, listening, quiz).
4. **Open an exercise** (`/exercises/[id]`):
   - Read the **Prompt** (text, plus an audio player if it's a speaking exercise with audio).
   - **Writing exercise** → type into the **Your response** box. A live **word count** updates as you write.
   - **Speaking exercise** → paste an audio URL into **Your recording**.
5. **(Optional) Save a draft.** On writing exercises, click **Save draft** — your text is saved in this browser. Reload the page and it's still there.
6. **(Optional) Get instant AI feedback.** Click **Get AI feedback** to receive a practice score and comments *without* submitting to your teacher. See [AI features](#6-ai-features-explained).
7. **Submit.** Click **Submit** → you're taken to your **Submissions** list, where the new entry shows as **Pending**.
8. **Wait for grading**, then read the result (next section).

### Track your submissions (`/submissions`)

- See all your submitted work, newest first, each with a type ("writing submission") and time submitted.
- Filter with the tabs: **All / Graded / Awaiting**.
- Status badges: **Pending** (awaiting a teacher), **Graded** (teacher gave feedback), **AI Graded** (auto-graded).
- Tap any card to open its detail.

### Read your feedback (`/submissions/[id]`)

- See the original **Prompt** and **Your answer** (your text, or an audio player for speaking work).
- **Feedback history** lists every piece of feedback you got — AI and teacher — each with a score badge, who/what gave it, and any comments.
- If it hasn't been graded yet, you'll see **Awaiting feedback.**

### Your classes (`/classes`)

- See every class you're enrolled in. Tap a class to open it.
- Inside a class (`/classes/[id]`), three tabs:
  - **Assignments** — exercises assigned to the class with due dates.
  - **Lesson plans** — titles, date ranges, and objectives your teacher posted.
  - **Roster** — your classmates (avatar, name, email).
- No classes yet? You'll get a link to browse modules and self-study.

### Study materials (`/study-materials`)

- A library of resources (PDFs, docs) shared by admins/teachers.
- Each card shows the title, description, when it was added, and a class-scope badge if it's limited to one class.
- Tap **View Details** for the full description, or **Open Document** to view the file in a new tab.

### Self-study without a class

No class? No problem. Browse **Modules**, filter by difficulty, work through exercises, and use **Get AI feedback** for instant practice scoring. Your progress is tracked on each module card.

---

## 4. Teacher guide

### Teacher Dashboard (`/dashboard`)

An overview built for grading throughput:

- Three metric cards: **My Classes**, **Enrolled Students**, and **Ungraded Submissions** (highlighted in red so you can't miss a backlog).
- **My Classes** — a card per class with a **View Class →** link and an **Export CSV** button (downloads that class's grade report).
- **Recent Ungraded Submissions** — pending student work with the student's name and time submitted. Tap one to jump straight into grading. When you're clear, you'll see **All caught up!**

### Workflow: Grade student submissions

1. **Find work to grade.** Use the dashboard's ungraded list, or open the **Submissions Inbox** (`/submissions`).
2. **In the inbox**, narrow things down:
   - **Class** dropdown — view one class or **All Classes**.
   - Status tabs — **All / Pending / Graded / AI Graded**.
   - Each card shows the student, submission type, exercise number, time, and score (if already graded). AI-graded items carry an AI tag.
3. **Open a submission** (`/submissions/[id]`). The screen splits in two:
   - **Left** — the **Prompt** (with audio player if present) and the **Student Response** (text or audio).
   - **Right** — AI evaluation and your feedback form.
4. **Grade it — two options:**
   - **Let AI grade it first.** If the submission is still pending, click **Request AI feedback**. The AI generates a score and diagnostic comments, added to the feedback history. You can leave it, or add your own on top.
   - **Grade it yourself.** In **Add Teacher Feedback**, enter a **Score (0–100)** and **Comments**, then click **Submit Feedback**. You're returned to the inbox.
5. The student now sees your feedback in their submission detail.

The **Feedback history** panel shows every prior entry (AI and teacher), so you always have context.

### Export grades to CSV

- From the **Dashboard** (per class card) or the **Submissions Inbox** (select a class first), click **Export CSV** to download that class's grade report.

### Classes & lesson plans

- Open a class from your dashboard to view its assignments, lesson plans, and roster.

---

## 5. Admin guide

Admins manage the **shared study-materials library**.

### Add a study material

1. Go to **Study Materials** (`/study-materials`).
2. Click **New material** (top-right).
3. In the modal, fill in:
   - **Title** (required)
   - **File URL** (required — link to the PDF/doc, e.g. `https://example.com/vocab.pdf`)
   - **Description** (optional)
   - **Class Scope** — **Public to all classes** (default) or a specific class
4. Click **Create**. The material appears in the grid for the relevant users.

### Edit or delete a material

1. Open a material's detail page (`/study-materials/[id]`).
2. **Edit** — opens the same form, pre-filled. Change fields, click **Save Changes**.
3. **Delete** — click **Delete**, then confirm in the warning dialog. *This can't be undone.*

---

## 6. AI features explained

The app has **two distinct AI feedback flows**. They're separate on purpose.

### AI Practice — for students (no teacher involved)

- **Where:** the exercise viewer (`/exercises/[id]`), the **Get AI feedback** button.
- **What it does:** instantly scores your writing/speaking draft (0–100) and gives diagnostic comments, labeled **Practice submission (no teacher involved)**.
- **Use it to:** check your work, revise, and try again *before* you officially submit.
- The button is disabled if your response is empty or while it's thinking.

### AI Evaluation — for teachers (assists grading)

- **Where:** the grading screen (`/submissions/[id]`), the **Request AI feedback** button (only on pending submissions).
- **What it does:** the AI grades the real submission and adds an **AI Feedback** entry (score + comments) to the feedback history.
- **The teacher stays in control:** you can accept the AI grade or layer your own teacher feedback on top.

Both AI and teacher feedback are clearly labeled wherever they appear (dashboard, submission detail, feedback history) so students always know the source.

---

## 7. Your profile & logging out

The **Profile** page (`/profile`) works for every role:

- See your avatar, name, email, and **role badge**.
- Edit your **full name** and **avatar URL**, then click **Save changes** (you'll see a **Saved.** confirmation; the header updates).
- Click **Log out** — you'll get a confirmation ("Any unsaved drafts stay on this device.") before you're returned to `/login`.

---

## 8. Tips & things to know

- **Drafts are saved on your device only.** **Save draft** stores writing in this browser's local storage. Use a different browser or device and the draft won't follow you. (It clears once you get AI feedback.)
- **Files are linked, not uploaded.** Avatars, audio recordings, and study materials are added by **pasting a URL** — there's no file-upload widget. Host your audio/PDF somewhere public first, then paste the link.
- **Quizzes aren't interactive yet.** Only **writing** (typed) and **speaking** (audio URL) submissions are supported.
- **No password reset in-app** — contact your admin if you're locked out.
- **Loading, empty, and error states** are everywhere — if a list is empty you'll get a helpful prompt, and failed loads show an error rather than a blank screen.
- **Notifications** update in real time via a live connection, so new feedback and submissions can appear without a manual refresh.

---

*This guide reflects the current build of engl.app. Routes shown in `code` are the in-app URLs you'll see in the address bar.*
