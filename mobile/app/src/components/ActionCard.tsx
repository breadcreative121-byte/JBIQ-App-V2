/* Compact action card in a Space (the 2-up grid + full-width rows). Optional
   "Soon" state shows a tag and a Notify affordance instead of a dead end. */
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';
import { AccentIconChip, type GlyphName } from './AccentIconChip';
import type { JdsName } from '@/theme/jdsIcons';

export function ActionCard({
  icon,
  jds,
  title,
  subtitle,
  soon,
  onPress,
  onNotify,
  style,
}: {
  icon?: GlyphName;
  jds?: JdsName;
  title: string;
  subtitle: string;
  soon?: boolean;
  onPress?: () => void;
  onNotify?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={soon ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.card,
        soon && styles.soon,
        pressed && !soon && styles.pressed,
        style,
      ]}
    >
      <AccentIconChip icon={icon} jds={jds} size={24} iconSize={16} />
      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {soon ? <Text style={styles.soonTag}>SOON</Text> : null}
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {soon && onNotify ? (
        <Pressable onPress={onNotify} accessibilityRole="button" style={styles.notify}>
          <Text style={styles.notifyLabel}>Notify me</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: fig.strokeCard,
    backgroundColor: fig.surface,
    padding: 12,
    gap: 8,
  },
  soon: { opacity: 0.72 },
  pressed: { backgroundColor: fig.surfaceMinimal },
  textWrap: { gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  title: { fontSize: 16, fontWeight: '700', color: fig.textHigh, lineHeight: 20, ...font('700') },
  subtitle: { fontSize: 12, fontWeight: '400', color: fig.textLow, lineHeight: 18, ...font('400') },
  soonTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: fig.textLow,
    backgroundColor: fig.surfaceGhost,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    ...font('800'),
  },
  notify: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: fig.strokeCard,
  },
  notifyLabel: { fontSize: 12, fontWeight: '700', color: fig.textHigh, ...font('700') },
});
