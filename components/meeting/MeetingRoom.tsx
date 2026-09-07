"use client";
// Full-bleed 1:1 meeting room: remote video as the stage, local preview as a
// picture-in-picture tile, control bar at the bottom. Permission-state UI
// follows RecorderPanel (unsupported note / denied panel / spinner while
// requesting); the connection states come from useMeetingRtc.
//
// The room fills its container exactly (h-full + overflow-hidden, every row
// shrink-0 except the stage, which is min-h-0): video must never push the
// controls off-screen or make the page scroll. The one-viewport clamp lives on
// the (meeting) group layout, which is fixed + h-dvh.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEndMeeting, useMeeting } from "@/lib/hooks";
import { useMeetingRtc } from "@/lib/use-meeting-rtc";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/cn";
import { durationLabel } from "@/lib/format";
import { Badge, Button, ErrorState, FullScreenLoader, Spinner } from "@/components/ui";

// Ticking clock counting from the room's server-stamped start instant, so
// both peers show the same elapsed time.
function MeetingTimer({ startedAt }: { startedAt: string }) {
  const origin = new Date(startedAt).getTime();
  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Math.floor((Date.now() - origin) / 1000)),
  );

  useEffect(() => {
    const id = window.setInterval(
      () => setElapsed(Math.max(0, Math.floor((Date.now() - origin) / 1000))),
      1000,
    );
    return () => window.clearInterval(id);
  }, [origin]);

  return (
    <span className="flex items-center gap-1.5 font-mono text-sm tabular-nums text-white">
      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
      {durationLabel(elapsed)}
    </span>
  );
}

function VideoSurface({
  stream,
  muted = false,
  mirrored = false,
  className,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  mirrored?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={cn("h-full w-full object-cover", mirrored && "-scale-x-100", className)}
    />
  );
}

export function MeetingRoom({ meetingId }: { meetingId: number }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { role } = useAuth();
  const meeting = useMeeting(meetingId);
  const endMeeting = useEndMeeting();
  const rtc = useMeetingRtc(meetingId);
  const canEnd = role === "teacher" || role === "admin";
  // The socket's "ready" frame is authoritative (it may have just stamped the
  // start); the fetched row covers a peer who joined after the room opened.
  const startedAt = rtc.startedAt ?? meeting.data?.started_at ?? null;

  // Refetch the row when the room opens (joining flips a scheduled meeting to
  // active — the header badge would otherwise still read "scheduled") and when
  // it ends (the peer who did not press End learns over the socket, and the
  // ended panel needs the final duration).
  useEffect(() => {
    if (rtc.state === "ended" || rtc.startedAt) {
      qc.invalidateQueries({ queryKey: qk.meeting(meetingId) });
    }
  }, [rtc.state, rtc.startedAt, qc, meetingId]);

  const leave = () => router.push("/meetings");
  const end = () => {
    // Server broadcasts meeting_ended; our own teardown happens on unmount.
    endMeeting.mutate(meetingId, { onSettled: leave });
  };

  if (meeting.isLoading) return <FullScreenLoader />;
  if (meeting.isError || !meeting.data) {
    return (
      <div className="mx-auto max-w-md p-6">
        <ErrorState message="Couldn’t load this meeting." />
        <Button variant="outline" className="mt-4" onClick={leave}>
          Back to meetings
        </Button>
      </div>
    );
  }

  // Terminal room states get a simple centered panel instead of the stage.
  if (
    rtc.state === "unsupported" ||
    rtc.state === "denied" ||
    rtc.state === "ended" ||
    rtc.state === "full"
  ) {
    const copy = {
      unsupported: {
        title: "This browser can’t run video calls",
        hint: "WebRTC or camera access is unavailable. Try a recent Chrome, Edge, or Safari.",
      },
      denied: {
        title: "Camera and microphone blocked",
        hint: "Allow camera and microphone access for this site in the browser address bar, then rejoin.",
      },
      ended: {
        title: "This meeting has ended",
        hint: "The teacher closed the room, or it no longer exists.",
      },
      full: {
        title: "This room is full",
        hint: "Meetings are one-to-one; two participants are already connected.",
      },
    }[rtc.state];
    const finalSeconds = meeting.data.duration_seconds;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 overflow-hidden p-6 text-center">
        <p className="text-lg font-semibold text-zinc-800">{copy.title}</p>
        <p className="max-w-sm text-sm text-zinc-500">{copy.hint}</p>
        {rtc.state === "ended" && finalSeconds != null && (
          <p className="font-mono text-sm tabular-nums text-zinc-600">
            Lasted {durationLabel(finalSeconds)}
          </p>
        )}
        <Button variant="outline" onClick={leave}>
          Back to meetings
        </Button>
      </div>
    );
  }

  const statusLabel =
    rtc.state === "requesting"
      ? "Requesting camera & microphone…"
      : rtc.state === "waiting"
        ? "Waiting for the other participant…"
        : rtc.state === "connecting"
          ? `Connecting to ${rtc.peer?.full_name || "peer"}…`
          : rtc.state === "error"
            ? "Connection problem — try leaving and rejoining."
            : null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-900">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-medium text-white">{meeting.data.title}</p>
          <Badge kind={meeting.data.status}>{meeting.data.status}</Badge>
        </div>
        <div className="flex items-center gap-3">
          {startedAt && <MeetingTimer startedAt={startedAt} />}
          <p className="hidden text-sm text-zinc-400 sm:block">{meeting.data.class_name}</p>
        </div>
      </header>

      <div className="relative mx-4 min-h-0 flex-1 overflow-hidden rounded-lg bg-black">
        {rtc.remoteStream ? (
          <VideoSurface stream={rtc.remoteStream} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-400">
            {(rtc.state === "requesting" || rtc.state === "connecting") && <Spinner className="h-6 w-6" />}
            {statusLabel && <p className="px-6 text-center text-sm">{statusLabel}</p>}
          </div>
        )}
        {rtc.peer && rtc.remoteStream && (
          <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
            {rtc.peer.full_name} · {rtc.peer.role}
          </span>
        )}
        {/* Local picture-in-picture preview */}
        <div className="absolute right-3 top-3 aspect-video w-32 overflow-hidden rounded-md border border-zinc-700 bg-zinc-800 sm:w-44">
          {rtc.localStream && rtc.camOn ? (
            <VideoSurface stream={rtc.localStream} muted mirrored />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              <VideoOff size={20} />
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 px-4 py-4">
        <Button
          variant={rtc.micOn ? "outline" : "danger"}
          onClick={rtc.toggleMic}
          title={rtc.micOn ? "Mute microphone" : "Unmute microphone"}
        >
          {rtc.micOn ? <Mic size={16} /> : <MicOff size={16} />}
        </Button>
        <Button
          variant={rtc.camOn ? "outline" : "danger"}
          onClick={rtc.toggleCam}
          title={rtc.camOn ? "Turn camera off" : "Turn camera on"}
        >
          {rtc.camOn ? <Video size={16} /> : <VideoOff size={16} />}
        </Button>
        <Button variant="danger" onClick={leave} title="Leave the room">
          <PhoneOff size={16} />
          Leave
        </Button>
        {canEnd && (
          <Button
            variant="outline"
            onClick={end}
            loading={endMeeting.isPending}
            title="End the meeting for everyone"
          >
            End meeting
          </Button>
        )}
      </div>
    </div>
  );
}
