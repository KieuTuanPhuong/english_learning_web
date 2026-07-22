# 07 — Realtime WebSockets (optional enhancement)

**Status:** Proposed (optional) · **Depends on:** [01](./01-types-and-api-client.md), [02](./02-dashboards-and-inbox.md), [05](./05-ai-practice-and-evaluate.md) · **Backend refs:** `ws/notifications/`, `ws/speaking/<exercise_id>/` (english-learning-api/docs/illms-upgrade/08)

**Blast radius:** `lib/ws.ts` (NEW), `lib/hooks.ts` (+`useRealtimeNotifications`, optional +`useSpeakingSession`), `app/(app)/layout.tsx` or the authed shell (mount the listener), optional minimal toast in `components/ui.tsx`.

> The FE's own MVP plan listed realtime as **out of scope** (`docs/IMPLEMENTATION_PLAN.md` §10). This brief is additive polish — ship it after 01–06. In dev the backend uses an in-process channel layer (no Redis), so it works under `runserver`/daphne but `group_send` is single-process only.

---

## Goal
Connect the client to the backend's WebSocket surface: live classroom notifications (new assignment, feedback posted) that toast + refresh the relevant queries, and (optional) a live speaking session.

## Why (gap)
No socket code exists (Explore map §6). Backend now serves: `ws/notifications/?token=<jwt>` (broadcasts `{event:"assignment_created"|"feedback_posted", ...}` to the user's class groups) and `ws/speaking/<exercise_id>/?token=<jwt>` (frames: `{type:"ready"}` → `{type:"ack",chunk}` → `{type:"result",score,comments,transcript}`). Auth is the access token via `?token=` query (consumers reject missing/suspended with close code `4401`).

## Changes (file by file)

### `lib/ws.ts` (NEW) — socket helper
```ts
import { API_BASE_URL } from "./env";
import { getAccessToken } from "./api";

// http(s)://host -> ws(s)://host
function wsBase(): string {
  return API_BASE_URL.replace(/^http/, "ws");
}

export function openSocket(path: string, onMessage: (data: unknown) => void): WebSocket {
  const token = getAccessToken() ?? "";
  const ws = new WebSocket(`${wsBase()}${path}?token=${encodeURIComponent(token)}`);
  ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch { /* ignore non-JSON */ } };
  return ws;
}
```
> Access token is in memory (~1h TTL). For a long-lived socket, reconnect on `onclose` and re-read `getAccessToken()` (after `apiFetch` has refreshed it on some HTTP call). Keep reconnect simple: backoff + give up after N tries; close code `4401` means re-auth (don't hammer).

### `lib/hooks.ts` — notifications listener
```ts
export function useRealtimeNotifications() {
  const qc = useQueryClient();
  useEffect(() => {
    const ws = openSocket("/ws/notifications/", (msg) => {
      const m = msg as { event?: string };
      // refresh whatever the event touches
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.submissionsInbox() });
      if (m.event === "assignment_created") qc.invalidateQueries({ queryKey: qk.classes });
      if (m.event === "feedback_posted") qc.invalidateQueries({ queryKey: qk.mySubmissions });
      // optional: push a toast with a human label
    });
    return () => ws.close();
  }, [qc]);
}
```
Mount it once inside the authed shell (e.g. top of `app/(app)/layout.tsx` after the auth guard, or in `AppShell`) so it lives for the whole session and is torn down on logout/unmount. Guard against running before a token exists.

### (Optional) `useSpeakingSession(exerciseId)` — live speaking
Only if you want the live experience beyond brief 05's one-shot AI practice. Open `ws/speaking/<exerciseId>/`, send `{type:"audio_chunk",data}` frames (mock string payloads — no real audio capture required), then `{type:"end", audio_recording_url}`; render the `{type:"result"}` score/comments. Reuse `<AiTag/>`. This duplicates brief 05's scoring over a socket; treat as a demo of the realtime path, not a replacement.

### (Optional) toast
Explore found a `Modal` but no toast primitive. If you want non-blocking notification UI, add a minimal toast to `components/ui.tsx` (a fixed-position list + a tiny context), or just `console`/badge for MVP. Don't block 07 on a full toast system.

## Acceptance criteria
- [ ] With two browser sessions (teacher + enrolled student) on the upgraded backend under `daphne`/`runserver`: teacher posts feedback → student's dashboard/submissions refresh within ~1s (and toast if implemented).
- [ ] A socket opened without a token closes (4401) and the client does not infinite-reconnect.
- [ ] `ws://`/`wss://` is derived correctly from `NEXT_PUBLIC_API_URL` (http→ws, https→wss).
- [ ] `yarn typecheck`/`yarn lint` pass; logout closes the socket.

## Deferred / out of scope
- Production multi-process delivery (needs backend `REDIS_URL` + daphne — backend brief 08 marks it deferred infra).
- Real microphone capture / audio streaming (frames are mock strings).
- Durable/unread notification store (ephemeral fire-and-forget only).
