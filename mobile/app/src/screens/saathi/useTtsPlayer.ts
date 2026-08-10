import { useCallback, useEffect, useRef } from 'react';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

type Handlers = {
  onStart?: () => void;
  onDone?: () => void;
};

// Wraps a single AudioPlayer for assistant TTS. Always unloads the previous clip
// before playing a new one, and exposes stop() so the conversation can interrupt
// playback the moment the user speaks or sends. `play()` resolves when the clip
// finishes OR is stopped/replaced — so scripted scenes can `await` each line
// without ever hanging on an interruption.
export function useTtsPlayer({ onStart, onDone }: Handlers = {}) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const lastUriRef = useRef<string | null>(null);
  const pendingResolveRef = useRef<(() => void) | null>(null);

  const settle = useCallback(() => {
    const resolve = pendingResolveRef.current;
    pendingResolveRef.current = null;
    resolve?.();
  }, []);

  const unload = useCallback(() => {
    playerRef.current?.remove();
    playerRef.current = null;
    settle(); // never leave an awaited play() hanging
  }, [settle]);

  const stop = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch {
        // ignore
      }
      unload();
    } else {
      settle();
    }
  }, [unload, settle]);

  const play = useCallback(
    (uri: string): Promise<void> => {
      unload(); // resolves any previous pending play()
      lastUriRef.current = uri;
      return new Promise<void>((resolve) => {
        pendingResolveRef.current = resolve;
        const player = createAudioPlayer({ uri });
        playerRef.current = player;
        player.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) {
            unload(); // settles this promise
            onDone?.();
          }
        });
        player.play();
        onStart?.();
      });
    },
    [unload, onStart, onDone],
  );

  // Replays the last clip — used by the resumption flow on app foreground.
  const replayLast = useCallback((): Promise<void> => {
    if (lastUriRef.current) return play(lastUriRef.current);
    return Promise.resolve();
  }, [play]);

  useEffect(() => unload, [unload]);

  return { play, stop, replayLast, isPlaying: () => !!playerRef.current };
}
