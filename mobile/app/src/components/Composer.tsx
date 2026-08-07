/* The persistent bottom "Ask anything" composer from Figma. A lilac "+"
   button, a grey input pill, and the indigo mic that opens the Saathi voice
   experience. Shared by Home and every Space. */
import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';

export function Composer({
  onMic,
  onSubmit,
  onPlus,
}: {
  onMic: () => void;
  onSubmit?: (text: string) => void;
  onPlus?: () => void;
}) {
  const [value, setValue] = useState('');
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPlus}
        accessibilityRole="button"
        accessibilityLabel="Add"
        style={styles.plus}
      >
        <Ionicons name="add" size={24} color={fig.brand} />
      </Pressable>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Ask anything"
        placeholderTextColor={fig.textLow}
        returnKeyType="send"
        onSubmitEditing={() => {
          const t = value.trim();
          if (t && onSubmit) onSubmit(t);
          setValue('');
        }}
        style={styles.input}
      />
      <Pressable
        onPress={onMic}
        accessibilityRole="button"
        accessibilityLabel="Speak"
        style={styles.mic}
      >
        <VoiceBars />
      </Pressable>
    </View>
  );
}

function VoiceBars() {
  const heights = [7, 13, 20, 12, 8];
  return (
    <View style={styles.bars}>
      {heights.map((h, i) => (
        <View key={i} style={[styles.voiceBar, { height: h }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plus: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: fig.lilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 24,
    backgroundColor: fig.surfaceGhost,
    paddingHorizontal: 16,
    fontSize: 16,
    color: fig.textHigh,
    ...font('400'),
  },
  mic: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: fig.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bars: { flexDirection: 'row', alignItems: 'center', gap: 2.5, height: 20 },
  voiceBar: { width: 2.5, borderRadius: 2, backgroundColor: fig.textOnBrand },
});
