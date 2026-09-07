"use client";
// P2P meeting hook (feature 05): camera+mic acquisition, WebRTC peer
// connection, and signaling over ws/meetings/<id>/ in one lifecycle state
// machine, mirroring use-recorder's stance: explicit permission states and
// hardware that is ALWAYS released on unmount.
//
// Signaling protocol (server = dumb relay, core.consumers.MeetingSignalConsumer):
//   join   -> server sends us {type:"ready"} and relays {type:"peer_joined"} to
//             the peer already in the room; THAT peer creates the offer, so the
//             two sides never both offer (no glare in the 1:1 case).
//   offer/answer carry a `from` identity so the second joiner learns who is on
//   the other end (peer_joined only reaches the first joiner).
//   ice    -> trickle ICE candidates, queued until the remote description is set.
//   peer_left / meeting_ended -> tear down the connection (room stays / closes).
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./auth-context";
import { openSocket } from "./ws";

export type MeetingRtcState =
  | "idle"
  | "unsupported"
  | "requesting"
  | "denied"
  | "waiting" // in the room, no peer yet
  | "connecting" // negotiating with a peer
  | "connected"
  | "full" // the room already has its two participants (server 4409)
  | "ended" // meeting ended (server) or room no longer joinable
  | "error";

export interface PeerInfo {
  user_id: number;
  full_name: string;
  role: string;
}

