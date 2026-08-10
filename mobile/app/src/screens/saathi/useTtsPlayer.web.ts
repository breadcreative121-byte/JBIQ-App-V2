import { useCallback, useEffect, useRef } from 'react';

type Handlers = {
  onStart?: () => void;
  onDone?: () => void;
};

// Web build of the TTS player. expo-audio's web AudioPlayer never emits
// `didJustFinish`, so we drive a plain HTMLAudioElement and use its `ended`
// event. Same surface as the native hook: play / stop / replayLast / isPlaying —
// and, like native, play() resolves when the clip ends OR is stopped/replaced so
// scripted scenes can `await` each line without ever hanging.
export function useTtsPlayer({ onStart, onDone }: Handlers = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUriRef = useRef<string | null>(null);
  const pendingResolveRef = useRef<(() => void) | null>(null);

  const settle = useCallback(() => {
    const resolve = pendingResolveRef.current;
    pendingResolveRef.current = null;
    resolve?.();
  }, []);

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
    settle();
  }, [settle]);

  const play = useCallback(
    (uri: string): Promise<void> => {
      stop(); // resolves any previous pending play()
      lastUriRef.current = uri;
      return new Promise<void>((resolve) => {
        pendingResolveRef.current = resolve;
        const a = new Audio(uri);
        audioRef.current = a;
        const finish = () => {
          if (audioRef.current === a) audioRef.current = null;
          settle();
          onDone?.();
        };
        a.onended = finish;
        a.onerror = finish; // voice is best-effort — never strand the UI
        // The user just tapped (send/mic), so autoplay is allowed; if it isn't,
        // resolve to idle so the scene/transcript still proceeds.
        a.play().catch(finish);
        onStart?.();
      });
    },
    [stop, settle, onStart, onDone],
  );

  const replayLast = useCallback((): Promise<void> => {
    if (lastUriRef.current) return play(lastUriRef.current);
    return Promise.resolve();
  }, [play]);

  useEffect(() => stop, [stop]);

  return { play, stop, replayLast, isPlaying: () => !!audioRef.current };
}
