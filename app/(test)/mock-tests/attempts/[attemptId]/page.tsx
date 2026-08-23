"use client";
// Full-screen test runner. The URL is /mock-tests/attempts/{id} — the `(test)`
// group is stripped from the path and only selects the minimal layout.
//
// This route consumes the attempt-detail payload exclusively. It must never
// call getExercise/useExercise: that serializer exposes `is_correct`, and a
// student sitting the test can read anything the browser receives.
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTestAttempt } from "@/lib/hooks";
import { ErrorState, FullScreenLoader } from "@/components/ui";
import { TestRunnerShell } from "@/components/mock-test/TestRunnerShell";

export default function TestRunnerPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = Number(params.attemptId);
  const router = useRouter();
  const attempt = useTestAttempt(attemptId);
  const status = attempt.data?.status;

  // A finished attempt has nothing to run; send it to the report so a stale
  // bookmark does not land on an empty screen.
  useEffect(() => {
    if (status === "completed") {
      router.replace(`/mock-tests/attempts/${attemptId}/report`);
    }
  }, [status, attemptId, router]);

  if (attempt.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FullScreenLoader />
      </div>
    );
  }
  if (attempt.isError || !attempt.data) {
    return (
      <div className="mx-auto max-w-md py-20">
        <ErrorState message="Couldn't load this test attempt." />
      </div>
    );
  }

  return <TestRunnerShell attempt={attempt.data} />;
}