type SignalFrame = {
  type?: string;
  // ISO timestamp on the "ready" frame: when the room's clock started.
  started_at?: string | null;
  sdp?: string;
  candidate?: RTCIceCandidateInit | null;
  from?: PeerInfo;
  user_id?: number;
  full_name?: string;
  role?: string;
  detail?: string;
  // Server-stamped id of the originating connection; lets us drop stale
  // frames from a peer's OLD connection after they rejoin.
  sid?: string;
};

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useMeetingRtc(meetingId: number) {
  const { user, role } = useAuth();
  const [state, setState] = useState<MeetingRtcState>("idle");
  const [peer, setPeer] = useState<PeerInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  // Room clock origin, handed to us by the server on "ready" so both peers
  // count from the same instant regardless of who joined first.
  const [startedAt, setStartedAt] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // ICE candidates that arrived before setRemoteDescription (trickle race).
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const closedByUsRef = useRef(false);
  // Who we're connected to (user identity + their current connection's sid).
  const peerRef = useRef<PeerInfo | null>(null);
  const peerSidRef = useRef<string | null>(null);
  const userId = user?.id;
  const fullName = user?.full_name;

  useEffect(() => {
    if (!Number.isFinite(meetingId) || userId == null) return;
    let cancelled = false;
    closedByUsRef.current = false;

    const send = (frame: SignalFrame) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(frame));
    };

    const teardownPeer = () => {
      pcRef.current?.close();
      pcRef.current = null;
      pendingIceRef.current = [];
      peerRef.current = null;
      peerSidRef.current = null;
      setRemoteStream(null);
      setPeer(null);
    };

    const adoptPeer = (info: PeerInfo, sid: string | undefined) => {
      peerRef.current = info;
      peerSidRef.current = sid ?? null;
      setPeer(info);
    };

    // Release camera/mic on terminal states, not just on unmount — the
    // "ended"/"full" panels must not keep the webcam LED lit.
    const releaseMedia = () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    };

    const createPeer = (): RTCPeerConnection => {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      const stream = localStreamRef.current;
      for (const track of stream?.getTracks() ?? []) {
        pc.addTrack(track, stream!);
      }
      pc.onicecandidate = (e) => {
        if (e.candidate) send({ type: "ice", candidate: e.candidate.toJSON() });
      };
      pc.ontrack = (e) => {
        if (e.streams[0]) setRemoteStream(e.streams[0]);
      };
      pc.onconnectionstatechange = () => {
        if (cancelled) return;
        if (pc.connectionState === "connected") setState("connected");
        else if (pc.connectionState === "failed") setState("error");
      };
      return pc;
    };

    const drainPendingIce = async (pc: RTCPeerConnection) => {
      for (const candidate of pendingIceRef.current.splice(0)) {
        try {
          await pc.addIceCandidate(candidate);
        } catch {
          // A dropped candidate degrades, not breaks, connectivity.
        }
      }
    };

    const self: PeerInfo = {
      user_id: userId,
      full_name: fullName ?? "",
      role: role ?? "student",
    };

    const onMessage = async (raw: unknown) => {
      if (cancelled) return;
      const msg = raw as SignalFrame;
      const pc = pcRef.current;
      try {
        switch (msg.type) {
          case "ready":
            // We are in the room; the resident peer will hear peer_joined.
            if (msg.started_at) setStartedAt(msg.started_at);
            break;
          case "peer_joined": {
            // We were here first -> we make the offer. A DIFFERENT user while
            // a call is up would be a third party (the server caps the room at
            // two, so this is belt-and-braces) — ignore them. The SAME user
            // rejoining means the previous connection is stale: start clean.
            if (
              pcRef.current &&
              peerRef.current &&
              peerRef.current.user_id !== (msg.user_id ?? 0)
            ) {
              break;
            }
            teardownPeer();
            adoptPeer(
              {
                user_id: msg.user_id ?? 0,
                full_name: msg.full_name ?? "",
                role: msg.role ?? "",
              },
              msg.sid,
            );
            setState("connecting");
            const newPc = createPeer();
            const offer = await newPc.createOffer();
            await newPc.setLocalDescription(offer);
            send({ type: "offer", sdp: offer.sdp, from: self });
            break;
          }
          case "offer": {
            // We joined second; the resident peer offers and identifies itself.
            if (msg.from) adoptPeer(msg.from, msg.sid);
            setState("connecting");
            const newPc = pc ?? createPeer();
            if (newPc.signalingState === "have-local-offer") {
              // Offer glare: both sides joined near-simultaneously and both
              // offered. Deterministic tie-break: the LOWER user_id keeps its
              // offer; the higher one rolls back and answers.
              const polite = self.user_id > (msg.from?.user_id ?? 0);
              if (!polite) break; // their client rolls back and answers ours
              await newPc.setLocalDescription({ type: "rollback" });
            }
            await newPc.setRemoteDescription({ type: "offer", sdp: msg.sdp });
            await drainPendingIce(newPc);
            const answer = await newPc.createAnswer();
            await newPc.setLocalDescription(answer);
            send({ type: "answer", sdp: answer.sdp, from: self });
            break;
          }
          case "answer": {
            if (!pc) return;
            if (msg.from) adoptPeer(msg.from, msg.sid);
            await pc.setRemoteDescription({ type: "answer", sdp: msg.sdp });
            await drainPendingIce(pc);
            break;
          }
          case "ice": {
            if (!msg.candidate) return;
            // Drop candidates from a connection that is not our current peer's.
            if (msg.sid && peerSidRef.current && msg.sid !== peerSidRef.current) break;
            if (pc && pc.remoteDescription) await pc.addIceCandidate(msg.candidate);
            else pendingIceRef.current.push(msg.candidate);
            break;
          }
          case "peer_left":
            // A late peer_left from the peer's OLD connection (they rejoined
            // and we already renegotiated) must not tear down the new call.
            if (msg.sid && peerSidRef.current && msg.sid !== peerSidRef.current) break;
            teardownPeer();
            setState("waiting");
            break;
          case "meeting_ended":
            teardownPeer();
            releaseMedia();
            closedByUsRef.current = true; // our own close must not flip to "error"
            wsRef.current?.close();
            wsRef.current = null;
            setState("ended");
            break;
          default:
            break; // server "error" acks for unknown frames — nothing to do
        }
      } catch {
        if (!cancelled) setState("error");
      }
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
        setState("unsupported");
        return;
      }
      setState("requesting");
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch {
        if (!cancelled) setState("denied");
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMicOn(true);
      setCamOn(true);

      const ws = openSocket(`/ws/meetings/${meetingId}/`, onMessage);
      wsRef.current = ws;
      ws.onclose = (e) => {
        if (cancelled || closedByUsRef.current) return;
        // 4404 = meeting missing/ended, 4409 = room already has two peers,
        // 4403 = not a participant, 4401 = auth failure.
        if (e.code === 4404 || e.code === 4409) {
          teardownPeer();
          releaseMedia();
          setState(e.code === 4404 ? "ended" : "full");
        } else {
          setState("error");
        }
      };
      setState("waiting");
    };

    void start();

    return () => {
      cancelled = true;
      closedByUsRef.current = true;
      pcRef.current?.close();
      pcRef.current = null;
      pendingIceRef.current = [];
      wsRef.current?.close();
      wsRef.current = null;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
      setPeer(null);
    };
  }, [meetingId, userId, fullName, role]);

  const toggleMic = useCallback(() => {
    const tracks = localStreamRef.current?.getAudioTracks() ?? [];
    const next = !(tracks[0]?.enabled ?? true);
    tracks.forEach((t) => (t.enabled = next));
    setMicOn(next);
  }, []);

  const toggleCam = useCallback(() => {
    const tracks = localStreamRef.current?.getVideoTracks() ?? [];
    const next = !(tracks[0]?.enabled ?? true);
    tracks.forEach((t) => (t.enabled = next));
    setCamOn(next);
  }, []);

  return {
    state,
    peer,
    localStream,
    remoteStream,
    micOn,
    camOn,
    startedAt,
    toggleMic,
    toggleCam,
  };
}
