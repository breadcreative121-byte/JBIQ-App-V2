/* The centered first-run stage: Saathi's current spoken line as a caption, the
   one tappable phrase once she's invited it, and a quiet Skip. Sits in the
   transcript flex area (the middle of the screen) while the conversation is
   still empty; the avatar orb + label remain below it, untouched. */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { space } from '@theme';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';
import { FIRST_TASK_PHRASE } from './useFirstRunScene';

export function FirstRunStage({
  phraseVisible,
  onSuggested,
  onSkip,
}: {
  phraseVisible: boolean;
  onSuggested: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={styles.wrap}>
      {phraseVisible ? (
        <Pressable onPress={onSuggested} accessibilityRole="button" hitSlop={8} style={styles.phraseBtn}>
          <Text style={styles.phrase}>“{FIRST_TASK_PHRASE}”</Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={onSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip intro"
        hitSlop={10}
        style={styles.skip}
      >
        <Text style={styles.skipText}>Skip</Text>
        <Ionicons name="chevron-forward" size={14} color={fig.textHigh} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
  phraseBtn: { marginTop: 14 },
  phrase: { fontSize: 18, lineHeight: 24, color: fig.brand, textAlign: 'center', ...font('800') },
  skip: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: fig.surfaceGhost,
  },
  skipText: { fontSize: 14, color: fig.textHigh, ...font('700') },
});
