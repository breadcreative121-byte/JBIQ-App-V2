/* A "sayable" phrase row from Figma Home — a centred pill with a peach icon
   circle and the quoted sentence. Tapping it hands the phrase to Saathi. */
import { Pressable, Text, StyleSheet } from 'react-native';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';
import { AccentIconChip, type GlyphName } from './AccentIconChip';
import type { JdsName } from '@/theme/jdsIcons';

export function PhraseRow({
  icon,
  jds,
  text,
  onPress,
}: {
  icon?: GlyphName;
  jds?: JdsName;
  text: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={text}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <AccentIconChip icon={icon} jds={jds} size={40} iconSize={20} />
      <Text style={styles.text} numberOfLines={1}>
        “{text}”
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    maxWidth: '100%',
    paddingVertical: 4,
    paddingLeft: 5,
    paddingRight: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: fig.strokeCard,
    backgroundColor: fig.surface,
  },
  pressed: { backgroundColor: fig.surfaceMinimal },
  text: { flexShrink: 1, fontSize: 14, fontWeight: '500', color: fig.textHigh, ...font('500') },
});
