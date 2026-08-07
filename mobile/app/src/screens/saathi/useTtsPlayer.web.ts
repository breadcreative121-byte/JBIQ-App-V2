import { useCallback, useEffect, useRef } from 'react';

type Handlers = {
  onStart?: () => void;
  onDone?: () => void;
};

// Web build of the TTS player. expo-audio's web AudioPlayer never emits
// `didJustFinish`, so the native useTtsPlayer would leave the turn stuck in
// "speaking". Here we drive a plain HTMLAudioElement and use its `ended` event.
// Same surface as the native hook: play / stop / replayLast / isPlaying.
export function useTtsPlayer({ onStart, onDone }: Handlers = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUriRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      try {
        a.pause();
      } catch {
        // ignore
      }
      a.onended = null;
      a.onerror = null;
      audioRef.current = null;
    }
  }, []);

  const play = useCallback(
    (uri: string) => {
      stop();
      lastUriRef.current = uri;
      const a = new Audio(uri);
      audioRef.current = a;
      a.onended = () => {
        if (audioRef.current === a) audioRef.current = null;
        onDone?.();
      };
      a.onerror = () => {
        if (audioRef.current === a) audioRef.current = null;
        onDone?.(); // voice is best-effort — never strand the UI
      };
      // The user just tapped (send/mic), so autoplay is allowed; if it isn't,
      // fall back to idle so the transcript still reads.
      a.play().catch(() => {
        if (audioRef.current === a) audioRef.current = null;
        onDone?.();
      });
      onStart?.();
    },
    [stop, onStart, onDone],
  );

  const replayLast = useCallback(() => {
    if (lastUriRef.current) play(lastUriRef.current);
  }, [play]);

  useEffect(() => stop, [stop]);

  return { play, stop, replayLast, isPlaying: () => !!audioRef.current };
}
