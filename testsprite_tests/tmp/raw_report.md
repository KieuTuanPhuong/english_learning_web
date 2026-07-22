
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** english-learning-web
- **Date:** 2026-06-15
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Register a new student account and reach the dashboard
- **Test Code:** [TC001_Register_a_new_student_account_and_reach_the_dashboard.py](./TC001_Register_a_new_student_account_and_reach_the_dashboard.py)
- **Test Error:** TEST FAILURE

Authentication did not succeed — the user could not be logged in, so the dashboard was not reached.

Observations:
- After submitting the login form the page displayed a red error message: 'Something went wrong'.
- The page remained on the login screen (no dashboard or authenticated navigation visible).
- A prior registration attempt returned: 'user with this email already exists.'
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/819a0d58-af2c-4fbc-a1bd-b2f79db3c69f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Log in as an existing student and reach the dashboard
- **Test Code:** [TC002_Log_in_as_an_existing_student_and_reach_the_dashboard.py](./TC002_Log_in_as_an_existing_student_and_reach_the_dashboard.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/1cca1193-6577-4bf7-9bb7-6f5123a0e8f1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Block access to protected pages when signed out
- **Test Code:** [TC003_Block_access_to_protected_pages_when_signed_out.py](./TC003_Block_access_to_protected_pages_when_signed_out.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/9acbc1b8-b069-4277-8cec-54f999e53f40
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Submit a completed writing exercise and review the submission in history
- **Test Code:** [TC004_Submit_a_completed_writing_exercise_and_review_the_submission_in_history.py](./TC004_Submit_a_completed_writing_exercise_and_review_the_submission_in_history.py)
- **Test Error:** TEST FAILURE

The student submission could not be created — the application returned an error when attempting to submit and no submission appears in the Submissions page.

Observations:
- After clicking 'Submit' the exercise displayed the message 'Couldn't submit.' under the response field.
- The Submissions page shows 'No submissions' and no new entry for the essay is listed.
- The essay was entered and Submit was clicked once, but the submission did not complete.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/7d387ced-698c-4cbe-ae20-8c1f1f7900a8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Log out and return to the login page
- **Test Code:** [TC005_Log_out_and_return_to_the_login_page.py](./TC005_Log_out_and_return_to_the_login_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/2b6dc91a-fae5-45c6-9e99-9eeb0eddcb30
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Log out and return to the login screen
- **Test Code:** [TC006_Log_out_and_return_to_the_login_screen.py](./TC006_Log_out_and_return_to_the_login_screen.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/2344e365-3e39-46b4-b5a9-82b9170fb2e3
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Submit a writing exercise and see it in submissions
- **Test Code:** [TC007_Submit_a_writing_exercise_and_see_it_in_submissions.py](./TC007_Submit_a_writing_exercise_and_see_it_in_submissions.py)
- **Test Error:** TEST FAILURE

The submission could not be created — the UI returned an error when attempting to submit the exercise, and no submission appears in the Submissions list.

Observations:
- The submit attempt produced a visible error message: "Couldn't submit." on the exercise page.
- The Submissions page displays "No submissions" and does not list the new submission or an "Awaiting" status.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/9b581d1d-a4eb-4bd5-8c53-f72c4722be65
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Start a writing exercise from a module
- **Test Code:** [TC008_Start_a_writing_exercise_from_a_module.py](./TC008_Start_a_writing_exercise_from_a_module.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/284aeb83-2654-44e7-8868-c40fc503b766
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Open a module from the module catalog and launch an exercise
- **Test Code:** [TC009_Open_a_module_from_the_module_catalog_and_launch_an_exercise.py](./TC009_Open_a_module_from_the_module_catalog_and_launch_an_exercise.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/fd45d0c5-246f-4ac8-86b8-07f5ce78535b
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Browse enrolled classes and open a class detail page
- **Test Code:** [TC010_Browse_enrolled_classes_and_open_a_class_detail_page.py](./TC010_Browse_enrolled_classes_and_open_a_class_detail_page.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the student has no enrolled classes to open.

Observations:
- The Classes page shows the message 'No classes yet' and indicates 0 enrolled.
- No class entries are present on the page and there is no way to open class details from this state.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/ff4b4e61-53b6-4201-b519-69d20eafce83
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Browse and open a module from the module list
- **Test Code:** [TC011_Browse_and_open_a_module_from_the_module_list.py](./TC011_Browse_and_open_a_module_from_the_module_list.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/bf61757e-d278-4f78-87a4-181aebd568ac
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Review graded submission feedback and original response
- **Test Code:** [TC012_Review_graded_submission_feedback_and_original_response.py](./TC012_Review_graded_submission_feedback_and_original_response.py)
- **Test Error:** TEST BLOCKED

The test could not be run — no graded submission existed for the student to reopen and review.

Observations:
- The Submissions page displays an empty state: 'No submissions' and the message 'Complete an exercise to see it here.'
- The 'Graded' tab is present but contains no items to open
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/fa5cb4f4-cec8-4bc2-8aba-062fb3afa6cb
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Open a module from the list without filtering
- **Test Code:** [TC013_Open_a_module_from_the_list_without_filtering.py](./TC013_Open_a_module_from_the_list_without_filtering.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/3c641da5-6bcb-45b6-9ed7-963d5aee25d1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Review graded submission details
- **Test Code:** [TC014_Review_graded_submission_details.py](./TC014_Review_graded_submission_details.py)
- **Test Error:** TEST BLOCKED

The test could not be run — there are no graded submissions available for this student account, so a graded submission cannot be opened to verify score, feedback, and original work.

Observations:
- The My submissions → Graded view displays 'No submissions' with the helper text 'Complete an exercise to see it here.'
- No graded submission items (cards or list entries) are visible on the page.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/ed168da6-3347-4dd9-bc9d-09bfa06a8447
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Update profile details and log out
- **Test Code:** [TC015_Update_profile_details_and_log_out.py](./TC015_Update_profile_details_and_log_out.py)
- **Test Error:** TEST FAILURE

The profile changes were saved but the app shell did not reflect the updated avatar and full name.

Observations:
- The profile form shows Full name 'Tuan Phuon E2E' and Avatar URL 'https://i.pravatar.cc/150?img=3' and the page displayed 'Saved.'
- The app shell still displayed initials 'TP' and did not show the new avatar image or the updated full name in the visible app shell/greeting.
- After clicking 'Log out', the login screen with Email and Password fields was displayed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/faf1ba31-e225-48d2-9a3c-83b6570ffd3b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Update profile details and see them reflected in the app shell
- **Test Code:** [TC016_Update_profile_details_and_see_them_reflected_in_the_app_shell.py](./TC016_Update_profile_details_and_see_them_reflected_in_the_app_shell.py)
- **Test Error:** TEST FAILURE

The profile name update succeeded and the avatar URL was saved, but the new avatar image was not reflected in the app shell.

Observations:
- The profile page shows 'Tuan Phuon Edited' and the Full name input value is 'Tuan Phuon Edited'.
- The Avatar URL input value is 'https://example.com/new-avatar.png' and the page displayed a 'Saved.' confirmation.
- The app shell still shows initials ('TP') and no profile image, so the avatar change is not visibly reflected in the shell.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/5978feb6-c4cd-476e-8009-727f6c0829b4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 Filter submissions by status
- **Test Code:** [TC017_Filter_submissions_by_status.py](./TC017_Filter_submissions_by_status.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/b53bf50e-c92d-4653-bea6-af3971b45236
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 Handle an empty classes list by linking to the module catalog
- **Test Code:** [TC018_Handle_an_empty_classes_list_by_linking_to_the_module_catalog.py](./TC018_Handle_an_empty_classes_list_by_linking_to_the_module_catalog.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/60c6ef0e-ee66-48c4-9b30-986dc6f7ddf6
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 Show validation feedback for an incomplete exercise response
- **Test Code:** [TC019_Show_validation_feedback_for_an_incomplete_exercise_response.py](./TC019_Show_validation_feedback_for_an_incomplete_exercise_response.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/51684274-b462-4b4c-aa06-6cf201a26cc6
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC020 Handle an empty submissions history
- **Test Code:** [TC020_Handle_an_empty_submissions_history.py](./TC020_Handle_an_empty_submissions_history.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6c80157d-b929-4fac-ad59-94d8c5b5c22d/de330113-d637-49b4-970b-203e12b5631e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **60.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---