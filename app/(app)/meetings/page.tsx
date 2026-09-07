"use client";
// Meetings list (/meetings). Teacher: start a room for one of their classes
// (create modal) and end active ones. Student: join active rooms of enrolled
// classes. The live room itself is the shell-less (meeting)/meetings/[id].
import { useState } from "react";
import Link from "next/link";
import { Video } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { useClasses, useCreateMeeting, useEndMeeting, useMeetings } from "@/lib/hooks";
import { dateLabel, dateTimeLabel, durationLabel } from "@/lib/format";
import type { Meeting } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  Skeleton,
  TextField,
} from "@/components/ui";

export default function MeetingsPage() {
  const { role } = useAuth();
  const isTeacher = role === "teacher" || role === "admin";
  const meetings = useMeetings();
  const [createOpen, setCreateOpen] = useState(false);
  const list = meetings.data ?? [];
  const active = list.filter((m) => m.status === "active");
  // Soonest booking first — the opposite of the newest-first list order.
  const scheduled = list
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));
  const past = list.filter((m) => m.status === "ended");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Meetings"
        subtitle={meetings.data ? `${active.length} live now` : undefined}
        action={
          isTeacher ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Video size={16} />
              Start meeting
            </Button>
          ) : undefined
        }
      />

      {meetings.isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : meetings.isError ? (
        <ErrorState message="Couldn’t load meetings." />
      ) : list.length === 0 ? (
        <EmptyState
          title="No meetings yet"
          hint={
            isTeacher
              ? "Start a meeting and students of that class can join instantly."
              : "When your teacher starts a meeting it will appear here."
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((m) => (
              <MeetingCard key={m.id} meeting={m} joinable canEnd={isTeacher} />
            ))}
          </div>
          {scheduled.length > 0 && (
            <>
              <h2 className="pt-2 text-sm font-semibold text-zinc-500">Upcoming</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {scheduled.map((m) => (
                  <MeetingCard key={m.id} meeting={m} joinable canEnd={isTeacher} />
                ))}
              </div>
            </>
          )}
          {past.length > 0 && (
            <>
              <h2 className="pt-2 text-sm font-semibold text-zinc-500">Past meetings</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {past.map((m) => (
                  <MeetingCard key={m.id} meeting={m} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {isTeacher && <CreateMeetingModal open={createOpen} onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

function MeetingCard({
  meeting,
  joinable = false,
  canEnd = false,
}: {
  meeting: Meeting;
  joinable?: boolean;
  canEnd?: boolean;
}) {
  const endMeeting = useEndMeeting();
  const isScheduled = meeting.status === "scheduled";
  return (
    <Card accent={joinable && !isScheduled} className="flex items-center justify-between gap-3">
      <div className="min-w-0 space-y-0.5">
        <p className="truncate font-medium">{meeting.title}</p>
        <p className="text-xs text-zinc-500">
          {meeting.class_name} ·{" "}
          {isScheduled
            ? `starts ${dateTimeLabel(meeting.scheduled_at)}`
            : dateLabel(meeting.created_at)}
          {meeting.created_by_name ? ` · ${meeting.created_by_name}` : ""}
        </p>
        {/* Post-meeting timer: how long the call actually ran. */}
        {meeting.status === "ended" && meeting.duration_seconds != null && (
          <p className="font-mono text-xs tabular-nums text-zinc-500">
            {durationLabel(meeting.duration_seconds)}
          </p>
        )}
      </div>
      {joinable ? (
        <div className="flex shrink-0 items-center gap-2">
          {canEnd && (
            <Button
              variant="outline"
              size="sm"
              loading={endMeeting.isPending}
              onClick={() => endMeeting.mutate(meeting.id)}
            >
              {isScheduled ? "Cancel" : "End"}
            </Button>
          )}
          <Link
            href={`/meetings/${meeting.id}`}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            {isScheduled ? "Start" : "Join"}
          </Link>
        </div>
      ) : (
        <Badge kind={meeting.status}>{meeting.status}</Badge>
      )}
    </Card>
  );
}

function CreateMeetingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const classes = useClasses();
  const createMeeting = useCreateMeeting();
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState<number | "">("");
  // Browser-local "YYYY-MM-DDTHH:mm"; empty means start the room now.
  const [when, setWhen] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!title.trim() || classId === "") {
      setError("Pick a class and give the meeting a title.");
      return;
    }
    let scheduledAt: string | null = null;
    if (when) {
      const parsed = new Date(when); // datetime-local is in the user's zone
      if (Number.isNaN(parsed.getTime())) {
        setError("That date and time isn’t valid.");
        return;
      }
      if (parsed.getTime() < Date.now()) {
        setError("Pick a date and time in the future.");
        return;
      }
      scheduledAt = parsed.toISOString();
    }
    setError(null);
    createMeeting.mutate(
      { class_id: classId, title: title.trim(), scheduled_at: scheduledAt },
      {
        onSuccess: () => {
          setTitle("");
          setClassId("");
          setWhen("");
          onClose();
        },
        onError: (err) =>
          setError(err instanceof ApiError ? err.message : "Something went wrong"),
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Start a meeting">
      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="block text-sm font-medium text-zinc-700">Class</span>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : "")}
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          >
            <option value="">Select a class…</option>
            {(classes.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_name}
              </option>
            ))}
          </select>
        </label>
        <TextField
          label="Title"
          placeholder="e.g. Speaking practice with Ms. Vy"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label="Date and time (optional)"
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
        />
        <p className="text-xs text-zinc-500">
          Leave empty to open the room right away. A booked meeting appears under
          Upcoming and opens when either of you joins.
        </p>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={createMeeting.isPending}>
            {when ? "Schedule" : "Start"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
