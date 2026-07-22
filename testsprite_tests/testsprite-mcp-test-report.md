# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** english-learning-web
- **Date:** 2026-06-15
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

### Requirement: Authentication & Registration
- **Description:** Handles student signup, login, logout, and route protection.

#### Test TC001 Register a new student account and reach the dashboard
- **Test Code:** [TC001_Register_a_new_student_account_and_reach_the_dashboard.py](./TC001_Register_a_new_student_account_and_reach_the_dashboard.py)
- **Test Error:** Registration returned error 'user with this email already exists.' Login page showed 'Something went wrong' on submit.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/819a0d58-af2c-4fbc-a1bd-b2f79db3c69f
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** The test case attempts to register a static or duplicate email address without a unique suffix, causing a database conflict on subsequent test runs.

---

#### Test TC002 Log in as an existing student and reach the dashboard
- **Test Code:** [TC002_Log_in_as_an_existing_student_and_reach_the_dashboard.py](./TC002_Log_in_as_an_existing_student_and_reach_the_dashboard.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/1cca1193-6577-4bf7-9bb7-6f5123a0e8f1
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Log in with correct credentials redirects the student to the dashboard as expected.

---

#### Test TC003 Block access to protected pages when signed out
- **Test Code:** [TC003_Block_access_to_protected_pages_when_signed_out.py](./TC003_Block_access_to_protected_pages_when_signed_out.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/9acbc1b8-b069-4277-8cec-54f999e53f40
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Unauthenticated access to `/dashboard` is correctly intercepted, redirecting users back to the `/login` page.

---

#### Test TC005 Log out and return to the login page
- **Test Code:** [TC005_Log_out_and_return_to_the_login_page.py](./TC005_Log_out_and_return_to_the_login_page.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/2b6dc91a-fae5-45c6-9e99-9eeb0eddcb30
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Log out function successfully terminates user session and redirects to the login screen.

---

### Requirement: Modules Catalog & Detail
- **Description:** Allows student to browse, search, filter, and view module details.

#### Test TC009 Open a module from the module catalog and launch an exercise
- **Test Code:** [TC009_Open_a_module_from_the_module_catalog_and_launch_an_exercise.py](./TC009_Open_a_module_from_the_module_catalog_and_launch_an_exercise.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/fd45d0c5-246f-4ac8-86b8-07f5ce78535b
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** The catalog navigates seamlessly to individual modules and loads exercise links correctly.

---

#### Test TC011 Browse and open a module from the module list
- **Test Code:** [TC011_Browse_and_open_a_module_from_the_module_list.py](./TC011_Browse_and_open_a_module_from_the_module_list.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/bf61757e-d278-4f78-87a4-181aebd568ac
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Search query and difficulty level filters correctly update the displayed modules.

---

#### Test TC013 Open a module from the list without filtering
- **Test Code:** [TC013_Open_a_module_from_the_list_without_filtering.py](./TC013_Open_a_module_from_the_list_without_filtering.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/3c641da5-6bcb-45b6-9ed7-963d5aee25d1
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Full module catalog list renders and transitions to detailed view properly.

---

### Requirement: Exercises Solving
- **Description:** Allows student to open exercises, validate response length, and submit answers.

#### Test TC004 Submit a completed writing exercise and review the submission in history
- **Test Code:** [TC004_Submit_a_completed_writing_exercise_and_review_the_submission_in_history.py](./TC004_Submit_a_completed_writing_exercise_and_review_the_submission_in_history.py)
- **Test Error:** Submission failed with error message 'Couldn't submit.'
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/7d387ced-698c-4cbe-ae20-8c1f1f7900a8
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** The API request to `/api/submissions/` returned an error. Needs inspection of the backend API parameters or permissions for students submitting exercises.

---

#### Test TC008 Start a writing exercise from a module
- **Test Code:** [TC008_Start_a_writing_exercise_from_a_module.py](./TC008_Start_a_writing_exercise_from_a_module.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/284aeb83-2654-44e7-8868-c40fc503b766
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Writing exercises open with visible instructions, textarea input, and submit buttons.

---

#### Test TC019 Show validation feedback for an incomplete exercise response
- **Test Code:** [TC019_Show_validation_feedback_for_an_incomplete_exercise_response.py](./TC019_Show_validation_feedback_for_an_incomplete_exercise_response.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/51684274-b462-4b4c-aa06-6cf201a26cc6
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Blank submissions are disabled by frontend validation as expected.

---

### Requirement: Classes & Syllabus
- **Description:** Displays enrolled classes, class schedules, assignments, and lesson plans.

#### Test TC010 Browse enrolled classes and open a class detail page
- **Test Code:** [TC010_Browse_enrolled_classes_and_open_a_class_detail_page.py](./TC010_Browse_enrolled_classes_and_open_a_class_detail_page.py)
- **Test Error:** Student account has 0 enrolled classes.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/ff4b4e61-53b6-4201-b519-69d20eafce83
- **Status:** ⚠️ Blocked
- **Severity:** MEDIUM
- **Analysis / Findings:** Test cannot proceed because the testing seed user is not enrolled in any class in the database.

---

#### Test TC018 Handle an empty classes list by linking to the module catalog
- **Test Code:** [TC018_Handle_an_empty_classes_list_by_linking_to_the_module_catalog.py](./TC018_Handle_an_empty_classes_list_by_linking_to_the_module_catalog.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/60c6ef0e-ee66-48c4-9b30-986dc6f7ddf6
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Shows the correct empty state illustration and redirect links when no classes are found.

---

### Requirement: Submissions History
- **Description:** Listing submissions, showing score badges, and checking graded submission details.

#### Test TC007 Submit a writing exercise and see it in submissions
- **Test Code:** [TC007_Submit_a_writing_exercise_and_see_it_in_submissions.py](./TC007_Submit_a_writing_exercise_and_see_it_in_submissions.py)
- **Test Error:** Submit returned 'Couldn't submit.' error message.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/9b581d1d-a4eb-4bd5-8c53-f72c4722be65
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Same issue as TC004. Failed API POST submission prevents verify step on /submissions page.

---

#### Test TC012 Review graded submission feedback and original response
- **Test Code:** [TC012_Review_graded_submission_feedback_and_original_response.py](./TC012_Review_graded_submission_feedback_and_original_response.py)
- **Test Error:** Submissions page is empty.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/fa5cb4f4-cec8-4bc2-8aba-062fb3afa6cb
- **Status:** ⚠️ Blocked
- **Severity:** MEDIUM
- **Analysis / Findings:** Blocked due to empty submission history (exacerbated by failed submission API).

---

#### Test TC014 Review graded submission details
- **Test Code:** [TC014_Review_graded_submission_details.py](./TC014_Review_graded_submission_details.py)
- **Test Error:** Submissions list contains no items.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/ed168da6-3347-4dd9-bc9d-09bfa06a8447
- **Status:** ⚠️ Blocked
- **Severity:** MEDIUM
- **Analysis / Findings:** Blocked. No existing graded submission card could be opened to verify.

---

#### Test TC017 Filter submissions by status
- **Test Code:** [TC017_Filter_submissions_by_status.py](./TC017_Filter_submissions_by_status.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/b53bf50e-c92d-4653-bea6-af3971b45236
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Status tabs filter empty lists correctly without error.

---

#### Test TC020 Handle an empty submissions history
- **Test Code:** [TC020_Handle_an_empty_submissions_history.py](./TC020_Handle_an_empty_submissions_history.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/de330113-d637-49b4-970b-203e12b5631e
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Correct empty state text and prompt message displayed.

---

### Requirement: Profile Management
- **Description:** Updating full name and avatar URL, and showing updates in the app shell.

#### Test TC006 Log out and return to the login screen
- **Test Code:** [TC006_Log_out_and_return_to_the_login_screen.py](./TC006_Log_out_and_return_to_the_login_screen.py)
- **Test Error:** None
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/2344e365-3e39-46b4-b5a9-82b9170fb2e3
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Logging out from the profile page succeeds and returns user to the login screen.

---

#### Test TC015 Update profile details and log out
- **Test Code:** [TC015_Update_profile_details_and_log_out.py](./TC015_Update_profile_details_and_log_out.py)
- **Test Error:** Profile avatar image was not updated in the app shell.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/faf1ba31-e225-48d2-9a3c-83b6570ffd3b
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** Changes save to database successfully, but app shell avatar and name do not dynamically update without a full reload/re-fetching context.

---

#### Test TC016 Update profile details and see them reflected in the app shell
- **Test Code:** [TC016_Update_profile_details_and_see_them_reflected_in_the_app_shell.py](./TC016_Update_profile_details_and_see_them_reflected_in_the_app_shell.py)
- **Test Error:** Avatar change is not visibly reflected in the app shell header.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/5978feb6-c4cd-476e-8009-727f6c0829b4
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** The app shell greeting or avatar remains outdated/cached after the profile save action.

---

## 3️⃣ Coverage & Matching Metrics

- **60.00%** of tests passed (12 passed, 5 failed, 3 blocked)

| Requirement | Total Tests | ✅ Passed | ❌ Failed | ⚠️ Blocked |
|-------------------|-------------|-----------|-----------|------------|
| Authentication & Registration | 4 | 3 | 1 | 0 |
| Modules Catalog & Detail | 3 | 3 | 0 | 0 |
| Exercises Solving | 3 | 2 | 1 | 0 |
| Classes & Syllabus | 2 | 1 | 0 | 1 |
| Submissions History | 5 | 2 | 1 | 2 |
| Profile Management | 3 | 1 | 2 | 0 |

---

## 4️⃣ Key Gaps / Risks

> 60.00% of UI tests passed.
> 
> **Key Gaps & Risks identified:**
> 1. **Exercise Submission Failures:** Multiple tests fail due to an error when submitting written exercises ("Couldn't submit."). This is a critical risk preventing students from turning in work.
> 2. **Profile State Sync Issue:** App shell fails to display updated names and profile avatars dynamically upon editing. The app layout/context doesn't automatically synchronize with the newest user details.
> 3. **E2E Test Email Conflicts:** The registration test fails because the registration test code attempts to register an email address that already exists from prior test runs, pointing to a need for random suffix generation in tests or database cleaning fixtures.
> 4. **Missing Class & Graded Submissions Seed Data:** Three test cases are blocked due to the test user lacking enrolled classes or historical graded submissions. Seed scripts should populate these scenarios to test details page functionality fully.
