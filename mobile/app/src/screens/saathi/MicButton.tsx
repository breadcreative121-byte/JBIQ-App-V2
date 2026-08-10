import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fig } from '@/theme/figma';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useRecorder } from './useRecorder';
import type { CueId } from './types';

type Props = {
  cue: (id: CueId) => void;
  onStart?: () => void; // fired on press-in (parent interrupts any TTS)
  onResult: (text: string) => void;
  onError: (message: string) => void;
  onListeningChange?: (listening: boolean) => void;
  disabled?: boolean;
};

// Hold-to-talk. Press-in starts a WAV recording; release stops it and transcribes
// via Sarvam STT. Pulses while recording. Audio cues bracket the interaction.
export function MicButton({ cue, onStart, onResult, onError, onListeningChange, disabled }: Props) {
  const { start, stopAndTranscribe, recording } = useRecorder();
  const scale = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const reduced = useReducedMotion();

  // Surface recording state to the screen so it can show "Listening…".
  useEffect(() => {
    onListeningChange?.(recording);
  }, [recording, onListeningChange]);

  useEffect(() => {
    // Colour still changes on record; only the looping pulse is suppressed.
    if (recording && !reduced) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.08, duration: 500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      scale.setValue(1);
    }
    return () => loopRef.current?.stop();
  }, [recording, scale, reduced]);

  const handlePressIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onStart?.();
    cue('mic-on');
    const ok = await start();
    if (!ok) onError('I can’t hear you yet — turn on mic access in Settings to talk to me.');
  };

  const handlePressOut = async () => {
    cue('mic-off');
    try {
      const result = await stopAndTranscribe();
      const transcript = result?.transcript.trim();
      if (transcript) onResult(transcript);
    } catch {
      onError('Didn’t catch that — hold the mic and try once more.');
    }
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled}>
      <Animated.View
        style={[
          styles.button,
          { backgroundColor: recording ? fig.brand : fig.lilac, transform: [{ scale }] },
          disabled && styles.disabled,
        ]}
      >
        <Ionicons
          name={recording ? 'mic' : 'mic-outline'}
          size={22}
          color={recording ? fig.textOnBrand : fig.brand}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
});
