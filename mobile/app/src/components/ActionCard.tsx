/* A full-width action row in a Space (Figma 168:1941): a bordered card with the
   peach icon chip stacked above the title + subtitle, and a chevron on the
   right. Optional "Soon" state dims the row and routes the tap to Notify. */
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      onPress={soon ? onNotify : onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.card, soon && styles.soon, pressed && styles.pressed, style]}
    >
      <View style={styles.content}>
        <AccentIconChip icon={icon} jds={jds} size={28} iconSize={16} />
        <View style={styles.textCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {soon ? <Text style={styles.soonTag}>SOON</Text> : null}
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name={soon ? 'notifications-outline' : 'chevron-forward'} size={20} color={fig.textLow} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: fig.strokeCard,
    backgroundColor: fig.surface,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 12,
  },
  soon: { opacity: 0.72 },
  pressed: { backgroundColor: fig.surfaceMinimal },
  content: { flex: 1, gap: 8 },
  textCol: { gap: 5 },
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
});
