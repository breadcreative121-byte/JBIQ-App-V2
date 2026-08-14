import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { space } from '@theme';
import { fig } from '@/theme/figma';
import { text as type } from '@/theme/typography';
import { MicButton } from './MicButton';
import type { CueId } from './types';

type Props = {
  cue: (id: CueId) => void;
  onSend: (text: string) => void;
  onMicStart?: () => void;
  onTranscript: (text: string) => void;
  onMicError: (message: string) => void;
  onListeningChange?: (listening: boolean) => void;
  onClose: () => void;
  onPlus?: () => void;
  busy?: boolean;
};

// Figma 152:6333 — the voice-mode composer: a lilac "+", an "Ask anything"
// pill, the hold-to-talk mic, and an indigo ✕ that closes voice mode. Uses the
// same `fig` palette as the Home composer.
export function Composer({
  cue,
  onSend,
  onMicStart,
  onTranscript,
  onMicError,
  onListeningChange,
  onClose,
  onPlus,
  busy,
}: Props) {
  const [value, setValue] = useState('');

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue('');
  };

  return (
    <View style={styles.row}>
      <Pressable onPress={onPlus} style={styles.plus} accessibilityRole="button" accessibilityLabel="Add">
        <Ionicons name="add" size={24} color={fig.brand} />
      </Pressable>

      <View style={styles.inputPill}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Ask anything"
          placeholderTextColor={fig.textLow}
          style={[type.bodyM, styles.input]}
          onSubmitEditing={submit}
          returnKeyType="send"
          blurOnSubmit
        />
      </View>

      <MicButton
        cue={cue}
        onStart={onMicStart}
        onResult={onTranscript}
        onError={onMicError}
        onListeningChange={onListeningChange}
        disabled={busy}
      />

      <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close voice">
        <Ionicons name="close" size={22} color={fig.textOnBrand} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.m,
    paddingTop: space.s,
    paddingBottom: 24,
  },
  plus: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: fig.lilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputPill: {
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    backgroundColor: fig.surfaceGhost,
    borderRadius: 24,
    paddingHorizontal: space.m,
  },
  input: {
    color: fig.textHigh,
    paddingVertical: 0,
  },
  close: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: fig.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
