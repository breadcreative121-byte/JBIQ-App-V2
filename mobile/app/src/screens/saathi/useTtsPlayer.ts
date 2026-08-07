import { useCallback, useEffect, useRef } from 'react';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

type Handlers = {
  onStart?: () => void;
  onDone?: () => void;
};

// Wraps a single AudioPlayer for assistant TTS. Always unloads the previous clip
// before playing a new one, and exposes stop() so the conversation can interrupt
// playback the moment the user speaks or sends.
export function useTtsPlayer({ onStart, onDone }: Handlers = {}) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const lastUriRef = useRef<string | null>(null);

  const unload = useCallback(() => {
    playerRef.current?.remove();
    playerRef.current = null;
  }, []);

  const stop = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch {
        // ignore
      }
      unload();
    }
  }, [unload]);

  const play = useCallback(
    (uri: string) => {
      unload();
      lastUriRef.current = uri;
      const player = createAudioPlayer({ uri });
      playerRef.current = player;
      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          unload();
          onDone?.();
        }
      });
      player.play();
      onStart?.();
    },
    [unload, onStart, onDone],
  );

  // Replays the last clip — used by the resumption flow on app foreground.
  const replayLast = useCallback(() => {
    if (lastUriRef.current) play(lastUriRef.current);
  }, [play]);

  useEffect(() => unload, [unload]);

  return { play, stop, replayLast, isPlaying: () => !!playerRef.current };
}
