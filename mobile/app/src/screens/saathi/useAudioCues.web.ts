import { useEffect, useRef } from 'react';
import { Asset } from 'expo-asset';
import type { CueId } from './types';

// Web build of the cue player. Mirrors useAudioCues.ts but drives plain
// HTMLAudioElements; asset requires are resolved to URLs via expo-asset. Cues are
// fire-and-forget — any failure stays silent and never breaks the conversation.
const CUE_SOURCES: Record<CueId, number> = {
  wakeup: require('../../../assets/audio/wakeup.mp3'),
  welcome: require('../../../assets/audio/welcome.mp3'),
  'va-understood': require('../../../assets/audio/va-understood.mp3'),
  'message-sent': require('../../../assets/audio/message-sent.mp3'),
  'mic-on': require('../../../assets/audio/VA_mic_on.mp3'),
  'mic-off': require('../../../assets/audio/VA_mic_off.mp3'),
  'info-warning': require('../../../assets/audio/info_warning.mp3'),
  'pay-success': require('../../../assets/audio/pay_success.mp3'),
};

export function useAudioCues() {
  const players = useRef<Partial<Record<CueId, HTMLAudioElement>>>({});

  useEffect(() => {
    for (const id of Object.keys(CUE_SOURCES) as CueId[]) {
      try {
        const uri = Asset.fromModule(CUE_SOURCES[id]).uri;
        const audio = new Audio(uri);
        audio.preload = 'auto';
        players.current[id] = audio;
      } catch {
        // a cue that won't preload is non-essential
      }
    }
    return () => {
      players.current = {};
    };
  }, []);

  return (id: CueId) => {
    const audio = players.current[id];
    if (!audio) return;
    try {
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    } catch {
      // a cue failing to play should never break the conversation flow
    }
  };
}
