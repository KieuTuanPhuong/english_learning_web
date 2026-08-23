"use client";
// Listening audio that plays exactly once, like the real exam.
//
// A native <audio> with its controls hidden, rather than a player library:
// play-once is a UI *subtraction* problem, and an audio library's entire value
// is the seek/replay surface we would then have to remove. `ended` reports
// upward so the played flag is persisted in the server draft — that is what
// survives a refresh.
//
// Honest limitation: the media URL is still fetchable directly, so this is a
// deterrent, not enforcement. Signed, expiring URLs arrive with the shared
// file-storage work.
import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui";

export function PlayOnceAudio({
  src,
  alreadyPlayed,
  onStarted,
  onEnded,
}: {
  src: string;
  alreadyPlayed: boolean;
  onStarted: () => void;
  onEnded: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Held in a ref so the listener effect below binds once instead of
  // re-subscribing on every parent render.
  const endedRef = useRef(onEnded);
  useEffect(() => {
    endedRef.current = onEnded;
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => {
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onDone = () => {
      setPlaying(false);
      setProgress(100);
      endedRef.current();
    };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onDone);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onDone);
    };
  }, []);

  const start = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || alreadyPlayed || playing) return;
    // Flag the play *before* the clip finishes: a student who reloads mid-clip
    // must not get a fresh listen.
    onStarted();
    setPlaying(true);
    void audio.play();
  }, [alreadyPlayed, onStarted, playing]);

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-center gap-3">
        <Volume2 size={18} className="shrink-0 text-zinc-500" aria-hidden />
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-700">
            {alreadyPlayed ? "Audio already played" : "Listening audio"}
          </p>
          <p className="text-xs text-zinc-500">
            {alreadyPlayed
              ? "This recording can only be played once."
              : "Plays once only — no pause, rewind, or replay."}
          </p>
        </div>
        {!alreadyPlayed && (
          <Button type="button" size="sm" onClick={start} disabled={playing}>
            <Play size={14} aria-hidden />
            {playing ? "Playing…" : "Play"}
          </Button>
        )}
      </div>

      {/* Read-only progress: an <input type="range"> here would be a seek bar. */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${alreadyPlayed ? 100 : progress}%` }}
        />
      </div>

      <audio ref={audioRef} src={src} preload="auto" className="hidden" />
    </div>
  );
}
