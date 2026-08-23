"use client";
// Shared microphone recorder hook (doc 04 §4.3): a permission/lifecycle state
// machine over native MediaRecorder, an AnalyserNode for the level meter, a
// ticking elapsed clock, a max-duration hard stop, and always-released
// hardware. Consumers: pronunciation RecorderPanel (raw Blob -> FormData) and
// the mock-test speaking pane (Blob -> data URL via blobToDataUrl). The submit
// contract differs; the capture does not.
import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState =
  | "idle"
  | "requesting"
  | "recording"
  | "recorded"
  | "denied"
  | "unsupported";

export interface Recording {
  blob: Blob;
  url: string;
  durationMs: number;
  mimeType: string;
}

// Preference order; the server transcodes whatever we send (doc 04 §3.1).
function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

export function useRecorder({ maxDurationMs = 120_000 } = {}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [recording, setRecording] = useState<Recording | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startedAtRef = useRef(0);
  const stopTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);

  const releaseHardware = useCallback(() => {
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAnalyser(null);
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (tickTimerRef.current !== null) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setState("unsupported");
      return;
    }
    setState("requesting");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const type = mimeType || recorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type });
        setRecording({
          blob,
          url: URL.createObjectURL(blob),
          durationMs: Date.now() - startedAtRef.current,
          mimeType: type,
        });
        setState("recorded");
        releaseHardware();
      };

      // Level meter: analyser off the same stream, never wired to output.
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const source = ctx.createMediaStreamSource(stream);
          const node = ctx.createAnalyser();
          node.fftSize = 1024;
          source.connect(node);
          audioContextRef.current = ctx;
          setAnalyser(node);
        }
      } catch {
        /* level meter is optional — recording still works without it */
      }

      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      recorder.start();
      setState("recording");
      // Hard cap: an unbounded recording is an unbounded upload.
      stopTimerRef.current = window.setTimeout(stop, maxDurationMs);
      tickTimerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, 200);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotFoundError"
          ? "No microphone found."
          : "Microphone permission denied.",
      );
      setState("denied");
      releaseHardware();
    }
  }, [maxDurationMs, releaseHardware, stop]);

  const reset = useCallback(() => {
    setRecording((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    setElapsedMs(0);
    setError(null);
    setState("idle");
  }, []);

  // Stop if the tab is backgrounded mid-recording (mobile suspends timers).
  useEffect(() => {
    if (state !== "recording") return;
    const onHide = () => {
      if (document.visibilityState === "hidden") stop();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [state, stop]);

  useEffect(() => () => releaseHardware(), [releaseHardware]);

  return { state, recording, analyser, elapsedMs, error, start, stop, reset };
}

/** Convert a recorded Blob to a data URL. Called once, at submit. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read recording"));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read recording"));
    reader.readAsDataURL(blob);
  });
}
