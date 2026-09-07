"use client";
// Live meeting room at /meetings/[id] — lives in the shell-less (meeting) group;
// the meetings list stays under (app) at /meetings (groups share one URL space,
// so only the leaf differs, mirroring the (app)/(test) mock-tests split).
import { useParams } from "next/navigation";
import { MeetingRoom } from "@/components/meeting/MeetingRoom";

export default function MeetingRoomPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  return <MeetingRoom meetingId={id} />;
}
