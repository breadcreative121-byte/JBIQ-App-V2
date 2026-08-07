import { useEffect, useRef } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import type { CueId } from './types';

// Maps the eight web-build cues onto their bundled mp3 assets.
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

// Preloads all cues once and exposes a fire-and-forget play(cueId). Cues are
// short, so we keep a dedicated player per cue and just rewind before replaying.
export function useAudioCues() {
  const players = useRef<Partial<Record<CueId, AudioPlayer>>>({});

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    for (const id of Object.keys(CUE_SOURCES) as CueId[]) {
      players.current[id] = createAudioPlayer(CUE_SOURCES[id]);
    }
    return () => {
      for (const p of Object.values(players.current)) p?.remove();
      players.current = {};
    };
  }, []);

  return (id: CueId) => {
    const player = players.current[id];
    if (!player) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {
      // a cue failing to play should never break the conversation flow
    }
  };
}
