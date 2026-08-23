"use client";
// The two ways a section ends: the student chooses to submit, or the clock does
// it for them. Both funnel into the same submit call — the difference is that
// TimeUpDialog offers no way out.
import { AlertTriangle } from "lucide-react";
import { Button, Modal } from "@/components/ui";

export function SubmitSectionDialog({
  open,
  onClose,
  onConfirm,
  submitting,
  answered,
  total,
  isLastSection,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
  answered: number;
  total: number;
  isLastSection: boolean;
  error?: string | null;
}) {
  const unanswered = Math.max(0, total - answered);

  return (
    <Modal open={open} onClose={onClose} title="Submit this section?">
      <div className="space-y-4">
        {total > 0 && (
          <p className="text-sm text-zinc-700">
            You have answered <strong>{answered}</strong> of {total} questions.
          </p>
        )}
        {unanswered > 0 && (
          <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              {unanswered} question{unanswered === 1 ? "" : "s"} left unanswered.
              Unanswered questions score zero.
            </span>
          </p>
        )}
        <p className="text-sm text-zinc-500">
          You cannot return to this section once it is submitted.
          {isLastSection
            ? " This is the last section — your report follows."
            : " The next section starts after this."}
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Keep working
          </Button>
          <Button onClick={onConfirm} loading={submitting}>
            Submit section
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function TimeUpDialog({
  open,
  onSubmit,
  submitting,
  error,
}: {
  open: boolean;
  onSubmit: () => void;
  submitting?: boolean;
  error?: string | null;
}) {
  return (
    // No-op onClose: dismissing this would imply the section is still editable.
    // The server already stopped accepting writes.
    <Modal open={open} onClose={() => {}} title="Time's up">
      <div className="space-y-4">
        <p className="text-sm text-zinc-700">
          This section&rsquo;s time has run out. Everything you saved has been
          kept — submit to record your answers and continue.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button onClick={onSubmit} loading={submitting}>
            Submit section
          </Button>
        </div>
      </div>
    </Modal>
  );
}
